import React from "react";
import { useLocation, Link } from "react-router-dom";
import "./AccountDeactivated.css";

const AccountDeactivated = () => {
  const location = useLocation();
  const { reason, deactivatedAt, email } = location.state || {};

  const displayReason =
    reason || "Tài khoản có dấu hiệu bất thường hoặc vi phạm chính sách cộng đồng của hệ thống.";

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="deactivated-page">
      <div className="deactivated-card">
        <div className="deactivated-icon-wrapper">
          <i className="fa-solid fa-user-lock"></i>
        </div>

        <h1 className="deactivated-title">TÀI KHOẢN ĐÃ BỊ VÔ HIỆU HÓA</h1>

        <p className="deactivated-subtitle">
          Rất tiếc, tài khoản NexCoffee của bạn đã bị tạm khóa để đảm bảo an toàn hoặc do vi phạm các chính sách điều khoản dịch vụ của hệ thống.
        </p>

        <div className="deactivated-reason-box">
          <div className="deactivated-reason-label">
            <i className="fa-solid fa-circle-exclamation"></i>
            Lý do ghi nhận
          </div>
          <p className="deactivated-reason-text">&ldquo;{displayReason}&rdquo;</p>

          <div className="deactivated-reason-meta">
            {email && (
              <div>
                <strong>Tài khoản:</strong> {email}
              </div>
            )}
            {deactivatedAt && (
              <div>
                <strong>Thời gian xử lý:</strong> {formatDate(deactivatedAt)}
              </div>
            )}
          </div>
        </div>

        <div className="deactivated-help-text">
          Nếu bạn cho rằng đây là sự nhầm lẫn hoặc cần hỗ trợ mở lại tài khoản, vui lòng liên hệ ngay với đội ngũ Chăm sóc Khách hàng của chúng tôi:
          <div className="deactivated-contact-info">
            <div className="deactivated-contact-item">
              <i className="fa-solid fa-phone"></i>
              Hotline: 1900 6868
            </div>
            <div className="deactivated-contact-item">
              <i className="fa-solid fa-envelope"></i>
              support@nexcoffee.vn
            </div>
          </div>
        </div>

        <div className="deactivated-actions">
          <a
            href="mailto:support@nexcoffee.vn?subject=Yêu cầu kiểm tra mở lại tài khoản NexCoffee"
            className="btn-contact-support"
          >
            <i className="fa-solid fa-headset"></i>
            Liên hệ hỗ trợ
          </a>

          <Link to="/" className="btn-home-return">
            <i className="fa-solid fa-house"></i>
            Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AccountDeactivated;
