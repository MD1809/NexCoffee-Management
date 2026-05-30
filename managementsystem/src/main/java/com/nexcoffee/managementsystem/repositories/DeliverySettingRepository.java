package com.nexcoffee.managementsystem.repositories;

import com.nexcoffee.managementsystem.entities.DeliverySetting;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DeliverySettingRepository extends JpaRepository<DeliverySetting, Long> {

    Optional<DeliverySetting> findFirstByOrderByIdAsc();
}