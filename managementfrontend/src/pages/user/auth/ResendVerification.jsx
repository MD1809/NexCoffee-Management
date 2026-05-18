import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { resendVerification } from "../../../apis/authApi";
import { toast } from "react-toastify";

const ResendVerification = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleResend = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (!email.trim()) {
      setError("Email không được để trống.");
      return;
    }

    setLoading(true);

    try {
      const response = await resendVerification(email.trim());

      setMessage(response || "Mã xác thực mới đã được gửi vào email của bạn.");
      toast.success(response || "Đã gửi lại email xác thực.");
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
      <div className="auth-container">
        <h2 className="auth-title">GỬI LẠI MÃ XÁC THỰC</h2>

        <p className="auth-subtitle">
          Nhập email đã đăng ký để nhận lại liên kết kích hoạt tài khoản.
        </p>

        {message && <div className="auth-message--success">{message}</div>}
        {error && <div className="auth-message--error">{error}</div>}

        <form className="auth-form" onSubmit={handleResend}>
          <div className="auth-form__group">
            <label className="auth-form__label">Email đã đăng ký</label>
            <input
              className={`auth-form__input ${error ? "input-error" : ""}`}
              type="email"
              placeholder="example@gmail.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              required
            />
          </div>

          <button
            type="submit"
            className="auth-form__submit-btn"
            disabled={loading}
          >
            {loading ? "Đang gửi..." : "Gửi email xác thực"}
          </button>

          <button
            type="button"
            className="auth-form__submit-btn"
            style={{ marginTop: "12px" }}
            onClick={() => navigate("/login")}
          >
            Quay lại đăng nhập
          </button>
        </form>
      </div>
    </section>
  );
};

export default ResendVerification;
