package com.pham.basis.evcharging.dto.request;

import lombok.Data;
import org.springframework.data.domain.Pageable;

@Data
public class GetPaymentRequest {
    Long userid;
    int page;
    int pageSize;
}
