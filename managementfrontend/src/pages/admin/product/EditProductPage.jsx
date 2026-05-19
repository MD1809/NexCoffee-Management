import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import categoryApi from "../../../apis/CategoryApi";
import productApi from "../../../apis/ProductApi";

import "./AddProductPage.css";

function EditProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);

  // --- STATE QUẢN LÝ ẢNH ---
  const [previewImage, setPreviewImage] = useState(null);
  const [existingSubImages, setExistingSubImages] = useState([]);
  const [newSubImages, setNewSubImages] = useState([]);
  const [deletedImageIds, setDeletedImageIds] = useState([]);
  const [deletedVariantIds, setDeletedVariantIds] = useState([]);

  // --- STATE QUẢN LÝ LOẠI SẢN PHẨM & BIẾN THỂ ---
  const [isSimpleProduct, setIsSimpleProduct] = useState(false);
  const [variantsWithSize, setVariantsWithSize] = useState([
    { size: "S", price: "", status: "available" },
  ]);
  const [variantSimple, setVariantSimple] = useState([
    { size: null, price: "", status: "available" },
  ]);

  const [product, setProduct] = useState({
    name: "",
    description: "",
    image: null,
    categoryId: "",
    status: "active",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchCategories();
    fetchProductDetail();

    return () => {
      if (previewImage && previewImage.startsWith("blob:")) {
        URL.revokeObjectURL(previewImage);
      }
      newSubImages.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchCategories = async () => {
    try {
      const response = await categoryApi.getAll();
      setCategories(response.data);
    } catch (error) {
      toast.error("Không thể tải danh sách danh mục!");
    }
  };

  const fetchProductDetail = async () => {
    try {
      const response = await productApi.getById(id);
      const data = response.data;
      console.log("DỮ LIỆU SẢN PHẨM TỪ API:", data);

      setProduct({
        name: data.name,
        description: data.description || "",
        image: null,
        categoryId: data.categoryId,
        status: data.status || "active",
      });

      // --- XỬ LÝ DỮ LIỆU BIẾN THỂ TỪ BACKEND ---
      if (data.variants && data.variants.length > 0) {
        // Nếu chỉ có 1 biến thể và size là null (hoặc chuỗi rỗng/"null") -> Sản phẩm không size
        const isSimple =
          data.variants.length === 1 &&
          (!data.variants[0].size || data.variants[0].size === "null");

        setIsSimpleProduct(isSimple);

        if (isSimple) {
          // Gán vào state variantSimple (có kèm id từ backend)
          setVariantSimple(data.variants);
          // Reset bên có size về mặc định
          setVariantsWithSize([{ size: "S", price: "", status: "available" }]);
        } else {
          // Gán vào state variantsWithSize (có kèm id từ backend)
          setVariantsWithSize(data.variants);
          // Reset bên không size về mặc định
          setVariantSimple([{ size: null, price: "", status: "available" }]);
        }
      }

      if (data.mainImage && data.mainImage.url) {
        setPreviewImage(data.mainImage.url);
      }
      if (data.galleryImages && data.galleryImages.length > 0) {
        setExistingSubImages(data.galleryImages);
      }
    } catch (error) {
      toast.error("Không thể tải thông tin sản phẩm!");
      navigate("/admin/products");
    }
  };

  // Hàm xử lý khi switch giữa Có size và Không size
  const handleProductTypeChange = (isSimple) => {
    setIsSimpleProduct(isSimple);
    if (errors.variants) {
      setErrors((prev) => ({ ...prev, variants: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!product.name.trim())
      newErrors.name = "Tên sản phẩm không được để trống.";
    if (!product.categoryId) newErrors.categoryId = "Vui lòng chọn danh mục.";
    if (!previewImage) newErrors.image = "Vui lòng chọn ảnh chính.";

    const variantErrors = [];
    const activeVariants = isSimpleProduct ? variantSimple : variantsWithSize;

    activeVariants.forEach((v, index) => {
      const vError = {};
      if (!v.price) {
        vError.price = "Giá bán không được để trống.";
      } else if (Number(v.price) <= 0) {
        vError.price = "Giá bán phải lớn hơn 0.";
      }
      if (Object.keys(vError).length > 0) variantErrors[index] = vError;
    });

    if (variantErrors.length > 0) newErrors.variants = variantErrors;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- HANDLER: ẢNH CHÍNH ---
  const handleMainImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (previewImage && previewImage.startsWith("blob:"))
        URL.revokeObjectURL(previewImage);
      setProduct({ ...product, image: file });
      setPreviewImage(URL.createObjectURL(file));
      setErrors((prev) => ({ ...prev, image: null }));
    }
    e.target.value = null;
  };

  // --- HANDLERS: ẢNH PHỤ ---
  const handleSubImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const newImages = files.map((file) => ({
        file: file,
        previewUrl: URL.createObjectURL(file),
      }));
      setNewSubImages((prev) => [...prev, ...newImages]);
    }
    e.target.value = null;
  };

  const removeNewSubImage = (indexToRemove) => {
    setNewSubImages((prev) => {
      const newList = [...prev];
      URL.revokeObjectURL(newList[indexToRemove].previewUrl);
      newList.splice(indexToRemove, 1);
      return newList;
    });
  };

  const removeExistingSubImage = (imageId) => {
    setDeletedImageIds((prev) => [...prev, imageId]);
    setExistingSubImages((prev) => prev.filter((img) => img.id !== imageId));
  };

  // --- HANDLER: TEXT & SELECT ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProduct({ ...product, [name]: value });
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  // --- HANDLERS: BIẾN THỂ ---
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

  const addVariant = () => {
    setVariantsWithSize([
      ...variantsWithSize,
      { size: "S", price: "", status: "available" },
    ]);
  };

  const removeVariant = (index) => {
    const variantToRemove = variantsWithSize[index];

    if (variantToRemove.id) {
      setDeletedVariantIds((prev) => [...prev, variantToRemove.id]);
    }

    const newVariants = variantsWithSize.filter((_, i) => i !== index);
    setVariantsWithSize(newVariants);

    if (errors.variants) {
      const newVariantErrors = errors.variants.filter((_, i) => i !== index);
      setErrors((prev) => ({ ...prev, variants: newVariantErrors }));
    }
  };

  // --- GỬI DỮ LIỆU ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Vui lòng kiểm tra lại các thông tin bị lỗi!");
      return;
    }

    // Xác định mảng nào đang được dùng, mảng nào bị loại bỏ
    const activeVariants = isSimpleProduct ? variantSimple : variantsWithSize;
    const inactiveVariants = isSimpleProduct ? variantsWithSize : variantSimple;

    // Lọc lấy ID của các biến thể ở tab bị loại bỏ
    const switchedDeletedIds = inactiveVariants
      .filter((v) => v.id)
      .map((v) => v.id);

    // Gom tất cả ID cần xóa lại
    const allDeletedVariantIds = [...deletedVariantIds, ...switchedDeletedIds];

    const formData = new FormData();
    formData.append("name", product.name);
    formData.append("description", product.description);
    formData.append("categoryId", product.categoryId);
    formData.append("status", product.status);

    // Gửi mảng biến thể hợp lệ đi
    formData.append("variants", JSON.stringify(activeVariants));

    // THÊM MỚI: Gửi mảng ID biến thể cần xóa đi
    if (allDeletedVariantIds.length > 0) {
      allDeletedVariantIds.forEach((deletedId) => {
        formData.append("deletedVariantIds", deletedId);
      });
    }

    if (product.image instanceof File) {
      formData.append("mainImage", product.image);
    }

    if (newSubImages.length > 0) {
      newSubImages.forEach((item) => {
        formData.append("subImages", item.file);
      });
    }

    if (deletedImageIds.length > 0) {
      deletedImageIds.forEach((deletedId) => {
        formData.append("deletedImageIds", deletedId);
      });
    }

    try {
      await productApi.update(id, formData);
      toast.success("Cập nhật sản phẩm thành công!");
      navigate("/admin/products");
    } catch (error) {
      console.error(error);
      const errorMsg =
        error.response?.data?.message || "Có lỗi xảy ra khi cập nhật!";
      toast.error(errorMsg);
    }
  };

  const getImageSource = (imgStr) => {
    if (!imgStr) return null;
    return imgStr.startsWith("blob:") || imgStr.startsWith("http")
      ? imgStr
      : `http://localhost:8080/images/${imgStr}`;
  };

  const currentVariants = isSimpleProduct ? variantSimple : variantsWithSize;

  return (
    <div className="add-product-page">
      <div className="page-header">
        <h2>Chỉnh sửa sản phẩm</h2>
      </div>

      <form onSubmit={handleSubmit} className="product-form" noValidate>
        <div className="layout-grid">
          {/* CỘT TRÁI: HÌNH ẢNH */}
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
                    src={getImageSource(previewImage)}
                    alt="Main"
                    className="main-preview-img"
                  />
                ) : (
                  <div className="upload-placeholder">
                    <span className="upload-text">+ Chọn ảnh chính</span>
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
                {existingSubImages.map((img) => (
                  <div key={`existing-${img.id}`} className="sub-image-item">
                    <img src={getImageSource(img.url)} alt={`Existing Sub`} />
                    <button
                      type="button"
                      className="btn-remove-sub"
                      onClick={() => removeExistingSubImage(img.id)}
                      title="Xóa ảnh cũ này"
                    >
                      X
                    </button>
                  </div>
                ))}

                {newSubImages.map((img, index) => (
                  <div key={`new-${index}`} className="sub-image-item">
                    <img src={img.previewUrl} alt={`New Sub ${index}`} />
                    <button
                      type="button"
                      className="btn-remove-sub"
                      onClick={() => removeNewSubImage(index)}
                      title="Hủy ảnh mới này"
                    >
                      X
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
                  +
                </label>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: THÔNG TIN */}
          <div className="right-column">
            <div className="form-section">
              <h3 className="section-title">THÔNG TIN CƠ BẢN</h3>

              <div className="input-group">
                <label>Tên sản phẩm</label>
                <input
                  name="name"
                  value={product.name}
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
                  <select
                    name="categoryId"
                    onChange={handleInputChange}
                    value={product.categoryId}
                    className={`form-control ${errors.categoryId ? "input-error" : ""}`}
                  >
                    <option value="">-- Chọn danh mục --</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  {errors.categoryId && (
                    <div className="error-message">{errors.categoryId}</div>
                  )}
                </div>

                <div className="input-group">
                  <label>Trạng thái</label>
                  <select
                    name="status"
                    onChange={handleInputChange}
                    value={product.status}
                    className="form-control"
                  >
                    <option value="active">Đang kinh doanh</option>
                    <option value="inactive">Ngừng kinh doanh</option>
                  </select>
                </div>
              </div>

              <div className="input-group">
                <label>Mô tả sản phẩm</label>
                <textarea
                  name="description"
                  value={product.description}
                  onChange={handleInputChange}
                  rows="5"
                  className="form-control"
                />
              </div>
            </div>

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
                {currentVariants.map((v, index) => {
                  const variantError = errors.variants?.[index];
                  return (
                    <div key={index} className="variant-wrapper">
                      <div className="variant-row-modern">
                        {!isSimpleProduct ? (
                          <select
                            value={v.size || "S"}
                            onChange={(e) =>
                              handleVariantChange(index, "size", e.target.value)
                            }
                            className="variant-column-select"
                          >
                            <option value="S">Size S</option>
                            <option value="M">Size M</option>
                            <option value="L">Size L</option>
                            <option value="XL">Size XL</option>
                          </select>
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
            Lưu thay đổi
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditProductPage;
