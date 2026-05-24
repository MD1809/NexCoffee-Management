import React, { useState } from "react";
import categoryApi from "../../../apis/CategoryApi";
import FormModal from "../../../components/admin/formModal/FormModal";
import Dropdown from "../../../components/admin/dropDown/Dropdown";
import { toast } from "react-toastify";

const AddCategoryForm = ({ isOpen, onClose, onRefresh }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    categoryStatus: "active",
  });

  // State lưu trữ lỗi của từng trường
  const [errors, setErrors] = useState({});

  // Hàm kiểm tra dữ liệu trước khi gửi
  const validateForm = () => {
    let newErrors = {};
    let isValid = true;

    // Validate Tên danh mục
    if (!formData.name.trim()) {
      newErrors.name = "Tên danh mục không được để trống";
      isValid = false;
    } else if (formData.name.length > 100) {
      newErrors.name = "Tên danh mục không được vượt quá 100 ký tự";
      isValid = false;
    }

    // Validate Mô tả
    if (formData.description && formData.description.length > 500) {
      newErrors.description = "Mô tả không được vượt quá 500 ký tự";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await categoryApi.create(formData);
      toast.success("Thêm danh mục thành công!");

      onRefresh();
      setFormData({ name: "", description: "", categoryStatus: "active" });
      setErrors({});
      onClose();
    } catch (error) {
      if (error.response && error.response.data) {
        const errorData = error.response.data;

        if (errorData.errors) {
          setErrors(errorData.errors);
        } else if (errorData.message) {
          setErrors({ name: errorData.message });
        }
      }
      console.error("Chi tiết lỗi:", error);
    }
  };

  const handleClose = () => {
    setFormData({ name: "", description: "", categoryStatus: "active" });
    setErrors({});
    onClose();
  };

  const statusOptions = [
    { label: "Hoạt động", value: "active" },
    { label: "Ngừng hoạt động", value: "inactive" },
  ];

  return (
    <FormModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Thêm danh mục mới"
      onSubmit={handleSubmit}
      submitText="Thêm mới"
    >
      <div className="form-modal__group">
        <label className="form-modal__label">
          Tên danh mục <span style={{ color: "red" }}>*</span>
        </label>
        <input
          name="name"
          className={`form-modal__input ${errors.name ? "input-error" : ""}`}
          value={formData.name}
          onChange={handleChange}
          required
        />
        {/* Hiển thị lỗi bên dưới input */}
        {errors.name && (
          <span
            className="form-modal__error-text"
            style={{ color: "red", fontSize: "12px" }}
          >
            {errors.name}
          </span>
        )}
      </div>

      <div className="form-modal__group">
        <label className="form-modal__label">Mô tả</label>
        <textarea
          name="description"
          className={`form-modal__input ${errors.description ? "input-error" : ""}`}
          value={formData.description}
          onChange={handleChange}
        />
        {errors.description && (
          <span
            className="form-modal__error-text"
            style={{ color: "red", fontSize: "12px" }}
          >
            {errors.description}
          </span>
        )}
      </div>

      <div className="form-modal__group">
        <label className="form-modal__label">Trạng thái</label>
        <Dropdown
          options={statusOptions}
          defaultValue={formData.categoryStatus}
          onChange={(option) => {
            handleChange({
              target: {
                name: "categoryStatus",
                value: option.value,
              },
            });
          }}
          placeholder="Chọn trạng thái"
        />
      </div>
    </FormModal>
  );
};

export default AddCategoryForm;
