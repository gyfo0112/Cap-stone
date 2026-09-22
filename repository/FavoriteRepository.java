package com.safetymap.safetymap.repository;

import com.safetymap.safetymap.entity.Favorite;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FavoriteRepository extends JpaRepository<Favorite, Integer> {

}
