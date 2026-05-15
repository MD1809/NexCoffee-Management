import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import categoryApi from "../../../apis/CategoryApi";
import productApi from "../../../apis/ProductApi";

import "./AddProductPage.css";

function AddProductPage() {
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();

  // --- STATE QUẢN LÝ ẢNH ---
  const [previewImage, setPreviewImage] = useState(null); // URL ảnh chính
  const [subImagesState, setSubImagesState] = useState([]); // Mảng chứa object: [{ file, previewUrl }]

  const [product, setProduct] = useState({
    name: "",
    description: "",
    image: null,
    categoryId: "",
    status: "active",
    variants: [{ size: "S", price: "", status: "available" }],
  });

  useEffect(() => {
    fetchCategories();
    // Cleanup memory
    return () => {
      if (previewImage) URL.revokeObjectURL(previewImage);
      subImagesState.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    };
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await categoryApi.getAll();
      setCategories(response.data);
    } catch (error) {
      toast.error("Không thể tải danh sách danh mục!");
    }
  };

  // --- HANDLER: ẢNH CHÍNH ---
  const handleMainImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (previewImage) URL.revokeObjectURL(previewImage);
      setProduct({ ...product, image: file });
      setPreviewImage(URL.createObjectURL(file));
    }
    // Reset input để có thể chọn lại cùng 1 file nếu cần
    e.target.value = null;
  };

  // --- HANDLER: ẢNH PHỤ (THÊM NỐI TIẾP) ---
  const handleSubImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const newImages = files.map((file) => ({
        file: file,
        previewUrl: URL.createObjectURL(file),
      }));
      // Thêm nối tiếp vào danh sách cũ
      setSubImagesState((prev) => [...prev, ...newImages]);
    }
    e.target.value = null; // Reset input
  };

  // --- HANDLER: XÓA ẢNH PHỤ ---
  const removeSubImage = (indexToRemove) => {
    setSubImagesState((prev) => {
      const newList = [...prev];
      URL.revokeObjectURL(newList[indexToRemove].previewUrl); // Giải phóng bộ nhớ
      newList.splice(indexToRemove, 1);
      return newList;
    });
  };

  // --- CÁC HANDLER KHÁC ---
  const handleInputChange = (e) => {
    setProduct({ ...product, [e.target.name]: e.target.value });
  };

  const handleVariantChange = (index, field, value) => {
    const newVariants = [...product.variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setProduct({ ...product, variants: newVariants });
  };

  const addVariant = () => {
    setProduct({
      ...product,
      variants: [...product.variants, { size: "S", price: "", status: "available" }],
    });
  };

  const removeVariant = (index) => {
    const newVariants = product.variants.filter((_, i) => i !== index);
    setProduct({ ...product, variants: newVariants });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!product.image) {
      toast.warning("Vui lòng chọn ảnh chính cho sản phẩm!");
      return;
    }

    const formData = new FormData();
    formData.append("name", product.name);
    formData.append("description", product.description);
    formData.append("categoryId", product.categoryId);
    formData.append("status", product.status);
    formData.append("variants", JSON.stringify(product.variants));

    formData.append("mainImage", product.image);

    // Lấy file từ subImagesState để append vào form
    if (subImagesState.length > 0) {
      subImagesState.forEach((item) => {
        formData.append("subImages", item.file);
      });
    }

    try {
      await productApi.create(formData);
      navigate("/admin/products", {
        state: { success: true, message: "Thêm sản phẩm mới thành công!" },
      });
    } catch (error) {
      console.error(error);
      const errorMsg = error.response?.data?.message || "Có lỗi xảy ra khi lưu sản phẩm!";
      toast.error(errorMsg);
    }
  };

  return (
    <div className="add-product-page">
      <div className="page-header">
        <h2>Thêm mới sản phẩm</h2>
        <p className="subtitle">
          Cập nhật thực đơn với các món thức uống đặc trưng mới nhất.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="product-form">
        <div className="layout-grid">
          
          {/* CỘT TRÁI: KHU VỰC UPLOAD ẢNH */}
          <div className="left-column">
            
            {/* 1. ẢNH CHÍNH */}
            <div className="form-section">
              <input
                id="mainImageInput"
                type="file"
                accept="image/*"
                onChange={handleMainImageChange}
                className="hidden-input"
              />
              <label htmlFor="mainImageInput" className="main-image-upload-area">
                {previewImage ? (
                  <img src={previewImage} alt="Main" className="main-preview-img" />
                ) : (
                  <div className="upload-placeholder">
                    {/* SVG Icon Upload (Đám mây) */}
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="17 8 12 3 7 8"></polyline>
                      <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                    <span className="upload-text">+ Thêm ảnh chính</span>
                  </div>
                )}
              </label>
            </div>

            {/* 2. ẢNH PHỤ */}
            <div className="sub-images-section">
              <div className="sub-images-container">
                {/* Render danh sách ảnh phụ đã chọn */}
                {subImagesState.map((img, index) => (
                  <div key={index} className="sub-image-item">
                    <img src={img.previewUrl} alt={`Sub ${index}`} />
                    <button
                      type="button"
                      className="btn-remove-sub"
                      onClick={() => removeSubImage(index)}
                      title="Xóa ảnh này"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                ))}

                {/* Nút + thêm ảnh phụ */}
                <input
                  id="subImageInput"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleSubImageChange}
                  className="hidden-input"
                />
                <label htmlFor="subImageInput" className="add-sub-btn">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2196F3" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </label>
              </div>
            </div>

          </div>

          {/* CỘT PHẢI: THÔNG TIN VÀ BIẾN THỂ (Giữ nguyên) */}
          <div className="right-column">
            {/* THÔNG TIN CƠ BẢN */}
            <div className="form-section">
              <h3 className="section-title">THÔNG TIN CƠ BẢN</h3>
              <div className="input-group">
                <label>Tên sản phẩm</label>
                <input name="name" placeholder="Ví dụ: Latte Macchiato" onChange={handleInputChange} required className="form-control" />
              </div>

              <div className="form-row-flex">
                <div className="input-group">
                  <label>Danh mục</label>
                  <select name="categoryId" onChange={handleInputChange} required className="form-control">
                    <option value="">-- Chọn danh mục --</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="input-group">
                  <label>Trạng thái</label>
                  <select name="status" onChange={handleInputChange} required className="form-control">
                    <option value="active">Đang kinh doanh</option>
                    <option value="inactive">Ngừng kinh doanh</option>
                  </select>
                </div>
              </div>

              <div className="input-group">
                <label>Mô tả sản phẩm</label>
                <textarea name="description" placeholder="Nhập mô tả..." onChange={handleInputChange} rows="5" className="form-control" />
              </div>
            </div>

            {/* BẢNG GIÁ & KÍCH THƯỚC */}
            <div className="form-section">
              <div className="section-header-flex">
                <h3 className="section-title">BẢNG GIÁ & KÍCH THƯỚC</h3>
              </div>
              <div className="variants-container">
                {product.variants.map((v, index) => (
                  <div key={index} className="variant-row-modern">
                    <select value={v.size} onChange={(e) => handleVariantChange(index, "size", e.target.value)} className="variant-select form-control">
                      <option value="S">Size S</option>
                      <option value="M">Size M</option>
                      <option value="L">Size L</option>
                      <option value="XL">Size XL</option>
                    </select>
                    <input type="number" placeholder="Giá bán" className="variant-price form-control" value={v.price} onWheel={(e) => e.target.blur()} onChange={(e) => handleVariantChange(index, "price", e.target.value)} required />
                    <button type="button" onClick={() => removeVariant(index)} className="btn-remove-icon" disabled={product.variants.length === 1}>Xóa</button>
                  </div>
                ))}
                <button type="button" onClick={addVariant} className="btn-add-text">+ Thêm size</button>
              </div>
            </div>
          </div>
        </div>

        <div className="form-actions bottom-actions">
          <button type="button" onClick={() => navigate("/admin/products")} className="btn-cancel">Hủy</button>
          <button type="submit" className="btn-save">Lưu sản phẩm</button>
        </div>
      </form>
    </div>
  );
}

export default AddProductPage;