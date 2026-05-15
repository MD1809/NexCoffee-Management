import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import productApi from "../../../apis/ProductApi";

import "./ProductDetail.css";

function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [activeImageUrl, setActiveImageUrl] = useState("");

  useEffect(() => {
    fetchProductDetail();
  }, [id]);

  const fetchProductDetail = async () => {
    try {
      const response = await productApi.getById(id);
      const data = response.data;
      setProduct(data);
      
      if (data.mainImage && data.mainImage.url) {
        setActiveImageUrl(`http://localhost:8080/images/${data.mainImage.url}`);
      }
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải thông tin sản phẩm!");
      navigate("/admin/products");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading-spinner">Đang tải dữ liệu...</div>;
  }

  if (!product) {
    return <div className="error-message">Không tìm thấy sản phẩm!</div>;
  }

  const allImages = [];
  if (product.mainImage) allImages.push(product.mainImage);
  if (product.galleryImages && product.galleryImages.length > 0) {
    allImages.push(...product.galleryImages);
  }

  const handleToggleVariantStatus = async (variantId, currentStatus) => {
    // 1. Đảo ngược trạng thái hiện tại
    const newStatus = currentStatus === "available" ? "unavailable" : "available";
    
    try {
      // 2. Gọi API gửi yêu cầu xuống Backend
      await productApi.updateVariantStatus(variantId, newStatus);
      
      // 3. Nếu API gọi thành công, cập nhật lại state để giao diện thay đổi ngay lập tức
      setProduct((prevProduct) => {
        const updatedVariants = prevProduct.variants.map((v) => {
          if (v.id === variantId) {
            return { ...v, status: newStatus };
          }
          return v;
        });
        return { ...prevProduct, variants: updatedVariants };
      });

      toast.success("Đã cập nhật trạng thái kích cỡ thành công!");
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái:", error);
      toast.error("Không thể cập nhật trạng thái! Vui lòng thử lại.");
    }
  };

  return (
    <div className="product-detail-page">
      {/* HEADER */}
      <div className="page-header flex-between">
        <div className="header-left">
          <button className="btn-back" onClick={() => navigate("/admin/products")}>
            <i className="fa-solid fa-arrow-left"></i> Quay lại
          </button>
          <h2>Chi tiết sản phẩm #{product.id}</h2>
        </div>
        <div className="header-right">
          <button 
            className="btn-edit-action"
            onClick={() => navigate(`/admin/products/edit/${product.id}`)}
          >
            <i className="fa-solid fa-pen"></i> Chỉnh sửa
          </button>
        </div>
      </div>

      <div className="detail-card">
        <div className="layout-grid">
          
          {/* CỘT TRÁI: THƯ VIỆN ẢNH */}
          <div className="left-column">
            <div className="main-image-viewer">
              {activeImageUrl ? (
                <img src={activeImageUrl} alt={product.name} />
              ) : (
                <div className="no-image-placeholder">Chưa có ảnh</div>
              )}
            </div>

            {allImages.length > 0 && (
              <div className="thumbnail-gallery">
                {allImages.map((img) => {
                  const fullUrl = `http://localhost:8080/images/${img.url}`;
                  const isActive = activeImageUrl === fullUrl;
                  return (
                    <div 
                      key={img.id} 
                      className={`thumbnail-item ${isActive ? "active" : ""}`}
                      onClick={() => setActiveImageUrl(fullUrl)}
                    >
                      <img src={fullUrl} alt="thumbnail" />
                      {img.id === product.mainImage?.id && (
                         <span className="main-badge">Chính</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* CỘT PHẢI: THÔNG TIN CHI TIẾT */}
          <div className="right-column">
            <h1 className="product-title">{product.name}</h1>
            
            <div className="badges-wrapper">
              <span className="badge category-badge">
                <i className="fa-solid fa-tag"></i> {product.categoryName}
              </span>
              <span className={`badge status-badge ${product.status === 'active' ? 'active' : 'inactive'}`}>
                {product.status === 'active' ? 'Đang kinh doanh' : 'Ngừng kinh doanh'}
              </span>
            </div>

            <div className="info-section">
              <h3>Mô tả sản phẩm</h3>
              <p className="product-description">
                {product.description || <span className="empty-text">Không có mô tả.</span>}
              </p>
            </div>

            <div className="info-section">
              <h3>Bảng giá & Biến thể</h3>
              <div className="variants-table-wrapper">
                <table className="variants-table">
                  <thead>
                    <tr>
                      <th>Kích cỡ (Size)</th>
                      <th>Giá bán</th>
                      <th>Trạng thái</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {product.variants && product.variants.length > 0 ? (
                      product.variants.map((v) => (
                        <tr key={v.id}>
                          <td className="size-col"><strong>{v.size}</strong></td>
                          <td className="price-col">{v.price.toLocaleString("vi-VN")} đ</td>
                          <td>
                            <span className={`v-status ${v.status === 'available' ? 'avail' : 'unavail'}`}>
                              {v.status === 'available' ? 'Còn hàng' : 'Hết hàng'}
                            </span>
                          </td>
                          <td>
                            <button
                            className={`v-status-toggle-btn ${v.status === 'available' ? 'active' : 'hidden'}`}
                            onClick={() => handleToggleVariantStatus(v.id, v.status)}
                            title="Nhấp để thay đổi trạng thái"
                          >
                            <i className={`fa-solid ${v.status === 'available' ? 'fa-check-circle' : 'fa-circle-xmark'}`}></i>
                            {v.status === 'available' ? ' Đang bán' : ' Tạm ngưng'}
                          </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="text-center">Chưa có biến thể nào</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetailPage;