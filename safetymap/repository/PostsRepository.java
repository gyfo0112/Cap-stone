package com.safetymap.safetymap.repository;

import com.safetymap.safetymap.entity.Posts;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PostsRepository extends JpaRepository<Posts, Integer> {

}
