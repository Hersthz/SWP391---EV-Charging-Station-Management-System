package com.pham.basis.evcharging.service.Impl;

import com.pham.basis.evcharging.dto.response.StationReviewResponse;
import com.pham.basis.evcharging.exception.AppException;
import com.pham.basis.evcharging.mapper.StationReviewMapper;
import com.pham.basis.evcharging.model.StationReview;
import com.pham.basis.evcharging.repository.ChargingStationRepository;
import com.pham.basis.evcharging.repository.StationReviewRepository;
import com.pham.basis.evcharging.repository.UserRepository;
import com.pham.basis.evcharging.service.StationReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class StationReviewServiceImpl implements StationReviewService {
    private final StationReviewRepository stationReviewRepository;
    private final ChargingStationRepository chargingStationRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public StationReviewResponse addReview(Long stationId, Long userId, int rating, String comment) {
        //Load and Validate
        var station = chargingStationRepository.findById(stationId)
                .orElseThrow(() -> new AppException.NotFoundException("Station not found"));
        var user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException.NotFoundException("User not found"));

        if (stationReviewRepository.existsByChargingStation_IdAndUser_Id(stationId, userId)) {
            throw new AppException.ConflictException("User has already reviewed this station");
        }
        //Create
        StationReview review = StationReview.builder()
                .chargingStation(station)
                .user(user)
                .rating(rating)
                .comment(comment)
                .createdAt(LocalDateTime.now())
                .build();

        StationReview savedReview = stationReviewRepository.save(review);

        return StationReviewMapper.toResponse(savedReview);
    }

    @Override
    public StationReviewResponse editReview(Long reviewId, Long userId, int rating, String comment) {
        //load
        var review = stationReviewRepository.findById(reviewId)
                .orElseThrow(() -> new AppException.NotFoundException("Review not found"));
        //check user
        if(!review.getUser().getId().equals(userId)) {
            throw new AppException.BadRequestException("You are not allowed to edit this station");
        }
        review.setRating(rating);
        review.setComment(comment);
        stationReviewRepository.save(review);
        return StationReviewMapper.toResponse(review);
    }

    @Override
    @Transactional
    public void deleteReview(Long reviewId, Long userId) {
        var review = stationReviewRepository.findById(reviewId)
                .orElseThrow(() -> new AppException.NotFoundException("Review not found"));
        if (!review.getUser().getId().equals(userId)) {
            throw new AppException.BadRequestException("You are not allowed to delete this review");
        }

        stationReviewRepository.delete(review);
    }

    @Override
    public StationReviewResponse getReview(Long reviewId) {
        var review = stationReviewRepository.findById(reviewId)
                .orElseThrow(() -> new AppException.NotFoundException("Review not found"));

        return StationReviewMapper.toResponse(review);
    }

    @Override
    public List<StationReviewResponse> getReviewsByStation(Long stationId) {
        var station = chargingStationRepository.findById(stationId)
                .orElseThrow(() -> new AppException.NotFoundException("Station not found"));

        List<StationReview> reviews = stationReviewRepository.findByChargingStation_Id(stationId);

        return reviews.stream()
                .map(StationReviewMapper::toResponse)
                .toList();
    }


}
