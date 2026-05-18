import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Register.css";
import { registerUser } from "../../../../apis/authApi";

const Register = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    passwordConfirmation: "",
  });

  const [errors, setErrors] = useState({});
  const [serverMessage, setServerMessage] = useState("");

  const validateVietnamPhone = (phone) => {
    return /^0(3|5|7|8|9)[0-9]{8}$/.test(phone);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    const nextValue =
      name === "phone" ? value.replace(/\D/g, "").slice(0, 10) : value;

    setFormData((prev) => ({
      ...prev,
      [name]: nextValue,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validatePassword = (pass) => {
    const pErrors = [];

    if (pass.length < 8) pErrors.push("Mật khẩu phải có ít nhất 8 ký tự.");
    if (!/[A-Z]/.test(pass)) pErrors.push("Phải chứa ít nhất một chữ hoa.");
    if (!/[a-z]/.test(pass)) pErrors.push("Phải chứa ít nhất một chữ thường.");
    if (!/[0-9]/.test(pass)) pErrors.push("Phải chứa ít nhất một chữ số.");
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pass)) {
      pErrors.push("Phải chứa ít nhất một ký tự đặc biệt.");
    }

    return pErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setErrors({});
    setServerMessage("");

    if (!formData.fullName.trim()) {
      setErrors({ fullName: "Họ và tên không được để trống." });
      return;
    }

    if (!formData.phone.trim()) {
      setErrors({ phone: "Số điện thoại không được để trống." });
      return;
    }

    if (!validateVietnamPhone(formData.phone)) {
      setErrors({
        phone: "Số điện thoại không hợp lệ",
      });
      return;
    }

    const passwordCriteriaErrors = validatePassword(formData.password);

    if (passwordCriteriaErrors.length > 0) {
      setErrors({ password: passwordCriteriaErrors });
      return;
    }

    if (formData.password !== formData.passwordConfirmation) {
      setErrors({ passwordConfirmation: "Mật khẩu xác nhận không khớp!" });
      return;
    }

    try {
      await registerUser(formData);

      navigate("/register-success", {
        state: { email: formData.email },
      });
    } catch (error) {
      const errorResponse = error.response?.data;
      let errorMsg = "Đăng ký thất bại!";

      if (typeof errorResponse === "string") {
        errorMsg = errorResponse;
      } else if (errorResponse?.message) {
        errorMsg = errorResponse.message;
      } else if (errorResponse?.error) {
        errorMsg = errorResponse.error;
      }

      const lowerMessage = errorMsg.toLowerCase();

      if (lowerMessage.includes("email")) {
        setErrors({ email: errorMsg });
      } else if (
        lowerMessage.includes("số điện thoại") ||
        lowerMessage.includes("phone")
      ) {
        setErrors({ phone: errorMsg });
      } else {
        setErrors({ common: errorMsg });
      }
    }
  };

  return (
    <section className="auth-section fade-in">
      <div className="auth-container">
        <h1 className="auth-title">ĐĂNG KÍ TÀI KHOẢN</h1>

        <p className="auth-subtitle">
          Bạn đã có tài khoản?{" "}
          <Link to="/login" className="auth-link--highlight">
            Đăng nhập tại đây
          </Link>
        </p>

        {serverMessage && (
          <div className="auth-message--success">{serverMessage}</div>
        )}

        {errors.common && (
          <div className="auth-message--error">{errors.common}</div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-form__group">
            <label className="auth-form__label">Họ và tên</label>
            <input
              className={`auth-form__input ${
                errors.fullName ? "input-error" : ""
              }`}
              type="text"
              name="fullName"
              placeholder="Nhập họ và tên"
              value={formData.fullName}
              onChange={handleChange}
              required
            />

            {errors.fullName && (
              <span className="error-text-inline">{errors.fullName}</span>
            )}
          </div>

          <div className="auth-form__group">
            <label className="auth-form__label">Email</label>
            <input
              className={`auth-form__input ${
                errors.email ? "input-error" : ""
              }`}
              type="email"
              name="email"
              placeholder="Nhập email"
              value={formData.email}
              onChange={handleChange}
              required
            />

            {errors.email && (
              <span className="error-text-inline">{errors.email}</span>
            )}
          </div>

          <div className="auth-form__group">
            <label className="auth-form__label">Số điện thoại</label>
            <input
              className={`auth-form__input ${
                errors.phone ? "input-error" : ""
              }`}
              type="tel"
              name="phone"
              inputMode="numeric"
              maxLength="10"
              placeholder="Nhập SĐT"
              value={formData.phone}
              onChange={handleChange}
              required
            />

            {errors.phone && (
              <span className="error-text-inline">{errors.phone}</span>
            )}
          </div>

          <div className="auth-form__group">
            <label className="auth-form__label">Mật khẩu</label>
            <input
              className={`auth-form__input ${
                errors.password ? "input-error" : ""
              }`}
              type="password"
              name="password"
              placeholder="Nhập mật khẩu"
              value={formData.password}
              onChange={handleChange}
              required
            />

            {errors.password && Array.isArray(errors.password) && (
              <div className="password-error-list">
                {errors.password.map((err, index) => (
                  <p key={index} className="error-text-bullet">
                    • {err}
                  </p>
                ))}
              </div>
            )}
          </div>

          <div className="auth-form__group">
            <label className="auth-form__label">Xác nhận mật khẩu</label>
            <input
              className={`auth-form__input ${
                errors.passwordConfirmation ? "input-error" : ""
              }`}
              type="password"
              name="passwordConfirmation"
              placeholder="Nhập lại mật khẩu"
              value={formData.passwordConfirmation}
              onChange={handleChange}
              required
            />

            {errors.passwordConfirmation && (
              <span className="error-text-inline">
                {errors.passwordConfirmation}
              </span>
            )}
          </div>

          <button type="submit" className="auth-form__submit-btn">
            Đăng kí
          </button>
        </form>
      </div>
    </section>
  );
};

export default Register;
