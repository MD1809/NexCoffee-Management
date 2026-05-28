import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaMinus, FaPlus, FaTrashAlt } from "react-icons/fa";
import { toast } from "react-toastify";
import noCartImage from "../../../assets/logo/no-cart.png";
import "./Cart.css";
import { getCart, removeCartItem, updateCartItem } from "../../../apis/cartApi";
import { getAccessToken, getCurrentUser } from "../../../utils/authStorage";

const BACKEND_URL = "http://localhost:8080";

const formatCurrency = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "0đ";
  }

  return new Intl.NumberFormat("vi-VN").format(Number(value)) + "đ";
};

const getImageUrl = (imagePath) => {
  if (!imagePath) return "";

  if (imagePath.startsWith("http")) {
    return imagePath;
  }

  if (imagePath.startsWith("/images")) {
    return `${BACKEND_URL}${imagePath}`;
  }

  if (imagePath.startsWith("images")) {
    return `${BACKEND_URL}/${imagePath}`;
  }

  return `${BACKEND_URL}/images/${imagePath}`;
};

const Cart = () => {
  const navigate = useNavigate();

  const [cart, setCart] = useState({
    items: [],
    totalQuantity: 0,
    totalAmount: 0,
  });

  const [loading, setLoading] = useState(true);
  const [updatingItemId, setUpdatingItemId] = useState(null);

  const items = useMemo(() => {
    return Array.isArray(cart?.items) ? cart.items : [];
  }, [cart]);

  const fetchCart = async () => {
    try {
      setLoading(true);

      const response = await getCart();

      setCart({
        items: Array.isArray(response?.items) ? response.items : [],
        totalQuantity: response?.totalQuantity || 0,
        totalAmount: response?.totalAmount || 0,
        cartToken: response?.cartToken || null,
        id: response?.id || null,
      });
    } catch (error) {
      toast.error("Không thể tải giỏ hàng.");
      setCart({
        items: [],
        totalQuantity: 0,
        totalAmount: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    fetchCart();
  }, []);

  const syncCart = (nextCart) => {
    setCart({
      items: Array.isArray(nextCart?.items) ? nextCart.items : [],
      totalQuantity: nextCart?.totalQuantity || 0,
      totalAmount: nextCart?.totalAmount || 0,
      cartToken: nextCart?.cartToken || null,
      id: nextCart?.id || null,
    });

    window.dispatchEvent(new Event("cart-changed"));
  };

  const handleDecrease = async (item) => {
    if (updatingItemId) return;

    try {
      setUpdatingItemId(item.id);

      if (item.quantity <= 1) {
        const response = await removeCartItem(item.id);
        syncCart(response);
        toast.success("Đã xóa sản phẩm khỏi giỏ hàng.");
        return;
      }

      const response = await updateCartItem(item.id, item.quantity - 1);
      syncCart(response);
    } catch (error) {
      toast.error("Không thể cập nhật số lượng.");
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleIncrease = async (item) => {
    if (updatingItemId) return;

    try {
      setUpdatingItemId(item.id);

      const response = await updateCartItem(item.id, item.quantity + 1);
      syncCart(response);
    } catch (error) {
      toast.error("Không thể cập nhật số lượng.");
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleRemove = async (itemId) => {
    if (updatingItemId) return;

    try {
      setUpdatingItemId(itemId);

      const response = await removeCartItem(itemId);

      syncCart(response);
      toast.success("Đã xóa sản phẩm khỏi giỏ hàng.");
    } catch (error) {
      toast.error("Không thể xóa sản phẩm khỏi giỏ hàng.");
    } finally {
      setUpdatingItemId(null);
    }
  };
  const handleCheckout = () => {
    if (items.length === 0) {
      toast.warning("Giỏ hàng của bạn đang trống.");
      return;
    }

    const token = getAccessToken();
    const currentUser = getCurrentUser();

    if (!token || !currentUser) {
      toast.info("Vui lòng đăng nhập để thanh toán.");

      navigate("/login", {
        state: {
          from: "/checkout",
        },
      });

      return;
    }

    if (currentUser.role === "ADMIN") {
      toast.warning("Tài khoản admin không thể thanh toán.");
      navigate("/admin", { replace: true });
      return;
    }

    navigate("/checkout");
  };

  if (loading) {
    return (
      <section className="cart-section fade-in">
        <div className="main-content">
          <div className="cart-loading">Đang tải giỏ hàng...</div>
        </div>
      </section>
    );
  }

  return (
    <section className="cart-section fade-in">
      <div className="main-content">
        <div className="cart-header">
          <div>
            <h1 className="cart-title">Giỏ hàng của bạn</h1>
          </div>

          <Link to="/menu" className="cart-continue-link">
            Tiếp tục mua hàng
          </Link>
        </div>

        {items.length === 0 ? (
          <div className="cart-empty">
            <div className="cart-empty-icon">
              <img src={noCartImage} alt="Giỏ hàng trống" />
            </div>
            <h2>Giỏ hàng trống</h2>
            <p>Hãy chọn món cà phê yêu thích và thêm vào giỏ hàng.</p>

            <Link to="/menu" className="checkout-btn">
              Đến Menu ngay
            </Link>
          </div>
        ) : (
          <div className="cart-container">
            <div className="cart-list">
              {items.map((item) => {
                const imageUrl = getImageUrl(item.imageUrl);
                const isUpdating = updatingItemId === item.id;

                return (
                  <div className="cart-item" key={item.id}>
                    <button
                      type="button"
                      className="remove-btn"
                      title="Xóa"
                      onClick={() => handleRemove(item.id)}
                      disabled={isUpdating}
                    >
                      <FaTrashAlt />
                    </button>

                    <Link
                      to={`/products/${item.productId}`}
                      className="cart-item-image"
                    >
                      {imageUrl ? (
                        <img src={imageUrl} alt={item.productName} />
                      ) : (
                        <div className="cart-image-placeholder">Nex</div>
                      )}
                    </Link>

                    <div className="cart-info">
                      <Link
                        to={`/products/${item.productId}`}
                        className="product-name"
                      >
                        <h3>{item.productName}</h3>
                      </Link>

                      {item.size && <p className="size">Size: {item.size}</p>}

                      <p className="price">{formatCurrency(item.unitPrice)}</p>
                    </div>

                    <div className="quantity-control">
                      <button
                        type="button"
                        onClick={() => handleDecrease(item)}
                        disabled={isUpdating}
                      >
                        <FaMinus />
                      </button>

                      <span className="qty-value">{item.quantity}</span>

                      <button
                        type="button"
                        onClick={() => handleIncrease(item)}
                        disabled={isUpdating}
                      >
                        <FaPlus />
                      </button>
                    </div>

                    <div className="cart-line-total">
                      {formatCurrency(item.lineTotal)}
                    </div>
                  </div>
                );
              })}
            </div>

            <aside className="cart-summary">
              <h4>Tóm tắt đơn hàng</h4>

              <div className="summary-row">
                <span>Số lượng sản phẩm</span>
                <strong>{cart.totalQuantity}</strong>
              </div>

              <div className="summary-row">
                <span>Tạm tính</span>
                <strong>{formatCurrency(cart.totalAmount)}</strong>
              </div>

              {/* <div className="summary-note">
                Phí giao hàng và thông tin thanh toán sẽ được xử lý ở bước
                checkout.
              </div> */}

              <div className="total">
                <span>TỔNG CỘNG</span>
                <strong>{formatCurrency(cart.totalAmount)}</strong>
              </div>

              <button
                type="button"
                className="checkout-btn"
                onClick={handleCheckout}
              >
                Thanh toán
              </button>
            </aside>
          </div>
        )}
      </div>
    </section>
  );
};

export default Cart;
