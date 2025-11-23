package com.pham.basis.evcharging.mapper;

import com.pham.basis.evcharging.dto.response.StationReviewResponse;
import com.pham.basis.evcharging.model.StationReview;
import org.mapstruct.Mapper;

@Mapper
public interface StationReviewMapper {

    public static StationReviewResponse toResponse(StationReview review) {
        if (review == null) return null;

        var user = review.getUser();

        String userName = user.getFullName();
        if (userName == null || userName.isBlank()) {
            userName = user.getEmail();
        }

        return StationReviewResponse.builder()
                .id(review.getId())
                .stationId(review.getChargingStation().getId())
                .userId(review.getUser().getId())
                .userName(userName)
                .rating(review.getRating())
                .comment(review.getComment())
                .createdAt(review.getCreatedAt())
                .build();
    }
}
