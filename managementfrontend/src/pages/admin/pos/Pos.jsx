import React, { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";

import SearchBox from "../../../components/admin/searchBox/SearchBox";
import Dropdown from "../../../components/admin/dropDown/Dropdown";
import posApi from "../../../apis/posApi";
import "./pos.css";

// Thư mục chứa ảnh tĩnh của Spring Boot (nếu có cấu hình WebMvcConfigurer để public thư mục uploads)
const IMAGE_BASE_URL = "http://localhost:8080/images/";

export default function Pos() {
  // --- STATES DỮ LIỆU TỪ SERVER ---
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- STATES GIỎ HÀNG & UI ---
  const [cart, setCart] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [discountCode, setDiscountCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const shippingFee = 0;

  // --- 1. LẤY DỮ LIỆU TỪ BACKEND KHI VỪA MỞ TRANG ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Gọi API qua posApi
        const [productsRes, categoriesRes] = await Promise.all([
          posApi.getProducts(),
          posApi.getCategories(),
        ]);

        setProducts(productsRes.data);
        setCategories([
          { value: "all", label: "Tất cả danh mục" },
          ...categoriesRes.data.map((c) => ({
            value: c.id.toString(),
            label: c.name,
          })),
        ]);
      } catch (error) {
        toast.error("Không thể tải dữ liệu từ server!");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- 2. LỌC SẢN PHẨM THEO TÌM KIẾM & DANH MỤC ---
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCategory =
        selectedCategoryId === "all" ||
        p.categoryId === parseInt(selectedCategoryId);
      const matchSearch = p.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [products, selectedCategoryId, searchQuery]);

  // --- 3. LOGIC GIỎ HÀNG ---
  const addToCart = (product, variant) => {
    const itemIndex = cart.findIndex(
      (item) =>
        item.product_id === product.id && item.variant_id === variant.id,
    );
    if (itemIndex > -1) {
      updateQuantity(itemIndex, 1);
    } else {
      setCart([
        ...cart,
        {
          ...product,
          product_id: product.id,
          variant_id: variant.id,
          size: variant.size,
          price: variant.price,
          quantity: 1,
        },
      ]);
    }
  };

  const updateQuantity = (index, delta) => {
    const newCart = [...cart];
    newCart[index].quantity += delta;
    if (newCart[index].quantity <= 0) newCart.splice(index, 1);
    setCart(newCart);
  };

  const removeItem = (index) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  const clearCart = () => setCart([]);

  const applyDiscount = () => {
    if (discountCode.toUpperCase() === "GIAM10K") {
      setDiscountAmount(10000);
    } else {
      setDiscountAmount(0);
      toast.error("Mã giảm giá không hợp lệ");
    }
  };

  // --- 4. TÍNH TOÁN TIỀN & THANH TOÁN ---
  const subTotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );
  const finalTotal = subTotal > 0 ? subTotal + shippingFee - discountAmount : 0;

  const handleCheckout = async () => {
    if (cart.length === 0) return toast.warning("Giỏ hàng trống!");

    // 1. Lấy thông tin user từ sessionStorage
    const userString = sessionStorage.getItem("currentUser");
    
    if (!userString) {
      toast.error("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại!");
      return;
    }

    const user = JSON.parse(userString);
    const userId = user.id; // Lấy đúng ID từ object đã parse

    // 2. Đóng gói payload với userId lấy từ session
    const orderPayload = {
      subtotal: subTotal,
      discount: discountAmount,
      shipping: 0,
      total: finalTotal,
      paymentMethod: "CASH",
      note: "Khách mua tại quầy",
      staffId: userId, // Truyền ID nhân viên thật vào đây
      items: cart.map((item) => ({
        productVariantId: item.variant_id,
        quantity: item.quantity,
        unitPrice: item.price,
      })),
    };

    try {
      const response = await posApi.checkout(orderPayload);
      toast.success(response.data.message || "Thanh toán thành công!");
      setCart([]);
      setDiscountAmount(0);
      setDiscountCode("");
    } catch (error) {
      // Log lỗi để kiểm tra xem có phải do staffId không hợp lệ không
      console.error("Checkout error:", error);
      toast.error("Thanh toán thất bại!");
    }
  };

  return (
    <div className="pos-layout">
      {/* =========================================
          CỘT TRÁI: MENU & SẢN PHẨM 
          ========================================= */}
      <div className="pos-main">
        {/* KHỐI 1: TÌM KIẾM VÀ LỌC (Cố định ở trên) */}
        <div className="top-bar">
          <SearchBox
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <div style={{ minWidth: "200px" }}>
            <Dropdown
              options={categories}
              defaultValue="all"
              placeholder="Chọn danh mục"
              onChange={(option) => setSelectedCategoryId(option.value)}
            />
          </div>
        </div>

        {/* KHỐI 2: DANH SÁCH SẢN PHẨM (Được phép trượt) */}
        <div className="product-scroll-area">
          {isLoading ? (
            <div
              style={{
                textAlign: "center",
                marginTop: "50px",
                color: "var(--text-secondary)",
              }}
            >
              Đang tải dữ liệu từ máy chủ...
            </div>
          ) : (
            <div className="product-grid">
              {filteredProducts.length === 0 && (
                <p style={{ color: "var(--text-secondary)" }}>
                  Không tìm thấy sản phẩm nào...
                </p>
              )}

              {filteredProducts.map((product) => {
                const imageUrl = product.mainImage?.url
                  ? product.mainImage.url.startsWith("http")
                    ? product.mainImage.url
                    : `${IMAGE_BASE_URL}${product.mainImage.url}`
                  : "https://placehold.co/300x300?text=No+Image";

                const activeVariants = product.variants
                  ? product.variants.filter((v) => v.status !== "INACTIVE")
                  : [];

                return (
                  <div key={product.id} className="product-card">
                    <img
                      src={imageUrl}
                      alt={product.name}
                      className="product-image"
                    />
                    <div className="product-info">
                      <div className="product-name">{product.name}</div>

                      <div className="variants-area">
                        {/* Kiểm tra xem có phải là sản phẩm có nhiều size thực sự không */}
                        {activeVariants.length > 0 &&
                        activeVariants.every(
                          (v) => v.size && v.size !== "Mặc định",
                        ) ? (
                          // KIỂU 1: Nhiều size (S, M, L) -> Hiển thị dạng nhóm capsule
                          <div className="variants-capsule-group">
                            {activeVariants.map((variant) => (
                              <button
                                key={variant.id}
                                className="variant-capsule-btn"
                                onClick={() => addToCart(product, variant)}
                              >
                                <span className="capsule-icon">
                                  {variant.size}
                                </span>
                                <span className="capsule-price">
                                  {variant.price / 1000}k
                                </span>
                              </button>
                            ))}
                          </div>
                        ) : activeVariants.length > 0 ? (
                          // KIỂU 2: Chỉ có 1 size mặc định -> Hiển thị nút thêm đơn giản
                          <div className="variant-single">
                            <span className="single-price">
                              {activeVariants[0].price.toLocaleString("vi-VN")}{" "}
                              đ
                            </span>
                            <button
                              className="icon-add-btn"
                              onClick={() =>
                                addToCart(product, activeVariants[0])
                              }
                              title="Thêm vào giỏ"
                            >
                              <i className="fa-solid fa-plus"></i>
                            </button>
                          </div>
                        ) : (
                          // KIỂU 3: Hết hàng
                          <span style={{ fontSize: "13px", color: "#ef4444" }}>
                            Tạm hết hàng
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* =========================================
          CỘT PHẢI: GIỎ HÀNG 
          ========================================= */}
      <div className="pos-sidebar">
        {/* Khối Header Giỏ hàng (Cố định) */}
        <div className="cart-header">
          <div className="cart-title">
            <i class="fa-solid fa-bag-shopping"></i>
            Giỏ Hàng ({cart.reduce((a, b) => a + b.quantity, 0)})
          </div>
          {cart.length > 0 && (
            <button className="clear-cart-btn" onClick={clearCart}>
              <i className="fa-solid fa-trash"></i>
              Xóa sạch
            </button>
          )}
        </div>

        {/* Khối Danh sách món đã chọn (Trượt) */}
        <div className="cart-body">
          {cart.length === 0 ? (
            <div className="empty-cart">Giỏ hàng đang trống...</div>
          ) : null}

          {cart.map((item, index) => (
            <div
              key={`${item.product_id}-${item.variant_id}`}
              className="cart-item"
            >
              <div className="item-top-row">
                <div className="item-name">{item.name}</div>
                <button
                  className="item-remove"
                  onClick={() => removeItem(index)}
                  title="Xóa"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              <div className="item-bottom-row">
                <div className="item-meta">
                  {item.size !== "Mặc định" && item.size !== null
                    ? `Size ${item.size}`
                    : "Mặc định"}
                </div>

                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <div className="qty-pill">
                    <button
                      className="qty-btn"
                      onClick={() => updateQuantity(index, -1)}
                    >
                      <i className="fa-solid fa-minus"></i>
                    </button>
                    <div className="qty-value">{item.quantity}</div>
                    <button
                      className="qty-btn"
                      onClick={() => updateQuantity(index, 1)}
                    >
                      <i className="fa-solid fa-plus"></i>
                    </button>
                  </div>
                  <div className="item-total-price">
                    {(item.price * item.quantity).toLocaleString("vi-VN")} đ
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Khối Footer Thanh toán (Cố định) */}
        <div className="cart-footer">
          <div className="discount-box">
            <input
              type="text"
              className="discount-input"
              placeholder="Mã giảm giá (VD: GIAM10K)"
              value={discountCode}
              onChange={(e) => setDiscountCode(e.target.value)}
            />
            <button className="discount-btn" onClick={applyDiscount}>
              Áp dụng
            </button>
          </div>

          <div className="summary-row">
            <span>Tạm tính</span>
            <span>{subTotal.toLocaleString("vi-VN")} đ</span>
          </div>

          {/* LUÔN HIỂN THỊ DÒNG GIẢM GIÁ */}
          <div
            className="summary-row"
            style={{
              color: discountAmount > 0 ? "#10b981" : "var(--text-secondary)",
            }}
          >
            <span>Giảm giá</span>
            <span>- {discountAmount.toLocaleString("vi-VN")} đ</span>
          </div>

          <div className="summary-total">
            <span>Tổng thanh toán</span>
            <span>{finalTotal.toLocaleString("vi-VN")} đ</span>
          </div>

          <button className="checkout-btn" onClick={handleCheckout}>
            THANH TOÁN
          </button>
        </div>
      </div>
    </div>
  );
}
