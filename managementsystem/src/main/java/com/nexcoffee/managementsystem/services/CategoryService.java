package com.nexcoffee.managementsystem.services;

import com.nexcoffee.managementsystem.dto.request.category.CategoryRequest;
import com.nexcoffee.managementsystem.dto.request.category.CategoryUpdateStatus;
import com.nexcoffee.managementsystem.dto.response.CategoryDetailResponse;
import com.nexcoffee.managementsystem.dto.response.CategoryResponse;
import com.nexcoffee.managementsystem.dto.response.ProductSimpleResponse;
import com.nexcoffee.managementsystem.entities.Category;
import com.nexcoffee.managementsystem.entities.Product;
import com.nexcoffee.managementsystem.entities.ProductImage;
import com.nexcoffee.managementsystem.exceptions.InvalidOperationException;
import com.nexcoffee.managementsystem.exceptions.ResourceNotFoundException; // <-- Thêm import này
import com.nexcoffee.managementsystem.repositories.CategoryRepository;
import com.nexcoffee.managementsystem.repositories.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CategoryService {

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ProductRepository productRepository;

    public CategoryResponse toCategoryResponse(Category category) {
        CategoryResponse res = new CategoryResponse();
        res.setId(category.getId());
        res.setName(category.getName());
        res.setDescription(category.getDescription());
        res.setProductCount(category.getProductCount());
        res.setCategoryStatus(category.getCategoryStatus());
        res.setCreatedAt(category.getCreatedAt());
        res.setUpdatedAt(category.getUpdatedAt());
        return res;
    }

    private ProductSimpleResponse toProductSimpleResponse(Product product) {
        ProductSimpleResponse res = new ProductSimpleResponse();
        res.setId(product.getId());
        res.setName(product.getName());
        res.setDescription(product.getDescription());
        res.setStatus(product.getStatus());
        res.setCreatedAt(product.getCreatedAt());

        if (product.getImages() != null && !product.getImages().isEmpty()) {
            String mainUrl = product.getImages().stream()
                    .filter(img -> Boolean.TRUE.equals(img.getIsMain()))
                    .map(ProductImage::getImageUrl)
                    .findFirst()
                    .orElse(null);
            res.setMainImageUrl(mainUrl);
        }

        return res;
    }

    public List<CategoryResponse> getAllCategories() {
        return categoryRepository.findAll().stream()
                .map(this::toCategoryResponse)
                .collect(Collectors.toList());
    }

    public CategoryResponse getCategoryById(Integer id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục với ID: " + id));
        return toCategoryResponse(category);
    }

    public CategoryDetailResponse getCategoryDetail(Integer categoryId) {
        CategoryResponse categoryResponse = this.getCategoryById(categoryId);
        List<Product> products = productRepository.findByCategoryId(categoryId);

        List<ProductSimpleResponse> simpleProducts = products.stream()
                .map(this::toProductSimpleResponse)
                .collect(Collectors.toList());

        CategoryDetailResponse detailResponse = new CategoryDetailResponse();
        detailResponse.setCategory(categoryResponse);
        detailResponse.setProducts(simpleProducts);

        return detailResponse;
    }

    @Transactional
    public CategoryResponse createCategory(CategoryRequest request) {
        if (categoryRepository.existsByName(request.getName())) {
            throw new InvalidOperationException("Tên danh mục '" + request.getName() + "' đã tồn tại!");
        }
        Category category = new Category();
        category.setName(request.getName());
        category.setDescription(request.getDescription());
        category.setCategoryStatus(request.getCategoryStatus());
        category.setProductCount(0);
        category.setCreatedAt(LocalDateTime.now());
        category.setUpdatedAt(LocalDateTime.now());

        Category savedCategory = categoryRepository.save(category);
        return toCategoryResponse(savedCategory);
    }

    @Transactional
    public CategoryResponse updateCategory(Integer id, CategoryRequest request) {
        Category existingCategory = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục với ID: " + id));

        if (!existingCategory.getName().equalsIgnoreCase(request.getName())
                && categoryRepository.existsByName(request.getName())) {
            throw new InvalidOperationException("Tên danh mục '" + request.getName() + "' đã tồn tại!");
        }

        existingCategory.setName(request.getName());
        existingCategory.setDescription(request.getDescription());
        existingCategory.setCategoryStatus(request.getCategoryStatus());
        existingCategory.setUpdatedAt(LocalDateTime.now());

        Category updatedCategory = categoryRepository.save(existingCategory);
        return toCategoryResponse(updatedCategory);
    }

    @Transactional
    public CategoryResponse updateCategoryStatus(Integer id, CategoryUpdateStatus request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục với ID: " + id));

        category.setCategoryStatus(request.getStatus());
        category.setUpdatedAt(LocalDateTime.now());

        Category updatedCategory = categoryRepository.save(category);
        return toCategoryResponse(updatedCategory);
    }

    public void deleteCategory(Integer id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục với ID: " + id));
        categoryRepository.delete(category);
    }
}