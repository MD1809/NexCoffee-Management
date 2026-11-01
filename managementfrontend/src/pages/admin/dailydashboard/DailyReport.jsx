import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import dailyReportApi from "../../../apis/dailyReportService";
import DataTable from "../../../components/admin/dataTable/DataTable";
import Dropdown from "../../../components/admin/dropDown/Dropdown";
import SearchBox from "../../../components/admin/searchBox/SearchBox";
import HourlyRevenueChartWithIntervals from "./HourlyRevenueChartWithIntervals";
import StoreSelectorBar from "../../../components/admin/storeSelector/StoreSelectorBar";
import ExportReportModal from "../../../components/admin/exportReportModal/ExportReportModal";
import { getCurrentUser } from "../../../utils/authStorage";
import "./DailyReport.css";

const getLocalDateString = (dateObj = new Date()) => {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getYesterdayDateString = (currentDateStr) => {
  const date = new Date(currentDateStr);
  date.setDate(date.getDate() - 1);
  return getLocalDateString(date);
};

const DailyReport = () => {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  // State chọn chi nhánh (với ADMIN là storeId của họ, với SUPER_ADMIN là null = tất cả)
  const [selectedStoreId, setSelectedStoreId] = useState(() => {
    if (currentUser?.role === "ADMIN" && currentUser?.storeId) {
      return currentUser.storeId;
    }
    return null;
  });

  const [selectedDate, setSelectedDate] = useState(getLocalDateString());
  const [revenue, setRevenue] = useState(0);
  const [salesStats, setSalesStats] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [visibleProductsCount, setVisibleProductsCount] = useState(5);
  const [prevRevenue, setPrevRevenue] = useState(0);
  const [prevOrdersCount, setPrevOrdersCount] = useState(0);
  const [prevProductsCount, setPrevProductsCount] = useState(0);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const fetchDailyData = useCallback(async (date, storeId) => {
    setLoading(true);
    try {
      const yesterdayStr = getYesterdayDateString(date);

      // Gọi song song API lấy dữ liệu hôm nay và hôm qua với storeId
      const [
        revenueData,
        statsData,
        ordersData,
        prevRevData,
        prevStatsData,
        prevOrdersData,
      ] = await Promise.allSettled([
        dailyReportApi.getRevenue(date, storeId),
        dailyReportApi.getSalesStats(date, storeId),
        dailyReportApi.getOrders(date, storeId),
        dailyReportApi.getRevenue(yesterdayStr, storeId),
        dailyReportApi.getSalesStats(yesterdayStr, storeId),
        dailyReportApi.getOrders(yesterdayStr, storeId),
      ]);

      setRevenue(revenueData.status === "fulfilled" ? revenueData.value : 0);
      setSalesStats(statsData.status === "fulfilled" ? statsData.value : []);
      setOrders(ordersData.status === "fulfilled" ? ordersData.value : []);

      setPrevRevenue(
        prevRevData.status === "fulfilled" ? prevRevData.value : 0,
      );

      const pOrders =
        prevOrdersData.status === "fulfilled" ? prevOrdersData.value : [];
      setPrevOrdersCount(pOrders.length);

      const pStats =
        prevStatsData.status === "fulfilled" ? prevStatsData.value : [];
      const pProductsCount = pStats.reduce(
        (sum, item) => sum + item.totalQuantity,
        0,
      );
      setPrevProductsCount(pProductsCount);

      setVisibleProductsCount(5);
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu báo cáo:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDailyData(selectedDate, selectedStoreId);
  }, [selectedDate, selectedStoreId, fetchDailyData]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount || 0);
  };

  const totalProductsSold = salesStats.reduce(
    (sum, item) => sum + item.totalQuantity,
    0,
  );
  const totalOrders = orders.length;

  const filteredOrders = useMemo(() => {
    if (statusFilter === "All") return orders;
    return orders.filter((order) => order.status === statusFilter);
  }, [orders, statusFilter]);

  const processedHourlyData = useMemo(() => {
    const hourlyDataTemplate = Array.from({ length: 24 }, (_, i) => ({
      hour: `${i.toString().padStart(2, "0")}:00`,
      revenue: 0,
    }));

    orders.forEach((order) => {
      if (order.paymentStatus === "paid" && order.createdAt) {
        const orderHour = new Date(order.createdAt).getHours();
        hourlyDataTemplate[orderHour].revenue += order.total;
      }
    });

    return hourlyDataTemplate;
  }, [orders]);

  // TÍNH NĂNG 4.5: MỞ FORM XUẤT BÁO CÁO EXCEL STUDIO
  const handleExportReport = () => {
    setIsExportModalOpen(true);
  };

  const renderTrend = (current, previous) => {
    let percent = 0;
    let isUp = true;

    if (previous === 0) {
      percent = current > 0 ? 100 : 0;
      isUp = true;
    } else {
      const change = ((current - previous) / previous) * 100;
      percent = Math.abs(change).toFixed(1);
      isUp = change >= 0;
    }

    const trendClass = isUp ? "trend-up" : "trend-down";
    const iconClass = isUp ? "fa-arrow-trend-up" : "fa-arrow-trend-down";
    const sign = isUp ? "+" : "-";

    return (
      <div className={`widget-trend ${trendClass}`}>
        <i className={`fa-solid ${iconClass}`}></i>
        <span>
          {sign}
          {percent}%
        </span>
        <span className="trend-text-muted">so với hôm qua</span>
      </div>
    );
  };

  const statusOptions = [
    { value: "All", label: "Tất cả trạng thái" },
    { value: "Pending", label: "Chờ nhận đơn" },
    { value: "Processing", label: "Đang pha chế" },
    { value: "Shipped", label: "Đang giao hàng" },
    { value: "Completed", label: "Hoàn thành" },
    { value: "Cancelled", label: "Đã hủy" },
  ];

  const orderColumns = [
    {
      header: "Mã đơn",
      accessor: "code",
      render: (row) => <strong>{row.code}</strong>,
    },
    { header: "Người đặt", accessor: "customerName" },
    {
      header: "Tổng tiền",
      accessor: "total",
      render: (row) => <strong>{formatCurrency(row.total)}</strong>,
    },
    {
      header: "Người bán",
      accessor: "staffName",
      render: (row) =>
        row.staffName ? (
          <span>{row.staffName}</span>
        ) : (
          <span style={{ color: "var(--text-secondary)" }}>-</span>
        ),
    },
    {
      header: "Người giao",
      accessor: "shipperName",
      render: (row) =>
        row.shipperName ? (
          <span>{row.shipperName}</span>
        ) : (
          <span style={{ color: "var(--text-secondary)" }}>-</span>
        ),
    },
    {
      header: "Thời gian",
      accessor: "createdAt",
      render: (row) => {
        if (!row.createdAt) return "";
        const date = new Date(row.createdAt);
        return date.toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        });
      },
    },
    {
      header: "Thanh toán",
      accessor: "paymentStatus",
      render: (row) => {
        let badgeClass = "dr-badge-secondary";
        if (row.paymentStatus === "paid") badgeClass = "dr-badge-paid";
        else if (row.paymentStatus === "unpaid") badgeClass = "dr-badge-unpaid";
        else if (row.paymentStatus === "refunded")
          badgeClass = "dr-badge-refunded";

        const label =
          row.paymentStatus === "paid"
            ? "Đã thanh toán"
            : row.paymentStatus === "unpaid"
              ? "Chưa thanh toán"
              : row.paymentStatus === "refunded"
                ? "Hoàn tiền"
                : row.paymentStatus;

        return <span className={`dr-badge ${badgeClass}`}>{label}</span>;
      },
    },
    {
      header: "Trạng thái",
      accessor: "status",
      render: (row) => {
        const statusOption = statusOptions.find(opt => opt.value === row.status);
        const label = statusOption ? statusOption.label : row.status;

        let badgeClass = "dr-badge-secondary";
        if (row.status === "Completed") badgeClass = "dr-badge-completed";
        else if (row.status === "Cancelled") badgeClass = "dr-badge-cancelled";
        else if (row.status === "Pending") badgeClass = "dr-badge-pending";
        else if (row.status === "Processing") badgeClass = "dr-badge-processing";
        else if (row.status === "Shipped") badgeClass = "dr-badge-shipped";

        return <span className={`dr-badge ${badgeClass}`}>{label}</span>;
      },
    },
    {
      header: "Thao tác",
      render: (row) => (
        <div className="action-buttons">
          <i
            className="fa-regular fa-eye btn-icon btn-icon--view"
            title="Xem chi tiết đơn"
            onClick={() => navigate(`/admin/orders/detail/${row.id}`)}
          ></i>
        </div>
      ),
    },
  ];

  const daysOfWeek = ["T2", "T3", "T4", "T5", "T6", "T7", "Cn"];
  const getDaysInMonth = (year, month) =>
    new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };
  const handlePrevMonth = () =>
    setCalendarDate(
      new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1),
    );
  const handleNextMonth = () =>
    setCalendarDate(
      new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1),
    );
  const handleDateClick = (day) => {
    const newDate = new Date(
      calendarDate.getFullYear(),
      calendarDate.getMonth(),
      day,
    );
    setSelectedDate(getLocalDateString(newDate));
  };

  const renderCalendarDays = () => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayIndex = getFirstDayOfMonth(year, month);
    const days = [];

    for (let i = 0; i < firstDayIndex; i++) {
      days.push(
        <div key={`empty-${i}`} className="daily-report-cal-day empty"></div>,
      );
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const currentCellDate = new Date(year, month, i);
      const currentDateStr = getLocalDateString(currentCellDate);
      const isSelected = currentDateStr === selectedDate;

      days.push(
        <div
          key={i}
          onClick={() => handleDateClick(i)}
          className={`daily-report-cal-day ${isSelected ? "active" : ""}`}
        >
          {i}
        </div>,
      );
    }
    return days;
  };

  return (
    <div className="daily-report-container">
      {/* Thanh chọn chi nhánh & thông tin phân quyền */}
      <StoreSelectorBar
        selectedStoreId={selectedStoreId}
        onStoreChange={(newStoreId) => setSelectedStoreId(newStoreId)}
        title="Thống Kê Hoạt Động Theo Ngày"
      />

      {/* Thanh công cụ hành động: Ngày đang xem + Nút Xuất Báo Cáo */}
      <div className="daily-report-action-bar">
        <div className="current-date-badge">
          <span>Ngày xem: <strong>{selectedDate}</strong></span>
        </div>

        <button
          type="button"
          className="btn-export-excel"
          onClick={handleExportReport}
          title="Xuất dữ liệu ngày sang file Excel / CSV"
        >
          Xuất Báo Cáo (Excel / CSV)
        </button>
      </div>

      {loading ? (
        /* Skeleton Loader cho trang Daily Report */
        <div className="daily-report-skeleton-container">
          <div className="daily-report-widgets-wrapper">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="daily-report-widget skeleton-card">
                <div className="skeleton-line skeleton-title"></div>
                <div className="skeleton-line skeleton-val"></div>
              </div>
            ))}
          </div>
          <div className="daily-report-card skeleton-card" style={{ height: "300px", marginTop: "20px" }}></div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
          <div className="daily-report-layoutTop">
            <div className="daily-report-col-left">
              {/* Box 3 Widgets */}
              <div className="daily-report-widgets-wrapper">
                {/* Widget 1: Doanh thu */}
                <div className="daily-report-widget">
                  <div className="widget-main-content">
                    <div className="widget-info">
                      <p className="daily-report-widget-title">Doanh thu</p>
                      <h3 className="daily-report-widget-val daily-report-val-green">
                        {formatCurrency(revenue)}
                      </h3>
                    </div>
                    <div className="widget-icon-wrapper widget-icon-green">
                      <i className="fa-solid fa-money-bill-wave"></i>
                    </div>
                  </div>
                  <div className="widget-trend-container">
                    {renderTrend(revenue, prevRevenue)}
                  </div>
                </div>

                {/* Widget 2: Đơn hàng */}
                <div className="daily-report-widget">
                  <div className="widget-main-content">
                    <div className="widget-info">
                      <p className="daily-report-widget-title">
                        Tổng số đơn hàng
                      </p>
                      <h3 className="daily-report-widget-val daily-report-val-blue">
                        {totalOrders.toLocaleString("vi-VN")}
                      </h3>
                    </div>
                    <div className="widget-icon-wrapper widget-icon-blue">
                      <i className="fa-solid fa-cart-shopping"></i>
                    </div>
                  </div>
                  <div className="widget-trend-container">
                    {renderTrend(totalOrders, prevOrdersCount)}
                  </div>
                </div>

                {/* Widget 3: Sản phẩm */}
                <div className="daily-report-widget">
                  <div className="widget-main-content">
                    <div className="widget-info">
                      <p className="daily-report-widget-title">
                        Sản phẩm đã bán
                      </p>
                      <h3 className="daily-report-widget-val daily-report-val-orange">
                        {totalProductsSold.toLocaleString("vi-VN")}
                      </h3>
                    </div>
                    <div className="widget-icon-wrapper widget-icon-orange">
                      <i className="fa-solid fa-box-open"></i>
                    </div>
                  </div>
                  <div className="widget-trend-container">
                    {renderTrend(totalProductsSold, prevProductsCount)}
                  </div>
                </div>
              </div>

              {/* Biểu đồ doanh thu theo giờ */}
              <div className="daily-report-card">
                <h3 className="daily-report-section-title">
                  Biểu đồ doanh thu theo giờ trong ngày
                </h3>
                <div className="daily-report-chart-wrapper">
                  <HourlyRevenueChartWithIntervals
                    data={processedHourlyData}
                    selectedDate={selectedDate}
                  />
                </div>
              </div>
            </div>

            <div className="daily-report-col-right">
              {/* Lịch chọn ngày */}
              <div className="daily-report-cal-card">
                <div className="daily-report-cal-header">
                  <span>
                    Tháng {calendarDate.getMonth() + 1}-
                    {calendarDate.getFullYear()}
                  </span>
                  <div className="daily-report-cal-controls">
                    <button
                      onClick={handlePrevMonth}
                      className="daily-report-cal-btn"
                      aria-label="Tháng trước"
                    >
                      <i className="fa-solid fa-angle-left"></i>
                    </button>
                    <button
                      onClick={handleNextMonth}
                      className="daily-report-cal-btn"
                      aria-label="Tháng sau"
                    >
                      <i className="fa-solid fa-angle-right"></i>
                    </button>
                  </div>
                </div>
                <div className="daily-report-cal-body">
                  <div className="daily-report-cal-dow">
                    {daysOfWeek.map((day) => (
                      <div key={day}>{day}</div>
                    ))}
                  </div>
                  <div className="daily-report-cal-grid">
                    {renderCalendarDays()}
                  </div>
                </div>
              </div>

              {/* Món bán chạy */}
              <div className="daily-report-card">
                <h3
                  className="daily-report-section-title"
                  style={{ marginBottom: "16px" }}
                >
                  Top sản phẩm bán chạy
                </h3>
                <table className="daily-report-top-products">
                  <thead>
                    <tr>
                      <th>Tên món</th>
                      <th style={{ textAlign: "center" }}>SL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesStats.length === 0 ? (
                      <tr>
                        <td
                          colSpan="2"
                          style={{
                            textAlign: "center",
                            padding: "24px 0",
                            color: "var(--text-secondary)",
                          }}
                        >
                          Chưa có dữ liệu bán hàng
                        </td>
                      </tr>
                    ) : (
                      salesStats
                        .slice(0, visibleProductsCount)
                        .map((stat, index) => (
                          <tr key={index}>
                            <td>
                              <div className="daily-report-tp-name">
                                {stat.productName}
                              </div>
                              <div className="daily-report-tp-size">
                                Size {stat.size}
                              </div>
                            </td>
                            <td className="daily-report-tp-qty">
                              {stat.totalQuantity}
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>

                {/* Nút XEM THÊM */}
                {visibleProductsCount < salesStats.length && (
                  <div
                    style={{
                      textAlign: "center",
                      marginTop: "16px",
                      borderTop: "1px solid var(--bordertable-color, rgba(255,255,255,0.08))",
                      paddingTop: "12px",
                    }}
                  >
                    <button
                      onClick={() =>
                        setVisibleProductsCount((prev) => prev + 5)
                      }
                      style={{
                        width: "100%",
                        background: "transparent",
                        outline: "none",
                        border: "0",
                        color: "#3b82f6",
                        padding: "6px 16px",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "13px",
                        fontWeight: 600,
                        transition: "background-color 0.2s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor =
                          "rgba(59, 130, 246, 0.1)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "transparent")
                      }
                    >
                      Xem thêm ({salesStats.length - visibleProductsCount} món)
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Danh sách đơn hàng chi tiết */}
          <div className="daily-report-order">
            <div className="daily-report-table-header">
              <h2>
                Chi Tiết Đơn Hàng ({filteredOrders.length})
              </h2>
              <div className="daily-report-filter-wrapper">
                <SearchBox
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm mã đơn, tên khách..."
                />
                <div style={{ width: "200px" }}>
                  <Dropdown
                    options={statusOptions}
                    defaultValue="All"
                    onChange={(option) => setStatusFilter(option.value)}
                  />
                </div>
              </div>
            </div>

            <DataTable
              columns={orderColumns}
              data={filteredOrders}
              searchQuery={searchQuery}
              itemsPerPage={10}
            />
          </div>
        </div>
      )}

      {/* Modal Xuất Báo Cáo Chuẩn Kế Toán (Export Studio) */}
      <ExportReportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        defaultDate={selectedDate}
        selectedStoreId={selectedStoreId}
        currentUser={currentUser}
        currentData={{
          revenue,
          totalOrders,
          totalProductsSold,
          salesStats,
          orders,
        }}
      />
    </div>
  );
};

export default DailyReport;
