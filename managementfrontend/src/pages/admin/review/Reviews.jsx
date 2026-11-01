import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { getAdminReviews, toggleReviewStatus } from "../../../apis/reviewApi";
import DataTable from "../../../components/admin/dataTable/DataTable";
import SearchBox from "../../../components/admin/searchBox/SearchBox";
import "./Reviews.css";

const PRESET_HIDE_REASONS = [
  "Nội dung thô tục, xúc phạm hoặc bôi nhọ",
  "Nội dung spam hoặc quảng cáo sản phẩm khác",
  "Thông tin sai lệch, không đúng thực tế",
  "Đánh giá không liên quan đến sản phẩm",
  "Chứa thông tin cá nhân nhạy cảm",
];

const Reviews = () => {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [ratingFilter, setRatingFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modal Ẩn đánh giá
  const [hideModalOpen, setHideModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [selectedPresetReason, setSelectedPresetReason] = useState(PRESET_HIDE_REASONS[0]);
  const [customReason, setCustomReason] = useState("");
  const [submittingHide, setSubmittingHide] = useState(false);

  // Modal Xem nội dung gốc của đánh giá bị ẩn
  const [viewingRawReview, setViewingRawReview] = useState(null);

  // Modal Xem chi tiết đánh giá dài (đang hiển thị)
  const [viewingDetailReview, setViewingDetailReview] = useState(null);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const data = await getAdminReviews();
      setReviews(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Lỗi khi tải danh sách đánh giá:", error);
      toast.error("Không thể tải danh sách đánh giá.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  // Thống kê nhanh
  const stats = useMemo(() => {
    const total = reviews.length;
    const active = reviews.filter((r) => r.status !== "HIDDEN").length;
    const hidden = reviews.filter((r) => r.status === "HIDDEN").length;
    const totalScore = reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
    const avg = total > 0 ? (totalScore / total).toFixed(1) : "0.0";
    return { total, active, hidden, avg };
  }, [reviews]);

  // Bộ lọc dữ liệu phía client
  const filteredReviews = useMemo(() => {
    return reviews.filter((item) => {
      // Lọc theo rating
      if (ratingFilter !== "ALL" && item.rating !== Number(ratingFilter)) {
        return false;
      }
      // Lọc theo status
      if (statusFilter === "ACTIVE" && item.status === "HIDDEN") {
        return false;
      }
      if (statusFilter === "HIDDEN" && item.status !== "HIDDEN") {
        return false;
      }
      return true;
    });
  }, [reviews, ratingFilter, statusFilter]);

  // Mở modal xác nhận ẩn
  const handleOpenHideModal = (review) => {
    setSelectedReview(review);
    setSelectedPresetReason(PRESET_HIDE_REASONS[0]);
    setCustomReason("");
    setHideModalOpen(true);
  };

  // Xác nhận ẩn đánh giá
  const handleConfirmHide = async () => {
    if (!selectedReview) return;
    const finalReason = customReason.trim() || selectedPresetReason;
    setSubmittingHide(true);
    try {
      await toggleReviewStatus(selectedReview.id, finalReason);
      toast.success("Đã ẩn nội dung đánh giá thành công.");
      setHideModalOpen(false);
      setSelectedReview(null);
      fetchReviews();
    } catch (error) {
      console.error("Lỗi khi ẩn đánh giá:", error);
      toast.error("Không thể ẩn đánh giá. Vui lòng thử lại!");
    } finally {
      setSubmittingHide(false);
    }
  };

  // Khôi phục hiển thị đánh giá
  const handleRestoreReview = async (review) => {
    if (!window.confirm("Bạn có chắc chắn muốn khôi phục hiển thị cho đánh giá này?")) {
      return;
    }
    try {
      await toggleReviewStatus(review.id, "");
      toast.success("Đã khôi phục hiển thị đánh giá thành công.");
      fetchReviews();
    } catch (error) {
      console.error("Lỗi khi khôi phục đánh giá:", error);
      toast.error("Không thể khôi phục đánh giá!");
    }
  };

  // Cấu hình bảng DataTable với kích thước cột rõ ràng
  const columns = [
    {
      header: "ID",
      accessor: "id",
      width: "55px",
      style: { width: "55px", textAlign: "center" },
    },
    {
      header: "Khách hàng",
      accessor: "userName",
      width: "160px",
      style: { width: "160px" },
      render: (row) => (
        <div className="review-user-cell">
          <Link
            to={`/admin/users/${row.userId}`}
            className="review-user-name"
            title={`Xem hồ sơ ${row.userName || 'khách hàng'}`}
          >
            <span>{row.userName || `Khách #${row.userId}`}</span>
            <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: "11px" }}></i>
          </Link>
          <span className="review-user-email">ID #{row.userId}</span>
        </div>
      ),
    },
    {
      header: "Sản phẩm",
      accessor: "productName",
      width: "180px",
      style: { width: "180px" },
      render: (row) => (
        <div className="review-product-cell">
          {row.productImageUrl && (
            <img
              src={row.productImageUrl}
              alt={row.productName}
              className="review-product-thumb"
            />
          )}
          <span className="review-product-name" title={row.productName}>
            {row.productName}
          </span>
        </div>
      ),
    },
    {
      header: "Đánh giá",
      accessor: "rating",
      width: "110px",
      style: { width: "110px", textAlign: "center" },
      render: (row) => (
        <div className="review-stars">
          {[1, 2, 3, 4, 5].map((star) => (
            <i
              key={star}
              className={
                star <= (row.rating || 0)
                  ? "fa-solid fa-star"
                  : "fa-regular fa-star"
              }
            ></i>
          ))}
        </div>
      ),
    },
    {
      header: "Nội dung nhận xét",
      accessor: "comment",
      width: "auto",
      style: {
        width: "auto",
        whiteSpace: "normal",
        overflow: "visible",
        textOverflow: "clip",
        maxWidth: "none",
      },
      render: (row) => {
        const isHidden = row.status === "HIDDEN";
        const commentText = row.comment || "";
        const isLong = commentText.length > 90 || commentText.includes("\n");

        return (
          <div className="review-content-box">
            {isHidden ? (
              <div className="review-hidden-summary">
                <div className="review-hidden-line">
                  <span className="review-hidden-label">
                    <i className="fa-solid fa-eye-slash"></i> Đã ẩn:
                  </span>
                  <span className="review-hidden-reason-text">
                    &ldquo;{commentText}&rdquo;
                  </span>
                </div>
                <button
                  type="button"
                  className="btn-view-raw-review"
                  onClick={() => setViewingRawReview(row)}
                  title={`Xem toàn văn nội dung gốc của ${row.userName || 'khách hàng'}`}
                >
                  <i className="fa-regular fa-eye"></i>
                  <span>Xem nội dung gốc</span>
                </button>
              </div>
            ) : (
              <div className="review-comment-wrap">
                <div
                  className={`review-comment-text ${
                    isLong ? "review-comment-text--clamped" : ""
                  }`}
                >
                  &ldquo;{commentText}&rdquo;
                </div>
                {isLong && (
                  <button
                    type="button"
                    className="btn-review-read-more"
                    onClick={() => setViewingDetailReview(row)}
                    title="Xem chi tiết toàn văn nhận xét"
                  >
                    <span>Xem thêm</span>
                    <i className="fa-solid fa-chevron-right"></i>
                  </button>
                )}
              </div>
            )}
            {row.isEdited && (
              <span className="review-badge-edited">
                <i className="fa-solid fa-pen-nib" style={{ marginRight: 4 }}></i>
                Đã chỉnh sửa
              </span>
            )}
          </div>
        );
      },
    },
    {
      header: "Thời gian",
      accessor: "createdAt",
      width: "125px",
      style: { width: "125px", textAlign: "center" },
      render: (row) => {
        if (!row.createdAt) return "—";
        const date = new Date(row.createdAt);
        return (
          <div className="review-time-cell">
            <span className="review-time-date">
              {date.toLocaleDateString("vi-VN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
            </span>
            <span className="review-time-hour">
              {date.toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        );
      },
    },
    {
      header: "Trạng thái",
      accessor: "status",
      width: "115px",
      style: { width: "115px", textAlign: "center" },
      render: (row) => {
        const isHidden = row.status === "HIDDEN";
        return (
          <span
            className={`review-status-badge ${
              isHidden ? "review-status-badge--hidden" : "review-status-badge--active"
            }`}
          >
            <i
              className={
                isHidden
                  ? "fa-solid fa-circle-exclamation"
                  : "fa-solid fa-circle-check"
              }
            ></i>
            {isHidden ? "Đã ẩn" : "Hiển thị"}
          </span>
        );
      },
    },
    {
      header: "Thao tác",
      accessor: "actions",
      width: "95px",
      style: { width: "95px", textAlign: "center" },
      render: (row) => {
        const isHidden = row.status === "HIDDEN";
        return (
          <div className="reviews-actions">
            {isHidden ? (
              <button
                type="button"
                className="btn-icon-action btn-icon-action--show"
                title="Khôi phục hiển thị đánh giá"
                onClick={() => handleRestoreReview(row)}
              >
                <i className="fa-solid fa-rotate-left"></i>
              </button>
            ) : (
              <button
                type="button"
                className="btn-icon-action btn-icon-action--hide"
                title="Ẩn nội dung không phù hợp"
                onClick={() => handleOpenHideModal(row)}
              >
                <i className="fa-solid fa-eye-slash"></i>
              </button>
            )}
            <button
              type="button"
              className="btn-icon-action btn-icon-action--user"
              title="Xem trang chi tiết khách hàng"
              onClick={() => navigate(`/admin/users/${row.userId}`)}
            >
              <i className="fa-solid fa-user-gear"></i>
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="reviews-management">
      <div className="reviews-header">
        <h2 className="reviews-header__title">
          Quản lý đánh giá sản phẩm
        </h2>
      </div>

      {/* Thẻ thống kê */}
      <div className="reviews-stats">
        <div className="reviews-stat-card">
          <div className="reviews-stat-icon reviews-stat-icon--total">
            <i className="fa-solid fa-comments"></i>
          </div>
          <div className="reviews-stat-info">
            <span className="reviews-stat-label">Tổng đánh giá</span>
            <span className="reviews-stat-value">{stats.total}</span>
          </div>
        </div>

        <div className="reviews-stat-card">
          <div className="reviews-stat-icon reviews-stat-icon--active">
            <i className="fa-solid fa-check"></i>
          </div>
          <div className="reviews-stat-info">
            <span className="reviews-stat-label">Đang hiển thị</span>
            <span className="reviews-stat-value">{stats.active}</span>
          </div>
        </div>

        <div className="reviews-stat-card">
          <div className="reviews-stat-icon reviews-stat-icon--hidden">
            <i className="fa-solid fa-eye-slash"></i>
          </div>
          <div className="reviews-stat-info">
            <span className="reviews-stat-label">Đã ẩn nội dung</span>
            <span className="reviews-stat-value">{stats.hidden}</span>
          </div>
        </div>

        <div className="reviews-stat-card">
          <div className="reviews-stat-icon reviews-stat-icon--avg">
            <i className="fa-solid fa-star"></i>
          </div>
          <div className="reviews-stat-info">
            <span className="reviews-stat-label">Điểm trung bình</span>
            <span className="reviews-stat-value">{stats.avg} / 5.0</span>
          </div>
        </div>
      </div>

      {/* Thanh công cụ tìm kiếm và lọc */}
      <div className="reviews-toolbar">
        <SearchBox
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tìm theo tên khách, sản phẩm, nội dung..."
        />

        <div className="reviews-filters">
          <select
            className="reviews-filter-select"
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
          >
            <option value="ALL">Tất cả số sao</option>
            <option value="5">5 sao</option>
            <option value="4">4 sao</option>
            <option value="3">3 sao</option>
            <option value="2">2 sao</option>
            <option value="1">1 sao</option>
          </select>

          <select
            className="reviews-filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hiển thị</option>
            <option value="HIDDEN">Đã ẩn nội dung</option>
          </select>
        </div>
      </div>

      {/* Bảng dữ liệu DataTable */}
      <DataTable
        columns={columns}
        data={filteredReviews}
        itemsPerPage={8}
        searchQuery={searchQuery}
      />

      {/* Modal Ẩn Đánh Giá */}
      {hideModalOpen && selectedReview && (
        <div className="modal-overlay" onClick={() => setHideModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                Ẩn nội dung đánh giá
              </h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setHideModalOpen(false)}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="modal-body">
              <div className="modal-review-preview">
                <strong>Khách hàng:</strong> {selectedReview.userName || `#${selectedReview.userId}`}
                <br />
                <strong>Sản phẩm:</strong> {selectedReview.productName}
                <br />
                <strong>Nội dung:</strong> &ldquo;{selectedReview.comment}&rdquo;
              </div>

              <p style={{ fontSize: "13px", color: "var(--text-secondary, #64748b)", marginBottom: "14px" }}>
                * Khi ẩn, nội dung gốc của khách sẽ được ẩn đi. Đánh giá vẫn hiển thị với mọi người nhưng nội dung được thay bằng chính lý do bạn chọn/nhập.
              </p>

              <div className="modal-form-group">
                <label>Lý do ẩn (chọn gợi ý):</label>
                <select
                  className="modal-select-presets"
                  value={selectedPresetReason}
                  onChange={(e) => setSelectedPresetReason(e.target.value)}
                >
                  {PRESET_HIDE_REASONS.map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-form-group">
                <label>Ghi chú lý do cụ thể (tùy chọn):</label>
                <textarea
                  className="modal-textarea"
                  placeholder="Nhập chi tiết lý do nếu cần..."
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                ></textarea>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setHideModalOpen(false)}
                disabled={submittingHide}
              >
                Hủy
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={handleConfirmHide}
                disabled={submittingHide}
              >
                {submittingHide ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i>
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-eye-slash"></i>
                    Xác nhận ẩn
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Xem Nội Dung Đánh Giá Gốc */}
      {viewingRawReview && (
        <div className="modal-overlay" onClick={() => setViewingRawReview(null)}>
          <div
            className="modal-dialog raw-review-modal-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>
                Chi tiết nội dung đánh giá gốc
              </h3>
              <button
                type="button"
                className="btn-close-modal"
                onClick={() => setViewingRawReview(null)}
                aria-label="Đóng cửa sổ"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="modal-body">
              {/* Thông tin người dùng & sản phẩm */}
              <div className="raw-modal-meta-grid">
                <div className="raw-modal-meta-item">
                  <span className="raw-modal-meta-label">Khách hàng:</span>
                  <strong className="raw-modal-meta-value">
                    {viewingRawReview.userName || `Khách hàng #${viewingRawReview.userId}`}
                  </strong>
                </div>
                <div className="raw-modal-meta-item">
                  <span className="raw-modal-meta-label">Sản phẩm:</span>
                  <strong className="raw-modal-meta-value">
                    {viewingRawReview.productName}
                  </strong>
                </div>
                <div className="raw-modal-meta-item">
                  <span className="raw-modal-meta-label">Đánh giá:</span>
                  <span className="raw-modal-meta-value review-stars" style={{ display: "inline-flex" }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <i
                        key={s}
                        className={
                          s <= (viewingRawReview.rating || 0)
                            ? "fa-solid fa-star"
                            : "fa-regular fa-star"
                        }
                      ></i>
                    ))}
                  </span>
                </div>
                <div className="raw-modal-meta-item">
                  <span className="raw-modal-meta-label">Thời gian:</span>
                  <span className="raw-modal-meta-value">
                    {viewingRawReview.createdAt
                      ? new Date(viewingRawReview.createdAt).toLocaleString("vi-VN")
                      : "—"}
                  </span>
                </div>
              </div>

              {/* Khung lý do đã ẩn */}
              <div className="raw-modal-reason-box">
                <div className="raw-modal-reason-tag">
                  <i className="fa-solid fa-eye-slash"></i>
                  Lý do đã ẩn (nội dung hiển thị với khách):
                </div>
                <div className="raw-modal-reason-text">
                  &ldquo;{viewingRawReview.comment}&rdquo;
                </div>
              </div>

              {/* Toàn văn nội dung gốc của khách */}
              <div className="raw-modal-content-group">
                <label className="raw-modal-content-label">
                  <i className="fa-solid fa-quote-left"></i> Toàn văn nội dung gốc của khách hàng:
                </label>
                <div className="raw-modal-raw-text">
                  &ldquo;{viewingRawReview.rawComment || viewingRawReview.comment}&rdquo;
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={() => setViewingRawReview(null)}
              >
                Đóng
              </button>
              <button
                type="button"
                className="btn-modal-restore-action"
                onClick={() => {
                  const rev = viewingRawReview;
                  setViewingRawReview(null);
                  handleRestoreReview(rev);
                }}
              >
                <i className="fa-solid fa-rotate-left"></i>
                Khôi phục hiển thị
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Xem Chi Tiết Đánh Giá Dài */}
      {viewingDetailReview && (
        <div className="modal-overlay" onClick={() => setViewingDetailReview(null)}>
          <div
            className="modal-dialog raw-review-modal-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>
                Chi tiết nhận xét khách hàng
              </h3>
              <button
                type="button"
                className="btn-close-modal"
                onClick={() => setViewingDetailReview(null)}
                aria-label="Đóng cửa sổ"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="modal-body">
              {/* Thông tin người dùng & sản phẩm */}
              <div className="raw-modal-meta-grid">
                <div className="raw-modal-meta-item">
                  <span className="raw-modal-meta-label">Khách hàng:</span>
                  <strong className="raw-modal-meta-value">
                    {viewingDetailReview.userName || `Khách hàng #${viewingDetailReview.userId}`}
                  </strong>
                </div>
                <div className="raw-modal-meta-item">
                  <span className="raw-modal-meta-label">Sản phẩm:</span>
                  <strong className="raw-modal-meta-value">
                    {viewingDetailReview.productName}
                  </strong>
                </div>
                <div className="raw-modal-meta-item">
                  <span className="raw-modal-meta-label">Đánh giá:</span>
                  <span className="raw-modal-meta-value review-stars" style={{ display: "inline-flex" }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <i
                        key={s}
                        className={
                          s <= (viewingDetailReview.rating || 0)
                            ? "fa-solid fa-star"
                            : "fa-regular fa-star"
                        }
                      ></i>
                    ))}
                  </span>
                </div>
                <div className="raw-modal-meta-item">
                  <span className="raw-modal-meta-label">Thời gian:</span>
                  <span className="raw-modal-meta-value">
                    {viewingDetailReview.createdAt
                      ? new Date(viewingDetailReview.createdAt).toLocaleString("vi-VN")
                      : "—"}
                  </span>
                </div>
              </div>

              {/* Toàn văn nội dung nhận xét */}
              <div className="raw-modal-content-group">
                <label className="raw-modal-content-label">
                  <i className="fa-solid fa-quote-left"></i> Toàn văn nhận xét:
                </label>
                <div className="raw-modal-raw-text">
                  &ldquo;{viewingDetailReview.comment}&rdquo;
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={() => setViewingDetailReview(null)}
              >
                Đóng
              </button>
              <button
                type="button"
                className="btn-modal-hide-action"
                onClick={() => {
                  const rev = viewingDetailReview;
                  setViewingDetailReview(null);
                  handleOpenHideModal(rev);
                }}
              >
                <i className="fa-solid fa-eye-slash"></i>
                Ẩn đánh giá này
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reviews;
