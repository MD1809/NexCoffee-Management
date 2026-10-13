import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaStar, FaArrowRight, FaPlus, FaFire } from "react-icons/fa";
import { getBestSellerProducts } from "../../../apis/menuApi";
import "./SignatureBrews.css";

const BACKEND_URL = "http://localhost:8080";

const getImageUrl = (imagePath) => {
  if (!imagePath) return "";
  if (imagePath.startsWith("http")) return imagePath;
  if (imagePath.startsWith("/images")) return `${BACKEND_URL}${imagePath}`;
  if (imagePath.startsWith("images")) return `${BACKEND_URL}/${imagePath}`;
  return `${BACKEND_URL}/images/${imagePath}`;
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
  return 39000;
};

// Fallback data an toàn khi backend chưa khởi động
const DEFAULT_PRODUCTS = [
  {
    id: 1,
    name: "Cà Phê Muối Kem Béo",
    categoryName: "Cà Phê Pha Phin",
    price: 39000,
    averageRating: 5.0,
    reviewCount: 42,
    soldCount: 128,
    description: "Espresso đậm đà hòa quyện cùng lớp kem muối biển béo ngậy độc quyền.",
    imageUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80"
  },
  {
    id: 2,
    name: "Bạc Xỉu Sữa Dừa Hạnh Nhân",
    categoryName: "Cà Phê Sữa",
    price: 45000,
    averageRating: 4.9,
    reviewCount: 36,
    soldCount: 95,
    description: "Cà phê phin truyền thống phối sữa dừa béo bùi và hạnh nhân lát giòn rụm.",
    imageUrl: "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=600&auto=format&fit=crop&q=80"
  },
  {
    id: 3,
    name: "Cold Brew Cam Quế Thủ Công",
    categoryName: "Cà Phê Ủ Lạnh",
    price: 49000,
    averageRating: 4.8,
    reviewCount: 28,
    soldCount: 84,
    description: "Ủ lạnh 16 tiếng từ hạt Arabica Cầu Đất, thoang thoảng hương quế và cam vàng.",
    imageUrl: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=600&auto=format&fit=crop&q=80"
  },
  {
    id: 4,
    name: "Trà Đào Cam Sả Thảo Mộc",
    categoryName: "Trà Trái Cây",
    price: 42000,
    averageRating: 4.9,
    reviewCount: 31,
    soldCount: 76,
    description: "Trà đen nguyên bản kết hợp đào mọng nước và sả tươi thơm nồng sảng khoái.",
    imageUrl: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&auto=format&fit=crop&q=80"
  }
];

const SignatureBrews = () => {
  const [products, setProducts] = useState(DEFAULT_PRODUCTS);
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
        }
      } catch (error) {
        // Giữ fallback mặc định nếu offline
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
      return "🔥 Bán chạy nhất";
    }
    if ((item.soldCount || 0) > 0) {
      return `Đã bán ${item.soldCount}+`;
    }
    if (index === 1) return "✨ Được yêu thích";
    if (index === 2) return "☕ Hương vị đặc trưng";
    return "Món mới gợi ý";
  };

  return (
    <section className="signature-brews-section" id="signature-brews">
      <div className="main-content">
        {/* Header Section */}
        <div className="section-head text-center">
          <div className="section-badge-light">
            <span>✨ Thức Uống Đặc Trưng</span>
          </div>
          <h2 className="section-title-light title-font">
            Hương Vị Được Yêu Thích Nhất
          </h2>
          <p className="section-desc-light">
            Các món bán chạy nhất tại NexCoffee được thống kê trực tiếp theo lượt yêu thích và đơn đặt hàng thực tế từ khách hàng.
          </p>
        </div>

        {/* Product Cards Grid */}
        <div className="brews-grid">
          {products.map((item, index) => {
            const rawImage = item.mainImage?.imageUrl || item.imageUrl || "";
            const displayImage = getImageUrl(rawImage) || DEFAULT_PRODUCTS[index % 4].imageUrl;
            const price = item.price || getDisplayPrice(item);
            const category = item.categoryName || item.category || "Đồ uống";
            const rating = Number(item.averageRating || 5.0).toFixed(1);
            const reviewCount = item.reviewCount || 0;
            const badge = getProductBadge(item, index);

            return (
              <div key={item.id} className="brew-card">
                <div className="brew-image-wrap">
                  <img src={displayImage} alt={item.name} className="brew-image" loading="lazy" />
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
                    {item.description || "Công thức pha chế độc quyền từ những hạt cà phê thượng hạng của NexCoffee."}
                  </p>

                  <div className="brew-footer">
                    <div className="brew-price">
                      {price.toLocaleString("vi-VN")} <span className="currency">đ</span>
                    </div>
                    <Link to={`/products/${item.id}`} className="brew-add-btn" aria-label={`Đặt món ${item.name}`}>
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
  );
};

export default SignatureBrews;
