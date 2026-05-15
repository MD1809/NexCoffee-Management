package com.nexcoffee.managementsystem.services;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nexcoffee.managementsystem.dto.request.product.ProductRequest;
import com.nexcoffee.managementsystem.dto.request.product.ProductVariantRequest;
import com.nexcoffee.managementsystem.dto.response.ImageProductResponse;
import com.nexcoffee.managementsystem.dto.response.ProductResponse;
import com.nexcoffee.managementsystem.dto.response.ProductVariantResponse;
import com.nexcoffee.managementsystem.entities.Category;
import com.nexcoffee.managementsystem.entities.Product;
import com.nexcoffee.managementsystem.entities.ProductImage;
import com.nexcoffee.managementsystem.entities.ProductVariant;
import com.nexcoffee.managementsystem.repositories.CategoryRepository;
import com.nexcoffee.managementsystem.repositories.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ProductService {

    @Autowired
    private ProductRepository productRepository;
    @Autowired
    private CategoryRepository categoryRepository;

    private final String UPLOAD_DIR = "uploads/";

    private String saveFile(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            return null;
        }
        String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
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
            } catch (IOException e) {
                System.err.println("Không thể xóa file ảnh vật lý: " + e.getMessage());
            }
        }
    }

    private ProductResponse toProductResponse(Product product) {
        ProductResponse res = new ProductResponse();
        res.setId(product.getId());
        res.setName(product.getName());
        res.setDescription(product.getDescription());
        res.setStatus(product.getStatus());

        if (product.getCategory() != null) {
            res.setCategoryId(product.getCategory().getId());
            res.setCategoryName(product.getCategory().getName());
        }

        if (product.getImages() != null) {
            // Lấy ảnh chính
            product.getImages().stream()
                    .filter(ProductImage::getIsMain)
                    .findFirst()
                    .ifPresent(img -> res.setMainImage(new ImageProductResponse(img.getId(), img.getImageUrl())));

            // Lấy danh sách ảnh phụ
            List<ImageProductResponse> subImgs = product.getImages().stream()
                    .filter(img -> !img.getIsMain())
                    .map(img -> new ImageProductResponse(img.getId(), img.getImageUrl()))
                    .collect(Collectors.toList());
            res.setGalleryImages(subImgs);
        }

        if (product.getVariants() != null) {
            List<ProductVariantResponse> variantResponses = product.getVariants().stream().map(v -> {
                ProductVariantResponse vr = new ProductVariantResponse();
                vr.setId(v.getId());
                vr.setSize(v.getSize());
                vr.setPrice(v.getPrice());
                vr.setStatus(v.getStatus());
                return vr;
            }).collect(Collectors.toList());
            res.setVariants(variantResponses);
        }

        return res;
    }

    public List<ProductResponse> getAllProducts() {
        return productRepository.findAll().stream()
                .map(this::toProductResponse)
                .collect(Collectors.toList());
    }

    public ProductResponse getProductById(Integer id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm với ID: " + id));
        return toProductResponse(product);
    }

    @Transactional
    public ProductResponse createProduct(ProductRequest request, MultipartFile mainImageFile, List<MultipartFile> subImageFiles) {
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Category không tồn tại"));

        Product product = new Product();
        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setStatus(request.getStatus());
        product.setCategory(category);
        product.setCreatedAt(LocalDateTime.now());
        product.setUpdatedAt(LocalDateTime.now());

        try {
            // Xử lý ảnh chính (Bắt buộc)
            if (mainImageFile == null || mainImageFile.isEmpty()) {
                throw new RuntimeException("Ảnh chính sản phẩm là bắt buộc!");
            }
            ProductImage mainImage = new ProductImage();
            mainImage.setImageUrl(saveFile(mainImageFile));
            mainImage.setIsMain(true);
            mainImage.setProduct(product);
            mainImage.setCreatedAt(LocalDateTime.now());
            mainImage.setUpdatedAt(LocalDateTime.now());
            product.getImages().add(mainImage);

            // Xử lý ảnh phụ (Tùy chọn)
            if (subImageFiles != null && !subImageFiles.isEmpty()) {
                for (MultipartFile subFile : subImageFiles) {
                    if (!subFile.isEmpty()) {
                        ProductImage subImage = new ProductImage();
                        subImage.setImageUrl(saveFile(subFile));
                        subImage.setIsMain(false);
                        subImage.setProduct(product);
                        subImage.setCreatedAt(LocalDateTime.now());
                        subImage.setUpdatedAt(LocalDateTime.now());
                        product.getImages().add(subImage);
                    }
                }
            }
        } catch (IOException e) {
            throw new RuntimeException("Lỗi khi lưu file ảnh: " + e.getMessage());
        }

        // Xử lý Variants
        ObjectMapper objectMapper = new ObjectMapper();
        List<ProductVariantRequest> variantRequests = new ArrayList<>();
        try {
            if (request.getVariants() != null && !request.getVariants().isEmpty()) {
                variantRequests = objectMapper.readValue(
                        request.getVariants(),
                        new TypeReference<List<ProductVariantRequest>>() {}
                );
            }
        } catch (Exception e) {
            throw new RuntimeException("Dữ liệu biến thể không hợp lệ: " + e.getMessage());
        }

        List<ProductVariant> variants = variantRequests.stream().map(vReq -> {
            ProductVariant variant = new ProductVariant();
            variant.setSize(vReq.getSize());
            variant.setPrice(vReq.getPrice());
            variant.setStatus(vReq.getStatus());
            variant.setProduct(product);
            variant.setCreatedAt(LocalDateTime.now());
            variant.setUpdatedAt(LocalDateTime.now());
            return variant;
        }).collect(Collectors.toList());

        product.setVariants(variants);
        Product savedProduct = productRepository.save(product);
        return toProductResponse(savedProduct);
    }

    @Transactional
    public ProductResponse updateProduct(Integer id, ProductRequest request,
                                         MultipartFile mainImageFile,
                                         List<MultipartFile> subImageFiles,
                                         List<Integer> deletedImageIds) { // BỔ SUNG THAM SỐ NÀY

        Product existingProduct = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm"));

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Category không tồn tại"));

        existingProduct.setName(request.getName());
        existingProduct.setDescription(request.getDescription());
        existingProduct.setStatus(request.getStatus());
        existingProduct.setCategory(category);
        existingProduct.setUpdatedAt(LocalDateTime.now());

        // A. XỬ LÝ XÓA ẢNH PHỤ
        if (deletedImageIds != null && !deletedImageIds.isEmpty()) {
            List<ProductImage> imagesToRemove = new ArrayList<>();
            for (ProductImage img : existingProduct.getImages()) {
                if (deletedImageIds.contains(img.getId())) {
                    if (img.getIsMain()) {
                        // Logic bảo vệ: Chặn không cho xóa ảnh chính
                        throw new RuntimeException("Không được phép xóa ảnh chính, chỉ được thay đổi!");
                    }
                    imagesToRemove.add(img);
                }
            }

            // Xóa file vật lý và xóa khỏi list
            for (ProductImage img : imagesToRemove) {
                deletePhysicalFile(img.getImageUrl());
                existingProduct.getImages().remove(img);
                // Nhờ orphanRemoval = true ở Entity, Hibernate sẽ tự động Delete trong Database
            }
        }

        try {
            // B. XỬ LÝ ẢNH CHÍNH: Chỉ đổi nếu có file mới gửi lên
            if (mainImageFile != null && !mainImageFile.isEmpty()) {
                existingProduct.getImages().stream()
                        .filter(ProductImage::getIsMain)
                        .findFirst()
                        .ifPresentOrElse(oldMain -> {
                            deletePhysicalFile(oldMain.getImageUrl()); // Xóa file cũ
                            try {
                                oldMain.setImageUrl(saveFile(mainImageFile)); // Ghi đè file mới
                                oldMain.setUpdatedAt(LocalDateTime.now());
                            } catch (IOException e) {
                                throw new RuntimeException(e);
                            }
                        }, () -> {
                            // Backup phòng hờ data cũ bị lỗi mất ảnh chính
                            try {
                                ProductImage newMain = new ProductImage();
                                newMain.setImageUrl(saveFile(mainImageFile));
                                newMain.setIsMain(true);
                                newMain.setProduct(existingProduct);
                                existingProduct.getImages().add(newMain);
                            } catch (IOException e) {
                                throw new RuntimeException(e);
                            }
                        });
            }

            // C. XỬ LÝ ẢNH PHỤ MỚI: Thêm nối tiếp vào danh sách hiện tại
            if (subImageFiles != null && !subImageFiles.isEmpty()) {
                for (MultipartFile subFile : subImageFiles) {
                    if (!subFile.isEmpty()) {
                        ProductImage subImage = new ProductImage();
                        subImage.setImageUrl(saveFile(subFile)); // Đã được xử lý hợp lệ
                        subImage.setIsMain(false);
                        subImage.setProduct(existingProduct);
                        subImage.setCreatedAt(LocalDateTime.now());
                        subImage.setUpdatedAt(LocalDateTime.now());

                        existingProduct.getImages().add(subImage);
                    }
                }
            }
        } catch (Exception e) { // ĐỔI THÀNH Exception (Bao trùm cả IOException và RuntimeException)
            throw new RuntimeException("Lỗi khi cập nhật file ảnh: " + e.getMessage());
        }

        // Xử lý Variants (Giữ nguyên logic cũ của bạn)
        ObjectMapper objectMapper = new ObjectMapper();
        List<ProductVariantRequest> variantRequests = new ArrayList<>();
        try {
            if (request.getVariants() != null && !request.getVariants().isEmpty()) {
                variantRequests = objectMapper.readValue(
                        request.getVariants(),
                        new TypeReference<List<ProductVariantRequest>>() {}
                );
            }
        } catch (Exception e) {
            throw new RuntimeException("Dữ liệu biến thể không hợp lệ: " + e.getMessage());
        }

        existingProduct.getVariants().clear();

        List<ProductVariant> newVariants = variantRequests.stream().map(vReq -> {
            ProductVariant variant = new ProductVariant();
            variant.setSize(vReq.getSize());
            variant.setPrice(vReq.getPrice());
            variant.setStatus(vReq.getStatus());
            variant.setProduct(existingProduct);
            variant.setCreatedAt(LocalDateTime.now());
            variant.setUpdatedAt(LocalDateTime.now());
            return variant;
        }).collect(Collectors.toList());

        existingProduct.getVariants().addAll(newVariants);

        Product updatedProduct = productRepository.save(existingProduct);
        return toProductResponse(updatedProduct);
    }

    @Transactional
    public void deleteProduct(Integer id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm với ID: " + id));

        // Xóa tất cả các file ảnh vật lý (cả chính lẫn phụ)
        if (product.getImages() != null) {
            for (ProductImage img : product.getImages()) {
                deletePhysicalFile(img.getImageUrl());
            }
        }

        productRepository.delete(product);
    }
}