package com.pham.basis.evcharging.service.Impl;

import com.pham.basis.evcharging.config.VNPayConfig;
import com.pham.basis.evcharging.dto.request.PaymentCreateRequest;
import com.pham.basis.evcharging.dto.response.PaymentResponse;
import com.pham.basis.evcharging.dto.response.PaymentResultResponse;
import com.pham.basis.evcharging.dto.response.PaymentTransactionResponse;
import com.pham.basis.evcharging.exception.AppException;
import com.pham.basis.evcharging.mapper.PaymentTransactionMapper;
import com.pham.basis.evcharging.model.*;
import com.pham.basis.evcharging.repository.*;
import com.pham.basis.evcharging.service.LoyaltyPointService;
import com.pham.basis.evcharging.service.NotificationService;
import com.pham.basis.evcharging.service.PaymentService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import org.springframework.data.domain.Pageable;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.SimpleDateFormat;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentServiceImpl.class);

    private final PaymentTransactionRepository txRepo;
    private final UserRepository userRepo;
    private final WalletRepository walletRepo;
    private final VNPayConfig vnpayConfig;
    private final ReservationRepository reservationRepo;
    private final ChargingSessionRepository  chargingSessionRepo;
    private final ChargingStationRepository  chargingStationRepo;
    private final NotificationService notificationService;
    private final LoyaltyPointService loyaltyPointService;
    private final PaymentTransactionMapper mapper;

    private static final int MAX_TXN_REF_GENERATION_ATTEMPTS = 10;

    // Payment types
    public static final String TYPE_RESERVATION = "RESERVATION";
    public static final String TYPE_WALLET = "WALLET";
    public static final String TYPE_SESSION = "CHARGING-SESSION";
    public static final String TYPE_MEMBERSHIP = "MEMBERSHIP";

    // Payment methods
    public static final String METHOD_VNPAY = "VNPAY";
    public static final String METHOD_WALLET = "WALLET";
    public static final String METHOD_CASH = "CASH";

    @Override
    @Transactional
    public PaymentResponse createPayment(PaymentCreateRequest req, Long userId, String clientIp) {
        log.info("Creating payment - Type: {}, Method: {}, User: {}",
                req.getType(), req.getMethod(), userId);
        try {
            validatePaymentRequest(req);

            if (!userRepo.existsById(userId)) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found: " + userId);
            }

            BigDecimal amountInVND = req.getAmount().setScale(0, RoundingMode.HALF_UP);

            // Idempotence check
            Optional<PaymentTransaction> existing = txRepo.findPendingByTypeAndReference(
                    req.getType(), req.getReferenceId(), userId, amountInVND);
            if (existing.isPresent()) {
                log.info("Found existing pending transaction");
                return mapToResponse(existing.get());
            }

            // Generate unique transaction reference
            String txnRef = generateUniqueTxnRef();

            // XỬ LÝ THEO PHƯƠNG THỨC THANH TOÁN
            if (METHOD_WALLET.equals(req.getMethod())) {
                return processWalletPayment(req, userId, amountInVND, txnRef);
            } else if (METHOD_VNPAY.equals(req.getMethod())) {
                return processVnpayPayment(req, userId, amountInVND, txnRef, clientIp);
            } else if (METHOD_CASH.equals(req.getMethod())) {
                return processCashPayment(req, userId, amountInVND, txnRef);
            } else {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Unsupported payment method: " + req.getMethod());
            }

        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to create payment for user: {}, type: {}", userId, req.getType(), e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Payment creation failed");
        }
    }

    //Thanh toán VNPAY
    private PaymentResponse processVnpayPayment(PaymentCreateRequest req, Long userId,
                                                BigDecimal amountInVND, String txnRef, String clientIp) {
        // Tạo transaction với status PENDING
        PaymentTransaction tx = createPaymentTransaction(req, userId, amountInVND, txnRef);
        tx.setStatus("PENDING");
        txRepo.save(tx);
        log.info("Created VNPAY payment transaction: {}", txnRef);

        // Build VNPay URL
        String paymentUrl = buildVNPayPaymentUrl(req, txnRef, amountInVND, clientIp);
        log.debug("Built VNPay payment URL for transaction: {}", txnRef);

        return buildPaymentResponse(tx, paymentUrl);
    }

    //Thanh toán bằng wallet
    private PaymentResponse processWalletPayment(PaymentCreateRequest req, Long userId,
                                                 BigDecimal amountInVND, String txnRef) {

        // Kiểm tra số dư ví
        Wallet wallet = walletRepo.findByUserId(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Wallet not found for user: " + userId));

        if (wallet.getBalance().compareTo(amountInVND) < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Insufficient wallet balance. Current: " + wallet.getBalance() + ", Required: " + amountInVND);
        }

        // Trừ tiền từ ví
        int updatedRows = walletRepo.deductBalance(userId, amountInVND);
        if (updatedRows == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Failed to deduct from wallet. Please try again.");
        }

        // Tạo transaction với status SUCCESS
        PaymentTransaction tx = createPaymentTransaction(req, userId, amountInVND, txnRef);
        tx.setStatus("SUCCESS");
        if ("SUCCESS".equals(tx.getStatus())) {
            loyaltyPointService.addPointsAfterCharging(
                    tx.getUser().getId(),
                    tx.getAmount(),
                    tx.getReferenceId()
            );
        }
        txRepo.save(tx);

        // Xử lý business logic ngay lập tức
        handlePaymentSuccess(tx);
        return buildPaymentResponse(tx, null); // Không có URL cho wallet
    }

    private PaymentResponse processCashPayment(PaymentCreateRequest req, Long userId,
                                               BigDecimal amountInVND, String txnRef) {
        PaymentTransaction tx = createPaymentTransaction(req, userId, amountInVND, txnRef);
        tx.setStatus("PENDING");
        txRepo.save(tx);

        // Gửi thông báo cho nhân viên trạm sạc
        notificationService.createNotification(
                userId,
                "CASH_PAYMENT",
                "You selected to pay by CASH. Please hand the cash directly to the station staff."
        );

        log.info("Created CASH payment transaction: {}", txnRef);
        return buildPaymentResponse(tx, null);
    }

    @Override
    @Transactional
    public String handleIpn(HttpServletRequest request) {
        Map<String, String> params = extractParameters(request);
        log.info("Received IPN from VNPAY: {}", params.keySet());
        try {
            // 1. Validate signature
            String receivedHash = params.remove("vnp_SecureHash");
            params.remove("vnp_SecureHashType");

            if (receivedHash == null || !vnpayConfig.verifySignature(params, receivedHash)) {
                log.warn("IPN signature mismatch");
                return "INVALID_SIGNATURE";
            }

            // 2. Process IPN
            return processIpnTransaction(params);

        } catch (Exception e) {
            log.error("Error processing IPN for transaction: {}", params.get("vnp_TxnRef"), e);
            return "PROCESSING_ERROR";
        }
    }

    // ----------------- Private Methods -----------------
    private void validatePaymentRequest(PaymentCreateRequest req) {
        if (req == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payment request cannot be null");
        }

        validateAmount(req.getAmount());
        validatePaymentType(req.getType());
        validatePaymentMethod(req.getMethod());

        // Validate referenceId based on type
        if (TYPE_RESERVATION.equals(req.getType()) && req.getReferenceId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "ReferenceId is required for RESERVATION payments");
        }

        if (TYPE_SESSION.equals(req.getType()) && req.getReferenceId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "ReferenceId is required for SESSION payments");
        }

        if (TYPE_MEMBERSHIP.equals(req.getType()) && req.getReferenceId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "ReferenceId is required for MEMBERSHIP payments");
        }

    }

    private void validatePaymentType(String type) {
        Set<String> validTypes = Set.of(TYPE_RESERVATION, TYPE_WALLET, TYPE_SESSION, TYPE_MEMBERSHIP);
        if (type == null || !validTypes.contains(type)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Invalid payment type. Valid types: " + validTypes);
        }
    }

    private void validatePaymentMethod(String method) {
        Set<String> validMethods = Set.of(METHOD_VNPAY, METHOD_WALLET, METHOD_CASH);
        if (method == null || !validMethods.contains(method)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Invalid payment method. Valid methods: " + validMethods);
        }
    }

    private void validateAmount(BigDecimal amount) {
        if (amount == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Amount cannot be null");
        }
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Amount must be positive");
        }
        if (amount.compareTo(new BigDecimal("1000000000")) > 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Amount too large");
        }

        if (amount.scale() > 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Amount must be integer (no decimal places for VND)");
        }
    }

    private String generateUniqueTxnRef() {
        String candidate;
        int tries = 0;
        do {
            candidate = VNPayConfig.generateTxnRef();
            tries++;
            if (tries > MAX_TXN_REF_GENERATION_ATTEMPTS) {
                candidate = UUID.randomUUID().toString().replace("-", "").substring(0, 16);
                log.warn("Using UUID fallback for transaction reference after {} attempts", tries);
                break;
            }
        } while (txRepo.existsByTxnRef(candidate));
        return candidate;
    }

    private PaymentTransaction createPaymentTransaction(PaymentCreateRequest req, Long userId,
                                                        BigDecimal amountInVND, String txnRef) {
        LocalDateTime now = LocalDateTime.now();

        return PaymentTransaction.builder()
                .txnRef(txnRef)
                .amount(amountInVND)
                .orderInfo(req.getDescription())
                .status("PENDING")
                .createdAt(now)
                .updatedAt(now)
                .type(req.getType())
                .referenceId(req.getReferenceId())
                .method(req.getMethod())
                .user(userRepo.getReferenceById(userId))
                .build();
    }

    private String buildVNPayPaymentUrl(PaymentCreateRequest req, String txnRef,
                                        BigDecimal amountInVND, String clientIp) {
        Map<String, String> vnp_Params = new HashMap<>();

        // Basic parameters
        vnp_Params.put("vnp_Version", vnpayConfig.getVnpApiVersion());
        vnp_Params.put("vnp_Command", "pay");
        vnp_Params.put("vnp_TmnCode", vnpayConfig.getVnpTmnCode());
        vnp_Params.put("vnp_TxnRef", txnRef);

        long vnpAmount = amountInVND.multiply(BigDecimal.valueOf(100)).longValue();
        vnp_Params.put("vnp_Amount", String.valueOf(vnpAmount));
        vnp_Params.put("vnp_CurrCode", "VND");

        vnp_Params.put("vnp_OrderInfo", buildOrderInfo(req));
        vnp_Params.put("vnp_OrderType", req.getType());
        vnp_Params.put("vnp_Locale", req.getLocale() != null ? req.getLocale() : "vn");

        // Return URL and IP
        String returnUrl = req.getReturnUrl() != null ? req.getReturnUrl() : vnpayConfig.getVnpReturnUrl();
        vnp_Params.put("vnp_ReturnUrl", returnUrl);
        vnp_Params.put("vnp_IpAddr", clientIp);

        // Dates
        Calendar cld = Calendar.getInstance(TimeZone.getTimeZone("Etc/GMT+7"));
        SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
        String vnp_CreateDate = formatter.format(cld.getTime());
        vnp_Params.put("vnp_CreateDate", vnp_CreateDate);

        cld.add(Calendar.MINUTE, 15);
        String vnp_ExpireDate = formatter.format(cld.getTime());
        vnp_Params.put("vnp_ExpireDate", vnp_ExpireDate);

        // Build data
        String queryUrl = VNPayConfig.buildQuery(vnp_Params);
        String vnp_SecureHash = VNPayConfig.hmacSHA512(vnpayConfig.getVnpHashSecret(), queryUrl);
        String paymentUrl = vnpayConfig.getVnpPayUrl() + "?" + queryUrl + "&vnp_SecureHash=" + vnp_SecureHash;

        log.debug("Built VNPay URL for transaction: {}", txnRef);
        return paymentUrl;
    }

    private String buildOrderInfo(PaymentCreateRequest req) {
        if (req.getDescription() != null && !req.getDescription().isEmpty()) {
            return req.getDescription();
        }

        switch (req.getType()) {
            case TYPE_RESERVATION:
                return "Reservation payment #" + req.getReferenceId();
            case TYPE_WALLET:
                return "Wallet top-up";
            case TYPE_SESSION:
                return "Charging session payment #" + req.getReferenceId();
            case TYPE_MEMBERSHIP:
                return "Membership renewal #" + req.getReferenceId();
            default:
                return "EV Charging payment";
        }
    }



    private PaymentResponse buildPaymentResponse(PaymentTransaction tx, String paymentUrl) {
        BigDecimal amount = tx.getAmount();
        return PaymentResponse.builder()
                .paymentId(tx.getId())
                .txnRef(tx.getTxnRef())
                .paymentUrl(paymentUrl)
                .amount(amount)
                .status(tx.getStatus())
                .type(tx.getType())
                .method(tx.getMethod())
                .referenceId(tx.getReferenceId())
                .expiresAt(OffsetDateTime.of(tx.getUpdatedAt().plusMinutes(15), ZoneOffset.UTC))
                .build();
    }

    private Map<String, String> extractParameters(HttpServletRequest request) {
        Map<String, String> params = new HashMap<>();
        Enumeration<String> names = request.getParameterNames();

        while (names.hasMoreElements()) {
            String name = names.nextElement();
            String value = request.getParameter(name);
            if (value != null && !value.isEmpty()) {
                params.put(name, value);
            }
        }
        return params;
    }

    private String processIpnTransaction(Map<String, String> params) {
        String txnRef = params.get("vnp_TxnRef");
        String vnpAmountStr = params.get("vnp_Amount");
        String vnpResponseCode = params.get("vnp_ResponseCode");

        if (txnRef == null) {
            log.warn("IPN missing txnRef");
            return "MISSING_TXNREF";
        }
        Optional<PaymentTransaction> opt = txRepo.findByTxnRef(txnRef);
        if (opt.isEmpty()) {
            log.warn("IPN for unknown txnRef={}", txnRef);
            return "TXN_NOT_FOUND";
        }
        PaymentTransaction tx = opt.get();

        try {
            //kiem tra amount đúng không
            long vnpAmountReceived = Long.parseLong(vnpAmountStr);
            long expectedAmount = tx.getAmount().multiply(BigDecimal.valueOf(100)).longValue();
            if (vnpAmountReceived != expectedAmount) {
                log.warn("IPN amount mismatch txnRef={} expected={} received={}",
                        txnRef, expectedAmount, vnpAmountReceived);
                return "AMOUNT_MISMATCH";
            }
        } catch (NumberFormatException ex) {
            log.warn("IPN invalid amount format: {}", vnpAmountStr);
            return "INVALID_AMOUNT";
        }

        // kiểm tra đã sử lý trước đó chưa
        if ("SUCCESS".equalsIgnoreCase(tx.getStatus())) {
            log.info("IPN already processed for txnRef={}", txnRef);
            return "OK";
        }

        // Update status
        String newStatus = "00".equals(vnpResponseCode) ? "SUCCESS" : "FAILED";
        tx.setStatus(newStatus);
        tx.setVnpTransactionNo(params.get("vnp_TransactionNo"));
        tx.setUpdatedAt(LocalDateTime.now());
        txRepo.save(tx);

        // Chỉ xử lý business logic nếu thanh toán thành công
        if ("SUCCESS".equals(newStatus)) {
            handlePaymentSuccess(tx);
        }

        log.info("IPN processed for txnRef={}, type={}, newStatus={}", txnRef, tx.getType(), newStatus);
        return "OK";
    }
//
    private void handlePaymentSuccess(PaymentTransaction tx) {
        try {
            switch (tx.getType()) {
                case TYPE_RESERVATION:
                    handleReservationPaymentSuccess(tx);
                    break;
                case TYPE_WALLET:
                    handleWalletTopUpSuccess(tx);
                    break;
                case TYPE_SESSION:
                    handleServicePaymentSuccess(tx);
                    break;
                case TYPE_MEMBERSHIP:
                    handleMembershipPaymentSuccess(tx);
                    break;
                default:
                    log.warn("Unknown payment type: {}", tx.getType());
            }
        } catch (Exception e) {
            log.error("Error handling payment success for txnRef: {}, type: {}",
                    tx.getTxnRef(), tx.getType(), e);
        }
    }
    //reservation
    private void handleReservationPaymentSuccess(PaymentTransaction tx) {
        reservationRepo.updateStatusById(tx.getReferenceId(),"SCHEDULED");
        //noti
        reservationRepo.updateStatusById(tx.getReferenceId(), "SCHEDULED");
        notificationService.createNotification(
                tx.getUser().getId(),
                "PAYMENT",
                "Reservation payment #" + tx.getReferenceId() + " successful!"
        );

        log.info("Reservation payment successful - Reference: {}", tx.getReferenceId());

    }

    private void handleWalletTopUpSuccess(PaymentTransaction tx) {
        // Nạp tiền vào ví khi thanh toán VNPAY thành công
        BigDecimal amount = tx.getAmount();
        walletRepo.addBalance(tx.getUser().getId(), amount);
        //noti
        notificationService.createNotification(
                tx.getUser().getId(),
                "WALLET_TOPUP",
                "Wallet top-up successful: " + amount.toPlainString() + " VND"
        );
        log.info("Wallet top-up successful - User: {}, Amount: {}",
                tx.getUser().getId(), amount);
    }

    private void handleServicePaymentSuccess(PaymentTransaction tx) {
        Long sessionId = tx.getReferenceId();
        if (sessionId == null) {
            log.warn("Service payment success without sessionId. tx={}", tx.getTxnRef());
            return;
        }

        ChargingSession session = chargingSessionRepo.findById(sessionId)
                .orElseThrow(() -> new AppException.NotFoundException("Session not found for payment"));

        Reservation res = session.getReservation();
        if (res == null) {
            log.warn("No reservation linked to session {} on payment success", sessionId);
            return;
        }
        boolean changed = false;
        if (!"COMPLETED".equalsIgnoreCase(res.getStatus())) {
            res.setStatus("COMPLETED");
            changed = true;
        }

        if (changed) {
            reservationRepo.save(res);
            //noti
            notificationService.createNotification(
                    tx.getUser().getId(),
                    "CHARGING_SESSION",
                    "Charging session #" + sessionId + " payment successful!"
            );
            log.info("Reservation save");
        }
    }

    private void handleMembershipPaymentSuccess(PaymentTransaction tx) {
        //noti
        notificationService.createNotification(
                tx.getUser().getId(),
                "MEMBERSHIP",
                "Membership renewal successful!"
        );
        log.info("Membership payment successful - User: {}, Reference: {}",
                tx.getUser().getId(), tx.getReferenceId());
    }

    private PaymentResponse mapToResponse(PaymentTransaction tx) {
        BigDecimal amount = tx.getAmount();

        return PaymentResponse.builder()
                .paymentId(tx.getId())
                .txnRef(tx.getTxnRef())
                .paymentUrl(null)
                .amount(amount)
                .status(tx.getStatus())
                .type(tx.getType())
                .method(tx.getMethod())
                .referenceId(tx.getReferenceId())
                .expiresAt(OffsetDateTime.of(tx.getUpdatedAt().plusMinutes(15), ZoneOffset.UTC))
                .build();
    }

    @Override
    @Transactional
    public PaymentResultResponse vnpReturn(HttpServletRequest request) {
        Map<String, String> fields = extractParameters(request);
        String vnp_SecureHash = fields.remove("vnp_SecureHash");
        fields.remove("vnp_SecureHashType");

        if (!vnpayConfig.verifySignature(fields, vnp_SecureHash)) {
            return PaymentResultResponse.builder()
                    .status("INVALID_SIGNATURE")
                    .message("Invalid signature")
                    .build();
        }

        String responseCode = fields.get("vnp_ResponseCode");
        String txnRef = fields.get("vnp_TxnRef");
        String transNo = fields.get("vnp_TransactionNo");

        Optional<PaymentTransaction> opt = txRepo.findByTxnRef(txnRef);
        BigDecimal amt = opt.map(PaymentTransaction::getAmount)
                .orElseGet(() -> {
                    try {
                        long a = Long.parseLong(fields.getOrDefault("vnp_Amount", "0"));
                        return BigDecimal.valueOf(a / 100L);
                    } catch (Exception e) { return null; }
                });

        return PaymentResultResponse.builder()
                .status("00".equals(responseCode) ? "SUCCESS" : "FAILED")
                .orderId(txnRef)
                .transactionNo(transNo)
                .message("00".equals(responseCode) ? "Transaction successful" : "Transaction failed (code: " + responseCode + ")")
                .amount(amt)
                .type(opt.map(PaymentTransaction::getType).orElse(null))
                .referenceId(opt.map(PaymentTransaction::getReferenceId).orElse(null))
                .build();
    }


    public PaymentTransaction getPaymentEntity(Long paymentId) {
        return txRepo.findById(paymentId)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found"));
    }


    @Override
    public Page<PaymentTransactionResponse> getPaymentTransactionByUserId(Long userId, Pageable pageable) {
        return txRepo.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(mapper::toResponse);
    }

    @Override
    public Page<PaymentTransactionResponse> getAllPaymentTransaction(Pageable pageable) {
        return txRepo.findAll(pageable)
                .map(mapper::toResponse);
    }

    @Override
    public List<PaymentTransactionResponse> getAllPaymentTransactionByStation(Long stationId) {
        ChargingStation station = chargingStationRepo.findById(stationId)
                .orElseThrow(() -> new AppException.NotFoundException("Charging station not found"));

        List<Reservation> reservations = reservationRepo.findByStationId(station.getId());
        List<Long> reservationIds = reservations.stream()
                .map(Reservation::getId)
                .toList();

        List<PaymentTransaction> payments = txRepo.findByTypeAndReferenceIdIn("RESERVATION",reservationIds);
        return payments.stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Override
    public void updatePaymentStatus(Long id) {
        PaymentTransaction payment = txRepo.findById(id)
                .orElseThrow(() -> new AppException.NotFoundException("Payment not found"));

        if ("SUCCESS".equals(payment.getStatus())) {
            throw new AppException.BadRequestException("Payment already marked as SUCCESS");
        }

        payment.setStatus("SUCCESS");
        payment.setUpdatedAt(LocalDateTime.now());
        txRepo.save(payment);

        handlePaymentSuccess(payment);
    }
}
