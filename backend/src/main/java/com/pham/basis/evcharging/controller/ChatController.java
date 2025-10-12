package com.pham.basis.evcharging.controller;

import com.pham.basis.evcharging.dto.request.ChatRequest;
import com.pham.basis.evcharging.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/chat")
@RequiredArgsConstructor
public class ChatController {
    private final ChatService chatService;

    @PostMapping("/suggest")
    public Map<String, Object> suggestChargingTime(@RequestBody ChatRequest request) {
        String result = chatService.suggestChargingTime(request.getQuestion());
        return Map.of(
                "success", true,
                "message", "Gợi ý thời gian sạc thành công",
                "data", result
        );
    }
}

