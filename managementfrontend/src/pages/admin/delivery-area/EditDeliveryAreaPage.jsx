import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import "./DeliveryArea.css";
import {
  getDeliveryAreaById,
  updateDeliveryArea,
} from "../../../apis/deliveryAreaApi";

const formatCurrency = (value) => {
  return new Intl.NumberFormat("vi-VN").format(Number(value || 0)) + "đ";
};

const EditDeliveryAreaPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [area, setArea] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    shippingFee: 0,
    status: "ACTIVE",
    note: "",
  });

  const areaDisplayName = useMemo(() => {
    if (!area) return "";

    if (area.wardName) {
      return `${area.wardName} - ${area.provinceName}`;
    }

    return area.provinceName || "";
  }, [area]);

  useEffect(() => {
    const fetchArea = async () => {
      try {
        setLoading(true);

        const response = await getDeliveryAreaById(id);
        const data = response.data;

        setArea(data);

        setFormData({
          shippingFee: data.shippingFee ?? 0,
          status: data.status || "ACTIVE",
          note: data.note || "",
        });
      } catch (error) {
        toast.error("Không thể tải thông tin khu vực giao hàng.");
        navigate("/admin/delivery-areas");
      } finally {
        setLoading(false);
      }
    };

    fetchArea();
  }, [id, navigate]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (checked ? "ACTIVE" : "INACTIVE") : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!area) return;

    if (Number(formData.shippingFee) < 0) {
      toast.warning("Phí ship không được âm.");
      return;
    }

    try {
      setSubmitting(true);

      await updateDeliveryArea(area.id, {
        provinceCode: area.provinceCode,
        wardCode: area.wardCode || null,
        shippingFee: Number(formData.shippingFee || 0),
        status: formData.status,
        note: formData.note,
      });

      toast.success("Cập nhật khu vực giao hàng thành công.");
      navigate("/admin/delivery-areas");
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data ||
        "Không thể cập nhật khu vực giao hàng.";

      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="delivery-area-page">
        <div className="delivery-area-card">
          <div className="delivery-empty">Đang tải dữ liệu...</div>
        </div>
      </div>
    );
  }

  if (!area) {
    return null;
  }

  return (
    <div className="delivery-area-page">
      <div className="delivery-area-card">
        <h1>Chỉnh sửa khu vực giao hàng</h1>

        <form className="delivery-form-box" onSubmit={handleSubmit}>
          <div className="delivery-form-group">
            <label>Khu vực</label>
            <div className="delivery-readonly-box">
              <strong>{areaDisplayName}</strong>
              <span>{area.scopeLabel}</span>
            </div>
          </div>

          <div className="delivery-form-group">
            <label>Mã khu vực</label>
            <input type="text" value={area.areaKey || ""} disabled />
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
            <small>
              Hiện tại: {formatCurrency(formData.shippingFee)}. Nhập 0 để miễn
              phí giao hàng cho khu vực này.
            </small>
          </div>

          <div className="delivery-form-group">
            <label>Ghi chú</label>
            <textarea
              name="note"
              value={formData.note}
              onChange={handleChange}
              placeholder="Ví dụ: Freeship toàn khu vực, phí riêng cho phường này..."
            />
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

          <div className="delivery-edit-note">
            {area.wardCode ? (
              <p>
                Rule này áp dụng riêng cho phường/xã. Nếu tỉnh/thành có rule
                khác, rule phường/xã này sẽ được ưu tiên khi tính phí ship.
              </p>
            ) : (
              <p>
                Rule này áp dụng cho toàn tỉnh/thành. Nếu có rule phường/xã
                riêng, rule phường/xã sẽ ưu tiên hơn rule toàn tỉnh.
              </p>
            )}
          </div>

          <div className="delivery-form-actions">
            <button
              type="submit"
              className="delivery-submit-btn"
              disabled={submitting}
            >
              {submitting ? "Đang cập nhật..." : "Cập nhật"}
            </button>

            <button
              type="button"
              className="delivery-cancel-btn"
              onClick={() => navigate("/admin/delivery-areas")}
              disabled={submitting}
            >
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditDeliveryAreaPage;
