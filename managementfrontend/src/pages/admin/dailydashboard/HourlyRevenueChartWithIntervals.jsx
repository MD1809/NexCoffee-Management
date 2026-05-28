import React, { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Hàm lấy chuỗi ngày hiện tại để so sánh
const getLocalDateString = (dateObj = new Date()) => {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Hàm nhóm dữ liệu: Vẽ đủ 24h, nhưng gán `null` cho giờ tương lai
const groupRevenueByHourIntervals = (hourlyData, intervalSize, selectedDate) => {
  const intervals = [];
  const isToday = selectedDate === getLocalDateString(new Date());
  const currentHour = new Date().getHours();

  for (let i = 0; i < 24; i += intervalSize) {
    const endHour = Math.min(i + intervalSize, 24);
    const label = `${i.toString().padStart(2, '0')}-${endHour.toString().padStart(2, '0')}h`;

    // Nếu là hôm nay và khoảng giờ bắt đầu (i) lớn hơn giờ hiện tại -> Chưa xảy ra
    if (isToday && i > currentHour) {
      intervals.push({
        interval: label,
        revenue: null, // Gán null để Recharts ngừng vẽ đường xanh tại đây
      });
    } else {
      // Nếu là giờ đã qua hoặc hiện tại -> Tính tổng bình thường
      const totalRevenue = hourlyData
        .slice(i, endHour)
        .reduce((sum, data) => sum + data.revenue, 0);

      intervals.push({
        interval: label,
        revenue: totalRevenue,
      });
    }
  }
  return intervals;
};

// Custom Tooltip nền tối
const CustomTooltip = ({ active, payload, label }) => {
  // Chỉ hiển thị Tooltip nếu có dữ liệu (bỏ qua các vùng null)
  if (active && payload && payload.length && payload[0].value !== null) {
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };
    
    return (
      <div style={{ 
        backgroundColor: "#333", 
        color: "#fff", 
        padding: "10px", 
        borderRadius: "6px", 
        border: "none"
      }}>
        <p style={{ margin: "0 0 4px 0", fontSize: "14px", color: "#ccc" }}>
          Khung giờ: {label}
        </p>
        <p style={{ margin: 0, fontWeight: "bold", fontSize: "14px" }}>
          Doanh thu: {formatCurrency(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

const HourlyRevenueChartWithIntervals = ({ data, selectedDate }) => {
  const chartData = useMemo(() => {
    return groupRevenueByHourIntervals(data, 3, selectedDate);
  }, [data, selectedDate]);

  const formatYAxis = (value) => {
    return `${value / 1000}k`;
  };

  return (
    <div style={{ width: "100%", height: 350 }}>
      <ResponsiveContainer width="100%" height="100%" minHeight={350}>
        <AreaChart
          data={chartData}
          margin={{ top: 20, right: 20, bottom: 5, left: 20 }}
        >
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--sidebar-active-dark)" stopOpacity={0.6} />
              <stop offset="95%" stopColor="var(--sidebar-active-dark)" stopOpacity={0.05} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-primary-color)" opacity={0.4} />

          <XAxis 
            dataKey="interval" 
            tick={{ fill: "var(--text-secondary)" }} 
            padding={{ left: 30, right: 30 }}
            axisLine={false} 
            tickLine={false} 
            minTickGap={16}
            interval={0}
          />
          <YAxis 
            tickFormatter={formatYAxis} 
            width={50}
            tick={{ fill: "var(--text-secondary)" }} 
            axisLine={false} 
            tickLine={false} 
          />

          <Tooltip content={<CustomTooltip />} />

          {/* connectNulls={false} đảm bảo đường vẽ bị đứt khi gặp giá trị null */}
          <Area 
            type="monotone"
            dataKey="revenue" 
            name="Doanh thu"
            stroke="var(--sidebar-active-dark)"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorRevenue)"
            connectNulls={false} 
            activeDot={{ r: 6, strokeWidth: 0, fill: "var(--sidebar-active-dark)" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default HourlyRevenueChartWithIntervals;