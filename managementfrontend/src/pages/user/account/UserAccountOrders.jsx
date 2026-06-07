import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { cancelMyOrder, getMyOrders } from "../../../apis/accountApi";

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

const getStatusInfo = (status) => {
  const map = {
    Pending: ["Chờ duyệt", "warn"],
    Processing: ["Đang xử lý", "shipping"],
    Shipped: ["Đang giao", "shipping"],
    Completed: ["Hoàn thành", "success"],
    Cancelled: ["Đã bị hủy", "cancelled"],
  };

  return map[status] || [status || "—", ""];
};

const getPaymentLabel = (paymentMethod) => {
  if (paymentMethod === "COD") return "Thanh toán khi nhận hàng (COD)";
  return paymentMethod || "—";
};
const ORDERS_PER_PAGE = 5;
const UserAccountOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await getMyOrders();
      setOrders(Array.isArray(data) ? data : []);
      setCurrentPage(1);
    } catch (error) {
      toast.error("Không thể tải danh sách đơn hàng.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    fetchOrders();
  }, []);

  const hasOrders = useMemo(() => orders.length > 0, [orders]);
  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(orders.length / ORDERS_PER_PAGE));
  }, [orders.length]);

  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * ORDERS_PER_PAGE;
    const endIndex = startIndex + ORDERS_PER_PAGE;

    return orders.slice(startIndex, endIndex);
  }, [orders, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  const handleCancel = async (order) => {
    if (order.status !== "Pending") {
      toast.warning("Chỉ có thể hủy đơn hàng đang ở trạng thái chờ duyệt.");
      return;
    }

    const reason = window.prompt(
      "Nhập lý do hủy đơn hàng:",
      "Khách hàng hủy đơn",
    );

    if (reason === null) return;

    try {
      await cancelMyOrder(order.id, reason);
      toast.success("Đã hủy đơn hàng.");
      fetchOrders();
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data ||
        "Không thể hủy đơn hàng.";

      toast.error(message);
    }
  };

  return (
    <section className="user-account-orders">
      <h2>ĐƠN HÀNG CỦA BẠN</h2>

      {loading ? (
        <p className="user-account-muted">Đang tải đơn hàng...</p>
      ) : !hasOrders ? (
        <div className="user-account-empty">
          <p>Bạn chưa có đơn hàng nào.</p>
          <Link to="/menu">Tiếp tục mua hàng</Link>
        </div>
      ) : (
        <>
          <div className="user-account-table-wrap">
            <table className="user-account-table">
              <thead>
                <tr>
                  <th>Đơn hàng</th>
                  <th>Ngày</th>
                  <th>Địa chỉ</th>
                  <th>Giá trị</th>
                  <th>TT thanh toán</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>

              <tbody>
                {paginatedOrders.map((order) => {
                  const [statusLabel, statusClass] = getStatusInfo(
                    order.status,
                  );

                  return (
                    <tr key={order.id}>
                      <td>
                        <Link to={`/account/orders/${order.id}`}>
                          #{order.code || order.id}
                        </Link>
                      </td>

                      <td>{formatDate(order.createdAt)}</td>
                      <td>{order.address || "—"}</td>

                      <td className="user-account-price">
                        {formatCurrency(order.total)}
                      </td>

                      <td>{getPaymentLabel(order.paymentMethod)}</td>

                      <td>
                        <span className={`user-account-badge ${statusClass}`}>
                          {statusLabel}
                        </span>
                      </td>

                      <td>
                        <div className="user-account-actions">
                          <Link
                            className="user-account-action-link"
                            to={`/account/orders/${order.id}`}
                          >
                            Xem
                          </Link>

                          {order.status === "Pending" && (
                            <button
                              type="button"
                              className="user-account-cancel-btn"
                              onClick={() => handleCancel(order)}
                            >
                              Hủy
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="user-account-pagination">
              <button
                type="button"
                onClick={handlePrevPage}
                disabled={currentPage === 1}
              >
                Trước
              </button>

              <span>
                Trang {currentPage} / {totalPages}
              </span>

              <button
                type="button"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
              >
                Sau
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default UserAccountOrders;
