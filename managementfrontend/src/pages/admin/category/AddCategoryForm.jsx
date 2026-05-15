import React, { useState } from "react";

import categoryApi from "../../../apis/CategoryApi";

import FormModal from "../../../components/admin/formModal/FormModal";
import { toast } from "react-toastify";

const AddCategoryForm = ({ isOpen, onClose, onRefresh }) => {

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    categoryStatus: "active",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      await categoryApi.create(formData);
      toast.success("Thêm danh mục thành công!");
      onRefresh();
      onClose(); 
      setFormData({ name: "", description: "", categoryStatus: "active" });
    } catch (error) {
      toast.error("Có lỗi xảy ra khi thêm danh mục");
      console.error(error);
    }
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Thêm danh mục mới"
      onSubmit={handleSubmit}
      submitText="Thêm mới"
    >
      <div className="form-modal__group">
        <label className="form-modal__label">Tên danh mục</label>
        <input
          name="name"
          className="form-modal__input"
          value={formData.name}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-modal__group">
        <label className="form-modal__label">Mô tả</label>
        <textarea
          name="description"
          className="form-modal__input"
          value={formData.description}
          onChange={handleChange}
        />
      </div>

      <div className="form-modal__group">
        <label className="form-modal__label">Trạng thái</label>
        <select
          name="categoryStatus"
          value={formData.categoryStatus}
          className="form-modal__input"
          onChange={handleChange}
        >
          <option value="active">Hoạt động</option>
          <option value="inactive">Ngừng hoạt động</option>
        </select>
      </div>
    </FormModal>
  );
};

export default AddCategoryForm;