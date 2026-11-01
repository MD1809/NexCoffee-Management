import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import userApi from "../../../apis/userApi";
import { toggleReviewStatus } from "../../../apis/reviewApi";
import "./UserDetail.css";

const PRESET_DEACTIVATE_REASONS = [
  "Tài khoản có dấu hiệu bất thường",
  "Tỷ lệ hủy đơn hàng cao bất thường / Nghi vấn boom hàng",
  "Đăng tải đánh giá ác ý hoặc spam liên tục",
  "Nghi vấn giả mạo thông tin người dùng",
  "Vi phạm điều khoản dịch vụ và chính sách của NexCoffee",
];

const PRESET_HIDE_REASONS = [
  "Nội dung thô tục, xúc phạm hoặc bôi nhọ",
  "Nội dung spam hoặc quảng cáo sản phẩm khác",
  "Thông tin sai lệch, không đúng thực tế",
  "Đánh giá không liên quan đến sản phẩm",
];

const UserDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [customerData, setCustomerData] = useState(null);
  const [activeTab, setActiveTab] = useState("orders"); // "orders" | "reviews"

  // Bộ lọc cho Tab Đánh giá
  const [reviewRatingFilter, setReviewRatingFilter] = useState("ALL");
  const [reviewStatusFilter, setReviewStatusFilter] = useState("ALL");
  const [reviewSearchQuery, setReviewSearchQuery] = useState("");

  // Bộ lọc cho Tab Đơn hàng
  const [orderStatusFilter, setOrderStatusFilter] = useState("ALL");
  const [orderSearchQuery, setOrderSearchQuery] = useState("");

  // Modal Vô hiệu hóa tài khoản
  const [deactivateModalOpen, setDeactivateModalOpen] = useState(false);
  const [presetDeactivateReason, setPresetDeactivateReason] = useState(PRESET_DEACTIVATE_REASONS[0]);
  const [customDeactivateReason, setCustomDeactivateReason] = useState("");
  const [submittingDeactivate, setSubmittingDeactivate] = useState(false);

  // Modal Ẩn đánh giá
  const [hideReviewModalOpen, setHideReviewModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [hideReason, setHideReason] = useState(PRESET_HIDE_REASONS[0]);
  const [submittingHideReview, setSubmittingHideReview] = useState(false);

  const fetchCustomerDetail = async () => {
    setLoading(true);
    try {
      const response = await userApi.getCustomerDetail(id);
      setCustomerData(response.data);
    } catch (error) {
      console.error("Lỗi khi tải thông tin khách hàng:", error);
      toast.error("Không thể tải thông tin khách hàng!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchCustomerDetail();
    }
  }, [id]);

  // Xử lý Vô hiệu hóa tài khoản
  const handleConfirmDeactivate = async () => {
    const finalReason = customDeactivateReason.trim() || presetDeactivateReason;
    setSubmittingDeactivate(true);
    try {
      await userApi.deactivate(id, finalReason);
      toast.success("Đã vô hiệu hóa tài khoản người dùng thành công!");
      setDeactivateModalOpen(false);
      fetchCustomerDetail();
    } catch (error) {
      console.error("Lỗi khi vô hiệu hóa tài khoản:", error);
      toast.error(error.response?.data?.message || "Không thể vô hiệu hóa tài khoản!");
    } finally {
      setSubmittingDeactivate(false);
    }
  };

  // Xử lý Kích hoạt lại tài khoản
  const handleReactivate = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn kích hoạt lại tài khoản này?")) {
      return;
    }
    try {
      await userApi.reactivate(id);
      toast.success("Đã kích hoạt lại tài khoản thành công!");
      fetchCustomerDetail();
    } catch (error) {
      console.error("Lỗi khi kích hoạt lại tài khoản:", error);
      toast.error("Không thể kích hoạt lại tài khoản!");
    }
  };

  // Xử lý Ẩn đánh giá
  const handleOpenHideReview = (review) => {
    setSelectedReview(review);
    setHideReason(PRESET_HIDE_REASONS[0]);
    setHideReviewModalOpen(true);
  };

  const handleConfirmHideReview = async () => {
    if (!selectedReview) return;
    setSubmittingHideReview(true);
    try {
      await toggleReviewStatus(selectedReview.id, hideReason);
      toast.success("Đã ẩn nội dung đánh giá thành công.");
      setHideReviewModalOpen(false);
      setSelectedReview(null);
      fetchCustomerDetail();
    } catch (error) {
      console.error("Lỗi khi ẩn đánh giá:", error);
      toast.error("Không thể ẩn đánh giá!");
    } finally {
      setSubmittingHideReview(false);
    }
  };

  // Khôi phục đánh giá
  const handleRestoreReview = async (review) => {
    if (!window.confirm("Bạn có chắc muốn khôi phục hiển thị đánh giá này?")) {
      return;
    }
    try {
      await toggleReviewStatus(review.id, "");
      toast.success("Đã khôi phục hiển thị đánh giá!");
      fetchCustomerDetail();
    } catch (error) {
      console.error("Lỗi khi khôi phục đánh giá:", error);
      toast.error("Không thể khôi phục đánh giá!");
    }
  };

  // Lọc đánh giá theo số sao, trạng thái và từ khóa tìm kiếm (Tuân thủ Rules of Hooks - Đặt trước return sớm)
  const filteredCustomerReviews = useMemo(() => {
    const revs = customerData?.reviews || [];
    return revs.filter((rev) => {
      // Lọc theo rating
      if (reviewRatingFilter !== "ALL" && rev.rating !== Number(reviewRatingFilter)) {
        return false;
      }
      // Lọc theo status
      if (reviewStatusFilter === "ACTIVE" && rev.status === "HIDDEN") {
        return false;
      }
      if (reviewStatusFilter === "HIDDEN" && rev.status !== "HIDDEN") {
        return false;
      }
      // Lọc theo từ khóa
      if (reviewSearchQuery.trim()) {
        const query = reviewSearchQuery.toLowerCase();
        const pName = (rev.productName || "").toLowerCase();
        const cText = (rev.comment || "").toLowerCase();
        const rawText = (rev.rawComment || "").toLowerCase();
        if (!pName.includes(query) && !cText.includes(query) && !rawText.includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [customerData?.reviews, reviewRatingFilter, reviewStatusFilter, reviewSearchQuery]);

  // Lọc đơn hàng theo trạng thái và mã đơn / cửa hàng (Tuân thủ Rules of Hooks)
  const filteredCustomerOrders = useMemo(() => {
    const list = customerData?.orders || [];
    return list.filter((ord) => {
      // Lọc theo trạng thái
      if (orderStatusFilter !== "ALL") {
        const normStatus = String(ord.status || "").toUpperCase();
        if (orderStatusFilter === "PROCESSING") {
          if (normStatus !== "PROCESSING" && normStatus !== "CONFIRMED") return false;
        } else if (orderStatusFilter === "SHIPPED") {
          if (normStatus !== "SHIPPED" && normStatus !== "SHIPPING" && normStatus !== "DELIVERING") return false;
        } else if (normStatus !== orderStatusFilter.toUpperCase()) {
          return false;
        }
      }
      // Lọc theo từ khóa tìm kiếm (mã đơn, cửa hàng, phương thức thanh toán)
      if (orderSearchQuery.trim()) {
        const query = orderSearchQuery.toLowerCase();
        const code = String(ord.code || ord.orderCode || ord.id || "").toLowerCase();
        const storeName = String(ord.storeName || "").toLowerCase();
        const payment = String(ord.paymentMethod || "").toLowerCase();
        if (!code.includes(query) && !storeName.includes(query) && !payment.includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [customerData?.orders, orderStatusFilter, orderSearchQuery]);

  // Hiển thị tiếng Việt và màu sắc badge chuẩn cho trạng thái đơn hàng
  const getOrderStatusInfo = (status) => {
    const norm = String(status || "").toUpperCase();
    switch (norm) {
      case "COMPLETED":
        return {
          text: "Thành công",
          badgeClass: "order-status--completed",
          icon: "fa-solid fa-circle-check",
        };
      case "CANCELLED":
        return {
          text: "Đã hủy",
          badgeClass: "order-status--cancelled",
          icon: "fa-solid fa-circle-xmark",
        };
      case "PENDING":
        return {
          text: "Chờ xác nhận",
          badgeClass: "order-status--pending",
          icon: "fa-solid fa-clock",
        };
      case "PROCESSING":
      case "CONFIRMED":
        return {
          text: "Đang xử lý",
          badgeClass: "order-status--processing",
          icon: "fa-solid fa-spinner",
        };
      case "SHIPPED":
      case "SHIPPING":
      case "DELIVERING":
        return {
          text: "Đang giao",
          badgeClass: "order-status--shipping",
          icon: "fa-solid fa-truck-fast",
        };
      default:
        return {
          text: status || "—",
          badgeClass: "order-status--default",
          icon: "fa-solid fa-circle-info",
        };
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="user-detail-page">
        <div style={{ textAlign: "center", padding: "80px 20px", color: "#6b7280" }}>
          <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: "2rem", marginBottom: "12px" }}></i>
          <p>Đang tải thông tin khách hàng...</p>
        </div>
      </div>
    );
  }

  if (!customerData) {
    return (
      <div className="user-detail-page">
        <div className="user-detail-top-nav">
          <button type="button" className="btn-back-link" onClick={() => navigate(-1)}>
            <i className="fa-solid fa-arrow-left"></i>
            Quay lại
          </button>
        </div>
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <h3>Không tìm thấy dữ liệu khách hàng!</h3>
        </div>
      </div>
    );
  }

  const userInfo = customerData?.user || customerData?.userInfo || {};
  const stats = customerData?.stats || {};
  const orders = customerData?.orders || [];
  const reviews = customerData?.reviews || [];
  const isDeactivated = Boolean(userInfo.status && userInfo.status !== "ACTIVE");

  return (
    <div className="user-detail-page">
      {/* Top Nav Back button */}
      <div className="user-detail-top-nav">
        <button type="button" className="btn-back-link" onClick={() => navigate(-1)}>
          <i className="fa-solid fa-arrow-left"></i>
          Quay lại danh sách
        </button>
      </div>

      {/* Header Profile & Actions */}
      <div className="user-detail-header">
        <div className="user-detail-header__info">
          <div className="user-avatar-circle">
            {userInfo.fullName ? userInfo.fullName.charAt(0).toUpperCase() : "U"}
          </div>
          <div className="user-detail-title-group">
            <h2 className="user-detail-name">
              {userInfo.fullName || "Khách hàng"}
              <span className="user-detail-id-tag">ID #{userInfo.id}</span>
            </h2>
            <div className="user-detail-meta-line">
              <span className="user-meta-item">
                <i className="fa-regular fa-envelope"></i>
                {userInfo.email || "Chưa cập nhật email"}
              </span>
              {userInfo.phone && (
                <span className="user-meta-item">
                  <i className="fa-solid fa-phone"></i>
                  {userInfo.phone}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="user-detail-header__actions">
          {isDeactivated ? (
            <button
              type="button"
              className="btn-reactivate"
              onClick={handleReactivate}
            >
              <i className="fa-solid fa-user-check"></i>
              Kích hoạt lại tài khoản
            </button>
          ) : (
            <button
              type="button"
              className="btn-deactivate"
              onClick={() => setDeactivateModalOpen(true)}
            >
              <i className="fa-solid fa-user-slash"></i>
              Vô hiệu hóa tài khoản
            </button>
          )}
        </div>
      </div>

      {/* Banner nếu tài khoản đang bị vô hiệu hóa */}
      {isDeactivated && (
        <div className="deactivation-banner">
          <i className="fa-solid fa-triangle-exclamation deactivation-banner__icon"></i>
          <div className="deactivation-banner__content">
            <h4 className="deactivation-banner__title">TÀI KHOẢN NÀY ĐANG BỊ VÔ HIỆU HÓA</h4>
            <p className="deactivation-banner__desc">
              <strong>Lý do:</strong> {userInfo.deactivationReason || "Tài khoản có dấu hiệu bất thường"}
            </p>
            <div className="deactivation-meta">
              {userInfo.deactivatedAt && (
                <span>
                  <i className="fa-regular fa-clock" style={{ marginRight: 6 }}></i>
                  Thời gian: {formatDate(userInfo.deactivatedAt)}
                </span>
              )}
              {userInfo.deactivatedBy && (
                <span>
                  <i className="fa-solid fa-user-shield" style={{ marginRight: 6 }}></i>
                  Người thực hiện: {userInfo.deactivatedBy}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Thẻ Thống kê KPIs */}
      <div className="user-stats-grid">
        <div className="user-stat-card">
          <div className="user-stat-icon user-stat-icon--orders">
            <i className="fa-solid fa-cart-shopping"></i>
          </div>
          <div className="user-stat-info">
            <span className="user-stat-label">Đơn hàng đã đặt</span>
            <span className="user-stat-value">{stats?.totalOrders ?? 0}</span>
          </div>
        </div>

        <div className="user-stat-card">
          <div className="user-stat-icon user-stat-icon--cancelled">
            <i className="fa-solid fa-ban"></i>
          </div>
          <div className="user-stat-info">
            <span className="user-stat-label">Đơn hàng đã hủy</span>
            <span className="user-stat-value" style={{ color: stats?.cancelledOrders > 0 ? "#ef4444" : "inherit" }}>
              {stats?.cancelledOrders ?? 0}
            </span>
          </div>
        </div>

        <div className="user-stat-card">
          <div className="user-stat-icon user-stat-icon--spent">
            <i className="fa-solid fa-wallet"></i>
          </div>
          <div className="user-stat-info">
            <span className="user-stat-label">Tổng chi tiêu</span>
            <span className="user-stat-value">{formatCurrency(stats?.totalSpent)}</span>
          </div>
        </div>

        <div className="user-stat-card">
          <div className="user-stat-icon user-stat-icon--reviews">
            <i className="fa-solid fa-comments"></i>
          </div>
          <div className="user-stat-info">
            <span className="user-stat-label">Tổng đánh giá</span>
            <span className="user-stat-value">{stats?.totalReviews ?? 0}</span>
          </div>
        </div>
      </div>

      {/* Thông tin hồ sơ chi tiết */}
      <div className="user-profile-card">
        <div className="user-profile-card__header">
          <h3 className="user-profile-card__title">
            <i className="fa-solid fa-id-card"></i>
            Thông tin tài khoản
          </h3>
          <span className="user-profile-subtitle">Chi tiết dữ liệu khách hàng được ghi nhận trên hệ thống</span>
        </div>
        <div className="user-profile-grid">
          <div className="profile-field">
            <span className="profile-field-label">Họ và tên</span>
            <span className="profile-field-value">{userInfo.fullName || "—"}</span>
          </div>
          <div className="profile-field">
            <span className="profile-field-label">Địa chỉ Email</span>
            <span className="profile-field-value">{userInfo.email || "—"}</span>
          </div>
          <div className="profile-field">
            <span className="profile-field-label">Số điện thoại</span>
            <span className="profile-field-value">{userInfo.phone || "—"}</span>
          </div>
          <div className="profile-field">
            <span className="profile-field-label">Mã tài khoản (ID)</span>
            <span className="profile-field-value">#{userInfo.id}</span>
          </div>
          <div className="profile-field">
            <span className="profile-field-label">Ngày tạo tài khoản</span>
            <span className="profile-field-value">{formatDate(userInfo.createdAt)}</span>
          </div>
          <div className="profile-field">
            <span className="profile-field-label">Trạng thái tài khoản</span>
            <span className="profile-field-value">
              <span
                className={`user-account-status-tag ${
                  userInfo.status === "ACTIVE"
                    ? "user-account-status-tag--active"
                    : "user-account-status-tag--deactivated"
                }`}
              >
                <i
                  className={
                    userInfo.status === "ACTIVE"
                      ? "fa-solid fa-circle-check"
                      : "fa-solid fa-circle-xmark"
                  }
                ></i>
                {userInfo.status === "ACTIVE" ? "Đang hoạt động" : "Đã vô hiệu hóa"}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Tabs: Đơn hàng & Đánh giá */}
      <div className="user-tabs-container">
        <div className="user-tabs-header">
          <button
            type="button"
            className={`user-tab-btn ${activeTab === "orders" ? "user-tab-btn--active" : ""}`}
            onClick={() => setActiveTab("orders")}
          >
            <i className="fa-solid fa-box"></i>
            Danh sách đơn hàng
            <span className="user-tab-badge">{orders.length}</span>
          </button>
          <button
            type="button"
            className={`user-tab-btn ${activeTab === "reviews" ? "user-tab-btn--active" : ""}`}
            onClick={() => setActiveTab("reviews")}
          >
            <i className="fa-solid fa-star"></i>
            Danh sách đánh giá
            <span className="user-tab-badge">{reviews.length}</span>
          </button>
        </div>

        <div className="user-tabs-content">
          {activeTab === "orders" && (
            orders.length === 0 ? (
              <div className="user-empty-state">
                <i className="fa-solid fa-cart-shopping"></i>
                <p>Khách hàng chưa có đơn hàng nào.</p>
              </div>
            ) : (
              <div className="user-orders-wrapper">
                {/* Thanh công cụ lọc đơn hàng */}
                <div className="user-orders-filter-bar">
                  <div className="filter-bar-controls">
                    <div className="order-search-wrap">
                      <i className="fa-solid fa-magnifying-glass search-icon"></i>
                      <input
                        type="text"
                        placeholder="Tìm theo mã đơn, cửa hàng..."
                        value={orderSearchQuery}
                        onChange={(e) => setOrderSearchQuery(e.target.value)}
                        className="order-search-input"
                      />
                      {orderSearchQuery && (
                        <button
                          type="button"
                          className="btn-clear-search"
                          onClick={() => setOrderSearchQuery("")}
                          title="Xóa tìm kiếm"
                        >
                          <i className="fa-solid fa-xmark"></i>
                        </button>
                      )}
                    </div>

                    <select
                      value={orderStatusFilter}
                      onChange={(e) => setOrderStatusFilter(e.target.value)}
                      className="user-order-select"
                      title="Lọc theo trạng thái đơn hàng"
                    >
                      <option value="ALL">Tất cả trạng thái</option>
                      <option value="COMPLETED">Thành công</option>
                      <option value="PROCESSING">Đang xử lý</option>
                      <option value="SHIPPED">Đang giao</option>
                      <option value="PENDING">Chờ xác nhận</option>
                      <option value="CANCELLED">Đã hủy</option>
                    </select>

                    {(orderStatusFilter !== "ALL" || orderSearchQuery) && (
                      <button
                        type="button"
                        className="btn-reset-order-filter"
                        onClick={() => {
                          setOrderStatusFilter("ALL");
                          setOrderSearchQuery("");
                        }}
                        title="Đặt lại bộ lọc"
                      >
                        <i className="fa-solid fa-rotate-left"></i>
                        Đặt lại
                      </button>
                    )}
                  </div>

                  <div className="filter-bar-count">
                    Hiển thị <strong>{filteredCustomerOrders.length}</strong> / {orders.length} đơn hàng
                  </div>
                </div>

                {filteredCustomerOrders.length === 0 ? (
                  <div className="user-empty-state">
                    <i className="fa-solid fa-filter-circle-xmark"></i>
                    <p>Không tìm thấy đơn hàng nào phù hợp với bộ lọc đã chọn.</p>
                  </div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table className="user-orders-table">
                      <thead>
                        <tr>
                          <th>Mã đơn</th>
                          <th>Ngày đặt</th>
                          <th>Cửa hàng</th>
                          <th>Phương thức</th>
                          <th>Tổng tiền</th>
                          <th>Trạng thái</th>
                          <th style={{ textAlign: "center" }}>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCustomerOrders.map((ord) => {
                          const statusInfo = getOrderStatusInfo(ord.status);
                          return (
                            <tr key={ord.id}>
                              <td>
                                <Link
                                  to={`/admin/orders/detail/${ord.id}`}
                                  className="order-code-link"
                                  title="Xem chi tiết đơn hàng"
                                >
                                  {ord.code || ord.orderCode || `#${ord.id}`}
                                </Link>
                              </td>
                              <td>{formatDate(ord.createdAt)}</td>
                              <td>{ord.storeName || "—"}</td>
                              <td>{ord.paymentMethod || "COD"}</td>
                              <td style={{ fontWeight: 700, color: "var(--text-primary, #f1f5f9)" }}>
                                {formatCurrency(ord.total)}
                              </td>
                              <td>
                                <span className={`order-status-badge ${statusInfo.badgeClass}`}>
                                  <i className={statusInfo.icon} style={{ marginRight: 6 }}></i>
                                  {statusInfo.text}
                                </span>
                              </td>
                              <td style={{ textAlign: "center" }}>
                                <Link
                                  to={`/admin/orders/detail/${ord.id}`}
                                  className="btn-icon-action"
                                  title="Xem chi tiết đơn"
                                  style={{ display: "inline-flex" }}
                                >
                                  <i className="fa-regular fa-eye"></i>
                                </Link>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          )}

          {activeTab === "reviews" && (
            reviews.length === 0 ? (
              <div className="user-empty-state">
                <i className="fa-solid fa-comment-dots"></i>
                <p>Khách hàng chưa gửi đánh giá nào.</p>
              </div>
            ) : (
              <div className="user-reviews-wrapper">
                {/* Thanh công cụ lọc đánh giá */}
                <div className="user-reviews-filter-bar">
                  <div className="filter-bar-controls">
                    <div className="review-search-wrap">
                      <i className="fa-solid fa-magnifying-glass search-icon"></i>
                      <input
                        type="text"
                        placeholder="Tìm theo sản phẩm hoặc nội dung..."
                        value={reviewSearchQuery}
                        onChange={(e) => setReviewSearchQuery(e.target.value)}
                        className="review-search-input"
                      />
                      {reviewSearchQuery && (
                        <button
                          type="button"
                          className="btn-clear-search"
                          onClick={() => setReviewSearchQuery("")}
                          title="Xóa tìm kiếm"
                        >
                          <i className="fa-solid fa-xmark"></i>
                        </button>
                      )}
                    </div>

                    <select
                      value={reviewRatingFilter}
                      onChange={(e) => setReviewRatingFilter(e.target.value)}
                      className="user-review-select"
                      title="Lọc theo số sao"
                    >
                      <option value="ALL">Tất cả số sao</option>
                      <option value="5">5 sao (★★★★★)</option>
                      <option value="4">4 sao (★★★★☆)</option>
                      <option value="3">3 sao (★★★☆☆)</option>
                      <option value="2">2 sao (★★☆☆☆)</option>
                      <option value="1">1 sao (★☆☆☆☆)</option>
                    </select>

                    <select
                      value={reviewStatusFilter}
                      onChange={(e) => setReviewStatusFilter(e.target.value)}
                      className="user-review-select"
                      title="Lọc theo trạng thái"
                    >
                      <option value="ALL">Tất cả trạng thái</option>
                      <option value="ACTIVE">Đang hiển thị</option>
                      <option value="HIDDEN">Đã ẩn nội dung</option>
                    </select>

                    {(reviewRatingFilter !== "ALL" || reviewStatusFilter !== "ALL" || reviewSearchQuery) && (
                      <button
                        type="button"
                        className="btn-reset-review-filter"
                        onClick={() => {
                          setReviewRatingFilter("ALL");
                          setReviewStatusFilter("ALL");
                          setReviewSearchQuery("");
                        }}
                        title="Đặt lại bộ lọc"
                      >
                        <i className="fa-solid fa-rotate-left"></i>
                        Đặt lại
                      </button>
                    )}
                  </div>

                  <div className="filter-bar-count">
                    Hiển thị <strong>{filteredCustomerReviews.length}</strong> / {reviews.length} đánh giá
                  </div>
                </div>

                {filteredCustomerReviews.length === 0 ? (
                  <div className="user-empty-state">
                    <i className="fa-solid fa-filter-circle-xmark"></i>
                    <p>Không tìm thấy đánh giá nào phù hợp với bộ lọc đã chọn.</p>
                  </div>
                ) : (
                  <div className="user-reviews-list">
                    {filteredCustomerReviews.map((rev) => {
                      const isHidden = rev.status === "HIDDEN";
                      return (
                        <div
                          key={rev.id}
                          className={`user-review-card ${isHidden ? "user-review-card--hidden" : ""}`}
                        >
                          <div className="user-review-card__header">
                            <div className="user-review-card__product">
                              {rev.productImageUrl && (
                                <img
                                  src={rev.productImageUrl}
                                  alt={rev.productName}
                                  className="review-product-thumb-large"
                                />
                              )}
                              <div className="review-product-info">
                                <h4 className="review-product-title">{rev.productName}</h4>
                                <div className="review-stars-large">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <i
                                      key={star}
                                      className={
                                        star <= (rev.rating || 0)
                                          ? "fa-solid fa-star"
                                          : "fa-regular fa-star"
                                      }
                                    ></i>
                                  ))}
                                  <span className="review-rating-num">({rev.rating}/5)</span>
                                </div>
                              </div>
                            </div>

                            <div className="review-card-meta-actions">
                              <span className="review-date-badge">
                                <i className="fa-regular fa-clock"></i>
                                {formatDate(rev.createdAt)}
                              </span>
                              {isHidden ? (
                                <button
                                  type="button"
                                  className="btn-action-restore"
                                  title="Khôi phục hiển thị đánh giá"
                                  onClick={() => handleRestoreReview(rev)}
                                >
                                  <i className="fa-solid fa-rotate-left"></i>
                                  Khôi phục
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="btn-action-hide"
                                  title="Ẩn nội dung không phù hợp"
                                  onClick={() => handleOpenHideReview(rev)}
                                >
                                  <i className="fa-solid fa-eye-slash"></i>
                                  Ẩn nội dung
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="user-review-card__body">
                            {isHidden ? (
                              <div className="review-hidden-notice">
                                <span className="review-hidden-tag">
                                  <i className="fa-solid fa-shield-halved"></i>
                                  Nội dung đánh giá này đã bị ẩn đối với công chúng
                                </span>
                                <div className="review-public-comment">
                                  <strong>Nội dung hiển thị (Lý do ẩn):</strong> &ldquo;{rev.comment}&rdquo;
                                </div>
                                <div className="review-raw-comment">
                                  <strong>Nội dung gốc của khách:</strong> &ldquo;{rev.rawComment || rev.comment}&rdquo;
                                </div>
                                {rev.hiddenReason && (
                                  <div className="review-hidden-reason">
                                    <strong>Ghi chú lý do:</strong> {rev.hiddenReason}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <p className="review-comment-main">&ldquo;{rev.comment}&rdquo;</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )
          )}
        </div>
      </div>

      {/* Modal Vô hiệu hóa tài khoản */}
      {deactivateModalOpen && (
        <div className="modal-overlay" onClick={() => setDeactivateModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <i className="fa-solid fa-user-slash"></i>
                Vô hiệu hóa tài khoản khách hàng
              </h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setDeactivateModalOpen(false)}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="modal-body">
              <p className="modal-deactivate-desc">
                Khách hàng <strong>{userInfo.fullName}</strong> ({userInfo.email}) sẽ không thể tiếp tục đăng nhập
                vào hệ thống. Khi họ cố đăng nhập, một trang thông báo kèm lý do vô hiệu hóa sẽ hiển thị.
              </p>

              <div className="modal-form-group">
                <label>Lý do vô hiệu hóa (chọn mẫu):</label>
                <select
                  className="modal-select-presets"
                  value={presetDeactivateReason}
                  onChange={(e) => setPresetDeactivateReason(e.target.value)}
                >
                  {PRESET_DEACTIVATE_REASONS.map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-form-group">
                <label>Lý do chi tiết bổ sung (tùy chọn):</label>
                <textarea
                  className="modal-textarea"
                  placeholder="Nhập lý do cụ thể hiển thị cho người dùng khi bị khóa..."
                  value={customDeactivateReason}
                  onChange={(e) => setCustomDeactivateReason(e.target.value)}
                ></textarea>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setDeactivateModalOpen(false)}
                disabled={submittingDeactivate}
              >
                Hủy
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={handleConfirmDeactivate}
                disabled={submittingDeactivate}
              >
                {submittingDeactivate ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i>
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-user-slash"></i>
                    Xác nhận vô hiệu hóa
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ẩn đánh giá trong tab */}
      {hideReviewModalOpen && selectedReview && (
        <div className="modal-overlay" onClick={() => setHideReviewModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <i className="fa-solid fa-triangle-exclamation"></i>
                Ẩn nội dung đánh giá
              </h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setHideReviewModalOpen(false)}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="modal-body">
              <div className="modal-review-preview">
                <strong>Sản phẩm:</strong> {selectedReview.productName}
                <br />
                <strong>Nội dung:</strong> &ldquo;{selectedReview.comment}&rdquo;
              </div>

              <div className="modal-form-group">
                <label>Lý do ẩn:</label>
                <select
                  className="modal-select-presets"
                  value={hideReason}
                  onChange={(e) => setHideReason(e.target.value)}
                >
                  {PRESET_HIDE_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setHideReviewModalOpen(false)}
                disabled={submittingHideReview}
              >
                Hủy
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={handleConfirmHideReview}
                disabled={submittingHideReview}
              >
                {submittingHideReview ? "Đang xử lý..." : "Xác nhận ẩn"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDetail;
