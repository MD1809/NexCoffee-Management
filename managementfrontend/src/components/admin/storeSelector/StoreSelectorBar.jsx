import React, { useState, useEffect } from "react";
import { getCurrentUser } from "../../../utils/authStorage";
import { getActiveStores } from "../../../apis/storeApi";
import Dropdown from "../dropDown/Dropdown";
import "./StoreSelectorBar.css";

const StoreSelectorBar = ({ selectedStoreId, onStoreChange, title = "Báo cáo & Thống kê" }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [storeOptions, setStoreOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);

    if (user?.role === "SUPER_ADMIN") {
      fetchStores();
    }
  }, []);

  const fetchStores = async () => {
    try {
      setLoading(true);
      const data = await getActiveStores();
      const storesList = Array.isArray(data) ? data : data?.data || [];
      const options = [
        { value: "", label: "Tất cả các chi nhánh" },
        ...storesList.map((s) => ({
          value: s.id,
          label: s.name,
        })),
      ];
      setStoreOptions(options);
    } catch (err) {
      console.error("Lỗi khi tải danh sách chi nhánh:", err);
    } finally {
      setLoading(false);
    }
  };

  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";

  const handleDropdownChange = (option) => {
    if (onStoreChange) {
      onStoreChange(option?.value ? option.value : null);
    }
  };

  return (
    <div className="store-selector-bar">
      <div className="store-selector-left">
        <div>
          <h2 className="store-selector-title">{title}</h2>
          <p className="store-selector-subtitle">
            {isSuperAdmin
              ? "Toàn quyền xem và so sánh số liệu tất cả chi nhánh"
              : `Dữ liệu tại ${currentUser?.storeName || "chi nhánh của bạn"}`}
          </p>
        </div>
      </div>

      <div className="store-selector-right">
        {isSuperAdmin ? (
          <div className="store-filter-box">
            <span className="store-filter-label">Chi nhánh:</span>
            <div className="store-dropdown-wrapper">
              <Dropdown
                options={storeOptions}
                placeholder="Chọn chi nhánh"
                defaultValue={selectedStoreId || ""}
                onChange={handleDropdownChange}
              />
            </div>
          </div>
        ) : (
          <div className="store-badge-locked" title="Dữ liệu cố định tại chi nhánh được phân công">
            <span className="store-badge-name">
              {currentUser?.storeName || "Chi nhánh của tôi"}
            </span>
            <span className="locked-tag">Cố định</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoreSelectorBar;
