package com.nexcoffee.managementsystem.services;

import com.nexcoffee.managementsystem.dto.request.category.CategoryRequest;
import com.nexcoffee.managementsystem.dto.request.category.CategoryUpdateStatus;
import com.nexcoffee.managementsystem.dto.response.CategoryResponse;
import com.nexcoffee.managementsystem.entities.Category;
import com.nexcoffee.managementsystem.repositories.CategoryRepository;
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

    public List<CategoryResponse> getAllCategories() {
        return categoryRepository.findAll().stream()
                .map(this::toCategoryResponse)
                .collect(Collectors.toList());
    }

    public CategoryResponse getCategoryById(Integer id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy danh mục với ID: " + id));
        return toCategoryResponse(category);
    }

    @Transactional
    public CategoryResponse createCategory(CategoryRequest request) {
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
        // Tìm entity để update
        Category existingCategory = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy danh mục"));

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
                .orElseThrow(() -> new RuntimeException("Không tìm thấy danh mục"));

        category.setCategoryStatus(request.getStatus());
        category.setUpdatedAt(LocalDateTime.now());

        Category updatedCategory = categoryRepository.save(category);
        return toCategoryResponse(updatedCategory);
    }

    public void deleteCategory(Integer id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy danh mục"));
        categoryRepository.delete(category);
    }
}