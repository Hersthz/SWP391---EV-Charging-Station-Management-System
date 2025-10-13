package com.pham.basis.evcharging.service;

import com.pham.basis.evcharging.config.VNPayConfig;
import com.pham.basis.evcharging.dto.request.PaymentCreateRequest;
import com.pham.basis.evcharging.dto.response.PaymentResponse;
import com.pham.basis.evcharging.model.PaymentTransaction;
import com.pham.basis.evcharging.model.Wallet;
import com.pham.basis.evcharging.repository.PaymentTransactionRepository;
import com.pham.basis.evcharging.repository.UserRepository;
import com.pham.basis.evcharging.repository.WalletRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.apache.commons.codec.digest.HmacUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentServiceImpl.class);

    private final PaymentTransactionRepository txRepo;
    private final UserRepository userRepo;
    private final WalletRepository walletRepo;
    private final VNPayConfig vnpayConfig;

    private static final DateTimeFormatter VNP_CREATE_DATE_FMT = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
    private static final int MAX_TXN_REF_GENERATION_ATTEMPTS = 10;

    // Payment types
    public static final String TYPE_RESERVATION = "RESERVATION";
    public static final String TYPE_WALLET = "WALLET";
    public static final String TYPE_SERVICE = "SERVICE";
    public static final String TYPE_MEMBERSHIP = "MEMBERSHIP";

    // Payment methods
    public static final String METHOD_VNPAY = "VNPAY";
    public static final String METHOD_WALLET = "WALLET";

    private String billingMobile=null;
    private String billingEmail=null;
    private String billingFullName=null;

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
            log.debug("Processing payment amount: {}", amountInVND);

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
        BigDecimal amount = amountInVND;

        // Kiểm tra số dư ví
        Wallet wallet = walletRepo.findByUserId(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Wallet not found for user: " + userId));

        if (wallet.getBalance().compareTo(amount) < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Insufficient wallet balance. Current: " + wallet.getBalance() + ", Required: " + amount);
        }

        // Trừ tiền từ ví
        int updatedRows = walletRepo.deductBalance(userId, amount);
        if (updatedRows == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Failed to deduct from wallet. Please try again.");
        }

        // Tạo transaction với status SUCCESS
        PaymentTransaction tx = createPaymentTransaction(req, userId, amountInVND, txnRef);
        tx.setStatus("SUCCESS");
        txRepo.save(tx);
        log.info("Created WALLET payment transaction: {}", txnRef);

        // Xử lý business logic ngay lập tức
        handlePaymentSuccess(tx);

        return buildPaymentResponse(tx, null); // Không có URL cho wallet
    }

    @Override
    @Transactional
    public String handleIpn(HttpServletRequest request) {
        Map<String, String> params = extractParameters(request);
        log.info("Received IPN from VNPAY: {}", params.keySet());
        try {
            // 1. Validate signature
            String receivedHash = params.remove("vnp_SecureHash");
            if (receivedHash == null) {
                log.warn("IPN missing vnp_SecureHash");
                return "INVALID_SIGNATURE";
            }

            if (!isValidSignature(params, receivedHash)) {
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

        if (TYPE_SERVICE.equals(req.getType()) && req.getReferenceId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "ReferenceId is required for SERVICE payments");
        }

        if (TYPE_MEMBERSHIP.equals(req.getType()) && req.getReferenceId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "ReferenceId is required for MEMBERSHIP payments");
        }

        // WALLET type doesn't need referenceId (it's for top-up)
    }

    private void validatePaymentType(String type) {
        Set<String> validTypes = Set.of(TYPE_RESERVATION, TYPE_WALLET, TYPE_SERVICE, TYPE_MEMBERSHIP);
        if (type == null || !validTypes.contains(type)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Invalid payment type. Valid types: " + validTypes);
        }
    }

    private void validatePaymentMethod(String method) {
        Set<String> validMethods = Set.of(METHOD_VNPAY, METHOD_WALLET);
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

        String orderInfo = buildOrderInfo(req);
        vnp_Params.put("vnp_OrderInfo", orderInfo);

        vnp_Params.put("vnp_OrderType", req.getType());

        // Locale
        String locale = Optional.ofNullable(req.getLocale()).orElse("vn");
        vnp_Params.put("vnp_Locale", locale);

        // Return URL and IP
        String returnUrl = Optional.ofNullable(req.getReturnUrl()).orElse(vnpayConfig.getVnpReturnUrl());
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

//        // Billing information (if available in your PaymentCreateRequest)
//        if (req.getBillingMobile() != null && !req.getBillingMobile().isEmpty()) {
//            vnp_Params.put("vnp_Bill_Mobile", req.getBillingMobile());
//        }
//        if (req.getBillingEmail() != null && !req.getBillingEmail().isEmpty()) {
//            vnp_Params.put("vnp_Bill_Email", req.getBillingEmail());
//        }
//        if (req.getBillingFullName() != null && !req.getBillingFullName().isEmpty()) {
//            String fullName = req.getBillingFullName().trim();
//            int idx = fullName.indexOf(' ');
//            if (idx > 0) {
//                String firstName = fullName.substring(0, idx);
//                String lastName = fullName.substring(idx + 1);
//                vnp_Params.put("vnp_Bill_FirstName", firstName);
//                vnp_Params.put("vnp_Bill_LastName", lastName);
//            } else {
//                vnp_Params.put("vnp_Bill_FirstName", fullName);
//                vnp_Params.put("vnp_Bill_LastName", "");
//            }
//        }
        // Billing information (if available in your PaymentCreateRequest)
        // Billing mobile/email (chỉ thêm nếu không null/blank)
        Optional.ofNullable(billingMobile)
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .ifPresent(m -> vnp_Params.put("vnp_Bill_Mobile", m));

        Optional.ofNullable(billingEmail)
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .ifPresent(e -> vnp_Params.put("vnp_Bill_Email", e));

// Billing full name: an toàn với null và chuỗi chỉ có khoảng trắng
        Optional.ofNullable(billingFullName)
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .ifPresent(fullName -> {
                    String[] parts = fullName.split("\\s+");
                    String firstName = parts[0];
                    String lastName = parts.length > 1 ? parts[parts.length - 1] : "";
                    vnp_Params.put("vnp_Bill_FirstName", firstName);
                    if (!lastName.isEmpty()) {
                        vnp_Params.put("vnp_Bill_LastName", lastName);
                    }
                });

        // Build data and signature (giống hệt code gốc)
        List<String> fieldNames = new ArrayList<>(vnp_Params.keySet());
        Collections.sort(fieldNames);
        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();

        Iterator<String> itr = fieldNames.iterator();
        while (itr.hasNext()) {
            String fieldName = itr.next();
            String fieldValue = vnp_Params.get(fieldName);
            if ((fieldValue != null) && (!fieldValue.isEmpty())) {
                // Build hash data
                hashData.append(fieldName)
                        .append('=')
                        .append(URLEncoder.encode(fieldValue, StandardCharsets.UTF_8));

                // Build query
                query.append(URLEncoder.encode(fieldName, StandardCharsets.UTF_8))
                        .append('=')
                        .append(URLEncoder.encode(fieldValue, StandardCharsets.UTF_8));

                if (itr.hasNext()) {
                    query.append('&');
                    hashData.append('&');
                }
            }
        }

        String queryUrl = query.toString();
        String vnp_SecureHash = HmacUtils.hmacSha512Hex(vnpayConfig.getVnpHashSecret(), hashData.toString());
        queryUrl += "&vnp_SecureHash=" + vnp_SecureHash;

        String paymentUrl = vnpayConfig.getVnpPayUrl() + "?" + queryUrl;

        log.debug("Built VNPay URL for transaction: {}", txnRef);
        return paymentUrl;
    }

    private String buildOrderInfo(PaymentCreateRequest req) {
        if (req.getDescription() != null && !req.getDescription().isEmpty()) {
            return req.getDescription();
        }

        switch (req.getType()) {
            case TYPE_RESERVATION:
                return "Thanh toán đặt chỗ #" + req.getReferenceId();
            case TYPE_WALLET:
                return "Nạp tiền ví";
            case TYPE_SERVICE:
                return "Thanh toán dịch vụ #" + req.getReferenceId();
            case TYPE_MEMBERSHIP:
                return "Gia hạn thành viên #" + req.getReferenceId();
            default:
                return "Thanh toán EV Charging";
        }
    }



    private PaymentResponse buildPaymentResponse(PaymentTransaction tx, String paymentUrl) {
        BigDecimal amount = tx.getAmount();

        return PaymentResponse.builder()
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

    private boolean isValidSignature(Map<String, String> params, String receivedHash) {
        String query = VNPayConfig.buildQuery(params);
        String expectedHash = HmacUtils.hmacSha512Hex(vnpayConfig.getVnpHashSecret(), query);
        return expectedHash.equalsIgnoreCase(receivedHash);
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

        // Idempotent update
        if ("SUCCESS".equalsIgnoreCase(tx.getStatus())) {
            log.info("IPN already processed for txnRef={}", txnRef);
            return "OK";
        }

        // Update status based on response code
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

    private void handlePaymentSuccess(PaymentTransaction tx) {
        try {
            switch (tx.getType()) {
                case TYPE_RESERVATION:
                    handleReservationPaymentSuccess(tx);
                    break;
                case TYPE_WALLET:
                    handleWalletTopUpSuccess(tx);
                    break;
                case TYPE_SERVICE:
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

    private void handleReservationPaymentSuccess(PaymentTransaction tx) {
        // TODO: Update reservation status to CONFIRMED
        log.info("Reservation payment successful - Reference: {}", tx.getReferenceId());
    }

    private void handleWalletTopUpSuccess(PaymentTransaction tx) {
        // Nạp tiền vào ví khi thanh toán VNPAY thành công
        BigDecimal amount = tx.getAmount();
        walletRepo.addBalance(tx.getUser().getId(), amount);
        log.info("Wallet top-up successful - User: {}, Amount: {}",
                tx.getUser().getId(), amount);
    }

    private void handleServicePaymentSuccess(PaymentTransaction tx) {
        // TODO: Kích hoạt dịch vụ
        log.info("Service payment successful - Reference: {}", tx.getReferenceId());
    }

    private void handleMembershipPaymentSuccess(PaymentTransaction tx) {
        // TODO: Gia hạn membership
        log.info("Membership payment successful - User: {}, Reference: {}",
                tx.getUser().getId(), tx.getReferenceId());
    }

    private PaymentResponse mapToResponse(PaymentTransaction tx) {
        BigDecimal amount = tx.getAmount();

        return PaymentResponse.builder()
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
}