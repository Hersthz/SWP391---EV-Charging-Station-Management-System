package com.pham.basis.evcharging.controller;

import com.pham.basis.evcharging.dto.request.StationReviewRequest;
import com.pham.basis.evcharging.dto.response.ApiResponse;
import com.pham.basis.evcharging.dto.response.StationReviewResponse;
import com.pham.basis.evcharging.service.StationReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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

    @DeleteMapping("/{reviewId}")
    public ResponseEntity<ApiResponse<Void>> deleteReview(
            @PathVariable Long reviewId,
            @RequestParam Long userId) {

        service.deleteReview(reviewId, userId);

        return ResponseEntity.ok(
                new ApiResponse<>("200", "Review deleted successfully", null)
        );
    }

    // GET 1 review
    @GetMapping("/{reviewId}")
    public ResponseEntity<ApiResponse<StationReviewResponse>> getReview(
            @PathVariable Long reviewId) {

        StationReviewResponse data = service.getReview(reviewId);

        return ResponseEntity.ok(
                new ApiResponse<>("200", "Success", data)
        );
    }


    @GetMapping("/station/{stationId}")
    public ResponseEntity<ApiResponse<List<StationReviewResponse>>> getReviewsByStation(
            @PathVariable Long stationId) {

        List<StationReviewResponse> data = service.getReviewsByStation(stationId);

        return ResponseEntity.ok(
                new ApiResponse<>("200", "Success", data)
        );
    }
}
