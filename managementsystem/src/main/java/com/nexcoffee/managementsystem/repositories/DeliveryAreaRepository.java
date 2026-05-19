package com.nexcoffee.managementsystem.repositories;

import com.nexcoffee.managementsystem.entities.DeliveryArea;
import com.nexcoffee.managementsystem.enums.DeliveryAreaStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DeliveryAreaRepository extends JpaRepository<DeliveryArea, Long> {

    Optional<DeliveryArea> findByAreaKey(String areaKey);

    boolean existsByAreaKey(String areaKey);

    List<DeliveryArea> findByStatus(DeliveryAreaStatus status);
}