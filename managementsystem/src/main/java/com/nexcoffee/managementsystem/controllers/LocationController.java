package com.nexcoffee.managementsystem.controllers;

import com.nexcoffee.managementsystem.entities.Province;
import com.nexcoffee.managementsystem.entities.Ward;
import com.nexcoffee.managementsystem.repositories.ProvinceRepository;
import com.nexcoffee.managementsystem.repositories.WardRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/locations")
@RequiredArgsConstructor
public class LocationController {

    private final ProvinceRepository provinceRepository;
    private final WardRepository wardRepository;

    @GetMapping("/provinces")
    public List<Province> getProvinces() {
        return provinceRepository.findAllByOrderByCodeAsc();
    }

    @GetMapping("/wards")
    public List<Ward> getWardsByProvince(@RequestParam String provinceCode) {
        return wardRepository.findByProvinceCodeOrderByCodeAsc(provinceCode);
    }
}