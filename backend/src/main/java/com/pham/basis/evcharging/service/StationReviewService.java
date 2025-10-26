package com.pham.basis.evcharging.service;

import com.pham.basis.evcharging.dto.response.StationReviewResponse;
import com.pham.basis.evcharging.model.StationReview;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;


public interface StationReviewService {
    StationReviewResponse addReview(Long stationId, Long userId, int rating, String comment);
    StationReviewResponse editReview(Long reviewId, Long userId, int rating, String comment);
    void deleteReview(Long reviewId, Long userId);
    StationReviewResponse getReview(Long reviewId);
    Page<StationReviewResponse> getReviewsByStation(Long stationId, Pageable pageable);
}
