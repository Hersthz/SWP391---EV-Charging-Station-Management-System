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

    public String suggestChargingTime(String question) {
        ChatResponse response = chatModel.call(new Prompt(
                "Bạn là hệ thống giải đáp các thắc mắc của người dùng.\n" +
                        "Câu hỏi của người dùng: " + question + "\n" +
                        "Hãy trả lời ngắn gọn'"
        ));
        return response.getResult().getOutput().getText().trim();
    }
}


