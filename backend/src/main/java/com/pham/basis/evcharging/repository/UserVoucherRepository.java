package com.pham.basis.evcharging.repository;

import com.pham.basis.evcharging.model.UserVoucher;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserVoucherRepository extends JpaRepository<UserVoucher, Long> {
    List<UserVoucher> findAllByUser_Id(Long userId);

    Optional<UserVoucher> findByUser_IdAndVoucher_Id(Long userId, Long voucherId);
    
    @Query("SELECT uv FROM UserVoucher uv WHERE uv.user.id = :userId AND uv.voucher.code = :code")
    Optional<UserVoucher> findByUser_IdAndVoucher_Code(@Param("userId") Long userId, @Param("code") String code);
    
    @Query("SELECT uv FROM UserVoucher uv WHERE uv.voucher.id = :voucherId")
    List<UserVoucher> findAllByVoucher_Id(@Param("voucherId") Long voucherId);
}
