import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  FaStar,
  FaTimes,
  FaCheckCircle,
  FaEdit,
  FaCalendarAlt,
  FaClock,
} from "react-icons/fa";
import { toast } from "react-toastify";
import { cancelMyOrder, getMyOrderDetail } from "../../../apis/accountApi";
import {
  getOrderReviews,
  createReview,
  updateReview,
} from "../../../apis/reviewApi";

const BACKEND_URL = "http://localhost:8080";

const formatCurrency = (value) => {
  return new Intl.NumberFormat("vi-VN").format(Number(value || 0)) + "đ";
};

const formatDate = (value) => {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const getImageUrl = (imagePath) => {
  if (!imagePath) return "";

  if (imagePath.startsWith("http")) return imagePath;
  if (imagePath.startsWith("/images")) return `${BACKEND_URL}${imagePath}`;
  if (imagePath.startsWith("images")) return `${BACKEND_URL}/${imagePath}`;

  return `${BACKEND_URL}/images/${imagePath}`;
};

const getStatusInfo = (status) => {
  const map = {
    Pending: ["Chờ duyệt", "warn"],
    Processing: ["Đang xử lý", "shipping"],
    Shipped: ["Đang giao", "shipping"],
    Completed: ["Đã hoàn thành", "success"],
    Cancelled: ["Đã bị hủy", "cancelled"],
  };

  return map[status] || [status || "—", ""];
};

const getPaymentLabel = (paymentMethod) => {
  if (paymentMethod === "COD") return "Thanh toán khi giao hàng (COD)";
  return paymentMethod || "—";
};

const RATING_HINTS = {
  1: "Tệ",
  2: "Chưa hài lòng",
  3: "Bình thường",
  4: "Rất ngon & hài lòng",
  5: "Tuyệt vời, chuẩn vị!",
};

// Kiểm tra đơn hàng có quá hạn 7 ngày để đánh giá không
const isReviewExpired = (order) => {
  if (!order) return true;
  const baseTime = new Date(order.completedAt || order.createdAt);
  const now = new Date();
  const diffInDays = (now - baseTime) / (1000 * 60 * 60 * 24);
  return diffInDays > 7;
};

// Lấy số ngày còn lại để đánh giá
const getReviewRemainingDays = (order) => {
  if (!order) return 0;
  const baseTime = new Date(order.completedAt || order.createdAt);
  const deadline = new Date(baseTime.getTime() + 7 * 24 * 60 * 60 * 1000);
  const now = new Date();
  const diffMs = deadline - now;
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
};

const UserAccountOrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // Danh sách đánh giá đã có cho đơn hàng này
  const [orderReviews, setOrderReviews] = useState([]);

  // State cho Modal đánh giá
  const [reviewingItem, setReviewingItem] = useState(null);
  const [reviewModalMode, setReviewModalMode] = useState("create"); // "create" | "edit"
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [hoverStar, setHoverStar] = useState(0);
  const [submittingReview, setSubmittingReview] = useState(false);

  // Khóa cuộn body khi modal đánh giá mở
  useEffect(() => {
    if (reviewingItem) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [reviewingItem]);

  const [statusLabel, statusClass] = useMemo(() => {
    return getStatusInfo(order?.status);
  }, [order]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const data = await getMyOrderDetail(id);
      setOrder(data);

      // Nếu đơn đã hoàn thành, load danh sách review của đơn này
      if (data && data.status === "Completed") {
        try {
          const reviewsRes = await getOrderReviews(data.id);
          const reviewList = Array.isArray(reviewsRes) ? reviewsRes : reviewsRes?.data || [];
          setOrderReviews(reviewList);
        } catch (err) {
          // Bỏ qua lỗi load review phụ
        }
      }
    } catch (error) {
      toast.error("Không thể tải chi tiết đơn hàng.");
      navigate("/account/orders", { replace: true });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    fetchOrder();
  }, [id]);

  // Khóa cuộn trang khi mở modal đánh giá món
  useEffect(() => {
    if (reviewingItem) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [reviewingItem]);

  const handleCancelOrder = async () => {
    if (!order || order.status !== "Pending") {
      toast.warning("Chỉ có thể hủy đơn hàng đang ở trạng thái chờ duyệt.");
      return;
    }

    const reason = window.prompt(
      "Nhập lý do hủy đơn hàng:",
      "Khách hàng hủy đơn",
    );

    if (reason === null) return;

    try {
      const updatedOrder = await cancelMyOrder(order.id, reason);
      setOrder(updatedOrder);
      toast.success("Đã hủy đơn hàng.");
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data ||
        "Không thể hủy đơn hàng.";

      toast.error(message);
    }
  };

  // Mở modal đánh giá mới cho một món
  const handleOpenReviewModal = (item) => {
    setReviewingItem(item);
    setReviewModalMode("create");
    setEditingReviewId(null);
    setReviewForm({ rating: 5, comment: "" });
    setHoverStar(0);
  };

  // Mở modal chỉnh sửa đánh giá đã có (chỉ cho phép sửa 1 lần)
  const handleOpenEditReviewModal = (item, existingReview) => {
    setReviewingItem(item);
    setReviewModalMode("edit");
    setEditingReviewId(existingReview.id);
    setReviewForm({
      rating: existingReview.rating || 5,
      comment: existingReview.comment || "",
    });
    setHoverStar(0);
  };

  const handleCloseReviewModal = () => {
    setReviewingItem(null);
    setReviewModalMode("create");
    setEditingReviewId(null);
    setReviewForm({ rating: 5, comment: "" });
    setHoverStar(0);
  };

  // Gửi đánh giá mới hoặc cập nhật đánh giá đã có
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (isReviewExpired(order)) {
      toast.error("Đơn hàng đã quá thời hạn 7 ngày kể từ khi mua hàng để gửi hoặc chỉnh sửa đánh giá.");
      return;
    }
    if (!reviewForm.comment.trim()) {
      toast.warning("Vui lòng nhập cảm nhận của bạn về món này!");
      return;
    }

    try {
      setSubmittingReview(true);

      if (reviewModalMode === "edit") {
        const payload = {
          rating: reviewForm.rating,
          comment: reviewForm.comment.trim(),
        };

        const updatedReview = await updateReview(editingReviewId, payload);
        const updatedData = updatedReview?.data || updatedReview;

        toast.success("Cập nhật đánh giá thành công!");
        setOrderReviews((prev) =>
          prev.map((r) => (r.id === updatedData.id ? updatedData : r))
        );
      } else {
        const payload = {
          orderId: order.id,
          productId: reviewingItem.productId,
          productVariantId: reviewingItem.variantId,
          rating: reviewForm.rating,
          comment: reviewForm.comment.trim(),
        };

        const newReview = await createReview(payload);
        const createdData = newReview?.data || newReview;

        toast.success("Cảm ơn bạn đã gửi đánh giá cho món ăn!");
        setOrderReviews((prev) => [...prev, createdData]);
      }

      handleCloseReviewModal();
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data ||
        "Không thể hoàn tất thao tác đánh giá lúc này.";
      toast.error(message);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <section className="user-account-content">
        <p className="user-account-muted">Đang tải chi tiết đơn hàng...</p>
      </section>
    );
  }

  if (!order) {
    return (
      <section className="user-account-content">
        <div className="user-account-empty">
          <p>Không tìm thấy thông tin đơn hàng.</p>
          <Link to="/account/orders">Quay lại danh sách đơn hàng</Link>
        </div>
      </section>
    );
  }

  const isCompletedOrder = order.status === "Completed";

  return (
    <section className="user-account-content">
      <div className="user-account-detail-head">
        <div>
          <h2>Đơn hàng #{order.code}</h2>
          <p className="user-account-muted">
            Ngày đặt: {formatDate(order.createdAt)}
          </p>
        </div>

        <span className={`user-account-badge ${statusClass}`}>
          {statusLabel}
        </span>
      </div>

      {order.status === "Pending" && (
        <div className="user-account-cancel-area">
          <button type="button" onClick={handleCancelOrder}>
            Hủy đơn hàng
          </button>
        </div>
      )}

      <div className="user-account-info-grid">
        <div className="user-account-info-card">
          <h3>ĐỊA CHỈ GIAO HÀNG</h3>
          <p className="user-account-uppercase">{order.fullName}</p>
          <p>
            <strong>Địa chỉ:</strong> {order.address}
          </p>
          <p>
            <strong>Số điện thoại:</strong> {order.phone}
          </p>
        </div>

        <div className="user-account-info-card">
          <h3>THANH TOÁN</h3>
          <p>{getPaymentLabel(order.paymentMethod)}</p>
        </div>

        <div className="user-account-info-card">
          <h3>GHI CHÚ</h3>
          <p>{order.note || "Không có ghi chú"}</p>
        </div>
      </div>

      <div className="user-account-product-list">
        <div className="user-account-product-title">DANH SÁCH SẢN PHẨM</div>

        <table>
          <thead>
            <tr>
              <th>Sản phẩm</th>
              <th>Đơn giá</th>
              <th>Số lượng</th>
              <th>Tổng</th>
              {isCompletedOrder && <th>Đánh giá</th>}
            </tr>
          </thead>

          <tbody>
            {(order.items || []).map((item) => {
              const imageUrl = getImageUrl(item.image);
              const existingReview = orderReviews.find(
                (r) => Number(r.productId) === Number(item.productId)
              );

              return (
                <tr key={`${item.variantId}-${item.productId}`}>
                  <td>
                    <div className="user-account-product-cell">
                      {imageUrl ? (
                        <img src={imageUrl} alt={item.productName} />
                      ) : (
                        <div className="user-account-product-placeholder">
                          Nex
                        </div>
                      )}

                      <div>
                        <strong>{item.productName}</strong>
                        {item.size && <p>Size {item.size}</p>}
                      </div>
                    </div>
                  </td>

                  <td>{formatCurrency(item.unitPrice)}</td>
                  <td>{item.quantity}</td>
                  <td className="user-account-line-total">
                    {formatCurrency(item.lineTotal || item.totalPrice)}
                  </td>

                  {/* Cột đánh giá cho từng món khi đơn đã hoàn thành */}
                  {isCompletedOrder && (
                    <td>
                      {existingReview ? (
                        <div className="review-cell-done">
                          <div className="review-badge-row">
                            <span
                              className="badge-reviewed"
                              title={`Bạn đã chấm ${existingReview.rating} sao: "${existingReview.comment}"`}
                            >
                              <FaCheckCircle />
                              <span>{existingReview.rating}</span>
                              <FaStar className="star-icon" />
                            </span>
                            {existingReview.isEdited && (
                              <span className="review-edited-tag">
                                Đã chỉnh sửa
                              </span>
                            )}
                          </div>

                          <span className="review-date-caption">
                            {formatDate(existingReview.createdAt)}
                          </span>

                          {/* Nút sửa đánh giá: chỉ hiển thị khi chưa sửa lần nào và chưa quá 7 ngày */}
                          {!existingReview.isEdited && !isReviewExpired(order) && (
                            <button
                              type="button"
                              className="btn-edit-review"
                              onClick={() => handleOpenEditReviewModal(item, existingReview)}
                              title="Chỉnh sửa đánh giá (mỗi đánh giá chỉ được sửa 1 lần duy nhất)"
                            >
                              <FaEdit className="edit-icon" />
                              <span>Sửa đánh giá</span>
                            </button>
                          )}
                        </div>
                      ) : isReviewExpired(order) ? (
                        <span
                          className="badge-expired-review"
                          title="Đã quá thời hạn 7 ngày kể từ ngày mua hàng (hết hạn gửi đánh giá)"
                        >
                          Hết hạn
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="btn-open-review"
                          onClick={() => handleOpenReviewModal(item)}
                          title={`Còn ${getReviewRemainingDays(order)} ngày để đánh giá`}
                        >
                          <FaStar />
                          <span>Đánh giá</span>
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="user-account-totals">
        <div>
          <div>
            <span>Tạm tính:</span>
            <strong>{formatCurrency(order.subtotal)}</strong>
          </div>

          <div>
            <span>Phí ship:</span>
            <strong>
              {Number(order.shipping || 0) > 0
                ? formatCurrency(order.shipping)
                : "Miễn phí"}
            </strong>
          </div>

          {Number(order.discount || 0) > 0 && (
            <div>
              <span>Giảm giá:</span>
              <strong>-{formatCurrency(order.discount)}</strong>
            </div>
          )}

          <div className="user-account-grand-total">
            <span>Tổng cộng</span>
            <strong>{formatCurrency(order.total)}</strong>
          </div>
        </div>
      </div>

      {/* MODAL POPUP ĐÁNH GIÁ MÓN NƯỚC (Mount vào document.body tránh bị giới hạn bới layout/transform) */}
      {reviewingItem &&
        createPortal(
          <div className="review-modal-backdrop" onClick={handleCloseReviewModal}>
            <div
              className="review-modal-card"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="review-modal-head">
                <h3>
                  {reviewModalMode === "edit"
                    ? "Chỉnh Sửa Đánh Giá Món"
                    : "Đánh Giá Món Uống"}
                </h3>
                <button
                  type="button"
                  className="btn-close-modal"
                  onClick={handleCloseReviewModal}
                  aria-label="Đóng cửa sổ đánh giá"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="review-product-preview">
                {reviewingItem.image ? (
                  <img
                    src={getImageUrl(reviewingItem.image)}
                    alt={reviewingItem.productName}
                  />
                ) : (
                  <div className="review-product-placeholder">Nex</div>
                )}
                <div className="review-product-info">
                  <strong>{reviewingItem.productName}</strong>
                  <span>
                    {reviewingItem.size ? `Size ${reviewingItem.size}` : "Mặc định"}
                  </span>
                </div>
              </div>

              <div className="review-order-meta-info">
                <div className="meta-info-row">
                  <span>
                    <FaCalendarAlt className="meta-icon" /> Ngày đặt hàng:
                  </span>
                  <strong>{formatDate(order.createdAt)}</strong>
                </div>
                <div className="meta-info-row meta-expiry-hint">
                  <span>
                    <FaClock className="meta-icon" /> Thời hạn đánh giá:
                  </span>
                  <span>
                    {reviewModalMode === "edit"
                      ? `Mỗi món chỉ được sửa 1 lần duy nhất (còn ${getReviewRemainingDays(order)} ngày)`
                      : `Trong 7 ngày kể từ khi mua (còn ${getReviewRemainingDays(order)} ngày)`}
                  </span>
                </div>
              </div>

              <form onSubmit={handleSubmitReview}>
                <div className="review-stars-select">
                  <label>Chất lượng món thế nào?</label>
                  <div className="stars-picker">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        className={`star-btn ${
                          (hoverStar || reviewForm.rating) >= star ? "active" : ""
                        }`}
                        onMouseEnter={() => setHoverStar(star)}
                        onMouseLeave={() => setHoverStar(0)}
                        onClick={() =>
                          setReviewForm((prev) => ({ ...prev, rating: star }))
                        }
                        aria-label={`${star} sao`}
                      >
                        <FaStar />
                      </button>
                    ))}
                  </div>
                  <span className="rating-text-hint">
                    {RATING_HINTS[hoverStar || reviewForm.rating]}
                  </span>
                </div>

                <div className="review-textarea-group">
                  <div className="review-textarea-header">
                    <label htmlFor="review-comment">Cảm nhận thực tế của bạn:</label>
                    <span
                      className={`review-char-counter ${
                        reviewForm.comment.length >= 280 ? "limit-near" : ""
                      }`}
                    >
                      {reviewForm.comment.length} / 300 ký tự
                    </span>
                  </div>
                  <textarea
                    id="review-comment"
                    value={reviewForm.comment}
                    maxLength={300}
                    onChange={(e) =>
                      setReviewForm((prev) => ({
                        ...prev,
                        comment: e.target.value,
                      }))
                    }
                    placeholder="Hãy chia sẻ về hương vị, độ ngọt, độ béo hoặc cách phục vụ... (hỗ trợ xuống dòng)"
                    rows="4"
                    required
                  />
                </div>

                <div className="review-modal-actions">
                  <button
                    type="button"
                    className="btn-modal-cancel"
                    onClick={handleCloseReviewModal}
                    disabled={submittingReview}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="btn-modal-submit"
                    disabled={submittingReview}
                  >
                    {submittingReview
                      ? "Đang lưu..."
                      : reviewModalMode === "edit"
                        ? "Cập Nhật Đánh Giá"
                        : "Gửi Đánh Giá"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </section>
  );
};

export default UserAccountOrderDetail;
