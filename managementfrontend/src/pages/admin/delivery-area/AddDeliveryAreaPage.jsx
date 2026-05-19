import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import "./DeliveryArea.css";
import {
  createDeliveryArea,
  getProvinces,
  getWardsByProvince,
} from "../../../apis/deliveryAreaApi";

const AddDeliveryAreaPage = () => {
  const navigate = useNavigate();

  const [provinces, setProvinces] = useState([]);
  const [wards, setWards] = useState([]);

  const [formData, setFormData] = useState({
    provinceCode: "",
    wardCode: "",
    shippingFee: 0,
    status: "ACTIVE",
    note: "",
  });

  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const response = await getProvinces();
        setProvinces(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        toast.error("Không thể tải danh sách tỉnh/thành phố.");
      }
    };

    fetchProvinces();
  }, []);

  useEffect(() => {
    const fetchWards = async () => {
      if (!formData.provinceCode) {
        setWards([]);
        return;
      }

      try {
        const response = await getWardsByProvince(formData.provinceCode);
        setWards(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        toast.error("Không thể tải danh sách phường/xã.");
      }
    };

    fetchWards();
  }, [formData.provinceCode]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (checked ? "ACTIVE" : "INACTIVE") : value,
      ...(name === "provinceCode" ? { wardCode: "" } : {}),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.provinceCode) {
      toast.warning("Vui lòng chọn tỉnh/thành phố.");
      return;
    }

    if (Number(formData.shippingFee) < 0) {
      toast.warning("Phí ship không được âm.");
      return;
    }

    try {
      await createDeliveryArea({
        provinceCode: formData.provinceCode,
        wardCode: formData.wardCode || null,
        shippingFee: Number(formData.shippingFee || 0),
        status: formData.status,
        note: formData.note,
      });

      toast.success("Thêm khu vực giao hàng thành công.");
      navigate("/admin/delivery-areas");
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data ||
        "Không thể thêm khu vực giao hàng.";

      toast.error(message);
    }
  };

  return (
    <div className="delivery-area-page">
      <div className="delivery-area-card">
        <h1>Thêm khu vực giao hàng</h1>

        <form className="delivery-form-box" onSubmit={handleSubmit}>
          <div className="delivery-form-group">
            <label>
              Tỉnh/Thành phố <span>*</span>
            </label>
            <select
              name="provinceCode"
              value={formData.provinceCode}
              onChange={handleChange}
              required
            >
              <option value="">-- Chọn tỉnh/thành phố --</option>
              {provinces.map((province) => (
                <option key={province.code} value={province.code}>
                  {province.fullName}
                </option>
              ))}
            </select>
          </div>

          <div className="delivery-form-group">
            <label>Phường/Xã tùy chọn</label>
            <select
              name="wardCode"
              value={formData.wardCode}
              onChange={handleChange}
              disabled={!formData.provinceCode}
            >
              <option value="">-- Toàn tỉnh/thành --</option>
              {wards.map((ward) => (
                <option key={ward.code} value={ward.code}>
                  {ward.fullName}
                </option>
              ))}
            </select>
          </div>

          <div className="delivery-form-group">
            <label>
              Phí ship <span>*</span>
            </label>
            <input
              type="number"
              name="shippingFee"
              min="0"
              value={formData.shippingFee}
              onChange={handleChange}
              required
            />
            <small>Nhập 0 để miễn phí giao hàng cho khu vực này</small>
          </div>

          <label className="delivery-checkbox">
            <input
              type="checkbox"
              name="status"
              checked={formData.status === "ACTIVE"}
              onChange={handleChange}
            />
            <span>Hoạt động</span>
          </label>

          <div className="delivery-form-actions">
            <button type="submit" className="delivery-submit-btn">
              Thêm khu vực
            </button>

            <button
              type="button"
              className="delivery-cancel-btn"
              onClick={() => navigate("/admin/delivery-areas")}
            >
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDeliveryAreaPage;
