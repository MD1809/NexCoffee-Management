import React, { useState, useEffect, useCallback } from "react";
import { FaDollarSign, FaShoppingCart, FaUsers, FaBox, FaCashRegister, FaMotorcycle, FaStore, FaTrophy } from "react-icons/fa";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

import "./Dashboard.css";
import dashboardApi from "../../../apis/DashboardApi";
import Dropdown from "../../../components/admin/dropDown/Dropdown";
import StoreSelectorBar from "../../../components/admin/storeSelector/StoreSelectorBar";
import { getCurrentUser } from "../../../utils/authStorage";

const Dashboard = () => {
  const currentUser = getCurrentUser();
  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";

  // State chọn chi nhánh (mặc định với ADMIN là store của họ, SUPER_ADMIN là null = toàn chuỗi)
  const [selectedStoreId, setSelectedStoreId] = useState(() => {
    if (currentUser?.role === "ADMIN" && currentUser?.storeId) {
      return currentUser.storeId;
    }
    return null;
  });

  // States lưu dữ liệu
  const [overview, setOverview] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    productsSold: 0,
  });
  const [revenueData, setRevenueData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [channelStats, setChannelStats] = useState(null);
  const [storeComparison, setStoreComparison] = useState([]);

  // States loading riêng biệt cho Skeleton UI
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingChart, setLoadingChart] = useState(true);
  const [loadingChannels, setLoadingChannels] = useState(true);
  const [loadingComparison, setLoadingComparison] = useState(false);

  // States cho Bộ lọc thời gian
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [selectedMonth, setSelectedMonth] = useState("all");

  const chartContainerRef = React.useRef(null);
  const [chartDimensionsReady, setChartDimensionsReady] = useState(false);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const checkDimensions = () => {
      if (
        chartContainerRef.current &&
        chartContainerRef.current.clientWidth > 0 &&
        chartContainerRef.current.clientHeight > 0
      ) {
        setChartDimensionsReady(true);
      }
    };

    checkDimensions();
    const observer = new ResizeObserver(checkDimensions);
    observer.observe(chartContainerRef.current);

    return () => observer.disconnect();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount || 0);
  };

  // 1. TẢI DỮ LIỆU TỔNG QUAN & TOP SẢN PHẨM
  const fetchGeneralData = useCallback(async (storeId) => {
    try {
      setLoadingOverview(true);
      const [resOverview, resTopProducts] = await Promise.all([
        dashboardApi.getOverview(storeId),
        dashboardApi.getTopProducts(storeId),
      ]);
      setOverview(resOverview.data || {});
      setTopProducts(resTopProducts.data || []);
    } catch (error) {
      console.error("Lỗi tải dữ liệu tổng quan:", error);
    } finally {
      setLoadingOverview(false);
    }
  }, []);

  // 2. TẢI DỮ LIỆU CƠ CẤU KÊNH BÁN (POS vs DELIVERY)
  const fetchChannelStats = useCallback(async (year, month, storeId) => {
    try {
      setLoadingChannels(true);
      const monthParam = month !== "all" ? parseInt(month, 10) : null;
      const res = await dashboardApi.getChannelStats(parseInt(year, 10), monthParam, storeId);
      setChannelStats(res.data);
    } catch (error) {
      console.error("Lỗi tải thống kê kênh bán:", error);
    } finally {
      setLoadingChannels(false);
    }
  }, []);

  // 3. TẢI DỮ LIỆU SO SÁNH CÁC CHI NHÁNH (Dành riêng cho SUPER_ADMIN)
  const fetchStoreComparison = useCallback(async (year, month) => {
    if (!isSuperAdmin) return;
    try {
      setLoadingComparison(true);
      const monthParam = month !== "all" ? parseInt(month, 10) : null;
      const res = await dashboardApi.getStoreComparison(parseInt(year, 10), monthParam);
      setStoreComparison(res.data || []);
    } catch (error) {
      console.error("Lỗi tải so sánh chi nhánh:", error);
    } finally {
      setLoadingComparison(false);
    }
  }, [isSuperAdmin]);

  // 4. TẢI DỮ LIỆU BIỂU ĐỒ DOANH THU
  const fetchChartData = useCallback(async (year, month, storeId) => {
    try {
      setLoadingChart(true);
      let response;
      let isDaily = false;

      if (month === "all") {
        response = await dashboardApi.getRevenueByYear(year, storeId);
      } else {
        response = await dashboardApi.getRevenueByMonth(year, month, storeId);
        isDaily = true;
      }

      const dataJson = response.data;
      const currentDate = new Date();
      const cYear = currentDate.getFullYear();
      const cMonth = currentDate.getMonth() + 1;
      const cDay = currentDate.getDate();

      const selYear = parseInt(year, 10);
      const selMonth = month !== "all" ? parseInt(month, 10) : null;

      if (Array.isArray(dataJson)) {
        const formattedData = dataJson.map((item) => {
          let isFuture = false;
          if (isDaily) {
            if (selYear > cYear) {
              isFuture = true;
            } else if (selYear === cYear && selMonth > cMonth) {
              isFuture = true;
            } else if (selYear === cYear && selMonth === cMonth && item.day > cDay) {
              isFuture = true;
            }
          } else {
            if (selYear > cYear) {
              isFuture = true;
            } else if (selYear === cYear && item.month > cMonth) {
              isFuture = true;
            }
          }

          return {
            name: isDaily ? `Ngày ${item.day}` : `T${item.month}`,
            revenue: isFuture ? null : item.revenue,
          };
        });

        setRevenueData(formattedData);
      } else {
        setRevenueData([]);
      }
    } catch (error) {
      console.error("Lỗi tải dữ liệu biểu đồ:", error);
    } finally {
      setLoadingChart(false);
    }
  }, []);

  // Lắng nghe thay đổi storeId
  useEffect(() => {
    fetchGeneralData(selectedStoreId);
    fetchChartData(selectedYear, selectedMonth, selectedStoreId);
    fetchChannelStats(selectedYear, selectedMonth, selectedStoreId);
  }, [selectedStoreId, fetchGeneralData, fetchChartData, fetchChannelStats, selectedYear, selectedMonth]);

  // Lắng nghe thay đổi năm, tháng đối với Store Comparison
  useEffect(() => {
    if (isSuperAdmin) {
      fetchStoreComparison(selectedYear, selectedMonth);
    }
  }, [selectedYear, selectedMonth, isSuperAdmin, fetchStoreComparison]);

  const monthOptions = [
    { label: "Cả năm", value: "all" },
    ...Array.from({ length: 12 }, (_, i) => ({
      label: `Tháng ${i + 1}`,
      value: (i + 1).toString(),
    })),
  ];

  const startYear = 2024;
  const numberOfYears = currentYear - startYear + 1;
  const yearOptions = Array.from({ length: numberOfYears }, (_, i) => {
    const year = startYear + i;
    return {
      label: `Năm ${year}`,
      value: year.toString(),
    };
  });

  return (
    <div className="dashboard-container">
      {/* Thanh chọn chi nhánh & phân quyền */}
      <StoreSelectorBar
        selectedStoreId={selectedStoreId}
        onStoreChange={(newStoreId) => setSelectedStoreId(newStoreId)}
        title="Trang Chủ Quản Trị & Thống Kê"
      />

      {/* 4 Thẻ KPI Tổng quan (kèm Skeleton loader) */}
      <div className="overview-cards">
        {loadingOverview ? (
          Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="dash-widget skeleton-card">
              <div className="skeleton-line skeleton-title"></div>
              <div className="skeleton-line skeleton-val"></div>
            </div>
          ))
        ) : (
          <>
            <div className="dash-widget">
              <div className="dash-widget-info">
                <p className="dash-widget-title">Tổng Doanh Thu</p>
                <h3 className="dash-widget-val daily-report-val-green">
                  {formatCurrency(overview.totalRevenue)}
                </h3>
              </div>
              <div className="dash-widget-icon icon-revenue">
                <FaDollarSign />
              </div>
            </div>

            <div className="dash-widget">
              <div className="dash-widget-info">
                <p className="dash-widget-title">Tổng Đơn Hàng</p>
                <h3 className="dash-widget-val daily-report-val-blue">
                  {overview.totalOrders?.toLocaleString("vi-VN") || 0}
                </h3>
              </div>
              <div className="dash-widget-icon icon-orders">
                <FaShoppingCart />
              </div>
            </div>

            <div className="dash-widget">
              <div className="dash-widget-info">
                <p className="dash-widget-title">Tổng Sản Phẩm</p>
                <h3 className="dash-widget-val daily-report-val-orange">
                  {overview.productsSold?.toLocaleString("vi-VN") || 0}
                </h3>
              </div>
              <div className="dash-widget-icon icon-products">
                <FaBox />
              </div>
            </div>

            <div className="dash-widget">
              <div className="dash-widget-info">
                <p className="dash-widget-title">Khách Hàng</p>
                <h3 className="dash-widget-val daily-report-val-purple">
                  {overview.totalCustomers?.toLocaleString("vi-VN") || 0}
                </h3>
              </div>
              <div className="dash-widget-icon icon-customers">
                <FaUsers />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Khu vực Biểu đồ & Top sản phẩm */}
      <div className="dashboard-main">
        {/* Biểu đồ doanh thu */}
        <div className="chart-section">
          <div className="chart-header">
            <h3 className="section-title">
              <i className="fa-solid fa-chart-area me-2"></i>
              Biểu Đồ Doanh Thu
            </h3>

            <div className="chart-filters">
              <div style={{ width: "135px" }}>
                <Dropdown
                  options={monthOptions}
                  defaultValue={selectedMonth}
                  onChange={(option) => setSelectedMonth(option.value)}
                  placeholder="Chọn tháng"
                />
              </div>

              <div style={{ width: "125px" }}>
                <Dropdown
                  options={yearOptions}
                  defaultValue={selectedYear}
                  onChange={(option) => setSelectedYear(option.value)}
                  placeholder="Chọn năm"
                />
              </div>
            </div>
          </div>

          <div
            ref={chartContainerRef}
            style={{ width: "100%", height: 350, minWidth: 0, minHeight: 350, position: "relative" }}
          >
            {loadingChart || !chartDimensionsReady ? (
              <div className="chart-skeleton-placeholder">
                <div className="skeleton-wave"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={350} minWidth={0}>
                <AreaChart
                  data={revenueData}
                  margin={{ top: 20, right: 20, bottom: 5, left: 20 }}
                >
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="#1468e3"
                        stopOpacity={0.6}
                      />
                      <stop
                        offset="95%"
                        stopColor="#1468e3"
                        stopOpacity={0.03}
                      />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="var(--border-primary-color)"
                    opacity={0.4}
                  />

                  <XAxis
                    dataKey="name"
                    tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
                    padding={{ left: 15, right: 15 }}
                    axisLine={false}
                    tickLine={false}
                    minTickGap={10}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    hide={true}
                    tickFormatter={(value) => `${(value / 1000).toLocaleString("vi-VN")}k`}
                    width={70}
                    tick={{ fill: "var(--text-secondary)" }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip
                    formatter={(value) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: "var(--bg-sidebar)",
                      color: "var(--text-primary)",
                      border: "1px solid var(--border-primary-color)",
                      borderRadius: "8px",
                      padding: "10px 14px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                    }}
                    itemStyle={{ color: "#1468e3", fontWeight: 600 }}
                  />

                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="Doanh thu"
                    stroke="#1468e3"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                    activeDot={{
                      r: 6,
                      strokeWidth: 0,
                      fill: "#1468e3",
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Cột phải: Top Sản Phẩm Bán Chạy */}
        <div className="top-products-section">
          <h3 className="section-title">
            <i className="fa-solid fa-fire me-2 text-warning"></i>
            Top Sản Phẩm Bán Chạy
          </h3>

          {loadingOverview ? (
            <div className="custom-top-list">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="custom-top-item skeleton-top-item">
                  <div className="skeleton-img"></div>
                  <div className="ct-content">
                    <div className="skeleton-line" style={{ width: "70%" }}></div>
                    <div className="skeleton-line" style={{ width: "40%", height: "8px" }}></div>
                  </div>
                </div>
              ))}
            </div>
          ) : topProducts.length > 0 ? (
            <div className="custom-top-list">
              {topProducts.map((product, index) => (
                <div key={index} className="custom-top-item">
                  <img
                    src={product.image ? `http://localhost:8080/images/${product.image}` : "/placeholder.png"}
                    alt={product.productName}
                    className="ct-image"
                    onError={(e) => {
                      e.target.src = "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=100&auto=format&fit=crop&q=60";
                    }}
                  />

                  <div className="ct-content">
                    <div className="ct-product-name">{product.productName}</div>
                    <div className="ct-progress-bg">
                      <div
                        className="ct-progress-fill"
                        style={{ width: `${Math.min(product.percentage, 100)}%` }}
                      ></div>
                    </div>
                    <div className="ct-subinfo">
                      <span>Đã bán: <b>{product.quantity || 0}</b></span>
                      <span className={product.status === "active" ? "ct-status-active" : "ct-status-inactive"}>
                        {product.status === "active" ? "Đang bán" : "Tạm ngưng"}
                      </span>
                    </div>
                  </div>

                  <div className="ct-percentage">{product.percentage}%</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state-text">
              <i className="fa-solid fa-mug-hot me-2"></i> Chưa có dữ liệu sản phẩm
            </div>
          )}
        </div>
      </div>

      {/* TÍNH NĂNG 4.2: THỐNG KÊ CƠ CẤU KÊNH BÁN HÀNG (POS VS DELIVERY) */}
      <div className="channel-stats-card">
        <div className="channel-stats-header">
          <div>
            <h3 className="section-title mb-1">
              Cơ Cấu Kênh Bán Hàng (POS Tại Quầy vs Online Giao Hàng)
            </h3>
            <p className="section-subtitle">
              So sánh tỷ trọng đơn hàng và doanh thu giữa khách mua trực tiếp tại quán và đặt giao tận nơi
            </p>
          </div>
          <div className="channel-stats-period-badge">
            {selectedMonth === "all" ? `Năm ${selectedYear}` : `Tháng ${selectedMonth}/${selectedYear}`}
          </div>
        </div>

        {loadingChannels ? (
          <div className="channel-skeleton">
            <div className="skeleton-line" style={{ height: "40px", marginBottom: "15px" }}></div>
            <div className="skeleton-grid">
              <div className="skeleton-card" style={{ height: "90px" }}></div>
              <div className="skeleton-card" style={{ height: "90px" }}></div>
            </div>
          </div>
        ) : (
          <div className="channel-stats-body">
            {/* Thanh tỷ trọng Segmented Bar */}
            <div className="channel-ratio-bar-wrapper">
              {(() => {
                const totalRevenue = (channelStats?.posRevenue || 0) + (channelStats?.deliveryRevenue || 0);
                const posPercent = totalRevenue > 0 ? (channelStats?.posRevenuePercentage ?? 0) : 0;
                const deliveryPercent = totalRevenue > 0 ? (channelStats?.deliveryRevenuePercentage ?? 0) : 0;

                if (totalRevenue === 0) {
                  return (
                    <div className="channel-ratio-bar empty-bar">
                      <span className="channel-empty-label">
                        <i className="fa-solid fa-circle-info me-1"></i> Chưa phát sinh doanh thu trong kỳ này
                      </span>
                    </div>
                  );
                }

                return (
                  <div className="channel-ratio-bar">
                    {posPercent > 0 && (
                      <div
                        className="channel-bar-seg pos-seg"
                        style={{
                          width: `${posPercent}%`,
                          borderRadius: deliveryPercent === 0 ? "13px" : "13px 0 0 13px",
                        }}
                        title={`Bán tại quầy: ${posPercent}% (${formatCurrency(channelStats?.posRevenue)})`}
                      >
                        {posPercent >= 8 && `${posPercent}%`}
                      </div>
                    )}
                    {deliveryPercent > 0 && (
                      <div
                        className="channel-bar-seg delivery-seg"
                        style={{
                          width: `${deliveryPercent}%`,
                          borderRadius: posPercent === 0 ? "13px" : "0 13px 13px 0",
                        }}
                        title={`Giao hàng trực tuyến: ${deliveryPercent}% (${formatCurrency(channelStats?.deliveryRevenue)})`}
                      >
                        {deliveryPercent >= 8 && `${deliveryPercent}%`}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Chi tiết 2 kênh */}
            <div className="channel-cards-grid">
              {/* Kênh POS */}
              <div className="channel-box pos-box">
                <div className="channel-box-icon">
                  <FaCashRegister />
                </div>
                <div className="channel-box-content">
                  <div className="channel-box-header">
                    <h4>Bán Tại Quầy (POS)</h4>
                    <span className="channel-badge pos-badge">
                      {channelStats?.posRevenuePercentage || 0}% Doanh thu
                    </span>
                  </div>
                  <div className="channel-box-metrics">
                    <div>
                      <span className="metric-label">Doanh thu</span>
                      <strong className="metric-value">
                        {formatCurrency(channelStats?.posRevenue)}
                      </strong>
                    </div>
                    <div>
                      <span className="metric-label">Số đơn hàng</span>
                      <strong className="metric-value">
                        {(channelStats?.posOrders || 0).toLocaleString("vi-VN")} đơn
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Kênh Giao hàng Delivery */}
              <div className="channel-box delivery-box">
                <div className="channel-box-icon">
                  <FaMotorcycle />
                </div>
                <div className="channel-box-content">
                  <div className="channel-box-header">
                    <h4>Giao Hàng Trực Tuyến (Online Delivery)</h4>
                    <span className="channel-badge delivery-badge">
                      {channelStats?.deliveryRevenuePercentage || 0}% Doanh thu
                    </span>
                  </div>
                  <div className="channel-box-metrics">
                    <div>
                      <span className="metric-label">Doanh thu</span>
                      <strong className="metric-value">
                        {formatCurrency(channelStats?.deliveryRevenue)}
                      </strong>
                    </div>
                    <div>
                      <span className="metric-label">Số đơn hàng</span>
                      <strong className="metric-value">
                        {(channelStats?.deliveryOrders || 0).toLocaleString("vi-VN")} đơn
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* TÍNH NĂNG 4.1: BẢNG SO SÁNH HIỆU QUẢ CÁC CHI NHÁNH (DÀNH CHO SUPER ADMIN) */}
      {isSuperAdmin && (
        <div className="store-benchmark-section">
          <div className="benchmark-header">
            <div>
              <h3 className="section-title mb-1">
                Bảng Xếp Hạng Hiệu Quả Các Chi Nhánh Toàn Chuỗi (Store Benchmarking)
              </h3>
              <p className="section-subtitle">
                Đánh giá và so sánh năng lực tạo doanh thu giữa các cơ sở trong hệ thống
              </p>
            </div>
            <span className="benchmark-count-badge">
              {storeComparison.length} Chi nhánh
            </span>
          </div>

          {loadingComparison ? (
            <div className="benchmark-skeleton">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skeleton-line" style={{ height: "55px", marginBottom: "10px" }}></div>
              ))}
            </div>
          ) : storeComparison.length > 0 ? (
            <div className="benchmark-table-wrapper">
              <table className="benchmark-table">
                <thead>
                  <tr>
                    <th style={{ width: "70px", textAlign: "center" }}>Hạng</th>
                    <th>Chi Nhánh</th>
                    <th>Địa Chỉ</th>
                    <th style={{ textAlign: "right" }}>Số Đơn Hàng</th>
                    <th style={{ textAlign: "right" }}>Tổng Doanh Thu</th>
                    <th style={{ width: "220px" }}>Thị Phần Toàn Hệ Thống</th>
                    <th style={{ textAlign: "center", width: "120px" }}>Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {storeComparison.map((item, index) => {
                    const isTop1 = index === 0;
                    const isTop2 = index === 1;
                    const isTop3 = index === 2;

                    return (
                      <tr key={item.storeId} className={selectedStoreId === item.storeId ? "row-highlighted" : ""}>
                        <td style={{ textAlign: "center" }}>
                          <span className={`rank-badge ${isTop1 ? "rank-1" : isTop2 ? "rank-2" : isTop3 ? "rank-3" : "rank-other"}`}>
                            {index + 1}
                          </span>
                        </td>
                        <td>
                          <div className="store-cell-name">
                            <span className="store-name-text">{item.storeName}</span>
                            {selectedStoreId === item.storeId && (
                              <span className="badge-viewing">Đang lọc</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className="store-cell-addr" title={item.address}>
                            {item.address || "Chưa cập nhật địa chỉ"}
                          </span>
                        </td>
                        <td style={{ textAlign: "right", fontWeight: 600 }}>
                          {(item.ordersCount || 0).toLocaleString("vi-VN")} đơn
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <span className="store-rev-highlight">
                            {formatCurrency(item.revenue)}
                          </span>
                        </td>
                        <td>
                          <div className="share-progress-wrapper">
                            <div className="share-progress-bar">
                              <div
                                className="share-progress-fill"
                                style={{ width: `${Math.min(item.sharePercentage || 0, 100)}%` }}
                              ></div>
                            </div>
                            <span className="share-percentage-label">
                              {item.sharePercentage || 0}%
                            </span>
                          </div>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <button
                            type="button"
                            className="btn-select-store"
                            onClick={() => setSelectedStoreId(item.storeId)}
                          >
                            Xem chi tiết
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state-text">
              <i className="fa-solid fa-store-slash me-2"></i> Không có dữ liệu hoạt động của các chi nhánh trong kỳ này.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
