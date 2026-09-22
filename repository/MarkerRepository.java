package com.safetymap.safetymap.repository;

import com.safetymap.safetymap.entity.Marker;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MarkerRepository extends JpaRepository<Marker, Integer> {

}
