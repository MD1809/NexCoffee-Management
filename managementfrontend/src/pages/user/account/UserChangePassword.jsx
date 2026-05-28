import React, { useState } from "react";
import { toast } from "react-toastify";
import { changeMyPassword } from "../../../apis/accountApi";

const UserChangePassword = () => {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

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

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }

    if (errors.common) {
      setErrors((prev) => ({
        ...prev,
        common: "",
      }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setErrors({});

    if (!formData.currentPassword.trim()) {
      setErrors({ currentPassword: "Vui lòng nhập mật khẩu hiện tại." });
      return;
    }

    const passwordCriteriaErrors = validatePassword(formData.newPassword);

    if (passwordCriteriaErrors.length > 0) {
      setErrors({ newPassword: passwordCriteriaErrors });
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setErrors({ confirmPassword: "Xác nhận mật khẩu không khớp." });
      return;
    }

    try {
      setSubmitting(true);

      await changeMyPassword(formData);

      toast.success("Đổi mật khẩu thành công.");

      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setErrors({});
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data ||
        "Không thể đổi mật khẩu.";

      setErrors({ common: message });
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="user-account-password">
      <header>
        <h2>ĐỔI MẬT KHẨU</h2>
        <p>
          Mật khẩu mới phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, chữ
          số và ký tự đặc biệt.
        </p>
      </header>

      {errors.common && (
        <div className="user-account-error-message">{errors.common}</div>
      )}

      <form className="user-account-password-form" onSubmit={handleSubmit}>
        <div>
          <label>Mật khẩu hiện tại</label>
          <input
            className={errors.currentPassword ? "input-error" : ""}
            type="password"
            name="currentPassword"
            value={formData.currentPassword}
            onChange={handleChange}
            autoComplete="current-password"
          />

          {errors.currentPassword && (
            <span className="user-account-error-text">
              {errors.currentPassword}
            </span>
          )}
        </div>

        <div>
          <label>Mật khẩu mới</label>
          <input
            className={errors.newPassword ? "input-error" : ""}
            type="password"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleChange}
            autoComplete="new-password"
          />

          {errors.newPassword && Array.isArray(errors.newPassword) && (
            <div className="user-account-password-error-list">
              {errors.newPassword.map((err, index) => (
                <p key={index}>• {err}</p>
              ))}
            </div>
          )}
        </div>

        <div>
          <label>Xác nhận mật khẩu</label>
          <input
            className={errors.confirmPassword ? "input-error" : ""}
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            autoComplete="new-password"
          />

          {errors.confirmPassword && (
            <span className="user-account-error-text">
              {errors.confirmPassword}
            </span>
          )}
        </div>

        <button type="submit" disabled={submitting}>
          {submitting ? "Đang đổi..." : "Đổi mật khẩu"}
        </button>
      </form>
    </section>
  );
};

export default UserChangePassword;
