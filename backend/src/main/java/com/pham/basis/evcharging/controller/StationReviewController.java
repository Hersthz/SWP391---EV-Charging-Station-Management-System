package com.pham.basis.evcharging.controller;

import com.pham.basis.evcharging.dto.request.StationReviewRequest;
import com.pham.basis.evcharging.dto.response.ApiResponse;
import com.pham.basis.evcharging.dto.response.StationReviewResponse;
import com.pham.basis.evcharging.service.StationReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/reviews")
@RequiredArgsConstructor
public class StationReviewController {
    private final StationReviewService service;

    @PostMapping("/add")
    public ResponseEntity<ApiResponse<StationReviewResponse>> addReview(@RequestBody @Valid StationReviewRequest request){
        StationReviewResponse data = service.addReview(request.getStationId(),request.getUserId(),request.getRating(),request.getComment());
        return ResponseEntity.ok(new ApiResponse<>("200","Review successfully added",data));
    }

    @PutMapping("/update")
    public ResponseEntity<ApiResponse<StationReviewResponse>> updateReview(@RequestBody @Valid StationReviewRequest request, @RequestParam("reviewId") Long reviewId){
        StationReviewResponse data = service.editReview(reviewId,request.getUserId(),request.getRating(),request.getComment());
        return ResponseEntity.ok(new ApiResponse<>("200","Update successfully",data));
    }
}
