package com.nexcoffee.managementsystem.repositories;

import com.nexcoffee.managementsystem.entities.Store;
import com.nexcoffee.managementsystem.enums.StoreStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StoreRepository extends JpaRepository<Store, Long> {
    List<Store> findByStatus(StoreStatus status);

    List<Store> findAllByOrderByCreatedAtDesc();

    List<Store> findByStatusOrderByCreatedAtDesc(StoreStatus status);

    Optional<Store> findFirstByStatusOrderByCreatedAtAsc(StoreStatus status);

    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);
}