import React from "react";
import FormModal from "../../../components/admin/formModal/FormModal";
import Dropdown from "../../../components/admin/dropDown/Dropdown";

const statusOptions = [
  { label: "Hoạt động", value: "ACTIVE" },
  { label: "Ngừng hoạt động", value: "INACTIVE" },
];

const storeRequiredRoles = ["ADMIN", "STAFF", "SHIPPER"];

const getRoleOptionsByCurrentRole = (currentRole) => {
  if (currentRole === "SUPER_ADMIN") {
    return [
      { label: "Super Admin", value: "SUPER_ADMIN" },
      { label: "Quản trị viên", value: "ADMIN" },
      { label: "Nhân viên", value: "STAFF" },
      { label: "Người giao hàng", value: "SHIPPER" },
      { label: "Khách hàng", value: "CUSTOMER" },
    ];
  }

  if (currentRole === "ADMIN") {
    return [
      { label: "Nhân viên", value: "STAFF" },
      { label: "Người giao hàng", value: "SHIPPER" },
    ];
  }

  return [];
};

const UserFormModal = ({
  isOpen,
  isEdit,
  formData,
  formErrors,
  stores = [],
  currentRole,
  onClose,
  onSubmit,
  onInputChange,
  onClearError,
}) => {
  const roleOptions = getRoleOptionsByCurrentRole(currentRole);

  const shouldShowStoreSelect =
    currentRole === "SUPER_ADMIN" && storeRequiredRoles.includes(formData.role);

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
          className={`form-modal__input ${
            formErrors.fullName ? "input--error" : ""
          }`}
          placeholder="Nhập họ và tên..."
          name="fullName"
          value={formData.fullName}
          onChange={(e) => {
            onInputChange(e);
            if (formErrors.fullName) onClearError("fullName");
          }}
        />

        {formErrors.fullName && (
          <span className="addU-error-text">{formErrors.fullName}</span>
        )}
      </div>

      <div className="form-modal__group">
        <label className="form-modal__label">Email</label>
        <input
          type="email"
          className={`form-modal__input ${
            formErrors.email ? "input--error" : ""
          }`}
          placeholder="VD: example@gmail.com"
          name="email"
          value={formData.email}
          onChange={(e) => {
            onInputChange(e);
            if (formErrors.email) onClearError("email");
          }}
        />

        {formErrors.email && (
          <span className="addU-error-text">{formErrors.email}</span>
        )}
      </div>

      <div className="form-modal__group">
        <label className="form-modal__label">Số điện thoại</label>
        <input
          type="text"
          className={`form-modal__input ${
            formErrors.phone ? "input--error" : ""
          }`}
          placeholder="VD: 0391234327"
          name="phone"
          value={formData.phone}
          onChange={(e) => {
            onInputChange(e);
            if (formErrors.phone) onClearError("phone");
          }}
        />

        {formErrors.phone && (
          <span className="addU-error-text">{formErrors.phone}</span>
        )}
      </div>

      {!isEdit && (
        <>
          <div className="form-modal__group">
            <label className="form-modal__label">Mật khẩu</label>
            <input
              type="password"
              className={`form-modal__input ${
                formErrors.password ? "input--error" : ""
              }`}
              placeholder="VD: Aa@1234"
              name="password"
              value={formData.password}
              onChange={(e) => {
                onInputChange(e);
                if (formErrors.password) onClearError("password");
              }}
            />

            {formErrors.password && (
              <span className="addU-error-text">{formErrors.password}</span>
            )}
          </div>

          <div className="form-modal__group">
            <label className="form-modal__label">Xác nhận mật khẩu</label>
            <input
              type="password"
              className={`form-modal__input ${
                formErrors.confirmPassword ? "input--error" : ""
              }`}
              placeholder="Nhập lại mật khẩu"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={(e) => {
                onInputChange(e);
                if (formErrors.confirmPassword) {
                  onClearError("confirmPassword");
                }
              }}
            />

            {formErrors.confirmPassword && (
              <span className="addU-error-text">
                {formErrors.confirmPassword}
              </span>
            )}
          </div>
        </>
      )}

      <div className="form-modal__row">
        <div className="form-modal__group">
          <label className="form-modal__label">Vai trò</label>

          <div
            className={`form-control-dropdown ${
              formErrors.role ? "input--error" : ""
            }`}
          >
            <Dropdown
              options={roleOptions}
              defaultValue={formData.role}
              placeholder="Chọn vai trò"
              onChange={(option) => {
                onInputChange({
                  target: {
                    name: "role",
                    value: option.value,
                  },
                });

                if (formErrors.role) {
                  onClearError("role");
                }
              }}
            />
          </div>

          {formErrors.role && (
            <span className="addU-error-text">{formErrors.role}</span>
          )}
        </div>

        <div className="form-modal__group">
          <label className="form-modal__label">Trạng thái</label>

          <Dropdown
            options={statusOptions}
            defaultValue={formData.status}
            placeholder="Chọn trạng thái"
            onChange={(option) => {
              onInputChange({
                target: {
                  name: "status",
                  value: option.value,
                },
              });
            }}
          />
        </div>
      </div>

      {shouldShowStoreSelect && (
        <div className="form-modal__group">
          <label className="form-modal__label">Cửa hàng phụ trách</label>

          <div
            className={`form-control-dropdown ${
              formErrors.storeId ? "input--error" : ""
            }`}
          >
            <Dropdown
              options={stores.map((store) => ({
                label: store.name,
                value: String(store.id),
              }))}
              defaultValue={formData.storeId ? String(formData.storeId) : ""}
              placeholder="Chọn cửa hàng"
              onChange={(option) => {
                onInputChange({
                  target: {
                    name: "storeId",
                    value: option.value,
                  },
                });

                if (formErrors.storeId) {
                  onClearError("storeId");
                }
              }}
            />
          </div>

          {formErrors.storeId && (
            <span className="addU-error-text">{formErrors.storeId}</span>
          )}
        </div>
      )}

      {currentRole === "ADMIN" && (
        <div className="form-modal__group">
          <label className="form-modal__label">Cửa hàng phụ trách</label>

          <input
            type="text"
            className="form-modal__input"
            value="Tự động gán cửa hàng đang quản lý"
            readOnly
          />
        </div>
      )}
    </FormModal>
  );
};

export default UserFormModal;
