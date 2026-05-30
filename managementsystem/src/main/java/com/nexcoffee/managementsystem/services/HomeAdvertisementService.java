package com.nexcoffee.managementsystem.services;

import com.nexcoffee.managementsystem.dto.request.advertisement.HomeAdvertisementRequest;
import com.nexcoffee.managementsystem.dto.response.advertisement.HomeAdvertisementResponse;
import com.nexcoffee.managementsystem.entities.HomeAdvertisement;
import com.nexcoffee.managementsystem.enums.AdvertisementTargetType;
import com.nexcoffee.managementsystem.repositories.HomeAdvertisementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class HomeAdvertisementService {

    private final HomeAdvertisementRepository homeAdvertisementRepository;

    private final String UPLOAD_DIR = "uploads/";

    @Transactional(readOnly = true)
    public List<HomeAdvertisementResponse> getAll() {
        return homeAdvertisementRepository.findAllByOrderByUpdatedAtDesc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public HomeAdvertisementResponse getActiveHomeAdvertisement() {
        return homeAdvertisementRepository.findFirstByActiveTrueOrderByUpdatedAtDesc()
                .map(this::toResponse)
                .orElse(null);
    }

    public HomeAdvertisementResponse create(HomeAdvertisementRequest request) {
        validateBasicRequest(request, true);

        if (Boolean.TRUE.equals(request.getActive())) {
            deactivateAllAdvertisements();
        }

        AdvertisementTargetType targetType = parseTargetType(request.getTargetType());
        Long targetId = normalizeTargetId(targetType, request.getTargetId());

        String imageUrl;
        try {
            imageUrl = saveFile(request.getImage());
        } catch (IOException exception) {
            System.err.println("Lỗi IO khi lưu file ảnh quảng cáo mới: " + exception.getMessage());
            throw new RuntimeException("Lỗi hệ thống khi lưu file ảnh quảng cáo.");
        }

        HomeAdvertisement advertisement = HomeAdvertisement.builder()
                .title(request.getTitle().trim())
                .imageUrl(imageUrl)
                .targetType(targetType)
                .targetId(targetId)
                .targetUrl(buildTargetUrl(targetType, targetId))
                .active(Boolean.TRUE.equals(request.getActive()))
                .build();

        return toResponse(homeAdvertisementRepository.save(advertisement));
    }

    public HomeAdvertisementResponse update(Long id, HomeAdvertisementRequest request) {
        HomeAdvertisement advertisement = homeAdvertisementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy quảng cáo."));

        validateBasicRequest(request, false);

        if (Boolean.TRUE.equals(request.getActive())) {
            deactivateAllAdvertisements();
        }

        AdvertisementTargetType targetType = parseTargetType(request.getTargetType());
        Long targetId = normalizeTargetId(targetType, request.getTargetId());

        advertisement.setTitle(request.getTitle().trim());
        advertisement.setTargetType(targetType);
        advertisement.setTargetId(targetId);
        advertisement.setTargetUrl(buildTargetUrl(targetType, targetId));
        advertisement.setActive(Boolean.TRUE.equals(request.getActive()));

        if (request.getImage() != null && !request.getImage().isEmpty()) {
            deletePhysicalFile(advertisement.getImageUrl());

            try {
                advertisement.setImageUrl(saveFile(request.getImage()));
            } catch (IOException exception) {
                System.err.println("Lỗi IO khi cập nhật ảnh quảng cáo: " + exception.getMessage());
                throw new RuntimeException("Lỗi hệ thống khi cập nhật file ảnh quảng cáo.");
            }
        }

        return toResponse(homeAdvertisementRepository.save(advertisement));
    }

    public HomeAdvertisementResponse activate(Long id) {
        HomeAdvertisement advertisement = homeAdvertisementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy quảng cáo."));

        deactivateAllAdvertisements();

        advertisement.setActive(true);

        return toResponse(homeAdvertisementRepository.save(advertisement));
    }

    public void delete(Long id) {
        HomeAdvertisement advertisement = homeAdvertisementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy quảng cáo."));

        deletePhysicalFile(advertisement.getImageUrl());
        homeAdvertisementRepository.delete(advertisement);
    }

    private String saveFile(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            return null;
        }

        String originalFilename = file.getOriginalFilename() == null
                ? "advertisement.jpg"
                : file.getOriginalFilename();

        String fileName = UUID.randomUUID() + "_" + originalFilename;
        Path path = Paths.get(UPLOAD_DIR + fileName);

        Files.createDirectories(path.getParent());
        Files.copy(file.getInputStream(), path, StandardCopyOption.REPLACE_EXISTING);

        return fileName;
    }

    private void deletePhysicalFile(String fileName) {
        if (fileName != null && !fileName.isEmpty()) {
            try {
                Path imagePath = Paths.get(UPLOAD_DIR + fileName);
                Files.deleteIfExists(imagePath);
            } catch (IOException exception) {
                System.err.println("Không thể xóa file ảnh quảng cáo: " + exception.getMessage());
            }
        }
    }

    private void deactivateAllAdvertisements() {
        homeAdvertisementRepository.findAll()
                .forEach(advertisement -> advertisement.setActive(false));
    }

    private void validateBasicRequest(HomeAdvertisementRequest request, boolean requireImage) {
        if (request.getTitle() == null || request.getTitle().trim().isEmpty()) {
            throw new RuntimeException("Tiêu đề quảng cáo không được để trống.");
        }

        if (requireImage && (request.getImage() == null || request.getImage().isEmpty())) {
            throw new RuntimeException("Ảnh quảng cáo không được để trống.");
        }
    }

    private AdvertisementTargetType parseTargetType(String value) {
        if (value == null || value.isBlank()) {
            return AdvertisementTargetType.NONE;
        }

        try {
            return AdvertisementTargetType.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException exception) {
            throw new RuntimeException("Loại đích đến không hợp lệ.");
        }
    }

    private Long normalizeTargetId(AdvertisementTargetType targetType, Long targetId) {
        if (targetType == AdvertisementTargetType.NONE) {
            return null;
        }

        if (targetId == null) {
            throw new RuntimeException("Vui lòng chọn đích đến cho quảng cáo.");
        }

        return targetId;
    }

    private String buildTargetUrl(AdvertisementTargetType targetType, Long targetId) {
        if (targetType == AdvertisementTargetType.CATEGORY) {
            return "/menu?category=" + targetId;
        }

        if (targetType == AdvertisementTargetType.PRODUCT) {
            return "/products/" + targetId;
        }

        return null;
    }

    private HomeAdvertisementResponse toResponse(HomeAdvertisement advertisement) {
        return HomeAdvertisementResponse.builder()
                .id(advertisement.getId())
                .title(advertisement.getTitle())
                .imageUrl(advertisement.getImageUrl())
                .targetType(advertisement.getTargetType() == null
                        ? null
                        : advertisement.getTargetType().name())
                .targetId(advertisement.getTargetId())
                .targetUrl(advertisement.getTargetUrl())
                .active(advertisement.getActive())
                .createdAt(advertisement.getCreatedAt())
                .updatedAt(advertisement.getUpdatedAt())
                .build();
    }
}