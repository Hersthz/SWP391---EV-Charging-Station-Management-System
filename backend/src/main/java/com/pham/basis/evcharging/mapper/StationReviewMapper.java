package com.pham.basis.evcharging.mapper;

import com.pham.basis.evcharging.dto.response.StationReviewResponse;
import com.pham.basis.evcharging.model.StationReview;

public class StationReviewMapper {

    public static StationReviewResponse toResponse(StationReview review) {
        if (review == null) return null;

        return StationReviewResponse.builder()
                .id(review.getId())
                .stationId(review.getChargingStation().getId())
                .userId(review.getUser().getId())
                .rating(review.getRating())
                .comment(review.getComment())
                .createdAt(review.getCreatedAt())
                .build();
    }
}
