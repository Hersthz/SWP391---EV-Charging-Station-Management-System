package com.pham.basis.evcharging.mapper;

import com.pham.basis.evcharging.dto.response.PaymentTransactionResponse;
import com.pham.basis.evcharging.model.PaymentTransaction;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface PaymentTransactionMapper {

    @Mapping(source = "user.id", target = "userId")
    @Mapping(source = "user.username", target = "username")
    PaymentTransactionResponse toResponse(PaymentTransaction tx);
}

