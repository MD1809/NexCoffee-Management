import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { resendVerification } from "../../../../apis/authApi";
import { toast } from "react-toastify";

const RegisterSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const email = location.state?.email || "";
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleResend = async () => {
    if (!email) {
      navigate("/resend-verification");
      return;
    }

    setMessage("");
    setError("");
    setLoading(true);

    try {
      const response = await resendVerification(email);
      setMessage(response || "Email xác thực đã được gửi lại.");
      toast.success(response || "Email xác thực đã được gửi lại.");
    } catch (error) {
      const serverError =
        error.response?.data || "Không thể gửi lại email lúc này.";

      setError(serverError);
      toast.error(serverError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-section fade-in">
      <div className="auth-container" style={{ textAlign: "center" }}>
        <h2 className="auth-title">ĐĂNG KÝ THÀNH CÔNG</h2>

        {email ? (
          <p className="auth-subtitle">
            Vui lòng kiểm tra email <strong>{email}</strong> để kích hoạt tài
            khoản.
          </p>
        ) : (
          <p className="auth-subtitle">
            Vui lòng kiểm tra email đã đăng ký để kích hoạt tài khoản.
          </p>
        )}

        <p className="auth-subtitle">Bạn không nhận được email?</p>

        {message && <div className="auth-message--success">{message}</div>}
        {error && <div className="auth-message--error">{error}</div>}

        <button
          onClick={handleResend}
          className="auth-form__submit-btn"
          disabled={loading}
        >
          {loading ? "Đang gửi..." : "Gửi lại email xác thực"}
        </button>
        <Link
          to="/register"
          className="auth-link--highlight register-back-link"
          style={{
            display: "inline-block",
            marginTop: "18px",
          }}
        >
          Quay lại trang đăng ký
        </Link>
      </div>
    </section>
  );
};

export default RegisterSuccess;
