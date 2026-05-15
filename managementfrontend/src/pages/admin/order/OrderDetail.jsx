import React, { useState, useEffect, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { LuUser, LuPhone, LuMapPin, LuClock, LuCreditCard } from "react-icons/lu";

import orderApi from "../../../apis/OrderApi";
import Button from "../../../components/admin/button/Button";
import "./OrderDetail.css";

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const billRef = useRef();

  const handlePrint = useReactToPrint({
    contentRef: billRef,
    documentTitle: `Hoa_Don_${order?.code || "NEX"}`,
    onAfterPrint: () => console.log("In thành công!"),
  });

  useEffect(() => {
    const fetchOrderDetail = async () => {
      try {
        const response = await orderApi.getById(id);
        setOrder(response.data);
      } catch (error) {
        console.error("Lỗi khi lấy chi tiết đơn hàng:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrderDetail();
  }, [id]);

  // Hàm định dạng tiền tệ
  const formatPrice = (price) => {
    return price != null ? `${price.toLocaleString("vi-VN")}đ` : "0đ";
  };

  // Hàm định dạng ngày tháng
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Hàm xử lý cập nhật trạng thái đơn hàng
  const handleUpdateStatus = async (newStatus) => {
    const isConfirmed = window.confirm(
      `Bạn có chắc chắn muốn chuyển trạng thái đơn hàng sang: ${newStatus}?`,
    );
    if (!isConfirmed) return;

    try {
      const response = await orderApi.updateOrderStatus(id, newStatus);

      setOrder(response.data);
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái:", error);
      alert("Có lỗi xảy ra, vui lòng thử lại!");
    }
  };

  // Nếu đang tải dữ liệu
  if (isLoading)
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        Đang tải dữ liệu chi tiết...
      </div>
    );

  // Nếu không tìm thấy đơn hàng
  if (!order)
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        Không tìm thấy đơn hàng!
      </div>
    );

  // Logic xác định trạng thái Timeline
  const statusSteps = ["Pending", "Processing", "Shipped", "Completed"];
  const currentStepIndex = statusSteps.indexOf(order.status);
  const isCancelled = order.status === "Cancelled";

  return (
    <div className="order-container">
      <div className="order-content">
        <button onClick={() => navigate(-1)} className="order-content__backBtn">
          <FaArrowLeft />
          <p>Quay lại</p>
        </button>

        <div className="order-card">
          <h2 className="section-title">Trạng thái đơn hàng: {order.code}</h2>

          {isCancelled && (
            <span style={{ color: "red" }}>Đã Hủy: {order.cancelReason}</span>
          )}

          {!isCancelled && (
            <div className="timeline">
              <div className="timeline-line"></div>

              <div
                className={`timeline-step ${currentStepIndex < 0 ? "step-opacity" : ""}`}
              >
                <div
                  className={`step-icon ${currentStepIndex >= 1 ? "done" : currentStepIndex === 0 ? "active" : "pending"}`}
                >
                  {currentStepIndex >= 1 ? (
                    "✓"
                  ) : currentStepIndex === 0 ? (
                    <div className="active-dot"></div>
                  ) : (
                    ""
                  )}
                </div>
                <div className="step-text">
                  <p
                    className={`step-title ${currentStepIndex === 0 ? "active-text" : ""}`}
                  >
                    Chờ nhận đơn
                  </p>
                </div>
              </div>

              <div
                className={`timeline-step ${currentStepIndex < 1 ? "step-opacity" : ""}`}
              >
                <div
                  className={`step-icon ${currentStepIndex >= 2 ? "done" : currentStepIndex === 1 ? "active" : "pending"}`}
                >
                  {currentStepIndex >= 2 ? (
                    "✓"
                  ) : currentStepIndex === 1 ? (
                    <div className="active-dot"></div>
                  ) : (
                    ""
                  )}
                </div>
                <div className="step-text">
                  <p
                    className={`step-title ${currentStepIndex === 1 ? "active-text" : ""}`}
                  >
                    Đang pha chế
                  </p>
                </div>
              </div>

              <div
                className={`timeline-step ${currentStepIndex < 2 ? "step-opacity" : ""}`}
              >
                <div
                  className={`step-icon ${currentStepIndex >= 3 ? "done" : currentStepIndex === 2 ? "active" : "pending"}`}
                >
                  {currentStepIndex >= 3 ? (
                    "✓"
                  ) : currentStepIndex === 2 ? (
                    <div className="active-dot"></div>
                  ) : (
                    ""
                  )}
                </div>
                <div className="step-text">
                  <p
                    className={`step-title ${currentStepIndex === 2 ? "active-text" : ""}`}
                  >
                    Đang giao hàng
                  </p>
                </div>
              </div>

              <div
                className={`timeline-step ${currentStepIndex < 3 ? "step-opacity" : ""}`}
              >
                <div
                  className={`step-icon ${currentStepIndex === 3 ? "done" : "pending"}`}
                >
                  {currentStepIndex === 3 ? "✓" : ""}
                </div>
                <div className="step-text">
                  <p
                    className={`step-title ${currentStepIndex === 3 ? "active-text" : ""}`}
                  >
                    Hoàn thành
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* nội dung */}
        <div className="order-grid">
          {/* danh sách sản phẩm trong đơn hàng */}
          <div className="order-grid-left">
            <div className="order-card">
              <h2 className="card-title">Sản phẩm đã đặt</h2>
              <table className="product-table">
                <thead>
                  <tr>
                    <th>SẢN PHẨM</th>
                    <th className="text-center">SỐ LƯỢNG</th>
                    <th className="text-right">ĐƠN GIÁ</th>
                    <th className="text-right">THÀNH TIỀN</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items &&
                    order.items.map((item, index) => (
                      <tr key={index}>
                        <td>
                          <div className="product-info">
                            <img
                              src={`http://localhost:8080/images/${item.image}`}
                              alt="image product"
                              className="orderProduct__img"
                              style={{
                                width: "60px",
                                height: "60px",
                                objectFit: "cover",
                                borderRadius: "4px",
                              }}
                            />
                            <div>
                              <p className="product-name">{item.productName}</p>
                              <p className="product-note">Size: {item.size}</p>
                            </div>
                          </div>
                        </td>
                        <td className="text-center font-medium">
                          {item.quantity}
                        </td>
                        <td className="text-right text-gray-600">
                          {formatPrice(item.unitPrice)}
                        </td>
                        <td className="text-right price-bold">
                          {formatPrice(item.totalPrice)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <div className="order-card">
              <h2 className="card-title">Tóm tắt thanh toán</h2>
              <div>
                <div className="summary-row">
                  <span>Tạm tính</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>
                <div className="summary-row">
                  <span>Phí vận chuyển</span>
                  <span>{formatPrice(order.shipping)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="summary-row summary-discount">
                    <span>Giảm giá</span>
                    <span>-{formatPrice(order.discount)}</span>
                  </div>
                )}
                <div className="summary-total">
                  <span className="total-label">Tổng cộng</span>
                  <span className="total-value">
                    {formatPrice(order.total)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Thao tác và thông tin khách hàng */}
          <div className="order-grid-right">
            <div className="order-card">
              <h2 className="section-title">Thao tác quản trị</h2>
              <div>
                {/* Nút động theo trạng thái */}
                {!isCancelled && order.status !== "Completed" && (
                  <>
                    {order.status === "Pending" && (
                      <button
                        className="btn btn-primary"
                        style={{ marginRight: "10px" }}
                        onClick={() => handleUpdateStatus("Processing")}
                      >
                        Duyệt & Pha chế
                      </button>
                    )}

                    {order.status === "Processing" && (
                      <button
                        className="btn btn-primary"
                        style={{ marginRight: "10px" }}
                        onClick={() => handleUpdateStatus("Shipped")}
                      >
                        Giao hàng
                      </button>
                    )}

                    {order.status === "Shipped" && (
                      <button
                        className="btn btn-success"
                        style={{
                          marginRight: "10px",
                          backgroundColor: "#28a745",
                          color: "white",
                        }}
                        onClick={() => handleUpdateStatus("Completed")}
                      >
                        Đã giao thành công
                      </button>
                    )}
                  </>
                )}

                <Button buttonName="In hóa đơn" onClick={handlePrint} />

                {/* Nút hủy tạm thời để đó, chưa gắn sự kiện */}
                {!isCancelled && order.status !== "Completed" && (
                  <>
                    <button className="btn btn-secondary">Hủy đơn hàng</button>
                  </>
                )}
              </div>
            </div>

            <div className="order-card">
              <h2 className="card-title">Thông tin khách hàng</h2>
              <div className="customer-info">
                <div className="info-row">
                  <span className="info-icon">
                    <LuUser size={18} />
                  </span>
                  <div>
                    <p className="info-label">Họ tên</p>
                    <p className="info-value">{order.customerName}</p>
                  </div>
                </div>

                <div className="info-row">
                  <span className="info-icon">
                    <LuPhone size={18} />
                  </span>
                  <div>
                    <p className="info-label">Điện thoại</p>
                    <p className="info-value">{order.phone}</p>
                  </div>
                </div>

                {order.address && (
                  <div className="info-row">
                    <span className="info-icon">
                      <LuMapPin size={18} />
                    </span>
                    <div>
                      <p className="info-label">Địa chỉ</p>
                      <p className="info-value">{order.address}</p>
                    </div>
                  </div>
                )}

                <hr className="divider" />

                <div className="info-row">
                  <span className="info-icon">
                    <LuClock size={18} />
                  </span>
                  <div>
                    <p className="info-label">Thời gian đặt</p>
                    <p className="info-value">{formatDate(order.createdAt)}</p>
                  </div>
                </div>

                <div className="info-row">
                  <span className="info-icon">
                    <LuCreditCard size={18} />
                  </span>
                  <div>
                    <p className="info-label">Thanh toán</p>
                    <p className="info-value">
                      <span className="payment-tag">{order.paymentMethod}</span>
                      {order.paymentStatus === "paid"
                        ? " (Đã thanh toán)"
                        : " (Chưa thanh toán)"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "none" }}>
        <div ref={billRef} className="print-bill-container">
          <div className="bill-header">
            <h2>NEX COFFEE</h2>
            <p>123 Đường ABC, Quận 1, TP.HCM</p>
            <p>Hotline: 0909 123 456</p>
            <hr />
            <h3>HÓA ĐƠN THANH TOÁN</h3>
          </div>

          <div className="bill-info">
            <p>
              <strong>Mã đơn:</strong> {order.code}
            </p>
            <p>
              <strong>Ngày:</strong> {formatDate(order.createdAt)}
            </p>
            <p>
              <strong>Khách hàng:</strong> {order.customerName}
            </p>
          </div>

          <hr />

          <table className="bill-items">
            <thead>
              <tr>
                <th style={{ textAlign: "left" }}>Món</th>
                <th>SL</th>
                <th style={{ textAlign: "right" }}>Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {order.items &&
                order.items.map((item, index) => (
                  <tr key={index}>
                    <td>
                      {item.productName} <br />
                      <small>Size: {item.size}</small>
                    </td>
                    <td style={{ textAlign: "center" }}>{item.quantity}</td>
                    <td style={{ textAlign: "right" }}>
                      {formatPrice(item.totalPrice)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>

          <hr />

          <div className="bill-summary">
            <div className="summary-line">
              <span>Tạm tính:</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="summary-line">
              <span>Phí Ship:</span>
              <span>{formatPrice(order.shipping)}</span>
            </div>
            {order.discount > 0 && (
              <div className="summary-line">
                <span>Giảm giá:</span>
                <span>-{formatPrice(order.discount)}</span>
              </div>
            )}
            <div className="summary-line total">
              <span>TỔNG CỘNG:</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>

          <div className="bill-footer">
            <p>Xin cảm ơn và hẹn gặp lại!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
