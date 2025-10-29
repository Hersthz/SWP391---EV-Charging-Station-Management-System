package com.pham.basis.evcharging.mapper;


import com.pham.basis.evcharging.dto.request.SubscriptionPlanRequest;
import com.pham.basis.evcharging.dto.response.SubscriptionPlanResponse;
import com.pham.basis.evcharging.model.SubscriptionPlan;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface SubscriptionPlanMapper {
    SubscriptionPlan toEntity(SubscriptionPlanRequest request);
    SubscriptionPlanResponse toResponse(SubscriptionPlan plan);
}
