import { useEffect, useMemo, useState } from "react";
import {
  createStore,
  deleteStore,
  getAllStores,
  updateStore,
  updateStoreStatus,
} from "../../../apis/storeApi";
import StoreLocationPicker from "./StoreLocationPicker";
import { toast } from "react-toastify";
import "./StorePage.css";
import StoreOverviewMap from "./StoreOverviewMap";

const initialFormData = {
  name: "",
  phone: "",
  address: "",
  latitude: "",
  longitude: "",
  status: "ACTIVE",
};
const PAGE_SIZE = 10;

export default function StorePage() {
  const [stores, setStores] = useState([]);
  const [formData, setFormData] = useState(initialFormData);

  const [editingId, setEditingId] = useState(null);
  const [isFormVisible, setIsFormVisible] = useState(false);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredStores = useMemo(() => {
    const value = keyword.trim().toLowerCase();

    return stores.filter((store) => {
      const matchKeyword =
        !value ||
        store.name?.toLowerCase().includes(value) ||
        store.phone?.toLowerCase().includes(value) ||
        store.address?.toLowerCase().includes(value) ||
        store.status?.toLowerCase().includes(value);

      const matchStatus =
        statusFilter === "ALL" || store.status === statusFilter;

      return matchKeyword && matchStatus;
    });
  }, [keyword, statusFilter, stores]);

  const totalPages = Math.max(1, Math.ceil(filteredStores.length / PAGE_SIZE));

  const paginatedStores = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredStores.slice(startIndex, startIndex + PAGE_SIZE);
  }, [currentPage, filteredStores]);

  useEffect(() => {
    setCurrentPage(1);
  }, [keyword, statusFilter]);
  const getPaginationItems = (currentPage, totalPages) => {
    const delta = 1;
    const items = [];

    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    items.push(1);

    const start = Math.max(2, currentPage - delta);
    const end = Math.min(totalPages - 1, currentPage + delta);

    if (start > 2) {
      items.push("left-ellipsis");
    }

    for (let page = start; page <= end; page += 1) {
      items.push(page);
    }

    if (end < totalPages - 1) {
      items.push("right-ellipsis");
    }

    items.push(totalPages);

    return items;
  };

  const fetchStores = async () => {
    try {
      setLoading(true);
      const data = await getAllStores();
      setStores(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      toast.error("Tải danh sách cửa hàng thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  const openCreateForm = () => {
    setEditingId(null);
    setFormData(initialFormData);
    setIsFormVisible(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openEditForm = (store) => {
    setEditingId(store.id);

    setFormData({
      name: store.name || "",
      phone: store.phone || "",
      address: store.address || "",
      latitude: store.latitude ?? "",
      longitude: store.longitude ?? "",
      status: store.status || "ACTIVE",
    });

    setIsFormVisible(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeForm = () => {
    setEditingId(null);
    setFormData(initialFormData);
    setIsFormVisible(false);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.warning("Tên cửa hàng không được để trống.");
      return false;
    }

    if (!formData.address.trim()) {
      toast.warning("Địa chỉ cửa hàng không được để trống.");
      return false;
    }

    const latitude = Number(formData.latitude);
    const longitude = Number(formData.longitude);

    if (Number.isNaN(latitude) || latitude < -90 || latitude > 90) {
      toast.warning("Vĩ độ không hợp lệ.");
      return false;
    }

    if (Number.isNaN(longitude) || longitude < -180 || longitude > 180) {
      toast.warning("Kinh độ không hợp lệ.");
      return false;
    }

    return true;
  };

  const buildPayload = () => {
    return {
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      address: formData.address.trim(),
      latitude: Number(formData.latitude),
      longitude: Number(formData.longitude),
      status: formData.status,
    };
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) return;

    try {
      setSaving(true);

      const payload = buildPayload();

      if (editingId) {
        await updateStore(editingId, payload);
        toast.success("Cập nhật cửa hàng thành công.");
      } else {
        await createStore(payload);
        toast.success("Thêm cửa hàng thành công.");
      }

      closeForm();
      await fetchStores();
    } catch (error) {
      console.error(error);
      const errorData = error?.response?.data;
      const message =
        errorData?.message ||
        errorData?.detail ||
        errorData?.error ||
        (typeof errorData === "string" ? errorData : null) ||
        "Lưu thông tin cửa hàng thất bại. Vui lòng kiểm tra lại dữ liệu.";

      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (store) => {
    const nextStatus = store.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    try {
      await updateStoreStatus(store.id, nextStatus);
      toast.success("Cập nhật trạng thái cửa hàng thành công.");
      await fetchStores();
    } catch (error) {
      console.error(error);
      toast.error("Cập nhật trạng thái cửa hàng thất bại.");
    }
  };

  const handleDelete = async (store) => {
    const confirmed = window.confirm(
      `Bạn muốn xóa cửa hàng "${store.name}" khỏi danh sách?`,
    );

    if (!confirmed) return;

    try {
      await deleteStore(store.id);
      toast.success("Xóa cửa hàng thành công.");
      await fetchStores();
    } catch (error) {
      console.error(error);
      toast.error("Xóa cửa hàng thất bại. Vui lòng thử lại.");
    }
  };

  if (isFormVisible) {
    return (
      <div className="admin-store-page">
        <div className="admin-store-header">
          <div>
            <h1>{editingId ? "Cập nhật cửa hàng" : "Thêm cửa hàng mới"}</h1>
            <p>
              Chọn vị trí cửa hàng bằng bản đồ hoặc nhập thủ công địa chỉ và tọa
              độ.
            </p>
          </div>

          <button
            type="button"
            className="admin-store-main-btn secondary"
            onClick={closeForm}
          >
            Quay lại danh sách
          </button>
        </div>

        <form className="admin-store-form-card" onSubmit={handleSubmit}>
          <div className="admin-store-form-grid">
            <div className="admin-store-field">
              <label>Tên cửa hàng</label>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Ví dụ: NexCoffee Hoàn Kiếm"
              />
            </div>

            <div className="admin-store-field">
              <label>Số điện thoại</label>
              <input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Ví dụ: 0900000001"
              />
            </div>

            <div className="admin-store-field">
              <label>Trạng thái</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="ACTIVE">Đang hoạt động</option>
                <option value="INACTIVE">Ngừng hoạt động</option>
              </select>
            </div>
          </div>

          <StoreLocationPicker formData={formData} setFormData={setFormData} />

          <div className="admin-store-form-actions">
            <button type="button" onClick={closeForm}>
              Hủy
            </button>

            <button type="submit" disabled={saving}>
              {saving
                ? "Đang lưu..."
                : editingId
                  ? "Cập nhật cửa hàng"
                  : "Thêm cửa hàng"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="admin-store-page">
      <div className="admin-store-header">
        <div>
          <h1>Quản lý cửa hàng</h1>
          <p>Quản lý danh sách địa chỉ cửa hàng trong hệ thống.</p>
        </div>

        <button
          type="button"
          className="admin-store-main-btn"
          onClick={openCreateForm}
        >
          Thêm cửa hàng
        </button>
      </div>

      <div className="admin-store-list-card">
        <div className="admin-store-list-header">
          <div>
            <h2>Danh sách cửa hàng</h2>
            <p>
              Hiển thị {filteredStores.length}/{stores.length} cửa hàng
            </p>
          </div>

          <div className="admin-store-filter-bar">
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Tìm theo tên, SĐT, địa chỉ..."
            />

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="INACTIVE">Ngừng hoạt động</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="admin-store-empty">Đang tải dữ liệu...</div>
        ) : filteredStores.length === 0 ? (
          <div className="admin-store-empty">Chưa có cửa hàng phù hợp.</div>
        ) : (
          <div className="admin-store-table-wrap">
            <table className="admin-store-table">
              <thead>
                <tr>
                  <th>Tên cửa hàng</th>
                  <th>Địa chỉ</th>
                  <th>Tọa độ</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>

              <tbody>
                {paginatedStores.map((store) => (
                  <tr key={store.id}>
                    <td>
                      <strong>{store.name}</strong>
                      {store.phone && <span>{store.phone}</span>}
                    </td>

                    <td>{store.address}</td>

                    <td>
                      <span>Lat: {store.latitude}</span>
                      <span>Lng: {store.longitude}</span>
                    </td>

                    <td>
                      <span
                        className={
                          store.status === "ACTIVE"
                            ? "admin-store-badge active"
                            : "admin-store-badge inactive"
                        }
                      >
                        {store.status === "ACTIVE"
                          ? "Đang hoạt động"
                          : "Ngừng hoạt động"}
                      </span>
                    </td>

                    <td>
                      <div className="admin-store-row-actions">
                        <button
                          type="button"
                          onClick={() => openEditForm(store)}
                        >
                          Sửa
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleStatus(store)}
                        >
                          {store.status === "ACTIVE" ? "Khóa" : "Mở"}
                        </button>

                        <button
                          type="button"
                          className="danger"
                          onClick={() => handleDelete(store)}
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredStores.length > PAGE_SIZE && (
              <div className="admin-store-pagination">
                <div className="admin-store-pagination-info">
                  Trang {currentPage}/{totalPages}
                </div>

                <div className="admin-store-pagination-actions">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                  >
                    Trước
                  </button>

                  {getPaginationItems(currentPage, totalPages).map((item) => {
                    if (typeof item === "string") {
                      return (
                        <span
                          key={item}
                          className="admin-store-pagination-ellipsis"
                        >
                          ...
                        </span>
                      );
                    }

                    return (
                      <button
                        key={item}
                        type="button"
                        className={item === currentPage ? "active" : ""}
                        onClick={() => setCurrentPage(item)}
                      >
                        {item}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="admin-store-map-card">
        <div className="admin-store-map-card-header">
          <div>
            <h2>Bản đồ cửa hàng</h2>
            <p>Hiển thị vị trí các cửa hàng đã được lưu trong hệ thống.</p>
          </div>
        </div>

        <StoreOverviewMap stores={filteredStores} />
      </div>
    </div>
  );
}
