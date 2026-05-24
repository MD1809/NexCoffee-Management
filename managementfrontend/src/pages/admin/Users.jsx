import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";

import "./Users.css";
import FormModal from "../../components/admin/formModal/FormModal";
import SearchBox from "../../components/admin/searchBox/SearchBox";
import Button from "../../components/admin/button/Button";
import DataTable from "../../components/admin/dataTable/DataTable";
import ConfirmModal from "../../components/admin/confirmModal/ConfirmModal";
import Dropdown from "../../components/admin/dropDown/Dropdown";

import { formatDateTime } from "../../utils/fomatDateTime";
import { getAccessToken } from "../../utils/authStorage";

// --- KHAI BÁO MẢNG DỮ LIỆU TĨNH CHO DROPDOWN ---
const roleOptions = [
  { label: "Khách hàng", value: "CUSTOMER" },
  { label: "Nhân viên", value: "STAFF" },
  { label: "Quản trị viên", value: "ADMIN" }
];

const statusOptions = [
  { label: "Hoạt động", value: "ACTIVE" },
  { label: "Ngừng hoạt động", value: "INACTIVE" }
];

function Users() {
  const API_BASE_URL = "http://localhost:8080/api/admin/users";

  const [users, setUsers] = useState([]);
  const [formErrors, setFormErrors] = useState({});
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
    role: "CUSTOMER",
    status: "ACTIVE",
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

  const validateForm = (data, isEdit = false) => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{10}$/;

    if (!data.fullName.trim())
      errors.fullName = "Họ và tên không được để trống";

    if (!data.email.trim()) {
      errors.email = "Email không được để trống";
    } else if (!emailRegex.test(data.email)) {
      errors.email = "Định dạng email không hợp lệ";
    }

    if (!data.phone.trim()) {
      errors.phone = "Số điện thoại không được để trống";
    } else if (!phoneRegex.test(data.phone)) {
      errors.phone = "Số điện thoại phải có 10 chữ số";
    }

    if (!isEdit) {
      if (!data.password) {
        errors.password = "Mật khẩu không được để trống";
      } else if (data.password.length < 8) {
        errors.password = "Mật khẩu phải ít nhất 8 ký tự";
      }
      if (data.password !== data.confirmPassword) {
        errors.confirmPassword = "Xác nhận mật khẩu không khớp";
      }
    }

    if (!data.role) errors.role = "Vui lòng chọn vai trò";

    return errors;
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = getAccessToken();

      if (!token) {
        console.error("Không tìm thấy token!");
        return;
      }

      const response = await axios.get(API_BASE_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUsers(response.data);
    } catch (error) {
      console.error("Lỗi:", error.response?.status);
    }
  };

  const roleTranslations = {
    ADMIN: "Quản trị viên",
    STAFF: "Nhân viên",
    CUSTOMER: "Khách hàng",
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
            title="Xem chi tiết"
          ></i>
          <i
            className="fa-regular fa-pen-to-square btn-icon btn-icon--edit"
            onClick={() => handleOpenEdit(u)}
          ></i>
          {/* Nút bật/tắt trạng thái nhanh */}
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

  const handleOpenDetail = (user) => {
    setViewingUser(user);
    setIsDetailModalOpen(true);
  };

  const handleAddInputChange = (e) => {
    const { name, value } = e.target;
    setAddFormData({ ...addFormData, [name]: value });
  };
  
  const handleAddSubmit = async () => {
    const errors = validateForm(addFormData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return; 
    }

    try {
      const token = getAccessToken();
      const dataToSend = { ...addFormData, isVerified: false };
      
      const response = await axios.post(API_BASE_URL, dataToSend, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // --- CHỈ CHẠY KHI API TRẢ VỀ 200/201 (THÀNH CÔNG) ---
      setUsers([...users, response.data]);
      setIsAddModalOpen(false); 
      setFormErrors({});       
      setAddFormData({         
        fullName: "", email: "", phone: "", 
        password: "", confirmPassword: "", 
        role: "CUSTOMER", status: "ACTIVE" 
      });
      toast.success("Thêm người dùng thành công!");

    } catch (error) {
      // --- XỬ LÝ KHI API TRẢ VỀ LỖI (400, 409, 500...) ---
      console.error("Lỗi từ Server:", error.response?.data);

      const serverError = error.response?.data;

      // Trường hợp 1: Backend trả về danh sách lỗi cho từng ô (Validation)
      if (serverError?.errors) {
        setFormErrors(serverError.errors);
      } 
      // Trường hợp 2: Backend trả về một câu thông báo lỗi chung (như "Email đã tồn tại")
      else if (serverError?.message) {
        // Gán lỗi message này vào đúng ô email để người dùng thấy
        if (serverError.message.includes("Email")) {
          setFormErrors({ email: serverError.message });
        } else if (serverError.message.includes("Số điện thoại")) {
          setFormErrors({ phone: serverError.message });
        } else {
          toast.error(serverError.message);
        }
      } else {
        toast.error("Có lỗi xảy ra, vui lòng thử lại!");
      }
      
      // QUAN TRỌNG: Tuyệt đối không gọi setIsAddModalOpen(false) ở đây
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
    // 1. Validate ở Frontend
    const errors = validateForm(editFormData, true);

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return; // Chặn không cho đóng form nếu có lỗi nhập liệu
    }

    try {
      const token = getAccessToken();
      const dataToSend = {
        ...editFormData,
        isVerified: editFormData.isVerified ?? false,
      };

      const response = await axios.put(`${API_BASE_URL}/${editFormData.id}`, dataToSend, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // --- CHỈ CHẠY KHI BACKEND TRẢ VỀ THÀNH CÔNG (200 OK) ---
      setUsers(users.map((u) => (u.id === editFormData.id ? response.data : u)));
      setIsEditModalOpen(false); // Đóng modal
      setFormErrors({});       // Xóa sạch thông báo lỗi
      toast.success("Cập nhật thành công!");

    } catch (error) {
      // --- XỬ LÝ KHI BACKEND TRẢ VỀ LỖI (400, 404, 403, 500...) ---
      console.error("Lỗi cập nhật:", error.response?.data);

      const serverError = error.response?.data;

      // Trường hợp 1: Backend trả về danh sách lỗi cụ thể (Validation)
      if (serverError?.errors) {
        setFormErrors(serverError.errors);
      } 
      // Trường hợp 2: Backend trả về thông báo lỗi logic (ví dụ: Email đã tồn tại)
      else if (serverError?.message) {
        const msg = serverError.message;
        if (msg.includes("Email")) {
          setFormErrors({ email: msg });
        } else if (msg.includes("Số điện thoại")) {
          setFormErrors({ phone: msg });
        } else {
          toast.error(msg);
        }
      } else {
        toast.error("Cập nhật thất bại. Vui lòng kiểm tra lại!");
      }
      
      // Lưu ý: Không gọi setIsEditModalOpen(false) ở đây để giữ Form mở cho người dùng sửa lại
    }
  };

  const handleToggleStatus = async (user) => {
    const nextStatus = user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    try {
      const token = getAccessToken();

      // Tạo đối tượng gửi đi và đảm bảo không có trường nào bị null gây lỗi Backend
      const updatedData = {
        ...user,
        status: nextStatus,
        // Đảm bảo isVerified luôn có giá trị boolean, tránh lỗi JSON parse null
        isVerified: user.isVerified ?? false,
      };

      const response = await axios.put(
        `${API_BASE_URL}/${user.id}`,
        updatedData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setUsers((prevUsers) =>
        prevUsers.map((u) => (u.id === user.id ? response.data : u)),
      );

      toast.success(
        `Đã ${nextStatus === "ACTIVE" ? "mở khóa" : "khóa"} tài khoản thành công!`,
      );
    } catch (error) {
      console.error("Lỗi thay đổi trạng thái:", error);
      toast.error("Không thể thay đổi trạng thái!");
    }
  };

  const handleInputChange = (e, formType) => {
    const { name, value } = e.target;
    if (formType === "add") {
      setAddFormData((prev) => ({ ...prev, [name]: value }));
    } else {
      setEditFormData((prev) => ({ ...prev, [name]: value }));
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

      {/* add user */}
      <FormModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setFormErrors({}); // Xóa lỗi khi đóng modal
        }}
        title="Thêm người dùng mới"
        submitText="Tạo tài khoản"
        onSubmit={handleAddSubmit}
      >
        <div className="form-modal__group">
          <label className="form-modal__label">Họ và tên</label>
          <input
            type="text"
            className={`form-modal__input ${formErrors.fullName ? "input--error" : ""}`}
            placeholder="Nhập họ và tên..."
            name="fullName"
            value={addFormData.fullName}
            onChange={(e) => {
              handleInputChange(e, "add");
              if (formErrors.fullName)
                setFormErrors({ ...formErrors, fullName: "" });
            }}
          />
          {formErrors.fullName && (
            <span className="addU-error-text">{formErrors.fullName}</span>
          )}
        </div>

        <div className="form-modal__group">
          <label className="form-modal__label">Email</label>
          <input
            type="email"
            className={`form-modal__input ${formErrors.email ? "input--error" : ""}`}
            placeholder="VD: example@gmail.com"
            name="email"
            value={addFormData.email}
            onChange={(e) => {
              handleInputChange(e, "add");
              if (formErrors.email) setFormErrors({ ...formErrors, email: "" });
            }}
          />
          {formErrors.email && (
            <span className="addU-error-text">{formErrors.email}</span>
          )}
        </div>

        <div className="form-modal__group">
          <label className="form-modal__label">Số điện thoại</label>
          <input
            type="text"
            className={`form-modal__input ${formErrors.phone ? "input--error" : ""}`}
            placeholder="VD: 039****327"
            name="phone"
            value={addFormData.phone}
            onChange={(e) => {
              handleInputChange(e, "add");
              if (formErrors.phone) setFormErrors({ ...formErrors, phone: "" });
            }}
          />
          {formErrors.phone && (
            <span className="addU-error-text">{formErrors.phone}</span>
          )}
        </div>

        <div className="form-modal__group">
          <label className="form-modal__label">Mật khẩu</label>
          <input
            type="password"
            className={`form-modal__input ${formErrors.password ? "input--error" : ""}`}
            placeholder="VD: Aa@1234"
            name="password"
            value={addFormData.password}
            onChange={(e) => {
              handleInputChange(e, "add");
              if (formErrors.password)
                setFormErrors({ ...formErrors, password: "" });
            }}
          />
          {formErrors.password && (
            <span className="addU-error-text">{formErrors.password}</span>
          )}
        </div>

        <div className="form-modal__group">
          <label className="form-modal__label">Xác nhận mật khẩu</label>
          <input
            type="password"
            className={`form-modal__input ${formErrors.confirmPassword ? "input--error" : ""}`}
            placeholder="Nhập lại mật khẩu"
            name="confirmPassword"
            value={addFormData.confirmPassword}
            onChange={(e) => {
              handleInputChange(e, "add");
              if (formErrors.confirmPassword)
                setFormErrors({ ...formErrors, confirmPassword: "" });
            }}
          />
          {formErrors.confirmPassword && (
            <span className="addU-error-text">{formErrors.confirmPassword}</span>
          )}
        </div>

        <div className="form-modal__row">
          <div className="form-modal__group">
            <label className="form-modal__label">Vai trò</label>
            <div className={`form-control-dropdown ${formErrors.role ? "input--error" : ""}`}>
              <Dropdown
                options={roleOptions}
                defaultValue={addFormData.role}
                placeholder="Chọn vai trò"
                onChange={(option) => {
                  handleInputChange({ target: { name: 'role', value: option.value } }, "add");
                  if (formErrors.role) setFormErrors({ ...formErrors, role: "" });
                }}
              />
            </div>
            {formErrors.role && (
              <span className="addU-error-text">{formErrors.role}</span>
            )}
          </div>

          <div className="form-modal__group">
            <label className="form-modal__label">Trạng thái</label>
            <Dropdown
              options={statusOptions}
              defaultValue={addFormData.status}
              placeholder="Chọn trạng thái"
              onChange={(option) => handleInputChange({ target: { name: 'status', value: option.value } }, "add")}
            />
          </div>
        </div>
      </FormModal>

      {/* edit user */}
      <FormModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setFormErrors({});
        }}
        title="Cập nhật thông tin tài khoản"
        submitText="Cập nhật"
        onSubmit={handleEditSubmit}
      >
        <div className="form-modal__group">
          <label className="form-modal__label">Họ và tên</label>
          <input
            type="text"
            className={`form-modal__input ${formErrors.fullName ? "input--error" : ""}`}
            name="fullName"
            value={editFormData.fullName}
            onChange={(e) => {
              handleInputChange(e, "edit");
              if (formErrors.fullName)
                setFormErrors({ ...formErrors, fullName: "" });
            }}
          />
          {formErrors.fullName && (
            <span className="addU-error-text">{formErrors.fullName}</span>
          )}
        </div>

        <div className="form-modal__group">
          <label className="form-modal__label">Email</label>
          <input
            type="email"
            className={`form-modal__input ${formErrors.email ? "input--error" : ""}`}
            name="email"
            value={editFormData.email}
            onChange={(e) => {
              handleInputChange(e, "edit");
              if (formErrors.email) setFormErrors({ ...formErrors, email: "" });
            }}
          />
          {formErrors.email && (
            <span className="addU-error-text">{formErrors.email}</span>
          )}
        </div>

        <div className="form-modal__group">
          <label className="form-modal__label">Số điện thoại</label>
          <input
            type="text"
            className={`form-modal__input ${formErrors.phone ? "input--error" : ""}`}
            name="phone"
            value={editFormData.phone}
            onChange={(e) => {
              handleInputChange(e, "edit");
              if (formErrors.phone) setFormErrors({ ...formErrors, phone: "" });
            }}
          />
          {formErrors.phone && (
            <span className="addU-error-text">{formErrors.phone}</span>
          )}
        </div>

        <div className="form-modal__row">
          <div className="form-modal__group">
            <label className="form-modal__label">Vai trò</label>
            <div className={`form-control-dropdown ${formErrors.role ? "input--error" : ""}`}>
              <Dropdown
                options={roleOptions}
                defaultValue={editFormData.role}
                placeholder="Chọn vai trò"
                onChange={(option) => {
                  handleInputChange({ target: { name: 'role', value: option.value } }, "edit");
                  if (formErrors.role) setFormErrors({ ...formErrors, role: "" });
                }}
              />
            </div>
            {formErrors.role && (
              <span className="addU-error-text">{formErrors.role}</span>
            )}
          </div>
          <div className="form-modal__group">
            <label className="form-modal__label">Trạng thái</label>
            <Dropdown
              options={statusOptions}
              defaultValue={editFormData.status}
              placeholder="Chọn trạng thái"
              onChange={(option) => handleInputChange({ target: { name: 'status', value: option.value } }, "edit")}
            />
          </div>
        </div>
      </FormModal>
    </>
  );
}

export default Users;