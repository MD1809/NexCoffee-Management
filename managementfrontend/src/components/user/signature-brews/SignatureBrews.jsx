import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaStar, FaArrowRight, FaPlus } from "react-icons/fa";
import { getBestSellerProducts } from "../../../apis/menuApi";
import SectionDivider from "../section-divider/SectionDivider";
import coffeeCup from "../../../assets/hero/coffee-cup.svg";
import "./SignatureBrews.css";

const BACKEND_URL = "http://localhost:8080";

const getImageUrl = (imagePath) => {
  if (!imagePath) return "";
  if (imagePath.startsWith("http")) return imagePath;
  if (imagePath.startsWith("/images")) return `${BACKEND_URL}${imagePath}`;
  if (imagePath.startsWith("images")) return `${BACKEND_URL}/${imagePath}`;
  return `${BACKEND_URL}/images/${imagePath}`;
};

// Hàm trích xuất ảnh sản phẩm an toàn và đầy đủ các trường hợp từ backend
const getProductImage = (item) => {
  if (!item) return "";

  // 1. Kiểm tra mainImage object (url hoặc imageUrl)
  if (item.mainImage?.url) return getImageUrl(item.mainImage.url);
  if (item.mainImage?.imageUrl) return getImageUrl(item.mainImage.imageUrl);
  if (typeof item.mainImage === "string") return getImageUrl(item.mainImage);

  // 2. Kiểm tra danh sách galleryImages
  if (Array.isArray(item.galleryImages) && item.galleryImages.length > 0) {
    const firstGallery = item.galleryImages[0];
    if (firstGallery?.url) return getImageUrl(firstGallery.url);
    if (firstGallery?.imageUrl) return getImageUrl(firstGallery.imageUrl);
  }

  // 3. Kiểm tra danh sách images
  if (Array.isArray(item.images) && item.images.length > 0) {
    const firstImg = item.images[0];
    if (firstImg?.url) return getImageUrl(firstImg.url);
    if (firstImg?.imageUrl) return getImageUrl(firstImg.imageUrl);
    if (typeof firstImg === "string") return getImageUrl(firstImg);
  }

  // 4. Kiểm tra các thuộc tính trực tiếp
  if (item.image) return getImageUrl(item.image);
  if (item.imageUrl) return getImageUrl(item.imageUrl);

  return "";
};

const getDisplayPrice = (product) => {
  if (Array.isArray(product.variants) && product.variants.length > 0) {
    const prices = product.variants
      .map((v) => Number(v.price))
      .filter((p) => !isNaN(p) && p > 0);
    if (prices.length > 0) {
      return Math.min(...prices);
    }
  }
  return product.price || 0;
};

const SignatureBrews = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchBestSellers = async () => {
      try {
        setLoading(true);
        const response = await getBestSellerProducts(4);
        const data = Array.isArray(response) ? response : response?.data;
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setProducts(data);
        } else if (isMounted) {
          setProducts([]);
        }
      } catch (error) {
        // Backend chưa kết nối hoặc lỗi mạng -> không dùng dữ liệu giả
        if (isMounted) {
          setProducts([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchBestSellers();
    return () => {
      isMounted = false;
    };
  }, []);

  const getProductBadge = (item, index) => {
    if (index === 0 && (item.soldCount || 0) > 0) {
      return "Bán chạy nhất";
    }
    if ((item.soldCount || 0) > 0) {
      return `Đã bán ${item.soldCount}+`;
    }
    if (index === 1) return "Được yêu thích";
    if (index === 2) return "Món nổi bật";
    return "Món mới gợi ý";
  };

  // Nếu không có sản phẩm nào từ backend (chưa kết nối / rỗng), ẩn hoàn toàn section
  if (products.length === 0) {
    return null;
  }

  return (
    <>
      {/* Chuyển tiếp Tối -> Sáng */}
      <SectionDivider type="dark-to-light" />

      <div id="signature-brews" className="home-scroll-section section-light">
        <section className="signature-brews-section">
          <div className="main-content">
            {/* Header Section */}
            <div className="section-head text-center">
              <div className="section-badge-light">
                <span>Thực Đơn Nổi Bật</span>
              </div>
              <h2 className="section-title-light title-font">
                Món Ngon Được Yêu Thích Nhất
              </h2>
              <p className="section-desc-light">
                Các món ăn, đồ uống và bánh ngọt bán chạy nhất tại NexCoffee được thống kê trực tiếp theo lượt đặt hàng thực tế từ khách hàng.
              </p>
            </div>

            {/* Product Cards Grid */}
            <div className="brews-grid">
              {products.map((item, index) => {
                const resolvedImage = getProductImage(item);
                const displayImage = resolvedImage || coffeeCup;
                const price = getDisplayPrice(item);
                const category = item.categoryName || item.category || "Món ngon";
                const rating = Number(item.averageRating || 5.0).toFixed(1);
                const reviewCount = item.reviewCount || 0;
                const badge = getProductBadge(item, index);

                return (
                  <div key={item.id} className="brew-card">
                    <div className="brew-image-wrap">
                      <img
                        src={displayImage}
                        alt={item.name}
                        className="brew-image"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.src = coffeeCup;
                        }}
                      />
                      <span className="brew-badge">{badge}</span>
                    </div>

                    <div className="brew-content">
                      <div className="brew-meta">
                        <span className="brew-category">{category}</span>
                        <div className="brew-rating">
                          <FaStar className="star-icon" />
                          <span>{rating}</span>
                          <span className="rating-count">({reviewCount})</span>
                        </div>
                      </div>

                      <h3 className="brew-name">{item.name}</h3>
                      <p className="brew-description">
                        {item.description ||
                          "Hương vị thơm ngon hấp dẫn được chế biến từ những nguyên liệu tươi mới, chất lượng cao tại NexCoffee."}
                      </p>

                      <div className="brew-footer">
                        <div className="brew-price">
                          {price.toLocaleString("vi-VN")}{" "}
                          <span className="currency">đ</span>
                        </div>
                        <Link
                          to={`/products/${item.id}`}
                          className="brew-add-btn"
                          aria-label={`Đặt món ${item.name}`}
                        >
                          <FaPlus className="add-icon" />
                          <span>Đặt Món</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom CTA */}
            <div className="brews-cta-wrap">
              <Link to="/menu" className="btn-view-all-menu">
                <span>Khám Phá Toàn Bộ Thực Đơn</span>
                <FaArrowRight className="cta-icon" />
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* Chuyển tiếp Sáng -> Tối sang About */}
      <SectionDivider type="light-to-dark" flip={true} />
    </>
  );
};

export default SignatureBrews;
