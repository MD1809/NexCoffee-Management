import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import productApi from "../../../apis/ProductApi";
import { toast } from "react-toastify";

import Button from "../../../components/admin/button/Button";
import SearchBox from "../../../components/admin/searchBox/SearchBox";
import DataTable from "../../../components/admin/dataTable/DataTable";
import "./Products.css";

function Products() {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const navigate = useNavigate();

  const columns = [
    { header: "ID", accessor: "id" },
    {
      header: "Ảnh",
      accessor: "image",
      render: (row) => (
        <div className="product-image-cell">
          {row.mainImage?.url ? (
            <img
              src={`http://localhost:8080/images/${row.mainImage.url}`}
              alt={row.name}
              style={{
                width: "60px",
                height: "60px",
                objectFit: "cover",
                borderRadius: "4px",
              }}
            />
          ) : (
            /* Hiển thị một ô trống dự phòng nếu sản phẩm chưa có ảnh */
            <div
              style={{
                width: "60px",
                height: "60px",
                backgroundColor: "#f5f5f5",
                border: "1px dashed #ccc",
                borderRadius: "4px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "10px",
                color: "#999",
                textAlign: "center"
              }}
            >
              No Image
            </div>
          )}
        </div>
      ),
    },
    { header: "Tên sản phẩm", accessor: "name" },
    { header: "Mô tả", accessor: "description", className: "truncate-1-line" },
    { header: "Danh mục", accessor: "categoryName" },
    {
      header: "Bảng giá",
      accessor: "variants",
      render: (row) => (
        <div className="variant-size">
          {row.variants.map((v) => (
            <span key={v.id} className="variant-tag">
              {v.size}: {v.price.toLocaleString("vi-VN")}đ
            </span>
          ))}
        </div>
      ),
    },
    {
      header: "Trạng thái",
      accessor: "status",
      render: (row) => (
        <span
          className={`status ${row.status === "active" ? "status--active" : "status--locked"}`}
        >
          {row.status === "active" ? "Đang kinh doanh" : "Ngừng kinh doanh"}
        </span>
      ),
    },
    {
      header: "Thao tác",
      accessor: "actions",
      render: (u) => (
        <div className="action-buttons">
          <i
            className="fa-regular fa-eye btn-icon btn-icon--view"
            onClick={() => handleOpenView(u)}
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
    fetchProducts();
  }, []);
  const fetchProducts = async () => {
    try {
      const response = await productApi.getAll();
      setProducts(response.data);
    } catch (error) {
      console.error("Lỗi khi tải sản phẩm:", error);
    }
  };

  const location = useLocation();
  const hasToastRun = React.useRef(false);
  useEffect(() => {
    if (location.state?.success && !hasToastRun.current) {
      toast.success(location.state.message);
      hasToastRun.current = true;
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const handleOpenView = (product) => {
    navigate(`detail/${product.id}`);
  };

  const handleOpenEdit = (product) => {
    navigate(`edit/${product.id}`);
  };

  return (
    <>
      <div className="user-management">
        <div className="user-management__header">
          <h2>Danh sách sản phẩm</h2>
          <Button buttonName="Thêm sản phẩm" onClick={() => navigate("add")} />
        </div>

        <div className="user-management__toolbar">
          <SearchBox
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <DataTable
          columns={columns}
          data={products}
          searchQuery={searchQuery}
        />
      </div>
    </>
  );
}

export default Products;
