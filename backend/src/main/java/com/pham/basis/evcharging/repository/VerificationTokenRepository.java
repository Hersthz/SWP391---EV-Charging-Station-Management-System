package com.pham.basis.evcharging.repository;

import com.pham.basis.evcharging.model.User;
import com.pham.basis.evcharging.model.VerificationToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VerificationTokenRepository extends JpaRepository<VerificationToken,Integer> {
    Optional<VerificationToken> findByToken(String token);
    //Optional là một container object có thể chứa giá trị hoặc rỗng (null)
    //Giúp tránh NullPointerException
    void deleteByUser(User user);
}
