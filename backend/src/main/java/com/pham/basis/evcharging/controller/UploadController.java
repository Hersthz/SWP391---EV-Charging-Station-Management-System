package com.pham.basis.evcharging.controller;

import com.pham.basis.evcharging.dto.response.ApiResponse;
import com.pham.basis.evcharging.service.CloudinaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/upload")
@RequiredArgsConstructor
public class UploadController {
    private final CloudinaryService cloudinaryService;

    @PostMapping
    public ResponseEntity<ApiResponse<String>> uploadImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam(defaultValue = "general") String folder) {

        String url = cloudinaryService.uploadFile(file, folder);

        ApiResponse<String> response = new ApiResponse<>(
                "200",
                "Upload thành công",
                url
        );

        return ResponseEntity.ok(response);
    }
}
