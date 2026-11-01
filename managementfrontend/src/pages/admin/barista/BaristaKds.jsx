import React, { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "react-toastify";
import posApi from "../../../apis/posApi";
import { getCurrentUser } from "../../../utils/authStorage";
import "./BaristaKds.css";

export default function BaristaKds() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterType, setFilterType] = useState("ALL"); // "ALL", "DINE_IN", "TAKEAWAY"
  const [completedItems, setCompletedItems] = useState({}); // { [itemKey]: boolean }
  const [now, setNow] = useState(Date.now());

  const currentUser = getCurrentUser();
  const currentStoreId = currentUser?.storeId || null;
  const storeName =
    currentUser?.storeName ||
    (currentUser?.role === "SUPER_ADMIN"
      ? "Toàn hệ thống"
      : "Chi nhánh của bạn");

  // Cập nhật đồng hồ thời gian mỗi 30 giây để đếm phút chờ chính xác
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const fetchOrders = useCallback(
    async (isManual = false) => {
      if (isManual) setIsRefreshing(true);
      try {
        const response = await posApi.getBaristaOrders(currentStoreId);
        setOrders(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Lỗi tải đơn pha chế:", error);
        if (isManual) {
          toast.error("Không thể tải danh sách đơn pha chế!");
        }
      } finally {
        setIsLoading(false);
        if (isManual) setIsRefreshing(false);
      }
    },
    [currentStoreId]
  );

  // Polling tự động mỗi 10 giây
  useEffect(() => {
    fetchOrders();
    const interval = setInterval(() => {
      fetchOrders(false);
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // Bộ lọc đơn
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (filterType === "DINE_IN") return order.orderType === "DINE_IN";
      if (filterType === "TAKEAWAY") return order.orderType === "TAKEAWAY";
      return true;
    });
  }, [orders, filterType]);

  // Tính tổng số ly cần pha
  const totalCupsPending = useMemo(() => {
    return orders.reduce((sum, o) => sum + (o.totalItems || 0), 0);
  }, [orders]);

  // Toggle tick gạch ngang từng món đã pha xong
  const toggleItemDone = (orderId, itemId) => {
    const key = `${orderId}-${itemId}`;
    setCompletedItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Hoàn thành cả đơn hàng
  const handleCompleteOrder = async (order) => {
    try {
      await posApi.completeBaristaOrder(order.id, {
        baristaId: currentUser?.id,
      });
      toast.success(`Đã hoàn thành đơn hàng #${order.code}!`);
      // Lọc bỏ đơn vừa xong khỏi state ngay lập tức
      setOrders((prev) => prev.filter((o) => o.id !== order.id));
      window.dispatchEvent(new CustomEvent("admin-notifications:refresh"));
    } catch (error) {
      console.error("Lỗi khi hoàn thành đơn:", error);
      toast.error("Không thể cập nhật trạng thái đơn! Vui lòng thử lại.");
    }
  };

  // Tính toán thời gian chờ và cấp độ cảnh báo
  const getWaitTimeInfo = (createdAt) => {
    if (!createdAt) return { text: "Vừa tạo", level: "normal" };
    const orderTime = new Date(createdAt).getTime();
    const diffMinutes = Math.max(0, Math.floor((now - orderTime) / 60000));

    if (diffMinutes < 5) {
      return { text: `${diffMinutes} phút`, level: "normal" };
    } else if (diffMinutes < 10) {
      return { text: `${diffMinutes} phút`, level: "warning" };
    } else {
      return { text: `${diffMinutes} phút (Ưu tiên)`, level: "danger" };
    }
  };

  return (
    <div className="barista-kds">
      {/* =========================================
          HEADER ĐIỀU PHỐI (KDS TOPBAR)
          ========================================= */}
      <div className="barista-header">
        <div className="barista-title-group">
          <h2 className="barista-title">Điều phối pha chế (Barista KDS)</h2>
          <span className="barista-store-name">{storeName}</span>
        </div>

        {/* Khối KPI nổi bật (Có icon theo quy tắc Rule: các mục Highlight quan trọng) */}
        <div className="barista-kpi-group">
          <div className="barista-kpi-card barista-kpi-card--pending">
            <i className="fa-solid fa-clock-rotate-left kpi-icon"></i>
            <div>
              <span className="kpi-label">Đơn chờ pha: </span>
              <strong className="kpi-value">{orders.length}</strong>
            </div>
          </div>

          <div className="barista-kpi-card barista-kpi-card--cups">
            <i className="fa-solid fa-mug-hot kpi-icon"></i>
            <div>
              <span className="kpi-label">Tổng số ly: </span>
              <strong className="kpi-value">{totalCupsPending}</strong>
            </div>
          </div>
        </div>

        {/* Bộ lọc & Refresh (Không icon ở button để tuân thủ quy tắc) */}
        <div className="barista-controls">
          <div className="barista-filter-pills">
            <button
              type="button"
              className={`barista-pill ${filterType === "ALL" ? "barista-pill--active" : ""}`}
              onClick={() => setFilterType("ALL")}
            >
              Tất cả ({orders.length})
            </button>
            <button
              type="button"
              className={`barista-pill ${filterType === "DINE_IN" ? "barista-pill--active" : ""}`}
              onClick={() => setFilterType("DINE_IN")}
            >
              Tại quán ({orders.filter((o) => o.orderType === "DINE_IN").length})
            </button>
            <button
              type="button"
              className={`barista-pill ${filterType === "TAKEAWAY" ? "barista-pill--active" : ""}`}
              onClick={() => setFilterType("TAKEAWAY")}
            >
              Mang về ({orders.filter((o) => o.orderType === "TAKEAWAY").length})
            </button>
          </div>

          <button
            type="button"
            className="btn-barista-refresh"
            onClick={() => fetchOrders(true)}
            disabled={isRefreshing}
            title="Làm mới danh sách đơn"
          >
            {isRefreshing ? "Đang đồng bộ..." : "Đồng bộ ngay"}
          </button>
        </div>
      </div>

      {/* =========================================
          DANH SÁCH THẺ ĐƠN HÀNG (KANBAN GRID)
          ========================================= */}
      <div className="barista-body">
        {isLoading ? (
          /* SKELETON LOADER HIỆU ỨNG SHIMMER CHUẨN UI RULES */
          <div className="barista-skeleton-grid">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="skeleton-card">
                <div className="skeleton-box skeleton-header-line"></div>
                <div className="skeleton-box skeleton-location-line"></div>
                <div className="skeleton-box skeleton-item-line"></div>
                <div className="skeleton-box skeleton-item-line"></div>
                <div className="skeleton-box skeleton-button-line"></div>
              </div>
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="barista-empty-state">
            <h3 className="empty-state-title">Hiện không có đơn nào đang chờ pha chế</h3>
            <p className="empty-state-subtitle">
              Quầy Bar đã hoàn tất tất cả đồ uống hoặc sẵn sàng nhận đơn mới từ thu ngân!
            </p>
          </div>
        ) : (
          <div className="barista-grid">
            {filteredOrders.map((order, orderIndex) => {
              const waitInfo = getWaitTimeInfo(order.createdAt);
              const isDineIn = order.orderType === "DINE_IN";
              const formattedTime = order.createdAt
                ? new Date(order.createdAt).toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "";

              return (
                <div
                  key={order.id}
                  className={`barista-card barista-card--${waitInfo.level}`}
                >
                  {/* Card Header */}
                  <div className="card-top">
                    <div className="card-top-left">
                      <span className="card-order-seq">#{orderIndex + 1}</span>
                      <strong className="card-order-code">{order.code}</strong>
                    </div>

                    <div className="card-top-right">
                      <span className="card-created-time">{formattedTime}</span>
                      <span className={`card-wait-badge card-wait-badge--${waitInfo.level}`}>
                        {waitInfo.text}
                      </span>
                    </div>
                  </div>

                  {/* Vị trí phục vụ nổi bật */}
                  <div className="card-location-banner">
                    <span
                      className={`location-badge ${
                        isDineIn ? "location-badge--dine-in" : "location-badge--takeaway"
                      }`}
                    >
                      {isDineIn ? "TẠI QUÁN" : "MANG VỀ"}
                    </span>
                    <strong className="location-detail-text">
                      {order.tableNumber || (isDineIn ? "Tại bàn" : "Mang đi")}
                    </strong>
                  </div>

                  {/* Ghi chú đơn nếu có */}
                  {order.note && order.note.includes("Ghi chú: ") && (
                    <div className="card-note-box">
                      <strong>Ghi chú:</strong>{" "}
                      {order.note.split("Ghi chú: ")[1]}
                    </div>
                  )}

                  {/* Danh sách món đồ uống */}
                  <div className="card-items-list">
                    {order.items?.map((item) => {
                      const itemKey = `${order.id}-${item.id}`;
                      const isDone = !!completedItems[itemKey];

                      return (
                        <div
                          key={item.id}
                          className={`card-item-row ${isDone ? "card-item-row--done" : ""}`}
                          onClick={() => toggleItemDone(order.id, item.id)}
                          title="Bấm để đánh dấu đã pha xong ly này"
                        >
                          <div className="item-check-indicator"></div>

                          <div className="item-text-info">
                            <div className="item-title">
                              <span className="item-qty">{item.quantity}x</span>
                              <span className="item-name">{item.productName}</span>
                            </div>

                            {item.variantSize && item.variantSize !== "Mặc định" && (
                              <span className="item-size-tag">
                                Size {item.variantSize}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Card Bottom: Nút Hoàn thành (Không icon theo UI rule) */}
                  <div className="card-bottom">
                    <button
                      type="button"
                      className="btn-complete-order"
                      onClick={() => handleCompleteOrder(order)}
                    >
                      Hoàn thành pha chế
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
