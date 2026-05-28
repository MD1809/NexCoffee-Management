import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";

import userApi from "../../../apis/userApi";
import UserFormModal from "./UserFormModal"; // Component vừa tách
import "./Users.css";

import SearchBox from "../../../components/admin/searchBox/SearchBox";
import Button from "../../../components/admin/button/Button";
import DataTable from "../../../components/admin/dataTable/DataTable";

const roleTranslations = {
  ADMIN: "Quản trị viên",
  STAFF: "Nhân viên",
  CUSTOMER: "Khách hàng",
  SHIPPER: "Người giao hàng", // Bổ sung role mới
};

const initialFormData = {
  fullName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  role: "CUSTOMER",
  status: "ACTIVE",
};

function Users() {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [formErrors, setFormErrors] = useState({});
  
  // State quản lý Modal
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState(initialFormData);

  // State Detail
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [viewingUser, setViewingUser] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await userApi.getAll();
      setUsers(response.data);
    } catch (error) {
      console.error("Lỗi:", error);
      toast.error("Không thể tải danh sách người dùng.");
    }
  };

  const validateForm = (data, isEdit) => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{10}$/;

    if (!data.fullName?.trim()) errors.fullName = "Họ và tên không được để trống";
    if (!data.email?.trim()) errors.email = "Email không được để trống";
    else if (!emailRegex.test(data.email)) errors.email = "Định dạng email không hợp lệ";

    if (!data.phone?.trim()) errors.phone = "Số điện thoại không được để trống";
    else if (!phoneRegex.test(data.phone)) errors.phone = "Số điện thoại phải có 10 chữ số";

    if (!isEdit) {
      if (!data.password) errors.password = "Mật khẩu không được để trống";
      else if (data.password.length < 8) errors.password = "Mật khẩu phải ít nhất 8 ký tự";
      if (data.password !== data.confirmPassword) errors.confirmPassword = "Xác nhận mật khẩu không khớp";
    }

    if (!data.role) errors.role = "Vui lòng chọn vai trò";
    return errors;
  };

  // --- ACTIONS ---

  const handleOpenAdd = () => {
    setFormData(initialFormData);
    setIsEditMode(false);
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (user) => {
    setFormData(user);
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
    setFormData((prev) => ({ ...prev, [name]: value }));
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
      const dataToSend = { ...formData, isVerified: formData.isVerified ?? false };

      let response;
      if (isEditMode) {
        response = await userApi.update(formData.id, dataToSend);
        setUsers(users.map((u) => (u.id === formData.id ? response.data : u)));
        toast.success("Cập nhật thành công!");
      } else {
        response = await userApi.create(dataToSend);
        setUsers([...users, response.data]);
        toast.success("Thêm người dùng thành công!");
      }

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
      const updatedData = { ...user, status: nextStatus, isVerified: user.isVerified ?? false };
      const response = await userApi.update(user.id, updatedData);
      setUsers(users.map((u) => (u.id === user.id ? response.data : u)));
      toast.success(`Đã ${nextStatus === "ACTIVE" ? "mở khóa" : "khóa"} tài khoản thành công!`);
    } catch (error) {
      console.error("Lỗi thay đổi trạng thái:", error);
      toast.error("Không thể thay đổi trạng thái!");
    }
  };

  const handleOpenDetail = (user) => {
    setViewingUser(user);
    setIsDetailModalOpen(true);
  };

  // --- CẤU HÌNH BẢNG ---
  const columnsTableUser = [
    { header: "ID", accessor: "id", className: "td-id" },
    { header: "Người dùng", accessor: "fullName" },
    { header: "Email", accessor: "email" },
    { header: "Số điện thoại", accessor: "phone", className: "td-phone" },
    {
      header: "Vai trò",
      accessor: "role",
      render: (row) => roleTranslations[row.role] || row.role,
    },
    {
      header: "Trạng thái",
      accessor: "status",
      className: "td-status",
      render: (row) => (
        <span className={`status ${row.status === "ACTIVE" ? "status--active" : "status--locked"}`}>
          {row.status === "ACTIVE" ? "Hoạt động" : "Ngừng hoạt động"}
        </span>
      ),
    },
    {
      header: "Thao tác",
      render: (u) => (
        <div className="action-buttons">
          <i className="fa-regular fa-eye btn-icon btn-icon--view" onClick={() => handleOpenDetail(u)} title="Xem chi tiết"></i>
          <i className="fa-regular fa-pen-to-square btn-icon btn-icon--edit" onClick={() => handleOpenEdit(u)}></i>
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

  return (
    <>
      <div className="user-management">
        <div className="user-management__header">
          <h2>Danh sách người dùng</h2>
          <Button buttonName="Thêm tài khoản" onClick={handleOpenAdd} />
        </div>

        <div className="user-management__toolbar">
          <SearchBox value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>

        <DataTable columns={columnsTableUser} data={users} itemsPerPage={5} searchQuery={searchQuery} />
      </div>

      <UserFormModal
        isOpen={isFormModalOpen}
        isEdit={isEditMode}
        formData={formData}
        formErrors={formErrors}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        onInputChange={handleInputChange}
        onClearError={handleClearError}
      />

      {/* --- PHẦN CHI TIẾT USER GIỮ NGUYÊN (Chưa tách) --- */}
      {isDetailModalOpen && viewingUser && (
        <div className="modal-userdetail">
          <div
            className="modal-userdetail__overlay"
            onClick={() => setIsDetailModalOpen(false)}
          ></div>

          <div className="modal-userdetail__content">
            <i
              className="fa-solid fa-xmark modal-userdetail__close"
              onClick={() => setIsDetailModalOpen(false)}
              style={{ cursor: "pointer" }}
              title="Đóng"
            ></i>

            <div className="modal-userdetail__top">
              <div className="modal-userdetail__profile">
                <div className="modal-userdetail__avatar">
                  <img
                    src="https://i.pinimg.com/236x/5e/e0/82/5ee082781b8c41406a2a50a0f32d6aa6.jpg"
                    alt="User Avatar"
                  />
                </div>
                <div className="modal-userdetail__meta">
                  <p className="modal-userdetail__id">
                    Mã ID: #{viewingUser.id}
                  </p>
                  <span
                    className={`modal-userdetail__status ${viewingUser.status === "ACTIVE" ? "status--active" : "status--locked"}`}
                  >
                    {viewingUser.status === "ACTIVE"
                      ? "Hoạt động"
                      : "Không hoạt động"}
                  </span>
                </div>
              </div>

              <div className="modal-userdetail__info">
                <div className="modal-userdetail__info-grid">
                  <div className="modal-userdetail__info-item">
                    <span className="label">Tên:</span>
                    <span className="value">{viewingUser.fullName}</span>
                  </div>
                  <div className="modal-userdetail__info-item">
                    <span className="label">Email:</span>
                    <span className="value">{viewingUser.email}</span>
                  </div>
                  <div className="modal-userdetail__info-item">
                    <span className="label">Vai trò:</span>
                    <span className="value">
                      {roleTranslations[viewingUser.role] || viewingUser.role}
                    </span>
                  </div>
                  <div className="modal-userdetail__info-item">
                    <span className="label">Số điện thoại:</span>
                    <span className="value">{viewingUser.phone}</span>
                  </div>
                </div>
              </div>
            </div>

            {viewingUser.role === "CUSTOMER" && (
              <>
                <hr className="modal-userdetail__divider" />

                <div className="modal-userdetail__bottom">
                  <h3 className="modal-userdetail__section-title">
                    Lịch sử mua hàng:
                  </h3>
                  <div className="modal-userdetail__empty">
                    <p>Không có dữ liệu</p>
                  </div>
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