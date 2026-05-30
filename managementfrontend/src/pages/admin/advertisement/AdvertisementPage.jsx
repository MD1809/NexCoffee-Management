import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import axiosClient from "../../../apis/axiosClient";
import DataTable from "../../../components/admin/dataTable/DataTable";

import {
  activateAdminAdvertisement,
  createAdminAdvertisement,
  deleteAdminAdvertisement,
  getAdminAdvertisements,
  updateAdminAdvertisement,
} from "../../../apis/advertisementApi";

import "./AdvertisementPage.css";

const BACKEND_URL = "http://localhost:8080";

const defaultForm = {
  id: null,
  title: "",
  image: null,
  imagePreview: "",
  targetType: "NONE",
  targetId: "",
  active: false,
};

const unwrap = (response) => response?.data ?? response;

const normalizeList = (data) => {
  const raw = unwrap(data);

  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.content)) return raw.content;
  if (Array.isArray(raw?.items)) return raw.items;

  return [];
};

const getImageUrl = (imageUrl) => {
  if (!imageUrl) return "";

  if (imageUrl.startsWith("http")) return imageUrl;
  if (imageUrl.startsWith("/images")) return `${BACKEND_URL}${imageUrl}`;

  return `${BACKEND_URL}/images/${imageUrl}`;
};

const AdvertisementPage = () => {
  const [advertisements, setAdvertisements] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);

  const [formData, setFormData] = useState(defaultForm);
  const [searchQuery, setSearchQuery] = useState("");
  const [errors, setErrors] = useState({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const targetOptions = useMemo(() => {
    if (formData.targetType === "CATEGORY") {
      return categories.map((category) => ({
        id: category.id,
        name: category.name,
      }));
    }

    if (formData.targetType === "PRODUCT") {
      return products.map((product) => ({
        id: product.id,
        name: product.name,
      }));
    }

    return [];
  }, [formData.targetType, categories, products]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [adsData, categoriesResponse, productsResponse] = await Promise.all(
        [
          getAdminAdvertisements(),
          axiosClient.get("/categories"),
          axiosClient.get("/products"),
        ],
      );

      setAdvertisements(Array.isArray(adsData) ? adsData : []);
      setCategories(normalizeList(categoriesResponse));
      setProducts(normalizeList(productsResponse));
    } catch (error) {
      toast.error("Không thể tải dữ liệu quảng cáo.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    return () => {
      if (formData.imagePreview?.startsWith("blob:")) {
        URL.revokeObjectURL(formData.imagePreview);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetForm = () => {
    if (formData.imagePreview?.startsWith("blob:")) {
      URL.revokeObjectURL(formData.imagePreview);
    }

    setFormData(defaultForm);
    setErrors({});
  };

  const handleChange = (event) => {
    const { name, value, type, checked, files } = event.target;

    if (name === "image") {
      const file = files?.[0] || null;

      if (file) {
        if (formData.imagePreview?.startsWith("blob:")) {
          URL.revokeObjectURL(formData.imagePreview);
        }

        setFormData((prev) => ({
          ...prev,
          image: file,
          imagePreview: URL.createObjectURL(file),
        }));

        setErrors((prev) => ({ ...prev, image: null }));
      }

      event.target.value = null;
      return;
    }

    if (name === "targetType") {
      setFormData((prev) => ({
        ...prev,
        targetType: value,
        targetId: "",
      }));

      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleEdit = (advertisement) => {
    if (formData.imagePreview?.startsWith("blob:")) {
      URL.revokeObjectURL(formData.imagePreview);
    }

    setFormData({
      id: advertisement.id,
      title: advertisement.title || "",
      image: null,
      imagePreview: getImageUrl(advertisement.imageUrl),
      targetType: advertisement.targetType || "NONE",
      targetId: advertisement.targetId || "",
      active: Boolean(advertisement.active),
    });

    setErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!formData.title.trim()) {
      nextErrors.title = "Vui lòng nhập tiêu đề quảng cáo.";
    }

    if (!formData.id && !formData.image) {
      nextErrors.image = "Vui lòng chọn ảnh quảng cáo.";
    }

    if (formData.targetType !== "NONE" && !formData.targetId) {
      nextErrors.targetId = "Vui lòng chọn đích đến.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      toast.warning("Vui lòng kiểm tra lại thông tin quảng cáo.");
      return false;
    }

    return true;
  };

  const buildFormData = () => {
    const payload = new FormData();

    payload.append("title", formData.title.trim());
    payload.append("targetType", formData.targetType);
    payload.append("active", String(formData.active));

    if (formData.targetType !== "NONE") {
      payload.append("targetId", formData.targetId);
    }

    if (formData.image) {
      payload.append("image", formData.image);
    }

    return payload;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) return;

    try {
      setSaving(true);

      if (formData.id) {
        await updateAdminAdvertisement(formData.id, buildFormData());
        toast.success("Cập nhật quảng cáo thành công.");
      } else {
        await createAdminAdvertisement(buildFormData());
        toast.success("Thêm quảng cáo thành công.");
      }

      resetForm();
      fetchData();
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data ||
        "Không thể lưu quảng cáo.";

      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleActivate = async (id) => {
    try {
      await activateAdminAdvertisement(id);
      toast.success("Đã bật quảng cáo.");
      fetchData();
    } catch {
      toast.error("Không thể bật quảng cáo.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa quảng cáo này?")) return;

    try {
      await deleteAdminAdvertisement(id);
      toast.success("Đã xóa quảng cáo.");
      fetchData();

      if (formData.id === id) {
        resetForm();
      }
    } catch {
      toast.error("Không thể xóa quảng cáo.");
    }
  };

  const getTargetText = (advertisement) => {
    if (advertisement.targetType === "CATEGORY") {
      const category = categories.find(
        (item) => Number(item.id) === Number(advertisement.targetId),
      );

      return category
        ? `Danh mục: ${category.name}`
        : `Danh mục #${advertisement.targetId}`;
    }

    if (advertisement.targetType === "PRODUCT") {
      const product = products.find(
        (item) => Number(item.id) === Number(advertisement.targetId),
      );

      return product
        ? `Sản phẩm: ${product.name}`
        : `Sản phẩm #${advertisement.targetId}`;
    }

    return "Không chuyển trang";
  };

  const columns = [
    {
      header: "Ảnh",
      accessor: "imageUrl",
      width: "110px",
      render: (advertisement) => (
        <img
          className="admin-ad-thumb"
          src={getImageUrl(advertisement.imageUrl)}
          alt={advertisement.title}
        />
      ),
    },
    {
      header: "Tiêu đề",
      accessor: "title",
      width: "220px",
    },
    {
      header: "Đích đến",
      accessor: "targetUrl",
      width: "260px",
      render: (advertisement) => getTargetText(advertisement),
    },
    {
      header: "Trạng thái",
      accessor: "active",
      width: "150px",
      render: (advertisement) => (
        <span
          className={`admin-ad-status ${
            advertisement.active ? "active" : "inactive"
          }`}
        >
          {advertisement.active ? "Đang hiển thị" : "Tắt"}
        </span>
      ),
    },
    {
      header: "Thao tác",
      accessor: "actions",
      width: "230px",
      render: (advertisement) => (
        <div className="admin-ad-row-actions">
          {!advertisement.active && (
            <button
              type="button"
              onClick={() => handleActivate(advertisement.id)}
            >
              Bật
            </button>
          )}

          <button type="button" onClick={() => handleEdit(advertisement)}>
            Sửa
          </button>

          <button
            type="button"
            className="danger"
            onClick={() => handleDelete(advertisement.id)}
          >
            Xóa
          </button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="admin-ad-page">
        <div className="admin-ad-card">Đang tải quảng cáo...</div>
      </div>
    );
  }

  return (
    <div className="admin-ad-page">
      <div className="admin-ad-header">
        <div>
          <h1>Quản lý quảng cáo trang chủ</h1>
          <p>
            Chỉ một quảng cáo được hiển thị trên trang chủ tại một thời điểm.
          </p>
        </div>
      </div>

      <form className="admin-ad-card admin-ad-form" onSubmit={handleSubmit}>
        <h2>{formData.id ? "Cập nhật quảng cáo" : "Thêm quảng cáo"}</h2>

        <div className="admin-ad-form-grid">
          <div className="admin-ad-image-column">
            <input
              id="advertisementImageInput"
              name="image"
              type="file"
              accept="image/*"
              onChange={handleChange}
              className="hidden-input"
            />

            <label
              htmlFor="advertisementImageInput"
              className={`main-image-upload-area ${
                errors.image ? "input-error-border" : ""
              }`}
            >
              {formData.imagePreview ? (
                <img
                  src={formData.imagePreview}
                  alt="Advertisement preview"
                  className="main-preview-img"
                />
              ) : (
                <div className="upload-placeholder">
                  <svg
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#555"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                  <span className="upload-text">+ Thêm ảnh quảng cáo</span>
                </div>
              )}
            </label>

            {errors.image && (
              <div className="error-message">{errors.image}</div>
            )}
          </div>

          <div className="admin-ad-info-column">
            <div className="admin-ad-field">
              <label>Tiêu đề</label>
              <input
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Ví dụ: Khuyến mãi tháng này"
                className={errors.title ? "input-error" : ""}
              />
              {errors.title && (
                <div className="error-message">{errors.title}</div>
              )}
            </div>

            <div className="admin-ad-field">
              <label>Đích đến khi nhấp vào quảng cáo</label>
              <select
                name="targetType"
                value={formData.targetType}
                onChange={handleChange}
              >
                <option value="NONE">Không chuyển trang</option>
                <option value="CATEGORY">Danh mục</option>
                <option value="PRODUCT">Sản phẩm</option>
              </select>
            </div>

            {formData.targetType !== "NONE" && (
              <div className="admin-ad-field">
                <label>
                  {formData.targetType === "CATEGORY"
                    ? "Chọn danh mục"
                    : "Chọn sản phẩm"}
                </label>

                <select
                  name="targetId"
                  value={formData.targetId}
                  onChange={handleChange}
                  className={errors.targetId ? "input-error" : ""}
                >
                  <option value="">-- Chọn đích đến --</option>

                  {targetOptions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>

                {errors.targetId && (
                  <div className="error-message">{errors.targetId}</div>
                )}
              </div>
            )}

            <label className="admin-ad-checkbox">
              <input
                name="active"
                type="checkbox"
                checked={formData.active}
                onChange={handleChange}
              />
              <span>Bật quảng cáo này</span>
            </label>

            <div className="admin-ad-actions">
              {formData.id && (
                <button
                  type="button"
                  className="admin-ad-secondary-btn"
                  onClick={resetForm}
                  disabled={saving}
                >
                  Hủy sửa
                </button>
              )}

              <button
                type="submit"
                className="admin-ad-primary-btn"
                disabled={saving}
              >
                {saving
                  ? "Đang lưu..."
                  : formData.id
                    ? "Cập nhật"
                    : "Thêm quảng cáo"}
              </button>
            </div>
          </div>
        </div>
      </form>

      <div className="admin-ad-card">
        <div className="admin-ad-list-header">
          <div>
            <h2>Danh sách quảng cáo</h2>
          </div>

          <input
            className="admin-ad-search"
            type="text"
            value={searchQuery}
            placeholder="Tìm quảng cáo..."
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>

        <DataTable
          columns={columns}
          data={advertisements}
          itemsPerPage={5}
          searchQuery={searchQuery}
        />
      </div>
    </div>
  );
};

export default AdvertisementPage;
