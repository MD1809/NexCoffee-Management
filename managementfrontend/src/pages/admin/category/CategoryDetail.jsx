import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DataTable from "../../../components/admin/dataTable/DataTable";
import SearchBox from "../../../components/admin/searchBox/SearchBox";
import Button from "../../../components/admin/button/Button";
import EditCategoryForm from "./EditCategoryForm"; // Import form chỉnh sửa
import "./CategoryDetail.css";

const CategoryDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // 1. Thêm state quản lý việc đóng/mở form chỉnh sửa
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // 2. Tách logic gọi API ra một hàm riêng để có thể tái sử dụng (làm mới dữ liệu)
  const fetchCategoryDetail = useCallback(() => {
    if (!id) return;

    fetch(`http://localhost:8080/api/categories/detail/${id}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Lỗi mạng hoặc không tìm thấy API");
        }
        return res.json();
      })
      .then((data) => {
        setCategory(data.category);
        setProducts(data.products);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Lỗi khi tải dữ liệu:", err);
        setIsLoading(false);
      });
  }, [id]);

  // Gọi API lần đầu khi component được render
  useEffect(() => {
    fetchCategoryDetail();
  }, [fetchCategoryDetail]);

  const columns = [
    { header: "ID", accessor: "id" },
    {
      header: "Ảnh",
      accessor: "mainImageUrl",
      render: (row) => {
        const imageUrl = row.mainImageUrl
          ? row.mainImageUrl.startsWith("http")
            ? row.mainImageUrl
            : `http://localhost:8080/images/${row.mainImageUrl}`
          : null;

        return (
          <div className="product-thumbnail">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={row.name}
                style={{
                  width: "50px",
                  height: "50px",
                  objectFit: "cover",
                  borderRadius: "6px",
                }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.style.display = "none";
                }}
              />
            ) : (
              <div
                style={{
                  width: "50px",
                  height: "50px",
                  backgroundColor: "var(--bg-secondary)",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "10px",
                  color: "var(--text-secondary)",
                  textAlign: "center",
                }}
              >
                No Image
              </div>
            )}
          </div>
        );
      },
    },
    { header: "Tên Sản Phẩm", accessor: "name" },
    {
      header: "Mô Tả",
      accessor: "description",
      render: (row) => (
        <span className="truncate-text" title={row.description}>
          {row.description || "Không có mô tả"}
        </span>
      ),
    },
    {
      header: "Trạng Thái",
      accessor: "status",
      render: (row) => (
        <span
          className={`status-badge ${row.status?.toLowerCase() || "inactive"}`}
        >
          {row.status === "active" ? "Hoạt động" : "Đã ẩn"}
        </span>
      ),
    },
  ];

  if (isLoading) {
    return <div className="loading-text">Đang tải thông tin...</div>;
  }

  if (!category) {
    return (
      <div className="loading-text">Không tìm thấy thông tin danh mục.</div>
    );
  }

  return (
    <>
      <div className="category-detail-container">
        {/* Ô trên: Thông tin chi tiết của danh mục */}
        <div className="cg-info-card">
          <div className="cg-title">
            <h2 className="cg-info-title">
              Chi tiết danh mục: {category.name}
            </h2>

            {/* 3. Sửa onClick thành mở Modal thay vì Navigate */}
            <Button
              buttonName="Chỉnh sửa"
              onClick={() => setIsEditModalOpen(true)}
            />
          </div>

          <div className="cg-info-grid">
            <div className="cg-info-grid__left">
              <div className="cg-info-item">
                <span className="cg-info-label">Trạng thái:</span>
                <span
                  className={`cg-status-badge ${category.categoryStatus?.toLowerCase()}`}
                >
                  {category.categoryStatus === "active"
                    ? "Hoạt động"
                    : "Tạm ngưng"}
                </span>
              </div>
              <div className="cg-info-item">
                <span className="cg-info-label">Mô tả:</span>
                <span className="cg-info-value">
                  {category.description || "Chưa cập nhật"}
                </span>
              </div>
            </div>
            <div className="cg-info-grid__right">
              <div className="cg-info-item">
                <span className="cg-info-label">Số lượng sản phẩm:</span>
                <span className="cg-info-value">
                  {category.productCount || 0}
                </span>
              </div>
              <div className="cg-info-item">
                <span className="cg-info-label">Ngày tạo:</span>
                <span className="cg-info-value">
                  {new Date(category.createdAt).toLocaleDateString("vi-VN")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Ô dưới: Danh sách sản phẩm thuộc danh mục */}
        <div className="products-card">
          <div className="products-header">
            <h3 className="products-title">Sản phẩm thuộc danh mục</h3>
            <SearchBox
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <DataTable
            columns={columns}
            data={products}
            itemsPerPage={5}
            searchQuery={searchQuery}
          />
        </div>
      </div>

      {/* 4. Thêm component EditCategoryForm vào đây */}
      <EditCategoryForm
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        category={category} // Truyền dữ liệu danh mục hiện tại vào form để hiển thị sẵn
        onRefresh={fetchCategoryDetail} // Sau khi lưu thành công, form gọi hàm này để cập nhật dữ liệu trang
      />
    </>
  );
};

export default CategoryDetail;
