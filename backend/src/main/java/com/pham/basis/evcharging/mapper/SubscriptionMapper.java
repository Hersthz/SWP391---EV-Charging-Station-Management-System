package com.pham.basis.evcharging.mapper;
import com.pham.basis.evcharging.dto.response.SubscriptionResponse;
import com.pham.basis.evcharging.model.Subscription;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface SubscriptionMapper {
    @Mapping(target = "planName", source = "plan.name")
    @Mapping(target = "planId", source = "plan.planId")
    SubscriptionResponse toResponse(Subscription subscription);
}