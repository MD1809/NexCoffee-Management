import React, { useState, useEffect } from "react";

import categoryApi from "../../../apis/CategoryApi";

import FormModal from "../../../components/admin/formModal/FormModal";
import { toast } from "react-toastify";

const EditCategoryForm = ({ isOpen, onClose, category, onRefresh }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    categoryStatus: "active",
  });

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        description: category.description || "",
        categoryStatus: category.categoryStatus,
      });
    }
  }, [category]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      await categoryApi.update(category.id, formData);
      toast.success("Cập nhật danh mục thành công!");
      onRefresh();
      onClose();
    } catch (error) {
      toast.error("Lỗi khi cập nhật danh mục");
      console.error(error);
    }
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Chỉnh sửa danh mục"
      onSubmit={handleSubmit}
      submitText="Lưu thay đổi"
    >
      <div className="form-modal__group">
        <label className="form-modal__label">Tên danh mục</label>
        <input name="name" className="form-modal__input" value={formData.name} onChange={handleChange} required />
      </div>

      <div className="form-modal__group">
        <label className="form-modal__label">Mô tả</label>
        <textarea name="description" className="form-modal__input" value={formData.description} onChange={handleChange} />
      </div>

      <div className="form-modal__group">
        <label className="form-modal__label">Trạng thái</label>
        <select name="categoryStatus" className="form-modal__input" value={formData.categoryStatus} onChange={handleChange}>
          <option value="active">Hoạt động</option>
          <option value="inactive">Ngừng hoạt động</option>
        </select>
      </div>
    </FormModal>
  );
};

export default EditCategoryForm;