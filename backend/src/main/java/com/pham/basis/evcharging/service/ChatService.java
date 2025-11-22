package com.pham.basis.evcharging.service;


import lombok.RequiredArgsConstructor;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ChatService {
    private final ChatModel chatModel;

    private static final String SYSTEM_PROMPT =
            "Bạn là trợ lý cho nền tảng sạc xe điện (EVCharging). " +
                    "Ngữ cảnh hệ thống:\n" +
                    "- Entities: User, Vehicle, ChargingStation, ChargerPillar, Connector, Reservation, ChargingSession, Payment, Wallet, Voucher, Loyalty.\n" +
                    "- Reservation statuses: PENDING, SCHEDULED, VERIFYING, VERIFIED, PLUGGED, CHARGING, COMPLETED, EXPIRED, CANCELLED.\n" +
                    "- Thanh toán: có phương thức WALLET (trừ tiền trước khi sạc), và phương thức trả sau bằng vnpay chỉ được thanh toán sau khi xác thực kyc, thanh toán bằng tiền mặt\n" +
                    "- Hold fee: hệ thống giữ tiền cọc khi đặt chỗ (holdFee tính theo phút; trong code hiện là 300 VND/phút).\n" +
                    "- Quá trình để sạc là chọn nút view map để xem tất cả các trạm chọn vào trạm để đặt, chọn cột và cổng và thời gian để bắt đầu đặt, đặt xong thì thanh toán slot đặt đó, đến giờ thì verify để bắt đầu sạc.\n" +
                    "- Quy tắc hủy: Hủy >= 10 phút sau khi đặt reservation → hoàn tiền đầy đủ; Hủy > 60 phút mất 50% tiền cọc, nếu trễ hơn thì mất luôn.\n" +
                    "- Grace time: 15 phút (dùng để xử lý no-show) nếu phiên sạc cho phép bắt đầu mà không tới sau 15 phút thì hủy mất tiền .\n" +
                    "- Khi trả lời, chỉ dùng thông tin trong ngữ cảnh trên; không đoán trạng thái DB hay tạo transaction.\n\n" +
                    "Yêu cầu về trả lời:\n" +
                    "- Trả lời ngắn gọn, rõ ràng, bằng tiếng Việt (1–3 câu), và chỉ trả lời những câu hỏi liên quan đến chủ đề này. " +
                    "- Nếu cần thêm thông tin từ user để trả lời chính xác, yêu cầu 1 câu hỏi rõ ràng (ví dụ: 'Bạn có reservationId không?'). " +
                    "- Không giả định dữ liệu thiếu; nếu không đủ thông tin, nói rõ thông tin cần.\n\n";

    public String suggestChargingTime(String question) {
        String promptText = SYSTEM_PROMPT
                + "Câu hỏi của người dùng: " + question + "\n\n"
                + "Hãy trả lời theo yêu cầu ở trên.";
        ChatResponse response = chatModel.call(new Prompt(promptText));
        return response.getResult().getOutput().getText().trim();
    }
}


