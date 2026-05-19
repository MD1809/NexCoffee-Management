import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

import "./DeliveryArea.css";
import {
  deleteDeliveryArea,
  getDeliveryAreas,
  updateDeliveryAreaStatus,
} from "../../../apis/deliveryAreaApi";

const formatCurrency = (value) => {
  return new Intl.NumberFormat("vi-VN").format(Number(value || 0)) + "đ";
};

const DeliveryAreasPage = () => {
  const [areas, setAreas] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchAreas = async () => {
    try {
      setLoading(true);

      const response = await getDeliveryAreas(status);
      setAreas(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      toast.error("Không thể tải danh sách khu vực giao hàng.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAreas();
  }, [status]);

  const filteredAreas = useMemo(() => {
    const searchValue = keyword.trim().toLowerCase();

    if (!searchValue) return areas;

    return areas.filter((area) => {
      const provinceName = area.provinceName || "";
      const wardName = area.wardName || "";
      const note = area.note || "";

      return `${provinceName} ${wardName} ${note}`
        .toLowerCase()
        .includes(searchValue);
    });
  }, [areas, keyword]);

  const handleToggleStatus = async (area) => {
    const nextStatus = area.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    try {
      await updateDeliveryAreaStatus(area.id, nextStatus);
      toast.success("Cập nhật trạng thái thành công.");
      fetchAreas();
    } catch (error) {
      toast.error("Không thể cập nhật trạng thái.");
    }
  };

  const handleDelete = async (areaId) => {
    const confirmed = window.confirm(
      "Bạn có chắc muốn xóa khu vực giao hàng này?",
    );

    if (!confirmed) return;

    try {
      await deleteDeliveryArea(areaId);
      toast.success("Đã xóa khu vực giao hàng.");
      fetchAreas();
    } catch (error) {
      toast.error("Không thể xóa khu vực giao hàng.");
    }
  };

  const handleClearFilter = () => {
    setKeyword("");
    setStatus("");
  };

  return (
    <div className="delivery-area-page">
      <div className="delivery-area-card">
        <div className="delivery-area-header">
          <h1>Quản lý khu vực giao hàng</h1>

          <Link to="/admin/delivery-areas/add" className="delivery-primary-btn">
            Thêm khu vực
          </Link>
        </div>

        <div className="delivery-filter-box">
          <input
            type="text"
            placeholder="Tìm tỉnh/thành phố hoặc phường/xã"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />

          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">Hoạt động</option>
            <option value="INACTIVE">Tạm ngừng</option>
          </select>

          <button
            type="button"
            onClick={fetchAreas}
            className="delivery-search-btn"
          >
            Tìm kiếm
          </button>

          <button
            type="button"
            onClick={handleClearFilter}
            className="delivery-clear-btn"
          >
            Xóa bộ lọc
          </button>
        </div>

        <div className="delivery-list-box">
          {loading ? (
            <div className="delivery-empty">Đang tải dữ liệu...</div>
          ) : filteredAreas.length === 0 ? (
            <div className="delivery-empty">
              {/* <div className="delivery-empty-icon">▱</div> */}
              <h2>Chưa có khu vực giao hàng nào</h2>
              <p>Hãy bắt đầu bằng cách thêm khu vực giao hàng được hỗ trợ</p>

              <Link
                to="/admin/delivery-areas/add"
                className="delivery-primary-btn"
              >
                Thêm khu vực
              </Link>
            </div>
          ) : (
            <div className="delivery-table-wrapper">
              <table className="delivery-table">
                <thead>
                  <tr>
                    <th>Khu vực</th>
                    <th>Phạm vi</th>
                    <th>Phí ship</th>
                    <th>Trạng thái</th>
                    <th>Ghi chú</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredAreas.map((area) => (
                    <tr key={area.id}>
                      <td>
                        <strong>
                          {area.wardName
                            ? `${area.wardName} - ${area.provinceName}`
                            : area.provinceName}
                        </strong>
                      </td>

                      <td>{area.scopeLabel}</td>

                      <td>{formatCurrency(area.shippingFee)}</td>

                      <td>
                        <span
                          className={`delivery-status ${
                            area.status === "ACTIVE" ? "active" : "inactive"
                          }`}
                        >
                          {area.status === "ACTIVE" ? "Hoạt động" : "Tạm ngừng"}
                        </span>
                      </td>

                      <td>{area.note || "—"}</td>

                      <td>
                        <div className="delivery-actions">
                          <Link
                            to={`/admin/delivery-areas/edit/${area.id}`}
                            className="delivery-action-btn"
                          >
                            Sửa
                          </Link>

                          <button
                            type="button"
                            className="delivery-action-btn"
                            onClick={() => handleToggleStatus(area)}
                          >
                            {area.status === "ACTIVE" ? "Tắt" : "Bật"}
                          </button>

                          <button
                            type="button"
                            className="delivery-danger-btn"
                            onClick={() => handleDelete(area.id)}
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeliveryAreasPage;
