import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import orderApi from "../../../apis/OrderApi";
import DataTable from "../../../components/admin/dataTable/DataTable";
import SearchBox from "../../../components/admin/searchBox/SearchBox";
import DropDown from "../../../components/admin/dropDown/Dropdown";
import "./Order.css";

function Order() {
  const navigate = useNavigate();

  const [todayOrders, setTodayOrders] = useState([]);
  const [historyOrders, setHistoryOrders] = useState([]);

  const [activeTabToday, setActiveTabToday] = useState("Tất cả");
  const [searchToday, setSearchToday] = useState("");

  const [activeTabHistory, setActiveTabHistory] = useState("Tất cả");
  const [searchHistory, setSearchHistory] = useState("");
  const [filterDate, setFilterDate] = useState("");

  const tabs = [
    "Tất cả",
    "Chờ xác nhận",
    "Đang xử lý",
    "Đang giao",
    "Thành công",
    "Đã hủy",
  ];

  const statusMapping = {
    "Chờ xác nhận": "Pending",
    "Đang xử lý": "Processing",
    "Đang giao": "Shipped",
    "Thành công": "Completed",
    "Đã hủy": "Cancelled",
  };

  const dropdownOptions = tabs.map((tab) => ({
    label: tab,
    value: tab,
  }));

  useEffect(() => {
    fetchTodayOrders();
  }, []);

  useEffect(() => {
    fetchHistoryOrders();
  }, [filterDate]);

  const fetchTodayOrders = async () => {
    try {
      const response = await orderApi.getToday();
      if (response && response.data) setTodayOrders(response.data);
    } catch (error) {
      console.error("Lỗi tải đơn hôm nay:", error);
      setTodayOrders([]);
    }
  };

  const fetchHistoryOrders = async () => {
    try {
      const response = await orderApi.getAll(filterDate);
      if (response && response.data) setHistoryOrders(response.data);
    } catch (error) {
      console.error("Lỗi tải lịch sử:", error);
      setHistoryOrders([]);
    }
  };

  const tableColumns = [
    { header: "Mã Đơn", accessor: "code" },
    { header: "Khách Hàng", accessor: "customerName" },
    {
      header: "Ngày Đặt",
      accessor: "createdAt",
      render: (row) =>
        new Date(row.createdAt).toLocaleDateString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
    },
    {
      header: "Tổng Tiền",
      accessor: "total",
      render: (row) => `${row.total.toLocaleString("vi-VN")} đ`,
    },
    {
      header: "Trạng Thái",
      accessor: "status",
      render: (row) => {
        let badgeClass = "";
        let statusText = "";
        switch (row.status) {
          case "Completed":
            badgeClass = "ord-badge ord-badge-completed";
            statusText = "Thành công";
            break;
          case "Cancelled":
            badgeClass = " ord-badge ord-badge-cancelled";
            statusText = "Đã hủy";
            break;
          case "Pending":
            badgeClass = "ord-badge ord-badge-warning";
            statusText = "Chờ xác nhận";
            break;
          case "Processing":
            badgeClass = "ord-badge ord-badge-info";
            statusText = "Đang xử lý";
            break;
          case "Shipped":
            badgeClass = "ord-badge ord-badge-primary";
            statusText = "Đang giao";
            break;
          default:
            badgeClass = "ord-badge ord-badge-default";
            statusText = row.status;
        }
        return (
          <span className={`status-badge ${badgeClass}`}>{statusText}</span>
        );
      },
    },
    {
      header: "Thanh Toán",
      accessor: "paymentStatus",
      render: (row) => {
        if (row.paymentStatus === "paid")
          return (
            <span className="ord-badge ord-badge-paid">Đã thanh toán</span>
          );
        if (row.paymentStatus === "refunded")
          return (
            <span className="ord-badge ord-badge-refunded">Đã hoàn tiền</span>
          );
        return (
          <span className="ord-badge ord-badge-unpaid">Chưa thanh toán</span>
        );
      },
    },
    {
      header: "Thao tác",
      render: (row) => (
        <div className="action-buttons">
          <i
            className="fa-regular fa-eye btn-icon btn-icon--view"
            onClick={() => navigate(`detail/${row.id}`)}
          ></i>
        </div>
      ),
    },
  ];

  // lọc dữ liệu 2 bảng
  const safeToday = Array.isArray(todayOrders) ? todayOrders : [];
  const filteredToday =
    activeTabToday === "Tất cả"
      ? safeToday
      : safeToday.filter(
          (o) => o && o.status === statusMapping[activeTabToday],
        );

  const safeHistory = Array.isArray(historyOrders) ? historyOrders : [];
  const filteredHistory =
    activeTabHistory === "Tất cả"
      ? safeHistory
      : safeHistory.filter(
          (o) => o && o.status === statusMapping[activeTabHistory],
        );
  
  // thông kê đơn hàng hôm nay
  const successTodayCount = safeToday.filter(
    (o) => o && o.status?.toLowerCase() === "completed",
).length;

const canceledTodayCount = safeToday.filter(
    (o) => o && o.status?.toLowerCase() === "cancelled",
).length;

  return (
    <div className="container">
      {/* <div className="container-header">
        <h1 className="container-header__title">Tổng quan đơn hàng</h1>
        <p className="container-header__desc">Quản lý và tra cứu toàn bộ hoạt động kinh doanh.</p>
      </div>


      {/* Bảng đơn hàng trong ngày */}
      <div className="section-today">
        <div className="header">
          <div className="header-info">
            <h1 className="title">Đơn hàng trong hôm nay</h1>
            <p className="desc">
              Theo dõi và quản lý các đơn hàng trong ngày hôm nay.
            </p>
          </div>

          <div className="stats-container">
            <div className="stat-card">
              <p className="stat-title">Tình trạng đơn hàng hôm nay</p>
              <div className="stat-value">
                <p className="stat-value--success">
                  {successTodayCount} <span>đơn thành công</span>
                </p>
                <p className="stat-value--canceled">
                  {canceledTodayCount} <span>đơn bị hủy</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div
          className="section-today__toolbar"
        >
          <SearchBox
            value={searchToday}
            onChange={(e) => setSearchToday(e.target.value)}
          />
        </div>

        <div className="tabs-container">
          {tabs.map((tab) => (
            <button
              key={`today-${tab}`}
              onClick={() => setActiveTabToday(tab)}
              className={`tab-button ${activeTabToday === tab ? "active" : ""}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="table-wrapper">
          <DataTable
            columns={tableColumns}
            data={filteredToday}
            itemsPerPage={5}
            searchQuery={searchToday}
          />
        </div>
      </div>

      <hr style={{ margin: "30px 0", border: "1px solid var(--border-primary-color)" }} />

      {/* Bảng lịch sử các đơn hàng */}
      <div className="section-history">
        <h2>
          Lịch Sử Đơn Hàng
        </h2>

        <div
          className="section-history__toolbar"
        >
          <SearchBox
            value={searchHistory}
            onChange={(e) => setSearchHistory(e.target.value)}
          />

          <div
            className="section-history__filter"
          >
            <input
              type="date"
              className="section-history__datefilter"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
             <DropDown
              options={dropdownOptions}
              defaultValue="Tất cả"
              placeholder="Lọc trạng thái"
              onChange={(selected) => setActiveTabHistory(selected.value)}
            />
          </div>
        </div>

        <div className="table-wrapper">
          <DataTable
            columns={tableColumns}
            data={filteredHistory}
            itemsPerPage={10}
            searchQuery={searchHistory}
          />
        </div>
      </div>
    </div>
  );
}

export default Order;
