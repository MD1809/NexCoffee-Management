import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { cancelMyOrder, getMyOrderDetail } from "../../../apis/accountApi";

const BACKEND_URL = "http://localhost:8080";

const formatCurrency = (value) => {
  return new Intl.NumberFormat("vi-VN").format(Number(value || 0)) + "đ";
};

const formatDate = (value) => {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const getImageUrl = (imagePath) => {
  if (!imagePath) return "";

  if (imagePath.startsWith("http")) return imagePath;
  if (imagePath.startsWith("/images")) return `${BACKEND_URL}${imagePath}`;
  if (imagePath.startsWith("images")) return `${BACKEND_URL}/${imagePath}`;

  return `${BACKEND_URL}/images/${imagePath}`;
};

const getStatusInfo = (status) => {
  const map = {
    Pending: ["Chờ duyệt", "warn"],
    Processing: ["Đang xử lý", "shipping"],
    Shipped: ["Đang giao", "shipping"],
    Completed: ["Đã hoàn thành", "success"],
    Cancelled: ["Đã bị hủy", "cancelled"],
  };

  return map[status] || [status || "—", ""];
};

const getPaymentLabel = (paymentMethod) => {
  if (paymentMethod === "COD") return "Thanh toán khi giao hàng (COD)";
  return paymentMethod || "—";
};

const UserAccountOrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const [statusLabel, statusClass] = useMemo(() => {
    return getStatusInfo(order?.status);
  }, [order]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const data = await getMyOrderDetail(id);
      setOrder(data);
    } catch (error) {
      toast.error("Không thể tải chi tiết đơn hàng.");
      navigate("/account/orders", { replace: true });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    fetchOrder();
  }, [id]);

  const handleCancelOrder = async () => {
    if (!order || order.status !== "Pending") {
      toast.warning("Chỉ có thể hủy đơn hàng đang ở trạng thái chờ duyệt.");
      return;
    }

    const reason = window.prompt(
      "Nhập lý do hủy đơn hàng:",
      "Khách hàng hủy đơn",
    );

    if (reason === null) return;

    try {
      const updatedOrder = await cancelMyOrder(order.id, reason);
      setOrder(updatedOrder);
      toast.success("Đã hủy đơn hàng.");
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data ||
        "Không thể hủy đơn hàng.";

      toast.error(message);
    }
  };

  if (loading) {
    return <p className="user-account-muted">Đang tải chi tiết đơn hàng...</p>;
  }

  if (!order) return null;

  const isCancelled = order.status === "Cancelled";

  return (
    <section className="user-account-order-detail">
      <div className="user-account-detail-head">
        <h2>
          Chi tiết đơn hàng <span>#{order.code || order.id}</span>
        </h2>

        <Link to="/account/orders">Quay lại đơn hàng</Link>
      </div>

      <div className="user-account-status-box">
        <div>
          <span>Trạng thái đơn hàng:</span>{" "}
          <strong className={`user-account-status-text ${statusClass}`}>
            {statusLabel}
          </strong>
        </div>

        <div>Ngày tạo: {formatDate(order.createdAt)}</div>
      </div>

      {isCancelled && (
        <div className="user-account-cancel-box">
          <p>Ngày hủy: {formatDate(order.updatedAt)}</p>
          <p>Lý do hủy: {order.cancelReason || "Không có lý do"}</p>
        </div>
      )}

      {order.status === "Pending" && (
        <div className="user-account-cancel-area">
          <button type="button" onClick={handleCancelOrder}>
            Hủy đơn hàng
          </button>
        </div>
      )}

      <div className="user-account-info-grid">
        <div className="user-account-info-card">
          <h3>ĐỊA CHỈ GIAO HÀNG</h3>
          <p className="user-account-uppercase">{order.fullName}</p>
          <p>
            <strong>Địa chỉ:</strong> {order.address}
          </p>
          <p>
            <strong>Số điện thoại:</strong> {order.phone}
          </p>
        </div>

        <div className="user-account-info-card">
          <h3>THANH TOÁN</h3>
          <p>{getPaymentLabel(order.paymentMethod)}</p>
        </div>

        <div className="user-account-info-card">
          <h3>GHI CHÚ</h3>
          <p>{order.note || "Không có ghi chú"}</p>
        </div>
      </div>

      <div className="user-account-product-list">
        <div className="user-account-product-title">DANH SÁCH SẢN PHẨM</div>

        <table>
          <thead>
            <tr>
              <th>Sản phẩm</th>
              <th>Đơn giá</th>
              <th>Số lượng</th>
              <th>Tổng</th>
            </tr>
          </thead>

          <tbody>
            {(order.items || []).map((item) => {
              const imageUrl = getImageUrl(item.image);

              return (
                <tr key={`${item.variantId}-${item.productId}`}>
                  <td>
                    <div className="user-account-product-cell">
                      {imageUrl ? (
                        <img src={imageUrl} alt={item.productName} />
                      ) : (
                        <div className="user-account-product-placeholder">
                          Nex
                        </div>
                      )}

                      <div>
                        <strong>{item.productName}</strong>
                        {item.size && <p>Size {item.size}</p>}
                      </div>
                    </div>
                  </td>

                  <td>{formatCurrency(item.unitPrice)}</td>
                  <td>{item.quantity}</td>
                  <td className="user-account-line-total">
                    {formatCurrency(item.lineTotal || item.totalPrice)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="user-account-totals">
        <div>
          <div>
            <span>Tạm tính:</span>
            <strong>{formatCurrency(order.subtotal)}</strong>
          </div>

          <div>
            <span>Phí ship:</span>
            <strong>
              {Number(order.shipping || 0) > 0
                ? formatCurrency(order.shipping)
                : "Miễn phí"}
            </strong>
          </div>

          {Number(order.discount || 0) > 0 && (
            <div>
              <span>Giảm giá:</span>
              <strong>-{formatCurrency(order.discount)}</strong>
            </div>
          )}

          <div className="user-account-grand-total">
            <span>Tổng cộng</span>
            <strong>{formatCurrency(order.total)}</strong>
          </div>
        </div>
      </div>
    </section>
  );
};

export default UserAccountOrderDetail;
