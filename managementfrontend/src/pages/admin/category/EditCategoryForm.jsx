import React, { useState, useEffect } from "react";
import categoryApi from "../../../apis/CategoryApi";
import FormModal from "../../../components/admin/formModal/FormModal";
import Dropdown from "../../../components/admin/dropDown/Dropdown";
import { toast } from "react-toastify";

const EditCategoryForm = ({ isOpen, onClose, category, onRefresh }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    categoryStatus: "active",
  });

  // State lưu trữ lỗi
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        description: category.description || "",
        categoryStatus: category.categoryStatus,
      });
      // Xóa lỗi cũ khi mở form sửa cho danh mục khác
      setErrors({});
    }
  }, [category]);

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

    // Tự động xóa lỗi khi người dùng sửa lại dữ liệu
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await categoryApi.update(category.id, formData);
      toast.success("Cập nhật danh mục thành công!");
      onRefresh();
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
    if (category) {
      setFormData({
        name: category.name,
        description: category.description || "",
        categoryStatus: category.categoryStatus,
      });
    }
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
      title="Chỉnh sửa danh mục"
      onSubmit={handleSubmit}
      submitText="Lưu thay đổi"
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
        />
      </div>
    </FormModal>
  );
};

export default EditCategoryForm;
