import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FaStar,
  FaCoffee,
  FaStore,
  FaCheckCircle,
  FaSearch,
  FaTimes,
  FaArrowRight,
  FaCalendarAlt,
  FaEdit,
  FaClock,
} from "react-icons/fa";
import {
  getAllReviews,
  getFeaturedReviews,
  updateReview,
} from "../../../apis/reviewApi";
import { getCurrentUser } from "../../../utils/authStorage";
import "./UserAccount.css";

const BACKEND_URL = "http://localhost:8080";

const getImageUrl = (imagePath) => {
  if (!imagePath) return "";
  if (imagePath.startsWith("http")) return imagePath;
  if (imagePath.startsWith("/images")) return `${BACKEND_URL}${imagePath}`;
  if (imagePath.startsWith("images")) return `${BACKEND_URL}/${imagePath}`;
  return `${BACKEND_URL}/images/${imagePath}`;
};

const formatDate = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const isReviewExpired = (review) => {
  if (!review) return true;
  const baseTimeStr = review.orderCreatedAt || review.createdAt;
  if (!baseTimeStr) return false;
  const baseTime = new Date(baseTimeStr);
  const now = new Date();
  const diffInDays = (now - baseTime) / (1000 * 60 * 60 * 24);
  return diffInDays > 7;
};

const getReviewRemainingDays = (review) => {
  if (!review) return 0;
  const baseTimeStr = review.orderCreatedAt || review.createdAt;
  if (!baseTimeStr) return 0;
  const baseTime = new Date(baseTimeStr);
  const deadline = new Date(baseTime.getTime() + 7 * 24 * 60 * 60 * 1000);
  const now = new Date();
  const diffMs = deadline - now;
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
};

const RATING_HINTS = {
  1: "Tệ",
  2: "Chưa hài lòng",
  3: "Bình thường",
  4: "Rất ngon & hài lòng",
  5: "Tuyệt vời, chuẩn vị!",
};

const RATING_TABS = [
  { key: "ALL", label: "Tất cả đánh giá" },
  { key: "MY", label: "Đánh giá của tôi" },
  { key: "5", label: "5 sao ★★★★★" },
  { key: "4", label: "4 sao ★★★★" },
  { key: "3", label: "3 sao ★★★" },
  { key: "2", label: "2 sao ★★" },
  { key: "1", label: "1 sao ★" },
];

const UserAccountReviews = () => {
  const [currentUser] = useState(() => getCurrentUser());
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeRating, setActiveRating] = useState("ALL");
  const [keyword, setKeyword] = useState("");

  // State modal chỉnh sửa đánh giá
  const [editingReview, setEditingReview] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [hoverStar, setHoverStar] = useState(0);
  const [submittingReview, setSubmittingReview] = useState(false);

  // State modal xem toàn văn đánh giá dài
  const [readingReview, setReadingReview] = useState(null);

  // Khóa cuộn trang khi mở modal, giải phóng khi đóng
  useEffect(() => {
    if (editingReview || readingReview) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [editingReview, readingReview]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      let data = [];
      const ratingParam =
        activeRating === "ALL" || activeRating === "MY"
          ? null
          : Number(activeRating);

      try {
        data = await getAllReviews(ratingParam, 0, 100);
      } catch (err) {
        // Fallback tự động lấy danh sách review featured nếu server chưa restart endpoint mới
        const featResponse = await getFeaturedReviews(50);
        data = Array.isArray(featResponse?.reviews)
          ? featResponse.reviews
          : Array.isArray(featResponse)
            ? featResponse
            : [];

        if (ratingParam) {
          data = data.filter((r) => Number(r.rating) === ratingParam);
        }
      }
      setReviews(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error("Không thể tải danh sách đánh giá.");
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    fetchReviews();
  }, [activeRating]);

  // Mở modal sửa đánh giá
  const handleOpenEditReviewModal = (review) => {
    setEditingReview(review);
    setReviewForm({
      rating: review.rating || 5,
      comment: review.comment || "",
    });
    setHoverStar(0);
  };

  const handleCloseEditModal = () => {
    setEditingReview(null);
    setReviewForm({ rating: 5, comment: "" });
    setHoverStar(0);
  };

  // Submit cập nhật đánh giá
  const handleSubmitEditReview = async (e) => {
    e.preventDefault();
    if (!editingReview) return;

    if (isReviewExpired(editingReview)) {
      toast.error("Đã quá thời hạn 7 ngày kể từ khi mua hàng để chỉnh sửa đánh giá.");
      return;
    }

    if (!reviewForm.comment.trim()) {
      toast.warning("Vui lòng nhập nhận xét của bạn!");
      return;
    }

    try {
      setSubmittingReview(true);
      const payload = {
        rating: reviewForm.rating,
        comment: reviewForm.comment.trim(),
      };

      const updated = await updateReview(editingReview.id, payload);
      const updatedData = updated?.data || updated;

      toast.success("Cập nhật đánh giá thành công!");

      // Cập nhật lại danh sách đánh giá ngay lập tức
      setReviews((prev) =>
        prev.map((r) =>
          r.id === updatedData.id
            ? { ...r, ...updatedData, isEdited: true }
            : r
        )
      );

      handleCloseEditModal();
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data ||
        "Không thể cập nhật đánh giá lúc này.";
      toast.error(message);
    } finally {
      setSubmittingReview(false);
    }
  };

  // Lọc đánh giá theo từ khóa tìm kiếm và tab
  const filteredReviews = useMemo(() => {
    let result = reviews;

    if (activeRating === "MY") {
      result = result.filter(
        (item) => currentUser && Number(currentUser.id) === Number(item.userId)
      );
    }

    const trimmed = keyword.trim().toLowerCase();
    if (!trimmed) return result;

    return result.filter((item) => {
      const matchProduct = String(item.productName || "")
        .toLowerCase()
        .includes(trimmed);
      const matchStore = String(item.storeName || "")
        .toLowerCase()
        .includes(trimmed);
      const matchComment = String(item.comment || "")
        .toLowerCase()
        .includes(trimmed);
      const matchUser = String(item.userFullName || "")
        .toLowerCase()
        .includes(trimmed);

      return matchProduct || matchStore || matchComment || matchUser;
    });
  }, [reviews, keyword, activeRating, currentUser]);

  return (
    <section className="user-account-reviews-page">
      {/* Header trang đánh giá khách hàng */}
      <div className="orders-page-header">
        <div className="orders-title-wrap">
          <h2 className="orders-title">Đánh giá của khách hàng</h2>
          <p className="orders-subtitle">
            Khám phá cảm nhận chân thực từ những khách hàng đã trải nghiệm đồ uống tại NexCoffee
          </p>
        </div>

        {/* Ô tìm kiếm đánh giá */}
        <div className="orders-search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            value={keyword}
            placeholder="Tìm theo tên món, tên quán hoặc lời bình..."
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

      {/* Thanh lọc số sao thiết kế giống danh mục menu, phân cách nhau bằng border */}
      <div className="orders-status-tabs-wrap">
        <div className="orders-status-filter-bar">
          {RATING_TABS.map((tab) => {
            const isActive = activeRating === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                className={`menu-category-btn orders-filter-tab-btn ${
                  isActive ? "active" : ""
                }`}
                onClick={() => setActiveRating(tab.key)}
              >
                <span className="tab-label">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Danh sách các card đánh giá của khách hàng */}
      <div className="customer-reviews-container">
        {loading ? (
          <div className="customer-reviews-skeleton-list">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="customer-review-skeleton-card">
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
        ) : filteredReviews.length === 0 ? (
          <div className="orders-empty-state">
            <div className="empty-icon-wrap">
              <FaCoffee className="empty-coffee-icon" />
            </div>
            <h3>Không tìm thấy đánh giá nào</h3>
            <p>
              {keyword
                ? `Không có đánh giá nào khớp với từ khóa "${keyword}".`
                : activeRating !== "ALL"
                  ? `Chưa có đánh giá nào ở mức ${activeRating} sao.`
                  : "Chưa có đánh giá nào từ khách hàng trong hệ thống."}
            </p>
            <Link to="/menu" className="btn-explore-menu">
              <span>Khám phá thực đơn ngay</span>
            </Link>
          </div>
        ) : (
          <div className="customer-reviews-grid">
            {filteredReviews.map((review) => {
              const targetProductId = review.productId;

              return (
                <Link
                  key={review.id}
                  to={targetProductId ? `/products/${targetProductId}` : "/menu"}
                  className="customer-review-card-link"
                  title={`Bấm để xem sản phẩm ${review.productName}`}
                >
                  <article className="customer-review-card">
                    {/* Header: Sản phẩm được đánh giá */}
                    <div className="review-card-product-head">
                      <div className="review-product-thumb-wrap">
                        {review.productImage ? (
                          <img
                            src={getImageUrl(review.productImage)}
                            alt={review.productName}
                            className="review-product-thumb"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="review-product-placeholder">
                            <FaCoffee />
                          </div>
                        )}
                      </div>

                      <div className="review-product-info">
                        <strong className="review-product-name">
                          {review.productName}
                        </strong>
                        <div className="review-product-meta-tags">
                          {review.variantSize && (
                            <span className="review-variant-pill">
                              Size {review.variantSize}
                            </span>
                          )}
                          <span className="review-category-pill">
                            {review.categoryName || "NexCoffee"}
                          </span>
                        </div>
                      </div>

                      <div className="review-goto-badge">
                        <span>Xem sản phẩm</span>
                        <FaArrowRight className="goto-icon" />
                      </div>
                    </div>

                    {/* Body: Sao rating, người đánh giá & comment */}
                    <div className="review-card-content">
                      <div className="review-user-and-stars-row">
                        <div className="review-stars-list">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <FaStar
                              key={star}
                              className={`review-star-icon ${
                                star <= review.rating ? "active" : "empty"
                              }`}
                            />
                          ))}
                        </div>

                        <span className="review-author-name">
                          {currentUser && Number(currentUser.id) === Number(review.userId)
                            ? "Bạn"
                            : review.userFullName || "Khách hàng"}
                        </span>

                        <span className="review-verified-tag">
                          <FaCheckCircle className="verified-icon" />
                          <span>Đã mua tại quán</span>
                        </span>

                        {currentUser && Number(currentUser.id) === Number(review.userId) && (
                          <span className="review-my-tag">
                            Đánh giá của bạn
                          </span>
                        )}

                        {review.isEdited && (
                          <span className="review-edited-tag">
                            Đã chỉnh sửa
                          </span>
                        )}

                        {/* Nút chỉnh sửa đánh giá: chỉ hiển thị cho đánh giá của chính user, chưa sửa lần nào và còn trong hạn 7 ngày */}
                        {currentUser &&
                          Number(currentUser.id) === Number(review.userId) &&
                          !review.isEdited &&
                          !isReviewExpired(review) && (
                            <button
                              type="button"
                              className="btn-card-edit-review"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleOpenEditReviewModal(review);
                              }}
                              title="Chỉnh sửa đánh giá (mỗi đánh giá chỉ được sửa 1 lần duy nhất)"
                            >
                              <FaEdit className="edit-icon" />
                              <span>Sửa đánh giá</span>
                            </button>
                          )}
                      </div>

                      {/* Nội dung đánh giá */}
                      {review.status === "HIDDEN" || review.isContentHidden ? (
                        <div className="review-card-hidden-notice">
                          <span className="hidden-tag">Nội dung gốc đã bị ẩn:</span>
                          <span className="hidden-reason">&ldquo;{review.comment}&rdquo;</span>
                        </div>
                      ) : (
                        <div className="review-card-comment-wrap">
                          <p
                            className={`review-card-comment ${
                              (review.comment || "").length > 90 ||
                              (review.comment || "").includes("\n")
                                ? "review-card-comment--clamped"
                                : ""
                            }`}
                          >
                            &ldquo;{review.comment}&rdquo;
                          </p>
                          {((review.comment || "").length > 90 ||
                            (review.comment || "").includes("\n")) && (
                            <button
                              type="button"
                              className="btn-card-read-more"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setReadingReview(review);
                              }}
                              title="Xem toàn văn cảm nhận"
                            >
                              <span>Xem thêm</span>
                              <FaArrowRight style={{ fontSize: "0.68rem", marginLeft: 4 }} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Footer: Quán phục vụ và ngày tháng */}
                    <div className="review-card-foot">
                      <div className="review-foot-store">
                        <FaStore className="store-icon" />
                        <span>{review.storeName || "NexCoffee"}</span>
                      </div>

                      <div className="review-foot-dates">
                        {review.orderCreatedAt && (
                          <span className="review-date-order">
                            <FaCalendarAlt className="date-icon" /> Đặt: {formatDate(review.orderCreatedAt)}
                          </span>
                        )}
                        <span className="review-date-posted">
                          Đánh giá: {formatDate(review.createdAt)}
                        </span>
                      </div>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL POPUP CHỈNH SỬA ĐÁNH GIÁ MÓN NƯỚC (Mount trực tiếp vào document.body tránh bị giới hạn bới transform / layout) */}
      {editingReview &&
        createPortal(
          <div className="review-modal-backdrop" onClick={handleCloseEditModal}>
            <div
              className="review-modal-card"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="review-modal-head">
                <h3>Chỉnh Sửa Đánh Giá Món</h3>
                <button
                  type="button"
                  className="btn-close-modal"
                  onClick={handleCloseEditModal}
                  aria-label="Đóng cửa sổ chỉnh sửa đánh giá"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="review-product-preview">
                {editingReview.productImage ? (
                  <img
                    src={getImageUrl(editingReview.productImage)}
                    alt={editingReview.productName}
                  />
                ) : (
                  <div className="review-product-placeholder">
                    <FaCoffee />
                  </div>
                )}
                <div className="review-product-info">
                  <strong>{editingReview.productName}</strong>
                  <span>
                    {editingReview.variantSize
                      ? `Size ${editingReview.variantSize}`
                      : "Mặc định"}
                  </span>
                </div>
              </div>

              <div className="review-order-meta-info">
                {editingReview.orderCreatedAt && (
                  <div className="meta-info-row">
                    <span>
                      <FaCalendarAlt className="meta-icon" /> Ngày đặt hàng:
                    </span>
                    <strong>{formatDate(editingReview.orderCreatedAt)}</strong>
                  </div>
                )}
                <div className="meta-info-row meta-expiry-hint">
                  <span>
                    <FaClock className="meta-icon" /> Thời hạn chỉnh sửa:
                  </span>
                  <span>
                    Mỗi món chỉ được sửa 1 lần duy nhất (còn {getReviewRemainingDays(editingReview)} ngày)
                  </span>
                </div>
              </div>

              <form onSubmit={handleSubmitEditReview}>
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
                    <label htmlFor="review-edit-comment">Cảm nhận thực tế của bạn:</label>
                    <span
                      className={`review-char-counter ${
                        reviewForm.comment.length >= 280 ? "limit-near" : ""
                      }`}
                    >
                      {reviewForm.comment.length} / 300 ký tự
                    </span>
                  </div>
                  <textarea
                    id="review-edit-comment"
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
                    onClick={handleCloseEditModal}
                    disabled={submittingReview}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="btn-modal-submit"
                    disabled={submittingReview}
                  >
                    {submittingReview ? "Đang lưu..." : "Cập Nhật Đánh Giá"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* MODAL XEM CHI TIẾT ĐÁNH GIÁ DÀI */}
      {readingReview &&
        createPortal(
          <div
            className="review-modal-backdrop"
            onClick={() => setReadingReview(null)}
          >
            <div
              className="review-modal-card reading-modal-card"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="review-modal-head">
                <h3>Chi Tiết Nhận Xét</h3>
                <button
                  type="button"
                  className="btn-close-modal"
                  onClick={() => setReadingReview(null)}
                  aria-label="Đóng cửa sổ"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="review-product-preview">
                {readingReview.productImage ? (
                  <img
                    src={getImageUrl(readingReview.productImage)}
                    alt={readingReview.productName}
                  />
                ) : (
                  <div className="review-product-placeholder">
                    <FaCoffee />
                  </div>
                )}
                <div className="review-product-info">
                  <strong>{readingReview.productName}</strong>
                  <span>
                    {readingReview.variantSize
                      ? `Size ${readingReview.variantSize}`
                      : "Mặc định"}
                  </span>
                </div>
              </div>

              <div className="reading-modal-meta">
                <div className="reading-modal-stars">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <FaStar
                      key={s}
                      className={`review-star-icon ${
                        s <= (readingReview.rating || 0) ? "active" : "empty"
                      }`}
                    />
                  ))}
                </div>
                <span className="reading-modal-author">
                  Người đánh giá:{" "}
                  <strong>
                    {currentUser && Number(currentUser.id) === Number(readingReview.userId)
                      ? "Bạn"
                      : readingReview.userFullName || "Khách hàng"}
                  </strong>
                </span>
                <span className="reading-modal-date">
                  {formatDate(readingReview.createdAt)}
                </span>
              </div>

              <div className="reading-modal-comment-box">
                <p className="reading-modal-comment-text">
                  &ldquo;{readingReview.comment}&rdquo;
                </p>
              </div>

              <div className="review-modal-actions">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  style={{ width: "100%" }}
                  onClick={() => setReadingReview(null)}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </section>
  );
};

export default UserAccountReviews;
