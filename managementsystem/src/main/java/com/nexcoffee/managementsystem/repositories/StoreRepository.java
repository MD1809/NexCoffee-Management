package com.nexcoffee.managementsystem.repositories;

import com.nexcoffee.managementsystem.entities.Store;
import com.nexcoffee.managementsystem.enums.StoreStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StoreRepository extends JpaRepository<Store, Long> {

    List<Store> findByStatus(StoreStatus status);
}