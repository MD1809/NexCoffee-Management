import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import categoryApi from "../../../apis/CategoryApi";
import productApi from "../../../apis/ProductApi";

import Dropdown from "../../../components/admin/dropDown/Dropdown";
import "./AddProductPage.css";

function AddProductPage() {
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();

  const [previewImage, setPreviewImage] = useState(null);
  const [subImagesState, setSubImagesState] = useState([]);

  // Quản lý loại sản phẩm: true = không size, false = có size
  const [isSimpleProduct, setIsSimpleProduct] = useState(false);

  // TÁCH RIÊNG 2 STATE QUẢN LÝ BIẾN THỂ (TỐI ƯU UX)
  const [variantsWithSize, setVariantsWithSize] = useState([
    { size: "S", price: "", status: "available" },
  ]);
  const [variantSimple, setVariantSimple] = useState([
    { size: null, price: "", status: "available" },
  ]);

  // Loại bỏ variants ra khỏi state product chung để dễ quản lý
  const [product, setProduct] = useState({
    name: "",
    description: "",
    image: null,
    categoryId: "",
    status: "active",
  });

  const [errors, setErrors] = useState({});

  const statusOptions = [
    { label: "Đang kinh doanh", value: "active" },
    { label: "Ngừng kinh doanh", value: "inactive" },
  ];

  const sizeOptions = [
    { label: "Size S", value: "S" },
    { label: "Size M", value: "M" },
    { label: "Size L", value: "L" },
    { label: "Size XL", value: "XL" },
  ];

  useEffect(() => {
    fetchCategories();
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

  // Hàm xử lý khi switch giữa Có size và Không size
  const handleProductTypeChange = (isSimple) => {
    setIsSimpleProduct(isSimple);
    // Chỉ xóa log lỗi của variants khi chuyển đổi tab, không xóa dữ liệu
    if (errors.variants) {
      setErrors((prev) => ({ ...prev, variants: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!product.name.trim()) {
      newErrors.name = "Tên sản phẩm không được để trống.";
    }
    if (product.description.length > 255) {
      newErrors.description = "Mô tả sản phẩm không được vượt quá 255 ký tự.";
    }
    if (!product.categoryId) {
      newErrors.categoryId = "Vui lòng chọn danh mục cho sản phẩm.";
    }
    if (!product.image) {
      newErrors.image = "Vui lòng chọn ảnh chính cho sản phẩm.";
    }

    const variantErrors = [];
    const activeVariants = isSimpleProduct ? variantSimple : variantsWithSize;

    activeVariants.forEach((v, index) => {
      const vError = {};
      if (!v.price) {
        vError.price = "Giá bán không được để trống.";
      } else if (Number(v.price) <= 0) {
        vError.price = "Giá bán phải lớn hơn 0.";
      }
      if (Object.keys(vError).length > 0) {
        variantErrors[index] = vError;
      }
    });

    if (variantErrors.length > 0) {
      newErrors.variants = variantErrors;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleMainImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (previewImage) URL.revokeObjectURL(previewImage);
      setProduct({ ...product, image: file });
      setPreviewImage(URL.createObjectURL(file));
      setErrors((prev) => ({ ...prev, image: null }));
    }
    e.target.value = null;
  };

  const handleSubImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const newImages = files.map((file) => ({
        file: file,
        previewUrl: URL.createObjectURL(file),
      }));
      setSubImagesState((prev) => [...prev, ...newImages]);
    }
    e.target.value = null;
  };

  const removeSubImage = (indexToRemove) => {
    setSubImagesState((prev) => {
      const newList = [...prev];
      URL.revokeObjectURL(newList[indexToRemove].previewUrl);
      newList.splice(indexToRemove, 1);
      return newList;
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProduct({ ...product, [name]: value });
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  // Tách biệt việc lưu dữ liệu variant vào đúng state đang thao tác
  const handleVariantChange = (index, field, value) => {
    if (isSimpleProduct) {
      const newVariants = [...variantSimple];
      newVariants[index] = { ...newVariants[index], [field]: value };
      setVariantSimple(newVariants);
    } else {
      const newVariants = [...variantsWithSize];
      newVariants[index] = { ...newVariants[index], [field]: value };
      setVariantsWithSize(newVariants);
    }

    // Xóa lỗi nếu đang nhập
    if (
      errors.variants &&
      errors.variants[index] &&
      errors.variants[index][field]
    ) {
      const newVariantErrors = [...errors.variants];
      delete newVariantErrors[index][field];
      setErrors((prev) => ({ ...prev, variants: newVariantErrors }));
    }
  };

  // Chỉ thêm variant cho chế độ "Có size"
  const addVariant = () => {
    setVariantsWithSize([
      ...variantsWithSize,
      { size: "S", price: "", status: "available" },
    ]);
  };

  // Chỉ xóa variant cho chế độ "Có size"
  const removeVariant = (index) => {
    const newVariants = variantsWithSize.filter((_, i) => i !== index);
    setVariantsWithSize(newVariants);

    if (errors.variants) {
      const newVariantErrors = errors.variants.filter((_, i) => i !== index);
      setErrors((prev) => ({ ...prev, variants: newVariantErrors }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Vui lòng kiểm tra lại các thông tin bị lỗi!");
      return;
    }

    const finalVariants = isSimpleProduct ? variantSimple : variantsWithSize;

    const formData = new FormData();
    formData.append("name", product.name);
    formData.append("description", product.description);
    formData.append("categoryId", product.categoryId);
    formData.append("status", product.status);
    formData.append("variants", JSON.stringify(finalVariants));
    formData.append("mainImage", product.image);

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
      if (error.response && error.response.data) {
        const errorData = error.response.data;

        // 1. Lỗi từ @Valid (ví dụ: thiếu giá trị bắt buộc)
        if (errorData.errors) {
          setErrors(errorData.errors);
          toast.error("Vui lòng kiểm tra lại dữ liệu nhập!");
        }
        // 2. Lỗi Custom từ Backend (ví dụ: Trùng tên cùng danh mục)
        else if (errorData.message) {
          toast.error(errorData.message);
          // Gán lỗi vào ô tên sản phẩm để hiện chữ đỏ bên dưới ô input
          setErrors({ name: errorData.message });
        } else {
          toast.error("Có lỗi xảy ra khi lưu sản phẩm!");
        }
      } else {
        toast.error("Lỗi kết nối đến máy chủ");
      }
      console.error("Chi tiết lỗi:", error);
    }
  };

  // Quyết định dữ liệu variants nào sẽ được hiển thị ra giao diện
  const currentVariants = isSimpleProduct ? variantSimple : variantsWithSize;

  return (
    <div className="add-product-page">
      <div className="page-header">
        <h2>Thêm mới sản phẩm</h2>
        <p className="subtitle">
          Cập nhật thực đơn với các món thức uống đặc trưng mới nhất.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="product-form" noValidate>
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
              <label
                htmlFor="mainImageInput"
                className={`main-image-upload-area ${errors.image ? "input-error-border" : ""}`}
              >
                {previewImage ? (
                  <img
                    src={previewImage}
                    alt="Main"
                    className="main-preview-img"
                  />
                ) : (
                  <div className="upload-placeholder">
                    <svg
                      width="40"
                      height="40"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#555"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="17 8 12 3 7 8"></polyline>
                      <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                    <span className="upload-text">+ Thêm ảnh chính</span>
                  </div>
                )}
              </label>
              {errors.image && (
                <div className="error-message">{errors.image}</div>
              )}
            </div>

            {/* 2. ẢNH PHỤ */}
            <div className="sub-images-section">
              <div className="sub-images-container">
                {subImagesState.map((img, index) => (
                  <div key={index} className="sub-image-item">
                    <img src={img.previewUrl} alt={`Sub ${index}`} />
                    <button
                      type="button"
                      className="btn-remove-sub"
                      onClick={() => removeSubImage(index)}
                      title="Xóa ảnh này"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                ))}

                <input
                  id="subImageInput"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleSubImageChange}
                  className="hidden-input"
                />
                <label htmlFor="subImageInput" className="add-sub-btn">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#2196F3"
                    strokeWidth="2"
                  >
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </label>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: THÔNG TIN VÀ BIẾN THỂ */}
          <div className="right-column">
            {/* THÔNG TIN CƠ BẢN */}
            <div className="form-section">
              <h3 className="section-title">THÔNG TIN CƠ BẢN</h3>

              <div className="input-group">
                <label>Tên sản phẩm</label>
                <input
                  name="name"
                  placeholder="Ví dụ: Latte Macchiato"
                  onChange={handleInputChange}
                  className={`form-control ${errors.name ? "input-error" : ""}`}
                />
                {errors.name && (
                  <div className="error-message">{errors.name}</div>
                )}
              </div>

              <div className="form-row-flex">
                <div className="input-group">
                  <label>Danh mục</label>
                  <div
                    className={`form-control-dropdown ${errors.categoryId ? "input-error" : ""}`}
                  >
                    <Dropdown
                      options={categories.map((cat) => ({
                        label: cat.name,
                        value: cat.id,
                      }))}
                      defaultValue={product.categoryId}
                      placeholder="-- Chọn danh mục --"
                      onChange={(option) =>
                        handleInputChange({
                          target: { name: "categoryId", value: option.value },
                        })
                      }
                    />
                  </div>
                  {errors.categoryId && (
                    <div className="error-message">{errors.categoryId}</div>
                  )}
                </div>

                <div className="input-group">
                  <label>Trạng thái</label>
                  <Dropdown
                    options={statusOptions}
                    defaultValue={product.status}
                    placeholder="Chọn trạng thái"
                    onChange={(option) =>
                      handleInputChange({
                        target: { name: "status", value: option.value },
                      })
                    }
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Mô tả sản phẩm</label>
                <textarea
                  name="description"
                  placeholder="Nhập mô tả..."
                  onChange={handleInputChange}
                  rows="5"
                  className="form-control"
                />
                {errors.description && (
                  <div className="error-message">{errors.description}</div>
                )}
              </div>
            </div>

            {/* BẢNG GIÁ & KÍCH THƯỚC */}
            <div className="form-section">
              <div className="section-header-flex">
                <h3 className="section-title priceSize">
                  BẢNG GIÁ & KÍCH THƯỚC
                </h3>

                <div className="product-type-toggle">
                  <label>
                    <input
                      type="radio"
                      name="productType"
                      checked={!isSimpleProduct}
                      onChange={() => handleProductTypeChange(false)}
                    />
                    Có size
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="productType"
                      checked={isSimpleProduct}
                      onChange={() => handleProductTypeChange(true)}
                    />
                    Không size
                  </label>
                </div>
              </div>

              <div className="variants-container">
                {/* Lặp qua danh sách tương ứng (currentVariants) */}
                {currentVariants.map((v, index) => {
                  const variantError = errors.variants?.[index];
                  return (
                    <div key={index} className="variant-wrapper">
                      <div className="variant-row-modern">
                        {!isSimpleProduct ? (
                          <div style={{ width: "140px" }}>
                            <Dropdown
                              options={sizeOptions}
                              defaultValue={v.size || "S"}
                              placeholder="Chọn Size"
                              onChange={(option) =>
                                handleVariantChange(index, "size", option.value)
                              }
                            />
                          </div>
                        ) : (
                          <div
                            style={{
                              padding: "8px 0",
                              fontWeight: "600",
                              color: "#555",
                              minWidth: "100px",
                            }}
                          >
                            Giá sản phẩm:
                          </div>
                        )}

                        <div
                          className="variant-column-priceInput"
                          style={{ flex: 1 }}
                        >
                          <input
                            type="number"
                            placeholder="Nhập giá bán (VNĐ)"
                            className={`variant-price form-control ${variantError?.price ? "input-error" : ""}`}
                            value={v.price}
                            onWheel={(e) => e.target.blur()}
                            onChange={(e) =>
                              handleVariantChange(
                                index,
                                "price",
                                e.target.value,
                              )
                            }
                          />
                          {variantError?.price && (
                            <div className="error-message variant-error">
                              {variantError.price}
                            </div>
                          )}
                        </div>

                        {!isSimpleProduct && (
                          <button
                            type="button"
                            onClick={() => removeVariant(index)}
                            className="btn-remove-icon"
                            disabled={currentVariants.length === 1}
                          >
                            Xóa
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {!isSimpleProduct && (
                  <button
                    type="button"
                    onClick={addVariant}
                    className="btn-add-text"
                  >
                    + Thêm size
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="form-actions bottom-actions">
          <button
            type="button"
            onClick={() => navigate("/admin/products")}
            className="btn-cancel"
          >
            Hủy
          </button>
          <button type="submit" className="btn-save">
            Lưu sản phẩm
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddProductPage;
