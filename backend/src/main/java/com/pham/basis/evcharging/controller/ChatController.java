package com.pham.basis.evcharging.controller;

import com.pham.basis.evcharging.dto.request.ChatRequest;
import com.pham.basis.evcharging.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/chat")
@RequiredArgsConstructor
public class ChatController {
    private final ChatService service;

    @PostMapping("/chat-message")
    String chatMessage(@RequestBody ChatRequest request){
        return service.generation(request.getQuestion());
    }
}
