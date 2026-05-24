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
import com.nexcoffee.managementsystem.enums.ProductVariantStatus;
import com.nexcoffee.managementsystem.enums.ProductsStatus;
import com.nexcoffee.managementsystem.exceptions.InvalidOperationException;
import com.nexcoffee.managementsystem.exceptions.ResourceNotFoundException;
import com.nexcoffee.managementsystem.repositories.CategoryRepository;
import com.nexcoffee.managementsystem.repositories.ProductRepository;
import com.nexcoffee.managementsystem.repositories.ProductVariantRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessException;
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
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ProductService {

    @Autowired
    private ProductRepository productRepository;
    @Autowired
    private CategoryRepository categoryRepository;
    @Autowired
    private ProductVariantRepository productVariantRepository;

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
            product.getImages().stream()
                    .filter(ProductImage::getIsMain)
                    .findFirst()
                    .ifPresent(img -> res.setMainImage(new ImageProductResponse(img.getId(), img.getImageUrl())));

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

    public List<ProductResponse> getProductsForAdmin() {
        return productRepository.findByDeletedFalseOrderByIdDesc().stream()
                .map(this::toProductResponse)
                .collect(Collectors.toList());
    }

    public List<ProductResponse> getTrashedProducts() {
        return productRepository.findByDeletedTrueOrderByIdDesc().stream()
                .map(this::toProductResponse)
                .collect(Collectors.toList());
    }


    public ProductResponse getProductById(Integer id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm với ID: " + id));
        return toProductResponse(product);
    }

    @Transactional
    public ProductResponse createProduct(ProductRequest request, MultipartFile mainImageFile, List<MultipartFile> subImageFiles) {
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Danh mục (Category) không tồn tại "));

        if (productRepository.existsByNameAndCategoryIdAndDeletedFalse(request.getName(), request.getCategoryId())) {
            throw new InvalidOperationException("Tên sản phẩm này đã tồn tại trong danh mục được chọn!");
        }

        Product product = new Product();
        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setStatus(request.getStatus());
        product.setCategory(category);
        product.setCreatedAt(LocalDateTime.now());
        product.setUpdatedAt(LocalDateTime.now());

        try {
            if (mainImageFile == null || mainImageFile.isEmpty()) {
                throw new InvalidOperationException("Ảnh chính sản phẩm là bắt buộc!");
            }
            ProductImage mainImage = new ProductImage();
            mainImage.setImageUrl(saveFile(mainImageFile));
            mainImage.setIsMain(true);
            mainImage.setProduct(product);
            mainImage.setCreatedAt(LocalDateTime.now());
            mainImage.setUpdatedAt(LocalDateTime.now());
            product.getImages().add(mainImage);

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
            System.err.println("Lỗi IO khi lưu file ảnh sản phẩm mới: " + e.getMessage());
            throw new RuntimeException("Lỗi hệ thống khi lưu file ảnh.");
        }

        ObjectMapper objectMapper = new ObjectMapper();
        List<ProductVariantRequest> variantRequests = new ArrayList<>();
        try {
            if (request.getVariants() != null && !request.getVariants().isEmpty()) {
                variantRequests = objectMapper.readValue(
                        request.getVariants(),
                        new TypeReference<List<ProductVariantRequest>>() {}
                );
            }
            else {
                variantRequests = new ArrayList<>();
            }
        } catch (Exception e) {
            throw new InvalidOperationException("Dữ liệu biến thể (variants) không hợp lệ.");
        }

        for (ProductVariantRequest vReq : variantRequests) {
            if (vReq.getSize() != null && (vReq.getSize().trim().isEmpty() || "null".equalsIgnoreCase(vReq.getSize().trim()))) {
                vReq.setSize(null);
            }

            if (vReq.getPrice() == null || vReq.getPrice() <= 0) {
                String logSize = (vReq.getSize() == null) ? "Mặc định" : vReq.getSize();
                throw new InvalidOperationException("Giá của biến thể (" + logSize + ") phải lớn hơn 0.");
            }
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

        int currentCount = category.getProductCount() == null ? 0 : category.getProductCount();
        category.setProductCount(currentCount + 1);
        categoryRepository.save(category);

        return toProductResponse(savedProduct);
    }

    @Transactional
    public ProductResponse updateProduct(Integer id, ProductRequest request,
                                         MultipartFile mainImageFile,
                                         List<MultipartFile> subImageFiles,
                                         List<Integer> deletedImageIds,
                                         List<Integer> deletedVariantIds) {

        Product existingProduct = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm với ID: " + id));

        if (productRepository.existsByNameAndCategoryIdAndIdNotAndDeletedFalse(request.getName(), request.getCategoryId(), id)) {
            throw new InvalidOperationException("Tên sản phẩm này đã tồn tại trong danh mục được chọn!");
        }

        Category newCategory = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Danh mục (Category) không tồn tại."));

        Category oldCategory = existingProduct.getCategory();
        if (oldCategory != null && !oldCategory.getId().equals(newCategory.getId())) {
            int oldCount = oldCategory.getProductCount() == null ? 0 : oldCategory.getProductCount();
            oldCategory.setProductCount(Math.max(0, oldCount - 1));
            categoryRepository.save(oldCategory);

            int newCount = newCategory.getProductCount() == null ? 0 : newCategory.getProductCount();
            newCategory.setProductCount(newCount + 1);
            categoryRepository.save(newCategory);
        }

        ObjectMapper objectMapper = new ObjectMapper();
        List<ProductVariantRequest> variantRequests;
        try {
            if (request.getVariants() != null && !request.getVariants().isEmpty()) {
                variantRequests = objectMapper.readValue(
                        request.getVariants(),
                        new TypeReference<List<ProductVariantRequest>>() {}
                );
            } else {
                variantRequests = new ArrayList<>();
            }
        } catch (Exception e) {
            throw new InvalidOperationException("Dữ liệu biến thể không hợp lệ.");
        }
        for (ProductVariantRequest vReq : variantRequests) {
            if (vReq.getSize() != null && (vReq.getSize().trim().isEmpty() || "null".equalsIgnoreCase(vReq.getSize().trim()))) {
                vReq.setSize(null);
            }
            if (vReq.getPrice() == null || vReq.getPrice() <= 0) {
                String logSize = (vReq.getSize() == null) ? "Mặc định" : vReq.getSize();
                throw new InvalidOperationException("Giá phải lớn hơn 0.");
            }
        }

        existingProduct.setName(request.getName());
        existingProduct.setDescription(request.getDescription());
        existingProduct.setStatus(request.getStatus());
        existingProduct.setCategory(newCategory);
        existingProduct.setUpdatedAt(LocalDateTime.now());


        if (deletedVariantIds != null && !deletedVariantIds.isEmpty()) {
            existingProduct.getVariants().removeIf(v -> deletedVariantIds.contains(v.getId()));
            productVariantRepository.deleteAllById(deletedVariantIds);
        }

        for (ProductVariantRequest vReq : variantRequests) {
            if (vReq.getId() != null) {
                existingProduct.getVariants().stream()
                        .filter(v -> v.getId().equals(vReq.getId()))
                        .findFirst()
                        .ifPresent(v -> {
                            v.setSize(vReq.getSize());
                            v.setPrice(vReq.getPrice());
                            v.setStatus(vReq.getStatus());
                            v.setUpdatedAt(LocalDateTime.now());
                        });
            } else {
                ProductVariant newVariant = new ProductVariant();
                newVariant.setSize(vReq.getSize());
                newVariant.setPrice(vReq.getPrice());
                newVariant.setStatus(vReq.getStatus());
                newVariant.setProduct(existingProduct);
                newVariant.setCreatedAt(LocalDateTime.now());
                newVariant.setUpdatedAt(LocalDateTime.now());
                existingProduct.getVariants().add(newVariant);
            }
        }

        if (deletedImageIds != null && !deletedImageIds.isEmpty()) {
            List<ProductImage> imagesToRemove = new ArrayList<>();
            for (ProductImage img : existingProduct.getImages()) {
                if (deletedImageIds.contains(img.getId())) {
                    if (img.getIsMain()) {
                        throw new InvalidOperationException("Không được phép xóa ảnh chính trực tiếp!");
                    }
                    imagesToRemove.add(img);
                }
            }

            for (ProductImage img : imagesToRemove) {
                deletePhysicalFile(img.getImageUrl());
            }
            existingProduct.getImages().removeAll(imagesToRemove);
        }

        try {
            if (mainImageFile != null && !mainImageFile.isEmpty()) {
                existingProduct.getImages().stream()
                        .filter(ProductImage::getIsMain)
                        .findFirst()
                        .ifPresentOrElse(oldMain -> {
                            deletePhysicalFile(oldMain.getImageUrl());
                            try {
                                oldMain.setImageUrl(saveFile(mainImageFile));
                                oldMain.setUpdatedAt(LocalDateTime.now());
                            } catch (IOException e) { throw new RuntimeException(e); }
                        }, () -> {
                            try {
                                ProductImage newMain = new ProductImage();
                                newMain.setImageUrl(saveFile(mainImageFile));
                                newMain.setIsMain(true);
                                newMain.setProduct(existingProduct);
                                newMain.setCreatedAt(LocalDateTime.now());
                                newMain.setUpdatedAt(LocalDateTime.now());
                                existingProduct.getImages().add(newMain);
                            } catch (IOException e) { throw new RuntimeException(e); }
                        });
            }

            if (subImageFiles != null && !subImageFiles.isEmpty()) {
                for (MultipartFile subFile : subImageFiles) {
                    if (!subFile.isEmpty()) {
                        ProductImage subImage = new ProductImage();
                        subImage.setImageUrl(saveFile(subFile));
                        subImage.setIsMain(false);
                        subImage.setProduct(existingProduct);
                        subImage.setCreatedAt(LocalDateTime.now());
                        subImage.setUpdatedAt(LocalDateTime.now());
                        existingProduct.getImages().add(subImage);
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Lỗi xử lý file ảnh cho SP ID " + id + ": " + e.getMessage());
            throw new RuntimeException("Lỗi hệ thống khi cập nhật file ảnh.");
        }

        Product updatedProduct = productRepository.save(existingProduct);
        return toProductResponse(updatedProduct);
    }

    @Transactional
    public void softDeleteProduct(Integer id) {
        try {
            Product product = productRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm với ID: " + id));

            // Kiểm tra xem đã bị xóa mềm chưa
            if (product.isDeleted()) {
                System.err.println("Thao tác lỗi: Cố gắng xóa sản phẩm đã bị xóa trước đó. ID: " + id);
                throw new InvalidOperationException("Sản phẩm này đã nằm trong thùng rác.");
            }

            // Bật cờ deleted thay vì đổi status
            product.setDeleted(true);
            // product.setStatus(...) // BỎ ĐI, giữ nguyên status hiện tại để sau này khôi phục lại đúng trạng thái cũ
            product.setUpdatedAt(LocalDateTime.now());

            productRepository.save(product);

            // Giảm số lượng sản phẩm của Category
            Category category = product.getCategory();
            if (category != null) {
                int count = category.getProductCount() == null ? 0 : category.getProductCount();
                category.setProductCount(Math.max(0, count - 1));
                categoryRepository.save(category);
            }

        } catch (DataAccessException e) {
            System.err.println("Lỗi Database khi xóa mềm sản phẩm ID " + id + ": " + e.getMessage());
            throw new RuntimeException("Lỗi hệ thống khi cập nhật dữ liệu.");
        }
    }

    @Transactional
    public void restoreProduct(Integer id) {
        try {
            Product product = productRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm với ID: " + id));

            // Kiểm tra xem sản phẩm có thực sự ở trong thùng rác không
            if (!product.isDeleted()) {
                System.err.println("Thao tác lỗi: Cố gắng khôi phục sản phẩm không bị xóa. ID: " + id);
                throw new InvalidOperationException("Sản phẩm này không nằm trong thùng rác.");
            }

            if (product.getCategory() != null) {
                boolean isNameTaken = productRepository.existsByNameAndCategoryIdAndDeletedFalse(
                        product.getName(), product.getCategory().getId()
                );
                if (isNameTaken) {
                    throw new InvalidOperationException("Không thể khôi phục vì đã có một sản phẩm khác mang tên '" + product.getName() + "' đang hoạt động trong danh mục này!");
                }
            }

            product.setDeleted(false);
            product.setUpdatedAt(LocalDateTime.now());

            productRepository.save(product);

            // Tăng lại số lượng sản phẩm của Category
            Category category = product.getCategory();
            if (category != null) {
                int count = category.getProductCount() == null ? 0 : category.getProductCount();
                category.setProductCount(count + 1);
                categoryRepository.save(category);
            }

        } catch (DataAccessException e) {
            System.err.println("Lỗi Database khi khôi phục sản phẩm ID " + id + ": " + e.getMessage());
            throw new RuntimeException("Lỗi hệ thống khi cập nhật dữ liệu.");
        }
    }
}