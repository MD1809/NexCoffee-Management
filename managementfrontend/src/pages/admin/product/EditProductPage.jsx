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
  const [previewImage, setPreviewImage] = useState(null);

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
    fetchProductDetail();

    return () => {
      if (previewImage && !previewImage.startsWith("http")) {
        URL.revokeObjectURL(previewImage);
      }
    };
  }, [id]);

  const fetchCategories = async () => {
    try {
      const response = await categoryApi.getAll();
      setCategories(response.data);
    } catch (error) {
      toast.error("Không thể tải thông tin sản phẩm!");
      navigate("/admin/products");
    }
  };

  const fetchProductDetail = async () => {
    try {
      const response = await productApi.getById(id);
      const data = response.data;

      setProduct({
        name: data.name,
        description: data.description,
        image: data.image,
        categoryId: data.categoryId,
        status: data.status,
        variants: data.variants,
      });
      setPreviewImage(data.image);
    } catch (error) {
      toast.error("Không thể tải thông tin sản phẩm!");
      navigate("/admin/products");
    }
  };

  const handleInputChange = (e) => {
    if (e.target.name === "image") {
      const file = e.target.files[0];
      if (file) {
        setProduct({ ...product, image: file });
        setPreviewImage(URL.createObjectURL(file));
      }
    } else {
      setProduct({ ...product, [e.target.name]: e.target.value });
    }
  };

  const handleVariantChange = (index, field, value) => {
    const newVariants = [...product.variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setProduct({ ...product, variants: newVariants });
  };

  const addVariant = () => {
    setProduct({
      ...product,
      variants: [
        ...product.variants,
        { size: "S", price: "", status: "available" },
      ],
    });
  };

  const removeVariant = (index) => {
    const newVariants = product.variants.filter((_, i) => i !== index);
    setProduct({ ...product, variants: newVariants });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("name", product.name);
    formData.append("description", product.description);
    formData.append("categoryId", product.categoryId);
    formData.append("status", product.status);
    formData.append("variants", JSON.stringify(product.variants));

    if (product.image instanceof File) {
      formData.append("image", product.image);
    }

    try {
      await productApi.update(id, formData);
      toast.success("Cập nhật sản phẩm thành công!");
      navigate("/admin/products");
    } catch (error) {
      console.error(error);
      toast.error("Có lỗi xảy ra khi cập nhật!");
    }
  };

  return (
    <div className="add-product-page">
      <div className="page-header">
        <h2>Chỉnh sửa sản phẩm</h2>
      </div>

      <form onSubmit={handleSubmit} className="product-form">
        <div className="layout-grid">
          {/* CỘT TRÁI: HÌNH ẢNH SẢN PHẨM */}
          <div className="left-column">
            <div className="form-section">
              <div className="image-upload-box">
                <input
                  name="image"
                  type="file"
                  accept="image/*"
                  onChange={handleInputChange}
                  className="file-input"
                />
                {previewImage && (
                  <div className="image-preview" style={{ marginTop: "15px" }}>
                    <img
                      src={
                        previewImage.startsWith("blob:")
                          ? previewImage
                          : `http://localhost:8080/images/${previewImage}`
                      }
                      // onError={(e) => {
                      //     e.target.src = '/default-image.png';
                      // }}
                      alt="Preview"
                      style={{
                        width: "100%",
                        maxHeight: "300px",
                        borderRadius: "8px",
                        objectFit: "cover",
                      }}
                    />
                  </div>
                )}
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
                  value={product.name}
                  onChange={handleInputChange}
                  required
                  className="form-control"
                />
              </div>

              <div className="form-row-flex">
                <div className="input-group">
                  <label>Danh mục</label>
                  <select
                    name="categoryId"
                    onChange={handleInputChange}
                    value={product.categoryId}
                    required
                    className="form-control"
                  >
                    <option value="">-- Chọn danh mục --</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <label>Trạng thái</label>
                  <select
                    name="status"
                    onChange={handleInputChange}
                    value={product.status || "active"}
                    required
                    className="form-control"
                  >
                    <option value="">-- Chọn trạng thái --</option>
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

            {/* BẢNG GIÁ & KÍCH THƯỚC */}
            <div className="form-section">
              <div className="section-header-flex">
                <h3 className="section-title">BẢNG GIÁ & KÍCH THƯỚC</h3>
              </div>

              <div className="variants-container">
                {product.variants.map((v, index) => (
                  <div key={index} className="variant-row-modern">
                    <select
                      value={v.size}
                      onChange={(e) =>
                        handleVariantChange(index, "size", e.target.value)
                      }
                      className="variant-select form-control"
                    >
                      <option value="S">Size S</option>
                      <option value="M">Size M</option>
                      <option value="L">Size L</option>
                      <option value="XL">Size XL</option>
                    </select>

                    <input
                      type="number"
                      placeholder="Giá bán"
                      className="variant-price form-control"
                      value={v.price}
                      onWheel={(e) => e.target.blur()}
                      onChange={(e) =>
                        handleVariantChange(index, "price", e.target.value)
                      }
                    />

                    <button
                      type="button"
                      onClick={() => removeVariant(index)}
                      className="btn-remove-icon"
                      disabled={product.variants.length === 1}
                      title="Xóa biến thể"
                    >
                      Xóa
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addVariant}
                  className="btn-add-text"
                >
                  + Thêm size
                </button>
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

export default EditProductPage;
