package com.pham.basis.evcharging.repository;

import com.pham.basis.evcharging.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

//interface → không cần viết code xử lý, Spring Data JPA sẽ tự động generate implementation khi chạy.
//Nếu cần custom query phức tạp hơn, có thể dùng @Query với JPQL hoặc SQL.
// Kế thừa JpaRepository để thao tác với DB thông qua Entity User
// User: entity class (tương ứng bảng User)
// Integer: kiểu dữ liệu của Primary Key (id)
@Repository
// @Repository: đánh dấu class là tầng truy xuất dữ liệu (DAO)
// Không cần dùng khi kế thừa JpaRepository, vì Spring Data JPA đã tự thêm.
public interface UserRepository extends JpaRepository<User,Integer> {
    User findUserByUsername(String username);
// JpaRepository đã có sẵn các method cơ bản:
// findAll(), findById(), save(), deleteById()...
    User findByEmail(String email);
}

