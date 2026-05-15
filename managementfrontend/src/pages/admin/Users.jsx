import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";

import "./Users.css";
import FormModal from "../../components/admin/formModal/FormModal";
import SearchBox from "../../components/admin/searchBox/SearchBox";
import Button from "../../components/admin/button/Button";
import DataTable from "../../components/admin/dataTable/DataTable";
import ConfirmModal from "../../components/admin/confirmModal/ConfirmModal";

import { formatDateTime } from "../../utils/fomatDateTime";

function Users() {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [viewingUser, setViewingUser] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addFormData, setAddFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "",
    status: "active",
  });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    id: "",
    fullName: "",
    email: "",
    phone: "",
    role: "",
    status: "",
  });

  useEffect(() => {
    fetchUsers();
  }, []);
  const fetchUsers = async () => {
    try {
      // Gọi API
      const response = await axios.get("http://localhost:8080/api/users");
      setUsers(response.data);
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu người dùng:", error);
    }
  };

  const roleTranslations = {
    admin: "Quản trị viên",
    staff: "Nhân viên",
    customer: "Khách hàng",
  };

  const columnsTableUser = [
    {
      header: "ID",
      accessor: "id",
      className: "td-id",
    },
    { header: "Người dùng", accessor: "fullName" },
    { header: "Email", accessor: "email" },
    { header: "Số điện thoại", accessor: "phone", className: "td-phone" },
    { header: "Vai trò", accessor: "role", render: (row) => roleTranslations[row.role] || row.role},
    {
      header: "Trạng thái",
      accessor: "status",
      className: "td-status",
      render: (row) => (
        <span className={`status ${row.status === "active" ? "status--active" : "status--locked"}`}>
          {row.status === "active" ? "Hoạt đông" : "Ngừng hoạt động"}
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
          ></i>
          <i
            className="fa-regular fa-pen-to-square btn-icon btn-icon--edit"
            onClick={() => handleOpenEdit(u)}
          ></i>
          {/* {u.status === "active" ? (
            <i
              className="fa-solid fa-user-slash btn-icon btn-icon--lock"
              onClick={() => handleToggleStatus(u)}
              title="Khóa tài khoản"
            ></i>
          ) : (
            <i
              className="fa-solid fa-user-check btn-icon btn-icon--unlock"
              onClick={() => handleToggleStatus(u)}
              title="Mở khóa tài khoản"
            ></i>
          )} */}
        </div>
      ),
    },
  ];

  const handleOpenDetail = (user) => {
    setViewingUser(user);
    setIsDetailModalOpen(true);
  };

  const handleAddInputChange = (e) => {
    const { name, value } = e.target;
    setAddFormData({ ...addFormData, [name]: value });
  };
  const handleAddSubmit = async () => {
    if (addFormData.password !== addFormData.confirmPassword) {
      alert("Lỗi: Mật khẩu và Xác nhận mật khẩu không trùng khớp!");
      return;
    }
    try {
      const response = await axios.post(
        "http://localhost:8080/api/users",
        addFormData,
      );
      setUsers([...users, response.data]);
      setIsAddModalOpen(false);
      setAddFormData({
        fullName: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
        role: "",
        status: "active",
      });
      toast.success("Thành công!");
    } catch (error) {
      console.error("Lỗi khi thêm:", error);
      toast.success("Thất bại!");
    }
  };

  const handleOpenEdit = (user) => {
    setEditFormData(user);
    setIsEditModalOpen(true);
  };
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData({ ...editFormData, [name]: value });
  };
  const handleEditSubmit = async () => {
    try {
      const response = await axios.put(
        `http://localhost:8080/api/users/${editFormData.id}`,
        editFormData,
      );
      setUsers(
        users.map((u) => (u.id === editFormData.id ? response.data : u)),
      );
      setIsEditModalOpen(false);
      toast.success("Cập nhật thành công!");
    } catch (error) {
      console.error("Lỗi khi sửa:", error);
      toast.error("Cập nhật thất bại!");
    }
  };

  const handleToggleStatus = async (user) => {
    const nextStatus = user.status === "active" ? "inactive" : "active";

    try {
      await axios.patch(`http://localhost:8080/api/users/${user.id}/status`, {
        status: nextStatus,
      });

      setUsers((prevUsers) =>
        prevUsers.map((u) =>
          u.id === user.id ? { ...u, status: nextStatus } : u,
        ),
      );

      toast.success(
        `Đã ${nextStatus === "active" ? "mở khóa" : "khóa"} thành công!`,
      );
    } catch (error) {
      console.error(error);
      toast.error("Có lỗi xảy ra khi cập nhật trạng thái!");
    }
  };

  return (
    <>
      <div className="user-management">
        <div className="user-management__header">
          <h2>Danh sách người dùng</h2>
          <Button
            buttonName="Thêm tài khoản"
            onClick={() => setIsAddModalOpen(true)}
          />
        </div>

        <div className="user-management__toolbar">
          <SearchBox
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Table */}
        <DataTable
          columns={columnsTableUser}
          data={users}
          itemsPerPage={5}
          searchQuery={searchQuery}
        />
      </div>

      {/* detail user */}
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
                    className={`modal-userdetail__status ${viewingUser.status === "active" ? "status--active" : "status--locked"}`}
                  >
                    {viewingUser.status}
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
                    <span className="value">{roleTranslations[viewingUser.role] || viewingUser.role}</span>
                  </div>
                  <div className="modal-userdetail__info-item">
                    <span className="label">Số điện thoại:</span>
                    <span className="value">{viewingUser.phone}</span>
                  </div>
                  <div className="modal-userdetail__info-item">
                    <span className="label">Ngày tham gia:</span>

                    <span className="value">
                      {formatDateTime(viewingUser.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {viewingUser.role === "customer" && (
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

      {/* add user */}
      <FormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Thêm người dùng mới"
        submitText="Tạo tài khoản"
        onSubmit={handleAddSubmit}
      >
        <div className="form-modal__group">
          <label className="form-modal__label">Họ và tên</label>
          <input
            type="text"
            className="form-modal__input"
            placeholder="Nhập họ và tên..."
            name="fullName"
            value={addFormData.fullName}
            onChange={handleAddInputChange}
            required
          />
        </div>

        <div className="form-modal__group">
          <label className="form-modal__label">Email</label>
          <input
            type="email"
            className="form-modal__input"
            placeholder="VD: example@gmail.com"
            name="email"
            value={addFormData.email}
            onChange={handleAddInputChange}
            required
          />
        </div>

        <div className="form-modal__group">
          <label className="form-modal__label">Số điện thoại</label>
          <input
            type="number"
            className="form-modal__input"
            placeholder="VD: 039****327"
            name="phone"
            value={addFormData.phone}
            onChange={handleAddInputChange}
            required
          />
        </div>

        <div className="form-modal__group">
          <label className="form-modal__label">Mật khẩu</label>
          <input
            type="password"
            className="form-modal__input"
            placeholder="VD: Aa@1234"
            name="password"
            value={addFormData.password}
            onChange={handleAddInputChange}
            required
          />
        </div>

        <div className="form-modal__group">
          <label className="form-modal__label">Xác nhận mật khẩu</label>
          <input
            type="password"
            className="form-modal__input"
            placeholder="Nhập lại mật khẩu"
            name="confirmPassword"
            value={addFormData.confirmPassword}
            onChange={handleAddInputChange}
            required
          />
        </div>

        <div className="form-modal__row">
          <div className="form-modal__group">
            <label className="form-modal__label">Vai trò</label>
            <select
              className="form-modal__input"
              name="role"
              value={addFormData.role}
              onChange={handleAddInputChange}
              required
            >
              <option value="" disabled>
                Chọn vai trò
              </option>
              <option value="admin">Quản trị viên (Admin)</option>
              <option value="staff">Nhân viên</option>
              <option value="customer">Khách hàng</option>
            </select>
          </div>
          <div className="form-modal__group">
            <label className="form-modal__label">Trạng thái</label>
            <select
              className="form-modal__input"
              name="status"
              value={addFormData.status}
              onChange={handleAddInputChange}
            >
              <option value="active">Hoạt động</option>
              <option value="inactive">Đã khóa</option>
            </select>
          </div>
        </div>
      </FormModal>

      {/* edit user */}
      <FormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Cập nhật thông tin tài khoản"
        submitText="Cập nhật"
        onSubmit={handleEditSubmit}
      >
        <div className="form-modal__group">
          <label className="form-modal__label">Họ và tên</label>
          <input
            type="text"
            className="form-modal__input"
            placeholder="Nhập họ và tên..."
            name="fullName"
            value={editFormData.fullName}
            onChange={handleEditInputChange}
            required
          />
        </div>

        <div className="form-modal__group">
          <label className="form-modal__label">Email</label>
          <input
            type="email"
            className="form-modal__input"
            placeholder="VD: example@gmail.com"
            name="email"
            value={editFormData.email}
            onChange={handleEditInputChange}
            required
          />
        </div>

        <div className="form-modal__group">
          <label className="form-modal__label">Số điện thoại</label>
          <input
            type="number"
            className="form-modal__input"
            placeholder="VD: 039****327"
            name="phone"
            value={editFormData.phone}
            onChange={handleEditInputChange}
            required
          />
        </div>

        <div className="form-modal__row">
          <div className="form-modal__group">
            <label className="form-modal__label">Vai trò</label>
            <select
              className="form-modal__input"
              name="role"
              value={editFormData.role}
              onChange={handleEditInputChange}
              required
            >
              <option value="" disabled>
                Chọn vai trò
              </option>
              <option value="Admin">Quản trị viên (Admin)</option>
              <option value="staff">Nhân viên</option>
              <option value="customer">Khách hàng</option>
            </select>
          </div>
          <div className="form-modal__group">
            <label className="form-modal__label">Trạng thái</label>
            <select
              className="form-modal__input"
              name="status"
              value={editFormData.status}
              onChange={handleEditInputChange}
            >
              <option value="active">Hoạt động</option>
              <option value="inactive">Ngừng hoạt động</option>
            </select>
          </div>
        </div>
      </FormModal>
    </>
  );
}

export default Users;
