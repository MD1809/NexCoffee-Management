import React from "react";
import FormModal from "../../../components/admin/formModal/FormModal";
import Dropdown from "../../../components/admin/dropDown/Dropdown";

const roleOptions = [
  { label: "Khách hàng", value: "CUSTOMER" },
  { label: "Nhân viên", value: "STAFF" },
  { label: "Quản trị viên", value: "ADMIN" },
  { label: "Người giao hàng", value: "SHIPPER" }
];

const statusOptions = [
  { label: "Hoạt động", value: "ACTIVE" },
  { label: "Ngừng hoạt động", value: "INACTIVE" }
];

const UserFormModal = ({
  isOpen,
  isEdit,
  formData,
  formErrors,
  onClose,
  onSubmit,
  onInputChange,
  onClearError
}) => {
  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Cập nhật thông tin tài khoản" : "Thêm người dùng mới"}
      submitText={isEdit ? "Cập nhật" : "Tạo tài khoản"}
      onSubmit={onSubmit}
    >
      <div className="form-modal__group">
        <label className="form-modal__label">Họ và tên</label>
        <input
          type="text"
          className={`form-modal__input ${formErrors.fullName ? "input--error" : ""}`}
          placeholder="Nhập họ và tên..."
          name="fullName"
          value={formData.fullName}
          onChange={(e) => {
            onInputChange(e);
            if (formErrors.fullName) onClearError("fullName");
          }}
        />
        {formErrors.fullName && <span className="addU-error-text">{formErrors.fullName}</span>}
      </div>

      <div className="form-modal__group">
        <label className="form-modal__label">Email</label>
        <input
          type="email"
          className={`form-modal__input ${formErrors.email ? "input--error" : ""}`}
          placeholder="VD: example@gmail.com"
          name="email"
          value={formData.email}
          onChange={(e) => {
            onInputChange(e);
            if (formErrors.email) onClearError("email");
          }}
        />
        {formErrors.email && <span className="addU-error-text">{formErrors.email}</span>}
      </div>

      <div className="form-modal__group">
        <label className="form-modal__label">Số điện thoại</label>
        <input
          type="text"
          className={`form-modal__input ${formErrors.phone ? "input--error" : ""}`}
          placeholder="VD: 039****327"
          name="phone"
          value={formData.phone}
          onChange={(e) => {
            onInputChange(e);
            if (formErrors.phone) onClearError("phone");
          }}
        />
        {formErrors.phone && <span className="addU-error-text">{formErrors.phone}</span>}
      </div>

      {/* Chỉ hiển thị phần Password nếu là Thêm Mới */}
      {!isEdit && (
        <>
          <div className="form-modal__group">
            <label className="form-modal__label">Mật khẩu</label>
            <input
              type="password"
              className={`form-modal__input ${formErrors.password ? "input--error" : ""}`}
              placeholder="VD: Aa@1234"
              name="password"
              value={formData.password}
              onChange={(e) => {
                onInputChange(e);
                if (formErrors.password) onClearError("password");
              }}
            />
            {formErrors.password && <span className="addU-error-text">{formErrors.password}</span>}
          </div>

          <div className="form-modal__group">
            <label className="form-modal__label">Xác nhận mật khẩu</label>
            <input
              type="password"
              className={`form-modal__input ${formErrors.confirmPassword ? "input--error" : ""}`}
              placeholder="Nhập lại mật khẩu"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={(e) => {
                onInputChange(e);
                if (formErrors.confirmPassword) onClearError("confirmPassword");
              }}
            />
            {formErrors.confirmPassword && (
              <span className="addU-error-text">{formErrors.confirmPassword}</span>
            )}
          </div>
        </>
      )}

      <div className="form-modal__row">
        <div className="form-modal__group">
          <label className="form-modal__label">Vai trò</label>
          <div className={`form-control-dropdown ${formErrors.role ? "input--error" : ""}`}>
            <Dropdown
              options={roleOptions}
              defaultValue={formData.role}
              placeholder="Chọn vai trò"
              onChange={(option) => {
                onInputChange({ target: { name: "role", value: option.value } });
                if (formErrors.role) onClearError("role");
              }}
            />
          </div>
          {formErrors.role && <span className="addU-error-text">{formErrors.role}</span>}
        </div>

        <div className="form-modal__group">
          <label className="form-modal__label">Trạng thái</label>
          <Dropdown
            options={statusOptions}
            defaultValue={formData.status}
            placeholder="Chọn trạng thái"
            onChange={(option) =>
              onInputChange({ target: { name: "status", value: option.value } })
            }
          />
        </div>
      </div>
    </FormModal>
  );
};

export default UserFormModal;