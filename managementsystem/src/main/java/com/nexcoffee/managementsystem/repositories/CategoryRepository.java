package com.nexcoffee.managementsystem.repositories;

import com.nexcoffee.managementsystem.entities.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Integer> {
    boolean existsByName(String name);
    List<Category> findByDeletedFalse();
}
