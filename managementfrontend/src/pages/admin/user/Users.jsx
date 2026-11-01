import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";

import userApi from "../../../apis/userApi";
import UserFormModal from "./UserFormModal";
import "./Users.css";

import SearchBox from "../../../components/admin/searchBox/SearchBox";
import Button from "../../../components/admin/button/Button";
import DataTable from "../../../components/admin/dataTable/DataTable";
import { getCurrentUser } from "../../../utils/authStorage";
import { getAllStores } from "../../../apis/storeApi";

const roleTranslations = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Quản trị viên",
  STAFF: "Nhân viên",
  CUSTOMER: "Khách hàng",
  SHIPPER: "Người giao hàng",
};

const initialFormData = {
  fullName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  role: "CUSTOMER",
  status: "ACTIVE",
  storeId: "",
};

const TIME_RANGE_OPTIONS = [
  { key: "TODAY", label: "Hôm nay" },
  { key: "7_DAYS", label: "7 ngày qua" },
  { key: "THIS_MONTH", label: "Tháng này" },
  { key: "ALL", label: "Toàn thời gian" },
];

function Users() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [timeRange, setTimeRange] = useState("TODAY");
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // State quản lý Modal thêm / sửa
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState(initialFormData);

  // State Detail
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [viewingUser, setViewingUser] = useState(null);
  const [staffDetailData, setStaffDetailData] = useState(null);
  const [loadingStaffDetail, setLoadingStaffDetail] = useState(false);

  const currentUser = getCurrentUser();
  const currentRole = currentUser?.role;
  const isSuperAdmin = currentRole === "SUPER_ADMIN";
  const isAdmin = currentRole === "ADMIN";

  const roleFilterOptions = isAdmin
    ? [
        { label: "Tất cả vai trò", value: "ALL" },
        { label: "Nhân viên", value: "STAFF" },
        { label: "Người giao hàng", value: "SHIPPER" },
      ]
    : [
        { label: "Tất cả vai trò", value: "ALL" },
        { label: "Super Admin", value: "SUPER_ADMIN" },
        { label: "Quản trị viên", value: "ADMIN" },
        { label: "Nhân viên", value: "STAFF" },
        { label: "Người giao hàng", value: "SHIPPER" },
        { label: "Khách hàng", value: "CUSTOMER" },
      ];

  const filteredUsers = users.filter((user) => {
    if (roleFilter === "ALL") return true;
    return user.role === roleFilter;
  });

  const [stores, setStores] = useState([]);

  useEffect(() => {
    fetchUsers();
  }, [timeRange]);

  useEffect(() => {
    if (isSuperAdmin) {
      fetchStores();
    }
  }, []);

  const fetchStores = async () => {
    try {
      const data = await getAllStores();
      setStores(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Lỗi tải cửa hàng:", error);
      toast.error("Không thể tải danh sách cửa hàng.");
    }
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      if (isAdmin) {
        const response = await userApi.getStaffStats(timeRange);
        setUsers(Array.isArray(response.data) ? response.data : []);
      } else {
        const response = await userApi.getAll();
        setUsers(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error("Lỗi:", error);
      toast.error(
        isAdmin
          ? "Không thể tải danh sách nhân viên."
          : "Không thể tải danh sách người dùng."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = (data, isEdit) => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{10}$/;

    if (!data.fullName?.trim())
      errors.fullName = "Họ và tên không được để trống";
    if (!data.email?.trim()) errors.email = "Email không được để trống";
    else if (!emailRegex.test(data.email))
      errors.email = "Định dạng email không hợp lệ";

    if (!data.phone?.trim()) errors.phone = "Số điện thoại không được để trống";
    else if (!phoneRegex.test(data.phone))
      errors.phone = "Số điện thoại phải có 10 chữ số";

    if (!isEdit) {
      if (!data.password) errors.password = "Mật khẩu không được để trống";
      else if (data.password.length < 8)
        errors.password = "Mật khẩu phải ít nhất 8 ký tự";
      if (data.password !== data.confirmPassword)
        errors.confirmPassword = "Xác nhận mật khẩu không khớp";
    }

    if (!data.role) errors.role = "Vui lòng chọn vai trò";

    if (isAdmin && !["STAFF", "SHIPPER"].includes(data.role)) {
      errors.role =
        "Admin chỉ được tạo hoặc sửa tài khoản nhân viên của cửa hàng mình";
    }

    if (
      isSuperAdmin &&
      storeRequiredRoles.includes(data.role) &&
      !data.storeId
    ) {
      errors.storeId = "Vui lòng chọn cửa hàng cho tài khoản này";
    }
    return errors;
  };

  // --- ACTIONS ---

  const storeRequiredRoles = ["ADMIN", "STAFF", "SHIPPER"];

  const handleOpenAdd = () => {
    setFormData({
      ...initialFormData,
      role: isAdmin ? "STAFF" : "CUSTOMER",
      storeId: isAdmin ? (currentUser?.storeId || "") : "",
    });
    setIsEditMode(false);
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (user) => {
    setFormData({
      ...user,
      password: "",
      confirmPassword: "",
      storeId: user.storeId || "",
    });

    setIsEditMode(true);
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsFormModalOpen(false);
    setFormErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const nextData = {
        ...prev,
        [name]: value,
      };

      if (name === "role" && !storeRequiredRoles.includes(value)) {
        nextData.storeId = "";
      }

      return nextData;
    });
  };

  const handleClearError = (fieldName) => {
    setFormErrors((prev) => ({ ...prev, [fieldName]: "" }));
  };

  const handleSubmit = async () => {
    const errors = validateForm(formData, isEditMode);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      const dataToSend = {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: formData.role,
        status: formData.status,
        isVerified: formData.isVerified ?? true,
        store:
          isSuperAdmin &&
          storeRequiredRoles.includes(formData.role) &&
          formData.storeId
            ? { id: Number(formData.storeId) }
            : null,
      };

      if (isEditMode) {
        await userApi.update(formData.id, dataToSend);
        toast.success("Cập nhật thành công!");
      } else {
        await userApi.create(dataToSend);
        toast.success(
          isAdmin
            ? "Thêm nhân viên mới thành công!"
            : "Thêm người dùng thành công!"
        );
      }

      fetchUsers();
      handleCloseModal();
    } catch (error) {
      console.error("Lỗi:", error.response?.data);
      const serverError = error.response?.data;

      if (serverError?.errors) setFormErrors(serverError.errors);
      else if (serverError?.message) {
        const msg = serverError.message;
        if (msg.includes("Email")) setFormErrors({ email: msg });
        else if (msg.includes("Số điện thoại")) setFormErrors({ phone: msg });
        else toast.error(msg);
      } else {
        toast.error("Có lỗi xảy ra, vui lòng thử lại!");
      }
    }
  };

  const handleToggleStatus = async (user) => {
    const nextStatus = user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      const updatedData = {
        ...user,
        status: nextStatus,
        isVerified: user.isVerified ?? false,
      };
      await userApi.update(user.id, updatedData);
      setUsers(
        users.map((u) =>
          u.id === user.id ? { ...u, status: nextStatus } : u
        )
      );
      toast.success(
        `Đã ${nextStatus === "ACTIVE" ? "mở khóa" : "khóa"} tài khoản thành công!`
      );
    } catch (error) {
      console.error("Lỗi thay đổi trạng thái:", error);
      toast.error("Không thể thay đổi trạng thái!");
    }
  };

  const handleOpenDetail = async (user) => {
    setViewingUser(user);
    setIsDetailModalOpen(true);
    setStaffDetailData(null);

    if (isAdmin) {
      setLoadingStaffDetail(true);
      try {
        const res = await userApi.getStaffDetail(user.id, timeRange);
        setStaffDetailData(res.data);
      } catch (err) {
        console.error("Lỗi tải chi tiết nhân viên:", err);
      } finally {
        setLoadingStaffDetail(false);
      }
    }
  };

  const formatCurrency = (val) => {
    if (!val && val !== 0) return "0 ₫";
    return Number(val).toLocaleString("vi-VN") + " ₫";
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return (
      d.toLocaleDateString("vi-VN") +
      " " +
      d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
    );
  };

  // --- CẤU HÌNH BẢNG CHO ADMIN (QUẢN LÝ NHÂN VIÊN) ---
  const columnsStaffAdmin = [
    { header: "ID", accessor: "id", className: "td-id" },
    {
      header: "Nhân viên",
      accessor: "fullName",
      render: (row) => (
        <div className="staff-cell-info">
          <div className="staff-fullname">{row.fullName}</div>
          <div className="staff-subtext">{row.email}</div>
        </div>
      ),
    },
    { header: "Số điện thoại", accessor: "phone", className: "td-phone" },
    {
      header: "Vai trò",
      accessor: "role",
      render: (row) => (
        <span className={`staff-role-badge staff-role-badge--${row.role?.toLowerCase()}`}>
          {roleTranslations[row.role] || row.role}
        </span>
      ),
    },
    {
      header: "Đơn bán (POS)",
      accessor: "posOrderCount",
      className: "td-metric",
      render: (row) => (
        <span className="staff-metric-number">
          {row.posOrderCount ?? 0}
        </span>
      ),
    },
    {
      header: "Đơn pha chế",
      accessor: "baristaOrderCount",
      className: "td-metric",
      render: (row) => (
        <span className="staff-metric-number">
          {row.baristaOrderCount ?? 0}
        </span>
      ),
    },
    {
      header: "Đơn giao",
      accessor: "deliveredOrderCount",
      className: "td-metric",
      render: (row) => (
        <span className="staff-metric-number">
          {row.deliveredOrderCount ?? 0}
        </span>
      ),
    },
    {
      header: "Trạng thái",
      accessor: "status",
      className: "td-status",
      render: (row) => (
        <span
          className={`status ${row.status === "ACTIVE" ? "status--active" : "status--locked"}`}
        >
          {row.status === "ACTIVE" ? "Hoạt động" : "Ngừng hoạt động"}
        </span>
      ),
    },
    {
      header: "Thao tác",
      render: (u) => (
        <div className="action-buttons">
          <i
            className="fa-regular fa-eye btn-icon btn-icon--view"
            onClick={() => handleOpenDetail(u)}
            title="Xem hồ sơ & hiệu suất"
          ></i>
          <i
            className="fa-regular fa-pen-to-square btn-icon btn-icon--edit"
            onClick={() => handleOpenEdit(u)}
            title="Chỉnh sửa thông tin"
          ></i>
          <i
            className={`fa-solid ${u.status === "ACTIVE" ? "fa-user-slash" : "fa-user-check"} btn-icon`}
            style={{ color: u.status === "ACTIVE" ? "#e74c3c" : "#2ecc71" }}
            onClick={() => handleToggleStatus(u)}
            title={u.status === "ACTIVE" ? "Khóa tài khoản" : "Mở khóa"}
          ></i>
        </div>
      ),
    },
  ];

  // --- CẤU HÌNH BẢNG CHO SUPER_ADMIN (TOÀN CHUỖI) ---
  const columnsSuperAdmin = [
    { header: "ID", accessor: "id", className: "td-id" },
    {
      header: "Người dùng",
      accessor: "fullName",
      render: (row) =>
        row.role === "CUSTOMER" ? (
          <Link
            to={`/admin/users/${row.id}`}
            style={{
              color: "#38bdf8",
              fontWeight: 600,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
            }}
            title="Xem hồ sơ chi tiết khách hàng"
          >
            <span>{row.fullName}</span>
            <i
              className="fa-solid fa-arrow-up-right-from-square"
              style={{ fontSize: "0.75rem", color: "#94a3b8" }}
            ></i>
          </Link>
        ) : (
          <span>{row.fullName}</span>
        ),
    },
    { header: "Email", accessor: "email" },
    { header: "Số điện thoại", accessor: "phone", className: "td-phone" },
    {
      header: "Vai trò",
      accessor: "role",
      render: (row) => roleTranslations[row.role] || row.role,
    },
    {
      header: "Cửa hàng",
      accessor: "storeName",
      render: (row) => row.storeName || "—",
    },
    {
      header: "Trạng thái",
      accessor: "status",
      className: "td-status",
      render: (row) => (
        <span
          className={`status ${row.status === "ACTIVE" ? "status--active" : "status--locked"}`}
        >
          {row.status === "ACTIVE" ? "Hoạt động" : "Ngừng hoạt động"}
        </span>
      ),
    },
    {
      header: "Thao tác",
      render: (u) => (
        <div className="action-buttons">
          <i
            className="fa-regular fa-eye btn-icon btn-icon--view"
            onClick={() => {
              if (u.role === "CUSTOMER") {
                navigate(`/admin/users/${u.id}`);
              } else {
                handleOpenDetail(u);
              }
            }}
            title="Xem chi tiết"
          ></i>
          <i
            className="fa-regular fa-pen-to-square btn-icon btn-icon--edit"
            onClick={() => handleOpenEdit(u)}
            title="Chỉnh sửa"
          ></i>
          <i
            className={`fa-solid ${u.status === "ACTIVE" ? "fa-user-slash" : "fa-user-check"} btn-icon`}
            style={{ color: u.status === "ACTIVE" ? "#e74c3c" : "#2ecc71" }}
            onClick={() => handleToggleStatus(u)}
            title={u.status === "ACTIVE" ? "Khóa tài khoản" : "Mở khóa"}
          ></i>
        </div>
      ),
    },
  ];

  const currentColumns = isAdmin ? columnsStaffAdmin : columnsSuperAdmin;

  return (
    <>
      <div className="user-management">
        <div className="user-management__header">
          <div>
            <h2>{isAdmin ? "Quản lý nhân viên chi nhánh" : "Danh sách người dùng"}</h2>
            {isAdmin && currentUser?.storeName && (
              <span className="admin-store-tag">
                <i className="fa-solid fa-store"></i> {currentUser.storeName}
              </span>
            )}
          </div>
          <Button
            buttonName={isAdmin ? "Thêm nhân viên" : "Thêm tài khoản"}
            onClick={handleOpenAdd}
          />
        </div>

        {/* Thanh công cụ tìm kiếm và lọc */}
        <div className="user-management__toolbar">
          <SearchBox
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isAdmin ? "Tìm theo tên, email, SĐT nhân viên..." : "Tìm kiếm người dùng..."}
          />

          <div className="user-role-filter">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              {roleFilterOptions.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>

          {/* Bộ lọc khoảng thời gian KPI dành riêng cho Admin */}
          {isAdmin && (
            <div className="time-range-filter-group">
              <span className="time-range-filter-label">Kỳ thống kê:</span>
              <div className="time-range-pills">
                {TIME_RANGE_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    className={`btn-time-range ${timeRange === opt.key ? "btn-time-range--active" : ""}`}
                    onClick={() => setTimeRange(opt.key)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bảng dữ liệu */}
        {isLoading ? (
          <div className="staff-table-skeleton-wrap">
            <div className="staff-skeleton-row staff-skeleton-row--header"></div>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="staff-skeleton-row"></div>
            ))}
          </div>
        ) : (
          <DataTable
            columns={currentColumns}
            data={filteredUsers}
            itemsPerPage={isAdmin ? 10 : 8}
            searchQuery={searchQuery}
          />
        )}
      </div>

      <UserFormModal
        isOpen={isFormModalOpen}
        isEdit={isEditMode}
        formData={formData}
        formErrors={formErrors}
        stores={stores}
        currentRole={currentRole}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        onInputChange={handleInputChange}
        onClearError={handleClearError}
      />

      {/* --- MODAL XEM CHI TIẾT NHÂN VIÊN / NGƯỜI DÙNG --- */}
      {isDetailModalOpen && viewingUser && (
        <div className="modal-userdetail">
          <div
            className="modal-userdetail__overlay"
            onClick={() => setIsDetailModalOpen(false)}
          ></div>

          <div className="modal-userdetail__content staff-modal-content">
            <i
              className="fa-solid fa-xmark modal-userdetail__close"
              onClick={() => setIsDetailModalOpen(false)}
              style={{ cursor: "pointer" }}
              title="Đóng"
            ></i>

            {/* Thông tin hồ sơ cơ bản */}
            <div className="modal-userdetail__top">
              <div className="modal-userdetail__profile">
                <div className="staff-modal-avatar">
                  {viewingUser.fullName?.charAt(0)?.toUpperCase() || "N"}
                </div>
                <div className="modal-userdetail__meta">
                  <p className="modal-userdetail__id">Mã ID: #{viewingUser.id}</p>
                  <span
                    className={`modal-userdetail__status ${
                      viewingUser.status === "ACTIVE"
                        ? "status--active"
                        : "status--locked"
                    }`}
                  >
                    {viewingUser.status === "ACTIVE"
                      ? "Đang hoạt động"
                      : "Ngừng hoạt động"}
                  </span>
                </div>
              </div>

              <div className="modal-userdetail__info">
                <div className="modal-userdetail__info-grid">
                  <div className="modal-userdetail__info-item">
                    <span className="label">Họ và tên:</span>
                    <span className="value">{viewingUser.fullName}</span>
                  </div>
                  <div className="modal-userdetail__info-item">
                    <span className="label">Email:</span>
                    <span className="value">{viewingUser.email}</span>
                  </div>
                  <div className="modal-userdetail__info-item">
                    <span className="label">Vai trò:</span>
                    <span className="value">
                      <span className={`staff-role-badge staff-role-badge--${viewingUser.role?.toLowerCase()}`}>
                        {roleTranslations[viewingUser.role] || viewingUser.role}
                      </span>
                    </span>
                  </div>
                  <div className="modal-userdetail__info-item">
                    <span className="label">Số điện thoại:</span>
                    <span className="value">{viewingUser.phone || "Chưa cập nhật"}</span>
                  </div>
                  {viewingUser.storeName && (
                    <div className="modal-userdetail__info-item">
                      <span className="label">Cửa hàng:</span>
                      <span className="value">{viewingUser.storeName}</span>
                    </div>
                  )}
                  <div className="modal-userdetail__info-item">
                    <span className="label">Ngày tham gia:</span>
                    <span className="value">{formatDate(viewingUser.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Khối thống kê KPI cho Admin */}
            {isAdmin && (
              <>
                <div className="staff-kpi-summary-section">
                  <div className="staff-kpi-header">
                    <h4>
                      Hiệu suất làm việc (
                      {TIME_RANGE_OPTIONS.find((t) => t.key === timeRange)?.label || "Hôm nay"}
                      )
                    </h4>
                  </div>
                  <div className="staff-kpi-cards-grid">
                    <div className="staff-kpi-card staff-kpi-card--pos">
                      <div className="staff-kpi-card__icon">
                        <i className="fa-solid fa-cash-register"></i>
                      </div>
                      <div className="staff-kpi-card__content">
                        <span className="staff-kpi-card__label">Đơn bán (POS)</span>
                        <strong className="staff-kpi-card__val">
                          {viewingUser.posOrderCount ?? 0}
                        </strong>
                      </div>
                    </div>

                    <div className="staff-kpi-card staff-kpi-card--online">
                      <div className="staff-kpi-card__icon">
                        <i className="fa-solid fa-globe"></i>
                      </div>
                      <div className="staff-kpi-card__content">
                        <span className="staff-kpi-card__label">Đơn online</span>
                        <strong className="staff-kpi-card__val">
                          {viewingUser.onlineOrderCount ?? 0}
                        </strong>
                      </div>
                    </div>

                    <div className="staff-kpi-card staff-kpi-card--barista">
                      <div className="staff-kpi-card__icon">
                        <i className="fa-solid fa-mug-hot"></i>
                      </div>
                      <div className="staff-kpi-card__content">
                        <span className="staff-kpi-card__label">Đơn pha chế</span>
                        <strong className="staff-kpi-card__val">
                          {viewingUser.baristaOrderCount ?? 0}
                        </strong>
                      </div>
                    </div>

                    <div className="staff-kpi-card staff-kpi-card--shipper">
                      <div className="staff-kpi-card__icon">
                        <i className="fa-solid fa-motorcycle"></i>
                      </div>
                      <div className="staff-kpi-card__content">
                        <span className="staff-kpi-card__label">Đơn giao (Shipper)</span>
                        <strong className="staff-kpi-card__val">
                          {viewingUser.deliveredOrderCount ?? 0}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Danh sách đơn hàng phụ trách gần đây */}
                <div className="staff-recent-orders-section">
                  <h4 className="staff-recent-orders-title">
                    Đơn hàng phụ trách gần đây
                  </h4>

                  {loadingStaffDetail ? (
                    <div className="staff-detail-skeleton">
                      <div className="skeleton-bar"></div>
                      <div className="skeleton-bar"></div>
                      <div className="skeleton-bar"></div>
                    </div>
                  ) : staffDetailData?.recentOrders?.length > 0 ? (
                    <div className="staff-orders-table-wrap">
                      <table className="staff-orders-table">
                        <thead>
                          <tr>
                            <th>Mã đơn</th>
                            <th>Nhiệm vụ</th>
                            <th>Tổng tiền</th>
                            <th>Thời gian</th>
                            <th>Trạng thái</th>
                          </tr>
                        </thead>
                        <tbody>
                          {staffDetailData.recentOrders.map((ord) => (
                            <tr key={ord.id}>
                              <td>
                                <Link
                                  to={`/admin/orders/detail/${ord.id}`}
                                  className="staff-order-code"
                                  title="Xem chi tiết đơn"
                                >
                                  {ord.code || `#${ord.id}`}
                                </Link>
                              </td>
                              <td>
                                <span className={`handled-role-tag handled-role-tag--${ord.roleHandled?.toLowerCase()}`}>
                                  {ord.roleHandled === "POS"
                                    ? "Bán quầy"
                                    : ord.roleHandled === "ONLINE"
                                    ? "Đơn online"
                                    : ord.roleHandled === "BARISTA"
                                    ? "Pha chế"
                                    : ord.roleHandled === "SHIPPER"
                                    ? "Giao hàng"
                                    : "Đơn online"}
                                </span>
                              </td>
                              <td style={{ fontWeight: 600 }}>
                                {formatCurrency(ord.total)}
                              </td>
                              <td>{formatDate(ord.createdAt)}</td>
                              <td>
                                <span className={`order-status-badge order-status--${ord.status?.toLowerCase()}`}>
                                  {ord.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="staff-orders-empty">
                      <i className="fa-solid fa-receipt"></i>
                      <p>Chưa có đơn hàng nào do nhân viên này phụ trách gần đây.</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default Users;
