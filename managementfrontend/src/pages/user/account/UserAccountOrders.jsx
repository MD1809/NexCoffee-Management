import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FaBox,
  FaCheckCircle,
  FaClock,
  FaCoffee,
  FaEye,
  FaSearch,
  FaStore,
  FaTimes,
  FaTimesCircle,
  FaTruck,
  FaUndo,
} from "react-icons/fa";
import { cancelMyOrder, getMyOrders } from "../../../apis/accountApi";

const BACKEND_URL = "http://localhost:8080";

const formatCurrency = (value) => {
  return new Intl.NumberFormat("vi-VN").format(Number(value || 0)) + "đ";
};

const formatDateTime = (value) => {
  if (!value) return "—";

  return new Date(value).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Kiểm tra đơn hàng có quá thời hạn 7 ngày để đánh giá hay không
const isReviewExpired = (order) => {
  if (!order) return true;
  const baseTimeStr = order.completedAt || order.createdAt;
  if (!baseTimeStr) return true;
  const baseTime = new Date(baseTimeStr);
  if (isNaN(baseTime.getTime())) return true;
  const now = new Date();
  const diffInDays = (now - baseTime) / (1000 * 60 * 60 * 24);
  return diffInDays > 7;
};

const getImageUrl = (imagePath) => {
  if (!imagePath) return "";
  if (imagePath.startsWith("http")) return imagePath;
  if (imagePath.startsWith("/images")) return `${BACKEND_URL}${imagePath}`;
  if (imagePath.startsWith("images")) return `${BACKEND_URL}/${imagePath}`;
  return `${BACKEND_URL}/images/${imagePath}`;
};

const STATUS_CONFIG = {
  Pending: {
    label: "CHỜ DUYỆT",
    shippingLabel: "Chờ xác nhận",
    icon: FaClock,
    className: "status-pending",
  },
  Processing: {
    label: "ĐANG XỬ LÝ",
    shippingLabel: "Đang pha chế & chuẩn bị",
    icon: FaBox,
    className: "status-processing",
  },
  Shipped: {
    label: "ĐANG GIAO",
    shippingLabel: "Shipper đang giao hàng",
    icon: FaTruck,
    className: "status-shipped",
  },
  Completed: {
    label: "HOÀN THÀNH",
    shippingLabel: "Giao hàng thành công",
    icon: FaCheckCircle,
    className: "status-completed",
  },
  Cancelled: {
    label: "ĐÃ HỦY",
    shippingLabel: "Đơn hàng đã hủy",
    icon: FaTimesCircle,
    className: "status-cancelled",
  },
};

const STATUS_TABS = [
  { key: "ALL", label: "Tất cả" },
  { key: "Pending", label: "Chờ duyệt" },
  { key: "Processing", label: "Đang xử lý" },
  { key: "Shipped", label: "Đang giao" },
  { key: "Completed", label: "Hoàn thành" },
  { key: "Cancelled", label: "Đã hủy" },
];

const BATCH_SIZE = 5;

const UserAccountOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState("ALL");
  const [keyword, setKeyword] = useState("");
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const sentinelRef = useRef(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await getMyOrders();
      setOrders(Array.isArray(data) ? data : []);
      setVisibleCount(BATCH_SIZE);
    } catch (error) {
      toast.error("Không thể tải danh sách đơn hàng.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    fetchOrders();
  }, []);

  // Lọc đơn hàng theo Tab trạng thái và từ khóa tìm kiếm (theo tên món hoặc tên quán)
  const filteredOrders = useMemo(() => {
    const trimmed = keyword.trim().toLowerCase();

    return orders.filter((order) => {
      const matchStatus =
        activeStatus === "ALL" ||
        String(order.status).toLowerCase() === activeStatus.toLowerCase();

      if (!matchStatus) return false;

      if (!trimmed) return true;

      const storeMatch = String(order.storeName || "")
        .toLowerCase()
        .includes(trimmed);

      const itemsMatch = Array.isArray(order.items)
        ? order.items.some((item) =>
            String(item.productName || "")
              .toLowerCase()
              .includes(trimmed),
          )
        : false;

      return storeMatch || itemsMatch;
    });
  }, [orders, activeStatus, keyword]);

  // Danh sách đơn hàng hiển thị theo Infinite Scroll
  const displayedOrders = useMemo(() => {
    return filteredOrders.slice(0, visibleCount);
  }, [filteredOrders, visibleCount]);

  // Đếm số lượng đơn theo từng trạng thái để hiển thị badge
  const statusCounts = useMemo(() => {
    const counts = { ALL: orders.length };
    STATUS_TABS.forEach((tab) => {
      if (tab.key !== "ALL") {
        counts[tab.key] = orders.filter(
          (o) => String(o.status).toLowerCase() === tab.key.toLowerCase(),
        ).length;
      }
    });
    return counts;
  }, [orders]);

  // Reset số lượng load khi chuyển tab hoặc đổi từ khóa
  useEffect(() => {
    setVisibleCount(BATCH_SIZE);
  }, [activeStatus, keyword]);

  // IntersectionObserver: Lướt đến đâu tự động load đến đấy
  useEffect(() => {
    const targetElement = sentinelRef.current;
    if (!targetElement) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];
        if (
          firstEntry.isIntersecting &&
          visibleCount < filteredOrders.length &&
          !isLoadingMore
        ) {
          setIsLoadingMore(true);
          setTimeout(() => {
            setVisibleCount((prev) =>
              Math.min(prev + BATCH_SIZE, filteredOrders.length),
            );
            setIsLoadingMore(false);
          }, 300);
        }
      },
      {
        root: null,
        rootMargin: "200px",
        threshold: 0.1,
      },
    );

    observer.observe(targetElement);

    return () => {
      observer.disconnect();
    };
  }, [visibleCount, filteredOrders.length, isLoadingMore]);

  const handleCancel = async (order) => {
    if (order.status !== "Pending") {
      toast.warning("Chỉ có thể hủy đơn hàng đang ở trạng thái chờ duyệt.");
      return;
    }

    const reason = window.prompt(
      "Nhập lý do hủy đơn hàng:",
      "Khách hàng thay đổi ý định",
    );

    if (reason === null) return;

    try {
      await cancelMyOrder(order.id, reason);
      toast.success("Đã hủy đơn hàng thành công.");
      fetchOrders();
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data ||
        "Không thể hủy đơn hàng.";

      toast.error(message);
    }
  };

  return (
    <section className="user-account-orders-container">
      {/* Header phong cách menu */}
      <div className="orders-page-header">
        <div className="orders-title-wrap">
          <h2 className="orders-title">Đơn hàng của bạn</h2>
          <p className="orders-subtitle">
            Theo dõi tiến độ chế biến, giao nhận và lịch sử mua sắm của bạn tại NexCoffee
          </p>
        </div>

        {/* Thanh tìm kiếm đơn hàng */}
        <div className="orders-search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            value={keyword}
            placeholder="Tìm kiếm theo tên món hoặc tên quán..."
            onChange={(e) => setKeyword(e.target.value)}
          />
          {keyword && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => setKeyword("")}
              aria-label="Xóa từ khóa tìm kiếm"
            >
              <FaTimes />
            </button>
          )}
        </div>
      </div>

      {/* Thanh lọc trạng thái thiết kế giống lọc danh mục trang Menu, phân cách nhau bằng border */}
      <div className="orders-status-tabs-wrap">
        <div className="orders-status-filter-bar">
          {STATUS_TABS.map((tab) => {
            const count = statusCounts[tab.key] || 0;
            const isActive = activeStatus === tab.key;

            return (
              <button
                key={tab.key}
                type="button"
                className={`menu-category-btn orders-filter-tab-btn ${
                  isActive ? "active" : ""
                }`}
                onClick={() => setActiveStatus(tab.key)}
              >
                <span className="tab-label">{tab.label}</span>
                {count > 0 && <span className="tab-count">({count})</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Danh sách các đơn hàng dạng thẻ E-commerce (Shopee style) */}
      <div className="orders-cards-list">
        {loading ? (
          <div className="orders-skeleton-wrapper">
            {[1, 2, 3].map((n) => (
              <div key={n} className="order-card-skeleton">
                <div className="skeleton-line skeleton-header"></div>
                <div className="skeleton-item-row">
                  <div className="skeleton-square"></div>
                  <div className="skeleton-details">
                    <div className="skeleton-line short"></div>
                    <div className="skeleton-line tiny"></div>
                  </div>
                </div>
                <div className="skeleton-line skeleton-footer"></div>
              </div>
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="orders-empty-state">
            <div className="empty-icon-wrap">
              <FaCoffee className="empty-coffee-icon" />
            </div>
            <h3>Không tìm thấy đơn hàng nào</h3>
            <p>
              {keyword
                ? `Không có đơn hàng nào khớp với từ khóa "${keyword}".`
                : activeStatus !== "ALL"
                  ? `Bạn chưa có đơn hàng nào ở trạng thái này.`
                  : "Bạn chưa có đơn hàng nào trong tài khoản."}
            </p>
            <Link to="/menu" className="btn-explore-menu">
              <span>Khám phá thực đơn ngay</span>
            </Link>
          </div>
        ) : (
          <>
            {displayedOrders.map((order) => {
              const statusCfg = STATUS_CONFIG[order.status] || {
                label: order.status || "—",
                shippingLabel: "Đang xử lý",
                icon: FaBox,
                className: "status-pending",
              };
              const StatusIcon = statusCfg.icon;
              const items = Array.isArray(order.items) ? order.items : [];
              const storeName = order.storeName || "NexCoffee";

              return (
                <article key={order.id} className="ecommerce-order-card">
                  {/* Card Header: Tên quán nhận đơn theo đơn hàng + Trạng thái */}
                  <div className="order-card-head">
                    <div className="order-store-info">
                      <FaStore className="store-icon" />
                      <strong className="store-title">{storeName}</strong>
                    </div>

                    <div className="order-status-group">
                      <div className="order-shipping-badge">
                        <StatusIcon className="shipping-icon" />
                        <span>{statusCfg.shippingLabel}</span>
                      </div>
                      <span className="order-status-sep">|</span>
                      <span className={`order-main-status ${statusCfg.className}`}>
                        {statusCfg.label}
                      </span>
                    </div>
                  </div>

                  {/* Card Items List: Mỗi sản phẩm là 1 hàng với ảnh, tên, phân loại, xSố lượng và giá, phân cách bằng border */}
                  <div className="order-card-items-wrap">
                    {items.length > 0 ? (
                      items.map((item, idx) => (
                        <div
                          key={`${item.productId || idx}-${item.size || ""}`}
                          className="order-product-row"
                        >
                          <Link
                            to={item.productId ? `/products/${item.productId}` : `/account/orders/${order.id}`}
                            className="order-item-img-link"
                          >
                            {item.image ? (
                              <img
                                src={getImageUrl(item.image)}
                                alt={item.productName}
                                className="order-item-thumbnail"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                }}
                              />
                            ) : (
                              <div className="order-item-img-placeholder">
                                <FaCoffee />
                              </div>
                            )}
                          </Link>

                          <div className="order-item-meta">
                            <Link
                              to={item.productId ? `/products/${item.productId}` : `/account/orders/${order.id}`}
                              className="order-item-title"
                            >
                              {item.productName}
                            </Link>

                            <div className="order-item-variant-line">
                              {item.size ? (
                                <span className="order-item-variant">
                                  Phân loại: Size {item.size}
                                </span>
                              ) : (
                                <span className="order-item-variant">
                                  Đồ uống chuẩn vị NexCoffee
                                </span>
                              )}
                            </div>

                            <span className="order-item-quantity">
                              x{item.quantity}
                            </span>
                          </div>

                          <div className="order-item-price-col">
                            <span className="order-item-unit-price">
                              {formatCurrency(item.unitPrice || item.totalPrice)}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="order-product-row order-product-fallback">
                        <div className="order-item-img-placeholder">
                          <FaCoffee />
                        </div>
                        <div className="order-item-meta">
                          <span className="order-item-title">
                            Sản phẩm đồ uống NexCoffee
                          </span>
                          <span className="order-item-variant">
                            Pha chế chuẩn công thức thượng hạng
                          </span>
                        </div>
                        <div className="order-item-price-col">
                          <span className="order-item-unit-price">
                            {formatCurrency(order.total)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Footer: Danh sách xem trước chỉ hiển thị thời gian đặt, tổng tiền và nút hành động (bỏ mã đơn và địa chỉ) */}
                  <div className="order-card-foot">
                    <div className="order-foot-meta-row">
                      <div className="order-created-time">
                        <FaClock className="order-time-icon" />
                        <span>Thời gian đặt: {formatDateTime(order.createdAt)}</span>
                      </div>

                      <div className="order-total-amount-box">
                        <span className="order-total-label">Thành tiền:</span>
                        <strong className="order-total-value">
                          {formatCurrency(order.total)}
                        </strong>
                      </div>
                    </div>

                    <div className="order-foot-actions-row">
                      <div className="order-note-hint">
                        {order.status === "Pending" && (
                          <span className="order-hint-pending">
                            Đơn đang chờ thu ngân xác nhận
                          </span>
                        )}
                        {order.status === "Cancelled" && order.cancelReason && (
                          <span className="order-hint-cancelled" title={order.cancelReason}>
                            Lý do hủy: {order.cancelReason}
                          </span>
                        )}
                      </div>

                      <div className="order-actions-buttons">
                        {/* Nút hủy đơn (chỉ khi Pending) */}
                        {order.status === "Pending" && (
                          <button
                            type="button"
                            className="btn-order-action btn-order-cancel"
                            onClick={() => handleCancel(order)}
                          >
                            Hủy đơn hàng
                          </button>
                        )}

                        {/* Nút xem chi tiết */}
                        <Link
                          to={`/account/orders/${order.id}`}
                          className="btn-order-action btn-order-detail"
                        >
                          <FaEye className="btn-icon" />
                          <span>Xem chi tiết</span>
                        </Link>

                        {/* Nút đánh giá hoặc mua lại */}
                        {order.status === "Completed" && (
                          <>
                            {!isReviewExpired(order) && (
                              <Link
                                to={`/account/orders/${order.id}`}
                                className="btn-order-action btn-order-review"
                              >
                                Đánh giá
                              </Link>
                            )}

                            <Link
                              to="/menu"
                              className="btn-order-action btn-order-reorder"
                            >
                              <FaUndo className="btn-icon" />
                              <span>Mua lại</span>
                            </Link>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}

            {/* Sentinel nhận diện vị trí cuộn cho Infinite Scroll */}
            <div ref={sentinelRef} className="infinite-scroll-sentinel">
              {isLoadingMore && (
                <div className="infinite-scroll-loading">
                  <div className="loading-spinner"></div>
                  <span>Đang tải thêm đơn hàng...</span>
                </div>
              )}

              {visibleCount >= filteredOrders.length && filteredOrders.length > 0 && (
                <div className="infinite-scroll-end">
                  <FaCheckCircle className="end-icon" />
                  <span>Bạn đã xem hết tất cả {filteredOrders.length} đơn hàng</span>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default UserAccountOrders;
