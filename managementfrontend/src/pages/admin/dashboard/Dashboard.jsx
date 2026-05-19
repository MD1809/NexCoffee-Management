import React, { useState, useEffect } from "react";
import { FaDollarSign, FaShoppingCart, FaUsers, FaBox } from "react-icons/fa";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
} from "recharts";

import "./Dashboard.css";
import dashboardApi from "../../../apis/DashboardApi";
import StatCard from "../../../components/admin/statCard/StatCard";

const Dashboard = () => {
  // States lưu dữ liệu
  const [overview, setOverview] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    productsSold: 0,
  });
  const [revenueData, setRevenueData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // States cho Bộ lọc
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear().toString(),
  ); // Mặc định năm nay
  const [selectedMonth, setSelectedMonth] = useState("all"); 

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // 2. LẤY DỮ LIỆU TỔNG QUAN & TOP SẢN PHẨM
  const fetchGeneralData = async () => {
    try {
      // Đợi cả 2 API chạy xong
      const [resOverview, resTopProducts] = await Promise.all([
        dashboardApi.getOverview(),
        dashboardApi.getTopProducts(),
      ]);

      // Axios bọc dữ liệu trong .data
      setOverview(resOverview.data);
      setTopProducts(resTopProducts.data);
    } catch (error) {
      console.error("Lỗi tải dữ liệu chung:", error);
    }
  };

  useEffect(() => {
    fetchGeneralData();
  }, []);

  // 3. LẤY DỮ LIỆU BIỂU ĐỒ
  const fetchChartData = async () => {
    try {
      setLoading(true);
      let response;
      let isDaily = false;

      // Gọi API
      if (selectedMonth === "all") {
        response = await dashboardApi.getRevenueByYear(selectedYear);
      } else {
        response = await dashboardApi.getRevenueByMonth(selectedYear, selectedMonth);
        isDaily = true;
      }

      const dataJson = response.data;

      // Lấy thời gian thực tế hiện tại để so sánh
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1;
      const currentDay = currentDate.getDate();

      // Ép kiểu Selected Year và Month về số nguyên để so sánh
      const selYear = parseInt(selectedYear);
      const selMonth = selectedMonth !== "all" ? parseInt(selectedMonth) : null;

      if (Array.isArray(dataJson)) {
        const formattedData = dataJson.map((item) => {
          let isFuture = false;

          // Kiểm tra xem mốc thời gian đang lặp có phải là tương lai không
          if (isDaily) {
            // Đang xem theo ngày
            if (selYear > currentYear) {
              isFuture = true;
            } else if (selYear === currentYear && selMonth > currentMonth) {
              isFuture = true;
            } else if (selYear === currentYear && selMonth === currentMonth && item.day > currentDay) {
              isFuture = true; // Ngày lớn hơn ngày hôm nay
            }
          } else {
            // Đang xem theo tháng (cả năm)
            if (selYear > currentYear) {
              isFuture = true;
            } else if (selYear === currentYear && item.month > currentMonth) {
              isFuture = true; // Tháng lớn hơn tháng hiện tại
            }
          }

          return {
            name: isDaily ? item.day.toString() : `Tháng ${item.month}`,
            // Nếu là tương lai -> trả về null để Recharts cắt đứt đường kẻ tại đây
            // Nếu là quá khứ/hiện tại -> giữ nguyên doanh thu
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
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChartData();
  }, [selectedYear, selectedMonth]);

  if (loading)
    return (
      <div style={{ padding: "20px", color: "var(--text-primary)" }}>
        Đang tải dữ liệu...
      </div>
    );

  return (
    <div className="dashboard-container">
      <h2 className="dashboard-title">Tổng Quan Cửa Hàng</h2>

      <div className="overview-cards">
        <StatCard
          title="Tổng Doanh Thu"
          value={formatCurrency(overview.totalRevenue)}
          IconComponent={FaDollarSign}
          colorTheme="revenue"
        />

        <StatCard
          title="Tổng Đơn Hàng"
          value={overview.totalOrders}
          IconComponent={FaShoppingCart}
          colorTheme="orders"
        />

        <StatCard
          title="Tổng sản phẩm" 
          value={overview.productsSold}
          IconComponent={FaBox}
          colorTheme="products"
        />
        
        <StatCard
          title="Khách Hàng"
          value={overview.totalCustomers}
          IconComponent={FaUsers}
          colorTheme="customers"
        />
      </div>

      {/* Khu vực Biểu đồ và Top Sản phẩm */}
      <div className="dashboard-main">
        <div className="chart-section">
          {/* TIÊU ĐỀ & BỘ LỌC */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
              borderBottom: "1px solid var(--border-primary-color)",
              paddingBottom: "10px",
            }}
          >
            <h3
              className="section-title"
              style={{
                borderBottom: "none",
                marginBottom: 0,
                paddingBottom: 0,
              }}
            >
              Biểu Đồ Doanh Thu
            </h3>

            <div style={{ display: "flex", gap: "10px" }}>
              {/* Dropdown chọn Tháng */}
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  backgroundColor: "var(--bg-secondary)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border-primary-color)",
                  outline: "none",
                }}
              >
                <option value="all">Cả năm</option>
                {[...Array(12).keys()].map((i) => (
                  <option key={i + 1} value={i + 1}>
                    Tháng {i + 1}
                  </option>
                ))}
              </select>

              {/* Dropdown chọn Năm */}
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  backgroundColor: "var(--bg-secondary)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border-primary-color)",
                  outline: "none",
                }}
              >
                <option value="2024">Năm 2024</option>
                <option value="2025">Năm 2025</option>
                <option value="2026">Năm 2026</option>
              </select>
            </div>
          </div>

          {/* VẼ BIỂU ĐỒ */}
          <div style={{ width: "100%", height: 350 }}>
            <ResponsiveContainer width="100%" height="100%" minHeight={350}>
              <AreaChart
                data={revenueData}
                margin={{ top: 20, right: 20, bottom: 5, left: 20 }}
              >
                {/* 1. Định nghĩa màu Gradient đổ bóng (nhạt dần xuống dưới) */}
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--sidebar-active-dark)"
                      stopOpacity={0.6}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--sidebar-active-dark)"
                      stopOpacity={0.05}
                    />
                  </linearGradient>
                </defs>

                {/* 2. Lưới biểu đồ (làm mờ đi để giống ảnh) */}
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--border-primary-color)"
                  opacity={0.4}
                />

                {/* 3. Trục X và Y (Bỏ đường viền trục) */}
                <XAxis
                  dataKey="name"
                  tick={{ fill: "var(--text-secondary)" }}
                  padding={{ left: 30, right: 30 }}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={16}
                  interval={0}
                />
                <YAxis
                  hide={true}
                  tickFormatter={(value) => `${value.toLocaleString("vi-VN")}đ`}
                  width={80}
                  tick={{ fill: "var(--text-secondary)" }}
                  axisLine={false}
                  tickLine={false}
                />

                {/* 4. Tooltip nền tối màu giống y hệt ảnh */}
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: "#333",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    padding: "10px",
                  }}
                  itemStyle={{ color: "#fff" }}
                  labelStyle={{
                    display: "none",
                  }} /* Ẩn chữ tiêu đề (Ngày/Tháng) mặc định để format gộp vào formatter nếu cần, hoặc để nguyên tùy ý */
                />

                {/* 5. Vẽ biểu đồ vùng (Area) với đường cong mềm (monotone) */}
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Doanh thu"
                  stroke="var(--sidebar-active-dark)"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorRevenue)" /* Gọi lại màu gradient đã định nghĩa ở trên */
                  activeDot={{
                    r: 6,
                    strokeWidth: 0,
                    fill: "var(--sidebar-active-dark)",
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cột phải: Top Sản Phẩm */}
        <div className="top-products-section">
          <h3 className="section-title">Sản phẩm bán chạy nhất</h3>

          {topProducts.length > 0 ? (
            <div className="custom-top-list">
              {topProducts.map((product, index) => (
                <div key={index} className="custom-top-item">
                  {/* 1. Hình ảnh sản phẩm */}
                  {/* Lưu ý: Thay đổi đường dẫn ảnh cho phù hợp với cấu trúc thư mục chứa ảnh thực tế của bạn */}
                  <img
                    src={`http://localhost:8080/images/${product.image}`}
                    alt={product.name}
                    style={{
                      width: "60px",
                      height: "60px",
                      objectFit: "cover",
                      borderRadius: "4px",
                    }}
                  />

                  {/* 2. Cột giữa: Tên, Thanh phần trăm, Trạng thái */}
                  <div className="ct-content">
                    <div className="ct-product-name">{product.productName}</div>

                    <div className="ct-progress-bg">
                      <div
                        className="ct-progress-fill"
                        style={{ width: `${product.percentage}%` }}
                      ></div>
                    </div>

                    <div className="ct-status">
                      Trạng thái:{" "}
                      <span
                        className={
                          product.status === "active"
                            ? "ct-status-active"
                            : "ct-status-inactive"
                        }
                      >
                        {product.status === "active"
                          ? "đang kinh doanh"
                          : "ngừng kinh doanh"}
                      </span>
                    </div>
                  </div>

                  {/* 3. Cột phải: Tỉ lệ phần trăm */}
                  <div className="ct-percentage">{product.percentage}%</div>
                </div>
              ))}
            </div>
          ) : (
            <p
              style={{
                color: "var(--text-secondary)",
                textAlign: "center",
                marginTop: "20px",
              }}
            >
              Chưa có dữ liệu
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
