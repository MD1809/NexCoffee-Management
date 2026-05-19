package com.nexcoffee.managementsystem.repositories;

import com.nexcoffee.managementsystem.entities.Province;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProvinceRepository extends JpaRepository<Province, String> {

    List<Province> findAllByOrderByCodeAsc();
}