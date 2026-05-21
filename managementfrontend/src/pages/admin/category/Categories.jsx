import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import categoryApi from "../../../apis/CategoryApi";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

import "./Categories.css";
import SearchBox from "../../../components/admin/searchBox/SearchBox";
import Button from "../../../components/admin/button/Button";
import DataTable from "../../../components/admin/dataTable/DataTable";
import AddCategoryForm from "./AddCategoryForm";
import EditCategoryForm from "./EditCategoryForm";

function Categories() {
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const navigate = useNavigate();

  const columns = [
    { header: "ID", accessor: "id" },
    { header: "Tên danh mục", accessor: "name" },
    { header: "Mô tả", accessor: "description" },
    { header: "SL Sản phẩm", accessor: "productCount" },
    {
      header: "Trạng thái",
      accessor: "categoryStatus",
      render: (row) => (
        <span
          className={`status ${row.categoryStatus === "active" ? "status--active" : "status--locked"}`}
        >
          {row.categoryStatus === "active" ? "Hoạt đông" : "Ngừng hoạt động"}
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
          <i
            className="fa-regular fa-trash-can btn-icon btn-icon--delete"
            onClick={() => handleDelete(u)}
          ></i>
        </div>
      ),
    },
  ];

  useEffect(() => {
    fetchCategories();
  }, []);
  const fetchCategories = async () => {
    try {
      const response = await categoryApi.getAll();
      setCategories(response.data);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách:", error);
    }
  };

  const handleOpenDetail = (category) => {
    navigate(`detail/${category.id}`);
  };

  const handleOpenEdit = (category) => {
    setEditingCategory(category);
    setIsEditModalOpen(true);
  };

  const handleDelete = (category) => {
    Swal.fire({
      title: "Xác nhận xóa",
      text: `Bạn có chắc chắn muốn xóa danh mục "${category.name}"?`,
      icon: "warning",
      showCancelButton: true,
      width: '500px',
      padding: '2em',
      confirmButtonColor: "#dc3545",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Đồng ý, xóa",
      cancelButtonText: "Hủy bỏ",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await categoryApi.remove(category.id);

          fetchCategories();

          toast.success(`Đã xóa danh mục "${category.name}" thành công!`);
        } catch (error) {
          console.error("Lỗi khi xóa:", error);
          const errorMessage =
            error.response?.data?.message ||
            "Có lỗi xảy ra, không thể xóa danh mục này!";

          toast.error(errorMessage);
        }
      }
    });
  };

  const handleToggleStatus = async (row) => {
    const newStatus = row.categoryStatus === "active" ? "inactive" : "active";
    try {
      await categoryApi.updateStatus(row.id, { status: newStatus });
      fetchCategories();
      toast.success(
        `Đã ${newStatus === "active" ? "mở khóa" : "khóa"} thành công!`,
      );
    } catch {
      console.error(error);
      toast.error("Có lỗi xảy ra khi cập nhật trạng thái!");
    }
  };

  return (
    <>
      <div className="user-management">
        <div className="user-management__header">
          <h2>Danh sách danh mục</h2>
          <Button
            buttonName="Thêm danh mục"
            onClick={() => setIsAddModalOpen(true)}
          />
        </div>

        <div className="user-management__toolbar">
          <SearchBox
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <DataTable
          columns={columns}
          data={categories}
          searchQuery={searchQuery}
          itemsPerPage={5}
        />
      </div>

      <AddCategoryForm
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onRefresh={fetchCategories}
      />

      <EditCategoryForm
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        category={editingCategory}
        onRefresh={fetchCategories}
      />
    </>
  );
}

export default Categories;
