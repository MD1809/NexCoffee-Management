import { useState, useEffect } from "react";

import categoryApi from "../../../apis/CategoryApi";
import { toast } from "react-toastify";

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

  const columns = [
    { header: "ID", accessor: "id" },
    { header: "Tên danh mục", accessor: "name" },
    { header: "Mô tả", accessor: "description" },
    { header: "SL Sản phẩm", accessor: "productCount" },
    {
      header: "Trạng thái",
      accessor: "categoryStatus",
      render: (row) => (
        <span className={`status ${row.categoryStatus === "active" ? "status--active" : "status--locked"}`}>
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

  const handleOpenEdit = (category) => {
    setEditingCategory(category);
    setIsEditModalOpen(true);
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
