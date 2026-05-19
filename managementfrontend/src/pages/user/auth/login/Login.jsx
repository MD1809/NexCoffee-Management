import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import "./Login.css";
import { loginUser } from "../../../../apis/authApi";
import { saveAuth } from "../../../../utils/authStorage";
import { mergeGuestCart } from "../../../../apis/cartApi";
import { clearGuestCartToken } from "../../../../utils/cartSession";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    remember: false,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const redirectByRole = (user) => {
    const redirectPath = location.state?.from?.pathname;

    if (redirectPath) {
      navigate(redirectPath, { replace: true });
      return;
    }

    if (user.role === "ADMIN") {
      navigate("/admin", { replace: true });
      return;
    }

    if (user.role === "STAFF") {
      navigate("/staff", { replace: true });
      return;
    }

    navigate("/", { replace: true });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (errors[name] || errors.common) {
      setErrors({});
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setErrors({});

    if (!formData.email.trim()) {
      setErrors({ email: "Email không được để trống." });
      return;
    }

    if (!formData.password.trim()) {
      setErrors({ password: "Mật khẩu không được để trống." });
      return;
    }

    setLoading(true);

    try {
      const response = await loginUser({
        email: formData.email.trim(),
        password: formData.password,
      });

      saveAuth(response, formData.remember);
      try {
        await mergeGuestCart();
        clearGuestCartToken();
        window.dispatchEvent(new Event("cart-changed"));
      } catch (mergeError) {
        console.warn("Không thể gộp giỏ khách:", mergeError);
      }

      toast.success("Đăng nhập thành công!");

      const redirectPath = location.state?.from;

      if (redirectPath) {
        navigate(redirectPath, { replace: true });
        return;
      }
      redirectByRole(response);
    } catch (error) {
      const serverError =
        error.response?.data || "Đăng nhập thất bại. Vui lòng thử lại.";

      if (
        serverError.includes("chưa được xác thực") ||
        serverError.includes("xác thực email")
      ) {
        setErrors({
          common: serverError,
          needVerify: true,
        });
      } else {
        setErrors({ common: serverError });
      }

      toast.error(serverError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-section fade-in">
      <div className="auth-container">
        <h1 className="auth-title">ĐĂNG NHẬP TÀI KHOẢN</h1>

        <p className="auth-subtitle">
          Bạn chưa có tài khoản?{" "}
          <Link to="/register" className="auth-link--highlight">
            Đăng kí tại đây
          </Link>
        </p>

        {errors.common && (
          <div className="auth-message--error">
            {errors.common}

            {errors.needVerify && (
              <div style={{ marginTop: "10px" }}>
                <Link
                  to="/resend-verification"
                  className="auth-link--highlight"
                >
                  Gửi lại email xác thực
                </Link>
              </div>
            )}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-form__group">
            <label className="auth-form__label" htmlFor="email">
              Email
            </label>

            <input
              className={`auth-form__input ${
                errors.email ? "input-error" : ""
              }`}
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              autoFocus
              placeholder="Nhập email của bạn"
            />

            {errors.email && (
              <span className="error-text-inline">{errors.email}</span>
            )}
          </div>

          <div className="auth-form__group">
            <label className="auth-form__label" htmlFor="password">
              Mật khẩu
            </label>

            <input
              className={`auth-form__input ${
                errors.password ? "input-error" : ""
              }`}
              id="password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Nhập mật khẩu"
            />

            {errors.password && (
              <span className="error-text-inline">{errors.password}</span>
            )}
          </div>

          <div className="auth-form__options">
            <label className="auth-form__checkbox-label">
              <input
                type="checkbox"
                name="remember"
                checked={formData.remember}
                onChange={handleChange}
              />
              <span>Nhớ đăng nhập</span>
            </label>

            <Link to="/forgot-password" className="auth-form__link">
              Quên mật khẩu?
            </Link>
          </div>

          <button
            type="submit"
            className="auth-form__submit-btn"
            disabled={loading}
          >
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>
      </div>
    </section>
  );
};

export default Login;
