import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaMoneyBillWave } from "react-icons/fa";
import { toast } from "react-toastify";

import "./UserCheckout.css";

import { getCart } from "../../../apis/cartApi";
import { placeOrder } from "../../../apis/checkoutApi";
import { clearGuestCartToken } from "../../../utils/cartSession";
import { getCurrentUser } from "../../../utils/authStorage";
import CheckoutAddressMap from "./CheckoutAddressMap";

const BACKEND_URL = "http://localhost:8080";

const formatCurrency = (value) => {
  return new Intl.NumberFormat("vi-VN").format(Number(value || 0)) + "đ";
};

const getImageUrl = (imagePath) => {
  if (!imagePath) return "";

  if (imagePath.startsWith("http")) return imagePath;

  if (imagePath.startsWith("/images")) {
    return `${BACKEND_URL}${imagePath}`;
  }

  if (imagePath.startsWith("images")) {
    return `${BACKEND_URL}/${imagePath}`;
  }

  return `${BACKEND_URL}/images/${imagePath}`;
};

const UserCheckout = () => {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const [cart, setCart] = useState({
    items: [],
    totalAmount: 0,
    totalQuantity: 0,
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [selectedAddress, setSelectedAddress] = useState(null);
  const [deliveryPreview, setDeliveryPreview] = useState(null);

  const [formData, setFormData] = useState({
    fullName: currentUser?.fullName || "",
    phone: currentUser?.phone || "",
    email: currentUser?.email || "",
    addressDetail: "",
    note: "",
    paymentMethod: "COD",
  });

  const items = useMemo(() => {
    return Array.isArray(cart.items) ? cart.items : [];
  }, [cart.items]);

  const shippingFee = useMemo(() => {
    if (!selectedAddress || !deliveryPreview?.deliverable) {
      return 0;
    }

    return Number(deliveryPreview.finalShippingFee || 0);
  }, [selectedAddress, deliveryPreview]);

  const total = useMemo(() => {
    return Number(cart.totalAmount || 0) + shippingFee;
  }, [cart.totalAmount, shippingFee]);

  useEffect(() => {
    const initCheckout = async () => {
      try {
        setLoading(true);

        const cartData = await getCart();

        setCart({
          items: Array.isArray(cartData?.items) ? cartData.items : [],
          totalAmount: cartData?.totalAmount || 0,
          totalQuantity: cartData?.totalQuantity || 0,
        });
      } catch (error) {
        toast.error("Không thể tải dữ liệu thanh toán.");
      } finally {
        setLoading(false);
      }
    };

    window.scrollTo({ top: 0, behavior: "smooth" });
    initCheckout();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (items.length === 0) {
      toast.warning("Giỏ hàng của bạn đang trống.");
      navigate("/cart");
      return false;
    }

    if (!formData.fullName.trim()) {
      toast.warning("Vui lòng nhập họ và tên.");
      return false;
    }

    if (!/^(0)(3|5|7|8|9)[0-9]{8}$/.test(formData.phone.trim())) {
      toast.warning("Số điện thoại Việt Nam không hợp lệ.");
      return false;
    }

    if (!selectedAddress) {
      toast.warning(
        "Vui lòng nhập địa chỉ giao hàng và chọn vị trí trên bản đồ.",
      );
      return false;
    }

    if (!deliveryPreview?.deliverable) {
      toast.warning(
        deliveryPreview?.message ||
          "Địa chỉ này không nằm trong phạm vi giao hàng.",
      );
      return false;
    }

    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) return;

    try {
      setSubmitting(true);

      const response = await placeOrder({
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        formattedAddress: selectedAddress.formattedAddress,
        addressDetail: formData.addressDetail.trim(),
        customerLatitude: selectedAddress.customerLatitude,
        customerLongitude: selectedAddress.customerLongitude,
        note: formData.note.trim(),
        paymentMethod: formData.paymentMethod,
      });

      clearGuestCartToken();
      window.dispatchEvent(new Event("cart-changed"));

      toast.success(`Đặt hàng thành công. Mã đơn: ${response.orderCode}`);
      navigate("/account/orders", { replace: true });
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data ||
        "Không thể đặt hàng.";

      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <section className="user-checkout-section fade-in">
        <div className="main-content">
          <div className="user-checkout-loading">Đang tải thanh toán...</div>
        </div>
      </section>
    );
  }

  return (
    <section className="user-checkout-section fade-in">
      <div className="main-content">
        <div className="user-checkout-grid">
          <form className="user-checkout-form" onSubmit={handleSubmit}>
            <h2>Thông tin giao hàng</h2>

            <div className="user-checkout-grid-2">
              <div className="user-checkout-field">
                <label>Họ và tên</label>
                <input
                  name="fullName"
                  type="text"
                  placeholder="Họ và tên"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="user-checkout-field">
                <label>Số điện thoại</label>
                <input
                  name="phone"
                  type="tel"
                  placeholder="Số điện thoại"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="user-checkout-field">
              <label>Email</label>
              <input
                name="email"
                type="email"
                placeholder="Email"
                value={formData.email}
                readOnly
              />
            </div>

            <CheckoutAddressMap
              subtotal={cart.totalAmount || 0}
              selectedAddress={selectedAddress}
              setSelectedAddress={setSelectedAddress}
              deliveryPreview={deliveryPreview}
              setDeliveryPreview={setDeliveryPreview}
              addressDetail={formData.addressDetail}
              onAddressDetailChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  addressDetail: value,
                }))
              }
            />

            <div className="user-checkout-field">
              <label>Ghi chú</label>
              <textarea
                name="note"
                rows="3"
                placeholder="Ghi chú"
                value={formData.note}
                onChange={handleChange}
              />
            </div>

            <h3>Hình thức thanh toán</h3>

            <div className="user-checkout-payment-method">
              <label className="user-checkout-pay-option">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="COD"
                  checked={formData.paymentMethod === "COD"}
                  onChange={handleChange}
                />
                <FaMoneyBillWave />
                <span>Thanh toán khi nhận hàng (COD)</span>
              </label>
            </div>
          </form>

          <aside className="user-checkout-summary">
            {items.length === 0 ? (
              <div className="user-checkout-empty">
                <p>Giỏ hàng của bạn đang trống.</p>
                <Link to="/menu">Quay lại menu</Link>
              </div>
            ) : (
              <>
                <ul className="user-checkout-cart-list">
                  {items.map((item) => {
                    const imageUrl = getImageUrl(item.imageUrl);

                    return (
                      <li className="user-checkout-cart-item" key={item.id}>
                        {imageUrl ? (
                          <img src={imageUrl} alt={item.productName} />
                        ) : (
                          <div className="user-checkout-image-placeholder">
                            Nex
                          </div>
                        )}

                        <div className="user-checkout-item-info">
                          <Link
                            to={`/products/${item.productId}`}
                            className="user-checkout-item-name"
                          >
                            {item.productName}
                          </Link>

                          <div className="user-checkout-item-meta">
                            {item.size && <span>Size {item.size}</span>}
                            <span>x{item.quantity}</span>
                          </div>
                        </div>

                        <div className="user-checkout-item-price">
                          {formatCurrency(item.lineTotal)}
                        </div>
                      </li>
                    );
                  })}
                </ul>

                <div className="user-checkout-totals">
                  <div className="user-checkout-total-row">
                    <span>Tạm tính:</span>
                    <span>{formatCurrency(cart.totalAmount)}</span>
                  </div>

                  <div className="user-checkout-total-row">
                    <span>Phí ship:</span>
                    <span>
                      {!selectedAddress
                        ? "-- Chọn địa chỉ --"
                        : deliveryPreview?.deliverable
                          ? shippingFee === 0
                            ? "Miễn phí"
                            : formatCurrency(shippingFee)
                          : "Không hỗ trợ"}
                    </span>
                  </div>

                  {deliveryPreview?.distanceMeters && (
                    <div className="user-checkout-total-row">
                      <span>Khoảng cách:</span>
                      <span>
                        {(deliveryPreview.distanceMeters / 1000).toFixed(1)} km
                      </span>
                    </div>
                  )}

                  <div className="user-checkout-grand">
                    <span>Tổng cộng</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>

                <div className="user-checkout-actions">
                  <Link className="user-checkout-outline-btn" to="/cart">
                    &lt; Giỏ hàng
                  </Link>

                  <button
                    className="user-checkout-primary-btn"
                    type="button"
                    disabled={
                      submitting ||
                      items.length === 0 ||
                      !selectedAddress ||
                      !deliveryPreview?.deliverable
                    }
                    onClick={handleSubmit}
                  >
                    {submitting ? "Đang xử lý..." : "Thanh toán"}
                  </button>
                </div>
              </>
            )}
          </aside>
        </div>
      </div>
    </section>
  );
};

export default UserCheckout;
