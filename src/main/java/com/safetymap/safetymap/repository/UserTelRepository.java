package com.safetymap.safetymap.repository;

import com.safetymap.safetymap.entity.UserTel;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserTelRepository extends JpaRepository<UserTel, Integer> {

    // 유저 uuid로 모든 전화번호 가져오기
    Slice<UserTel> findAllByUser_User_uuid(String user_uuid);

    // 유저 uuid와 tel uuid로 하나 삭제
    void deleteByUser_User_uuidAndTel_uuid(String user_uuid, String tel_uuid);
}
