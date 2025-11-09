package com.pham.basis.evcharging.repository;

import com.pham.basis.evcharging.model.UserVoucher;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserVoucherRepository extends JpaRepository<UserVoucher, Long> {
    Optional<UserVoucher> findByUserIdAndVoucherId(Long userId, Long voucherId);
    List<UserVoucher> findAllByUserId(Long userId);
    Optional<UserVoucher> findByUserId(Long userId);
}
