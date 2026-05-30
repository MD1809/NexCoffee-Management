package com.nexcoffee.managementsystem.repositories;

import com.nexcoffee.managementsystem.entities.HomeAdvertisement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface HomeAdvertisementRepository extends JpaRepository<HomeAdvertisement, Long> {

    Optional<HomeAdvertisement> findFirstByActiveTrueOrderByUpdatedAtDesc();

    List<HomeAdvertisement> findAllByOrderByUpdatedAtDesc();
}