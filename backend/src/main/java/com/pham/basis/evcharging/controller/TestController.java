package com.pham.basis.evcharging.controller;

import com.pham.basis.evcharging.config.VNPayConfig;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/test")
public class TestController {

    private final VNPayConfig vnpayConfig;

    public TestController(VNPayConfig vnpayConfig) {
        this.vnpayConfig = vnpayConfig;
    }

    @GetMapping("/vnpay")
    public String showConfig() {
        return "VNP_TMNCODE = " + vnpayConfig.getVnpTmnCode();
    }
}
