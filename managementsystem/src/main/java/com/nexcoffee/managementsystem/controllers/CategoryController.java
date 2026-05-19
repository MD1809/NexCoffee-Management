package com.nexcoffee.managementsystem.controllers;

import com.nexcoffee.managementsystem.dto.request.category.CategoryRequest;
import com.nexcoffee.managementsystem.dto.request.category.CategoryUpdateStatus;
import com.nexcoffee.managementsystem.dto.response.CategoryDetailResponse;
import com.nexcoffee.managementsystem.dto.response.CategoryResponse;
import com.nexcoffee.managementsystem.services.CategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    @Autowired
    private CategoryService categoryService;

    @PostMapping
    public CategoryResponse createCategory(@RequestBody CategoryRequest request) {
        return categoryService.createCategory(request);
    }

    @GetMapping
    public List<CategoryResponse> getAllCategories() {
        return categoryService.getAllCategories();
    }

    @GetMapping("/{categoryId}")
    public CategoryResponse getCategory(@PathVariable Integer categoryId) {
        return categoryService.getCategoryById(categoryId);
    }

    // --- ENDPOINT MỚI CHO TRANG CHI TIẾT ---
    @GetMapping("/detail/{categoryId}")
    public CategoryDetailResponse getCategoryDetail(@PathVariable Integer categoryId) {
        return categoryService.getCategoryDetail(categoryId);
    }

    @PutMapping("/{categoryId}")
    public CategoryResponse updateCategory(@PathVariable Integer categoryId, @RequestBody CategoryRequest request) {
        return categoryService.updateCategory(categoryId, request);
    }

    @PatchMapping("/{categoryId}/status")
    public CategoryResponse updateStatus(@PathVariable Integer categoryId, @RequestBody CategoryUpdateStatus request) {
        return categoryService.updateCategoryStatus(categoryId, request);
    }

    @DeleteMapping("/{categoryId}")
    public String deleteCategory(@PathVariable Integer categoryId) {
        categoryService.deleteCategory(categoryId);
        return "Category has been deleted";
    }
}