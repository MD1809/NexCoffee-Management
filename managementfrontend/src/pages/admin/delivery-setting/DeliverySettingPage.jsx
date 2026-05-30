import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";

import {
  getDeliverySetting,
  updateDeliverySetting,
} from "../../../apis/deliverySettingApi";

import "./DeliverySettingPage.css";

const defaultForm = {
  maxDistanceKm: 5,
  freeShipMinOrder: 100000,
  shippingFee: 15000,
  active: true,
};

const DeliverySettingPage = () => {
  const [formData, setFormData] = useState(defaultForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSetting = async () => {
    try {
      setLoading(true);

      const data = await getDeliverySetting();

      setFormData({
        maxDistanceKm: data.maxDistanceKm ?? 5,
        freeShipMinOrder: data.freeShipMinOrder ?? 100000,
        shippingFee: data.shippingFee ?? 15000,
        active: data.active ?? true,
      });
    } catch (error) {
      toast.warning("Chưa có cấu hình giao hàng. Bạn có thể nhập và lưu mới.");
      setFormData(defaultForm);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSetting();
  }, []);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const validateForm = () => {
    if (Number(formData.maxDistanceKm) <= 0) {
      toast.warning("Khoảng cách giao hàng phải lớn hơn 0.");
      return false;
    }

    if (Number(formData.freeShipMinOrder) < 0) {
      toast.warning("Mức đơn miễn phí ship không được âm.");
      return false;
    }

    if (Number(formData.shippingFee) < 0) {
      toast.warning("Phí ship không được âm.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) return;

    try {
      setSaving(true);

      await updateDeliverySetting({
        maxDistanceKm: Number(formData.maxDistanceKm),
        freeShipMinOrder: Number(formData.freeShipMinOrder),
        shippingFee: Number(formData.shippingFee),
        active: Boolean(formData.active),
      });

      toast.success("Cập nhật cấu hình giao hàng thành công.");
      fetchSetting();
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data ||
        "Không thể cập nhật cấu hình giao hàng.";

      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-delivery-setting-page">
        <div className="admin-delivery-card">
          <p>Đang tải cấu hình giao hàng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-delivery-setting-page">
      <div className="admin-delivery-header">
        <div>
          <h1>Cấu hình giao hàng</h1>
          <p>
            Quản lý quy tắc giao hàng dùng chung cho toàn bộ chi nhánh
            NexCoffee.
          </p>
        </div>
      </div>

      <form className="admin-delivery-card" onSubmit={handleSubmit}>
        <div className="admin-delivery-section-title">
          <div>
            <p>
              Cấu hình này áp dụng chung cho tất cả địa chỉ quán đang hoạt động.
            </p>
          </div>

          <span className={formData.active ? "is-active" : "is-inactive"}>
            {formData.active ? "Đang bật" : "Đang tắt"}
          </span>
        </div>

        <div className="admin-delivery-grid three">
          <div className="admin-delivery-field">
            <label>Khoảng cách tối đa x km</label>
            <input
              name="maxDistanceKm"
              type="number"
              step="0.1"
              min="0"
              value={formData.maxDistanceKm}
              onChange={handleChange}
            />
            <small>Khách xa hơn khoảng cách này sẽ không thể đặt hàng.</small>
          </div>

          <div className="admin-delivery-field">
            <label>Miễn phí ship nếu đơn từ y đồng</label>
            <input
              name="freeShipMinOrder"
              type="number"
              min="0"
              value={formData.freeShipMinOrder}
              onChange={handleChange}
            />
            <small>Ví dụ: 100000 nghĩa là đơn từ 100.000đ được freeship.</small>
          </div>

          <div className="admin-delivery-field">
            <label>Phí ship z đồng</label>
            <input
              name="shippingFee"
              type="number"
              min="0"
              value={formData.shippingFee}
              onChange={handleChange}
            />
            <small>Áp dụng khi đơn hàng nhỏ hơn mức miễn phí ship.</small>
          </div>
        </div>

        <label className="admin-delivery-checkbox">
          <input
            name="active"
            type="checkbox"
            checked={formData.active}
            onChange={handleChange}
          />
          <span>Cho phép nhận đơn hàng</span>
        </label>

        <div className="admin-delivery-note">
          <strong>Lưu ý:</strong>Khi tắt cấu hình giao hàng, khách hàng sẽ không
          thể đặt hàng giao đến nhà, nhưng vẫn có thể đặt để lấy tại quán.
        </div>

        <div className="admin-delivery-actions">
          <button
            type="button"
            className="admin-delivery-secondary-btn"
            onClick={fetchSetting}
            disabled={saving}
          >
            Hủy thay đổi
          </button>

          <button
            type="submit"
            className="admin-delivery-primary-btn"
            disabled={saving}
          >
            {saving ? "Đang lưu..." : "Lưu cấu hình"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DeliverySettingPage;
