package com.nexcoffee.managementsystem.repositories;

import com.nexcoffee.managementsystem.entities.Ward;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WardRepository extends JpaRepository<Ward, String> {

    List<Ward> findByProvinceCodeOrderByCodeAsc(String provinceCode);

    boolean existsByCodeAndProvinceCode(String code, String provinceCode);
}