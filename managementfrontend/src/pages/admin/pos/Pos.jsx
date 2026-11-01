import React, { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";

import SearchBox from "../../../components/admin/searchBox/SearchBox";
import Dropdown from "../../../components/admin/dropDown/Dropdown";
import posApi from "../../../apis/posApi";
import "./pos.css";

const IMAGE_BASE_URL = "http://localhost:8080/images/";

export default function Pos() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [cart, setCart] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [discountCode, setDiscountCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const shippingFee = 0;

  // --- CÁC TÍNH NĂNG NÂNG CẤP TẠI QUẦY ---
  // 1. Hình thức phục vụ & Số bàn
  const [orderType, setOrderType] = useState("DINE_IN"); // "DINE_IN" hoặc "TAKEAWAY"
  const [tableNumber, setTableNumber] = useState(""); // Gõ tự do: Bàn 04, Tầng 2-01, Thẻ #02...
  const [orderNote, setOrderNote] = useState("");

  // 2. Tiền mặt & Tiền thừa
  const [cashGiven, setCashGiven] = useState("");

  // 3. Đơn tạm (Hold Orders)
  const [heldOrders, setHeldOrders] = useState(() => {
    try {
      const saved = localStorage.getItem("pos_held_orders");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [isHoldModalOpen, setIsHoldModalOpen] = useState(false);

  // 4. Modal in hóa đơn
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [lastCompletedOrder, setLastCompletedOrder] = useState(null);

  // Lưu heldOrders vào localStorage mỗi khi thay đổi
  useEffect(() => {
    try {
      localStorage.setItem("pos_held_orders", JSON.stringify(heldOrders));
    } catch (e) {
      console.error("Lỗi khi lưu đơn tạm vào localStorage:", e);
    }
  }, [heldOrders]);

  useEffect(() => {
    const fetchData = async () => {
      try {
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

  const clearCart = () => {
    setCart([]);
    setCashGiven("");
    setDiscountAmount(0);
    setDiscountCode("");
    setTableNumber("");
    setOrderNote("");
  };

  const applyDiscount = () => {
    if (discountCode.trim().toUpperCase() === "GIAM10K") {
      setDiscountAmount(10000);
      toast.success("Đã áp dụng mã giảm 10.000 đ");
    } else {
      setDiscountAmount(0);
      toast.error("Mã giảm giá không hợp lệ");
    }
  };

  const subTotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );
  const finalTotal = subTotal > 0 ? Math.max(0, subTotal + shippingFee - discountAmount) : 0;

  // Tính tiền thừa / tiền thiếu
  const parsedCash = Number(cashGiven) || 0;
  const changeAmount = parsedCash >= finalTotal ? parsedCash - finalTotal : 0;
  const isCashShort = parsedCash > 0 && parsedCash < finalTotal;

  // Xử lý chọn nhanh mệnh giá tiền
  const handleQuickCash = (amount) => {
    if (amount === "EXACT") {
      setCashGiven(finalTotal.toString());
    } else {
      setCashGiven(amount.toString());
    }
  };

  // --- XỬ LÝ LƯU ĐƠN TẠM (HOLD ORDER) ---
  const handleHoldOrder = () => {
    if (cart.length === 0) {
      toast.warning("Giỏ hàng đang trống, không thể lưu tạm!");
      return;
    }

    const newHold = {
      id: Date.now(),
      cart: [...cart],
      orderType,
      tableNumber: tableNumber.trim(),
      orderNote: orderNote.trim(),
      discountCode,
      discountAmount,
      total: finalTotal,
      time: new Date().toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setHeldOrders([newHold, ...heldOrders]);
    clearCart();
    toast.success("Đã tạm lưu đơn hàng vào danh sách chờ!");
  };

  const handleRestoreHoldOrder = (holdItem) => {
    if (cart.length > 0) {
      if (!window.confirm("Giỏ hàng hiện tại đang có món. Bạn có muốn ghi đè bằng đơn tạm này không?")) {
        return;
      }
    }

    setCart(holdItem.cart || []);
    setOrderType(holdItem.orderType || "DINE_IN");
    setTableNumber(holdItem.tableNumber || "");
    setOrderNote(holdItem.orderNote || "");
    setDiscountCode(holdItem.discountCode || "");
    setDiscountAmount(holdItem.discountAmount || 0);
    setCashGiven("");

    // Xóa đơn tạm đã khôi phục
    setHeldOrders(heldOrders.filter((h) => h.id !== holdItem.id));
    setIsHoldModalOpen(false);
    toast.info("Đã khôi phục đơn tạm vào giỏ hàng!");
  };

  const handleDeleteHoldOrder = (holdId) => {
    setHeldOrders(heldOrders.filter((h) => h.id !== holdId));
    toast.success("Đã xóa đơn tạm.");
  };

  // --- XỬ LÝ THANH TOÁN ---
  const handleCheckout = async () => {
    if (cart.length === 0) return toast.warning("Giỏ hàng trống!");

    if (parsedCash > 0 && parsedCash < finalTotal) {
      return toast.error("Số tiền khách đưa chưa đủ để thanh toán!");
    }

    const userString = sessionStorage.getItem("currentUser");
    if (!userString) {
      toast.error("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại!");
      return;
    }

    const user = JSON.parse(userString);
    const userId = user.id;

    // Chuẩn bị nhãn bàn / mang về
    const formattedTableNumber = tableNumber.trim()
      ? tableNumber.trim()
      : orderType === "DINE_IN"
      ? "Tại bàn"
      : "Mang về";

    const orderPayload = {
      subtotal: subTotal,
      discount: discountAmount,
      shipping: 0,
      total: finalTotal,
      paymentMethod: "CASH",
      orderType,
      tableNumber: formattedTableNumber,
      cashGiven: parsedCash > 0 ? parsedCash : finalTotal,
      changeReturned: changeAmount,
      note: orderNote.trim(),
      staffId: userId,
      items: cart.map((item) => ({
        productVariantId: item.variant_id,
        quantity: item.quantity,
        unitPrice: item.price,
      })),
    };

    try {
      const response = await posApi.checkout(orderPayload);
      toast.success(response.data.message || "Thanh toán thành công!");

      // Lưu snapshot để in hóa đơn
      setLastCompletedOrder({
        ...orderPayload,
        code: response.data.code || `NEX-${Date.now().toString().slice(-6).toUpperCase()}`,
        staffName: user.fullName || "Thu ngân",
        storeName: user.storeName || "NexCoffee Store",
        createdAt: new Date().toLocaleString("vi-VN"),
        cartItems: [...cart],
      });

      // Mở modal in bill
      setIsReceiptModalOpen(true);

      // Reset giỏ hàng
      clearCart();
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Thanh toán thất bại! Vui lòng thử lại.");
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="pos-layout">
      {/* =========================================
          CỘT TRÁI: MENU & SẢN PHẨM 
          ========================================= */}
      <div className="pos-main">
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
                        {activeVariants.length > 0 &&
                        activeVariants.every(
                          (v) => v.size && v.size !== "Mặc định",
                        ) ? (
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
        {/* Khối Header Giỏ hàng */}
        <div className="cart-header">
          <div className="cart-title">
            Giỏ Hàng ({cart.reduce((a, b) => a + b.quantity, 0)})
          </div>

          <div className="cart-header-actions">
            {heldOrders.length > 0 && (
              <button
                type="button"
                className="btn-held-badge"
                onClick={() => setIsHoldModalOpen(true)}
                title="Xem các đơn tạm đang lưu"
              >
                Đơn tạm ({heldOrders.length})
              </button>
            )}

            {cart.length > 0 && (
              <>
                <button
                  type="button"
                  className="btn-hold-cart"
                  onClick={handleHoldOrder}
                  title="Lưu tạm đơn này để phục vụ khách khác"
                >
                  Lưu tạm
                </button>
                <button
                  type="button"
                  className="clear-cart-btn"
                  onClick={clearCart}
                  title="Xóa giỏ hàng hiện tại"
                >
                  Xóa
                </button>
              </>
            )}
          </div>
        </div>

        {/* Khối Chọn Hình Thức & Số Bàn */}
        <div className="pos-order-type-panel">
          <div className="pos-type-segmented">
            <button
              type="button"
              className={`pos-type-btn ${
                orderType === "DINE_IN" ? "pos-type-btn--active" : ""
              }`}
              onClick={() => setOrderType("DINE_IN")}
            >
              Tại quán
            </button>
            <button
              type="button"
              className={`pos-type-btn ${
                orderType === "TAKEAWAY" ? "pos-type-btn--active" : ""
              }`}
              onClick={() => setOrderType("TAKEAWAY")}
            >
              Mang về
            </button>
          </div>

          <div className="pos-table-input-wrap">
            <input
              type="text"
              className="pos-table-input"
              placeholder={
                orderType === "DINE_IN"
                  ? "Nhập số bàn (vd: Bàn 04, Tầng 2-01...)"
                  : "Nhập số thẻ rung / STT mang về (vd: #01)..."
              }
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
            />
          </div>
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

        {/* Khối Footer Thanh toán */}
        <div className="cart-footer">
          {/* Ô nhập ghi chú đơn hàng */}
          <div className="order-note-box">
            <input
              type="text"
              className="order-note-input"
              placeholder="Ghi chú đơn (vd: ít ngọt, nhiều đá...)"
              value={orderNote}
              onChange={(e) => setOrderNote(e.target.value)}
            />
          </div>

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

          {/* KHỐI TÍNH TIỀN MẶT & TIỀN THỪA */}
          {finalTotal > 0 && (
            <div className="cash-tender-panel">
              <div className="cash-input-row">
                <span className="cash-label">Khách đưa:</span>
                <input
                  type="number"
                  className="cash-input"
                  placeholder="Nhập tiền khách đưa..."
                  value={cashGiven}
                  onChange={(e) => setCashGiven(e.target.value)}
                />
              </div>

              {/* Các nút mệnh giá nhanh */}
              <div className="quick-cash-buttons">
                <button
                  type="button"
                  className="quick-cash-btn"
                  onClick={() => handleQuickCash("EXACT")}
                >
                  Đủ tiền
                </button>
                <button
                  type="button"
                  className="quick-cash-btn"
                  onClick={() => handleQuickCash(50000)}
                >
                  50k
                </button>
                <button
                  type="button"
                  className="quick-cash-btn"
                  onClick={() => handleQuickCash(100000)}
                >
                  100k
                </button>
                <button
                  type="button"
                  className="quick-cash-btn"
                  onClick={() => handleQuickCash(200000)}
                >
                  200k
                </button>
                <button
                  type="button"
                  className="quick-cash-btn"
                  onClick={() => handleQuickCash(500000)}
                >
                  500k
                </button>
              </div>

              {/* Dòng kết quả tiền thừa / thiếu */}
              {isCashShort ? (
                <div className="change-row change-row--short">
                  <span>Còn thiếu:</span>
                  <span>{(finalTotal - parsedCash).toLocaleString("vi-VN")} đ</span>
                </div>
              ) : parsedCash >= finalTotal && finalTotal > 0 ? (
                <div className="change-row change-row--return">
                  <span>Tiền thối lại:</span>
                  <span>{changeAmount.toLocaleString("vi-VN")} đ</span>
                </div>
              ) : null}
            </div>
          )}

          <button
            className="checkout-btn"
            onClick={handleCheckout}
            disabled={cart.length === 0 || isCashShort}
          >
            THANH TOÁN TIỀN MẶT
          </button>
        </div>
      </div>

      {/* =========================================
          MODAL 1: DANH SÁCH ĐƠN TẠM (HOLD ORDERS)
          ========================================= */}
      {isHoldModalOpen && (
        <div className="pos-modal-overlay" onClick={() => setIsHoldModalOpen(false)}>
          <div
            className="pos-modal-dialog pos-hold-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pos-modal-header">
              <h3>Danh sách đơn hàng đang tạm lưu ({heldOrders.length})</h3>
              <button
                type="button"
                className="pos-modal-close"
                onClick={() => setIsHoldModalOpen(false)}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="pos-modal-body">
              {heldOrders.length === 0 ? (
                <p style={{ textAlign: "center", color: "var(--text-secondary)", padding: "20px 0" }}>
                  Không có đơn tạm nào.
                </p>
              ) : (
                <div className="pos-hold-list">
                  {heldOrders.map((hold) => (
                    <div key={hold.id} className="pos-hold-card">
                      <div className="pos-hold-info">
                        <div className="pos-hold-title">
                          <span className="pos-hold-type">
                            {hold.orderType === "DINE_IN" ? "Tại quán" : "Mang về"}
                          </span>
                          {hold.tableNumber && (
                            <strong className="pos-hold-table">
                              • {hold.tableNumber}
                            </strong>
                          )}
                          <span className="pos-hold-time">({hold.time})</span>
                        </div>
                        <div className="pos-hold-items-summary">
                          {hold.cart.map((c) => `${c.quantity}x ${c.name}`).join(", ")}
                        </div>
                        <div className="pos-hold-total">
                          Tổng: {hold.total.toLocaleString("vi-VN")} đ
                        </div>
                      </div>

                      <div className="pos-hold-actions">
                        <button
                          type="button"
                          className="btn-restore-hold"
                          onClick={() => handleRestoreHoldOrder(hold)}
                        >
                          Khôi phục
                        </button>
                        <button
                          type="button"
                          className="btn-delete-hold"
                          onClick={() => handleDeleteHoldOrder(hold.id)}
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================
          MODAL 2: HÓA ĐƠN NHIỆT (RECEIPT PREVIEW & PRINT)
          ========================================= */}
      {isReceiptModalOpen && lastCompletedOrder && (
        <div className="pos-modal-overlay" onClick={() => setIsReceiptModalOpen(false)}>
          <div
            className="pos-modal-dialog pos-receipt-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pos-modal-header no-print">
              <h3>Hóa đơn thanh toán</h3>
              <button
                type="button"
                className="pos-modal-close"
                onClick={() => setIsReceiptModalOpen(false)}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="pos-modal-body">
              {/* Tờ hóa đơn in nhiệt */}
              <div className="thermal-receipt" id="thermal-receipt-content">
                <div className="receipt-brand">NEXCOFFEE</div>
                <div className="receipt-subtitle">Hệ thống Cà phê & Trà chất lượng cao</div>
                <div className="receipt-divider">--------------------------------</div>

                <div className="receipt-row">
                  <span>Mã đơn:</span>
                  <strong>{lastCompletedOrder.code}</strong>
                </div>
                <div className="receipt-row">
                  <span>Thời gian:</span>
                  <span>{lastCompletedOrder.createdAt}</span>
                </div>
                <div className="receipt-row">
                  <span>Thu ngân:</span>
                  <span>{lastCompletedOrder.staffName}</span>
                </div>
                <div className="receipt-row receipt-location-row">
                  <span>Vị trí:</span>
                  <strong className="receipt-location-badge">
                    {lastCompletedOrder.orderType === "DINE_IN" ? "TẠI QUÁN" : "MANG VỀ"}{" "}
                    - {lastCompletedOrder.tableNumber}
                  </strong>
                </div>

                <div className="receipt-divider">--------------------------------</div>

                {/* Bảng món */}
                <div className="receipt-items-table">
                  <div className="receipt-item-header">
                    <span className="col-name">Tên món</span>
                    <span className="col-qty">SL</span>
                    <span className="col-price">Đơn giá</span>
                    <span className="col-sub">T.Tiền</span>
                  </div>
                  {lastCompletedOrder.cartItems?.map((it) => (
                    <div key={`${it.product_id}-${it.variant_id}`} className="receipt-item-row">
                      <div className="col-name">
                        {it.name} {it.size && it.size !== "Mặc định" ? `(${it.size})` : ""}
                      </div>
                      <div className="col-qty">{it.quantity}</div>
                      <div className="col-price">{(it.price / 1000).toFixed(0)}k</div>
                      <div className="col-sub">
                        {((it.price * it.quantity) / 1000).toFixed(0)}k
                      </div>
                    </div>
                  ))}
                </div>

                <div className="receipt-divider">--------------------------------</div>

                <div className="receipt-row">
                  <span>Tạm tính:</span>
                  <span>{lastCompletedOrder.subtotal?.toLocaleString("vi-VN")} đ</span>
                </div>
                {lastCompletedOrder.discount > 0 && (
                  <div className="receipt-row">
                    <span>Giảm giá:</span>
                    <span>-{lastCompletedOrder.discount?.toLocaleString("vi-VN")} đ</span>
                  </div>
                )}
                <div className="receipt-row receipt-row--bold">
                  <span>TỔNG CỘNG:</span>
                  <span>{lastCompletedOrder.total?.toLocaleString("vi-VN")} đ</span>
                </div>

                <div className="receipt-divider">--------------------------------</div>

                <div className="receipt-row">
                  <span>Tiền khách đưa:</span>
                  <span>{lastCompletedOrder.cashGiven?.toLocaleString("vi-VN")} đ</span>
                </div>
                <div className="receipt-row receipt-row--bold">
                  <span>Tiền thối lại:</span>
                  <span>{lastCompletedOrder.changeReturned?.toLocaleString("vi-VN")} đ</span>
                </div>

                <div className="receipt-divider">--------------------------------</div>
                <div className="receipt-footer-text">
                  <p>Cảm ơn quý khách và hẹn gặp lại!</p>
                  <p>Wifi: NexCoffee_Guest | Pass: nexcoffee2026</p>
                </div>
              </div>
            </div>

            <div className="pos-modal-footer no-print">
              <button
                type="button"
                className="btn-print-bill"
                onClick={handlePrintReceipt}
              >
                In hóa đơn
              </button>
              <button
                type="button"
                className="btn-close-receipt"
                onClick={() => setIsReceiptModalOpen(false)}
              >
                Đóng / Đơn mới (Esc)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
