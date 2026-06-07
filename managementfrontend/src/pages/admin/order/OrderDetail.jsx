import React, { useState, useEffect, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import {
  LuUser,
  LuPhone,
  LuMapPin,
  LuClock,
  LuCreditCard,
  LuClipboardList,
  LuCoffee,
  LuTruck,
} from "react-icons/lu";
import Swal from "sweetalert2";

import orderApi from "../../../apis/OrderApi";
import userApi from "../../../apis/userApi";
import Button from "../../../components/admin/button/Button";
import "./OrderDetail.css";
import OrderRouteMap from "../../../components/admin/order/OrderRouteMap";

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

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

  const formatPrice = (price) => {
    return price != null ? `${price.toLocaleString("vi-VN")}đ` : "0đ";
  };

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

  const billRef = useRef();

  const handlePrint = useReactToPrint({
    contentRef: billRef,
    documentTitle: `Hoa_Don_${order?.code || "NEX"}`,
    onAfterPrint: () => console.log("In thành công!"),
  });

  const handleUpdateStatus = async (newStatus) => {
    let shipperId = null;
    let staffId = null;
    let confirmResult;

    if (newStatus === "Processing") {
      const userStorage =
        localStorage.getItem("currentUser") ||
        sessionStorage.getItem("currentUser");

      if (userStorage) {
        try {
          const userObj = JSON.parse(userStorage);
          staffId = userObj.id;
        } catch (error) {
          console.error("Lỗi khi đọc dữ liệu currentUser:", error);
        }
      }

      confirmResult = await Swal.fire({
        title: "Xác nhận đơn hàng",
        text: "Bạn sẽ tiếp nhận và tiến hành pha chế đơn hàng này?",
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#1468e3",
        cancelButtonColor: "rgb(154, 154, 154)",
        confirmButtonText: "Xác nhận",
        cancelButtonText: "Hủy bỏ",
        reverseButtons: true,
        customClass: {
          popup: "swal-custom-popup",
          title: "swal-custom-title",
        },
      });

      if (!confirmResult.isConfirmed) return;
    } else if (newStatus === "Shipped") {
      try {
        const response = await userApi.getShippers();
        const shippersFromDb = response.data;

        const shipperOptions = {};
        shippersFromDb.forEach((shipper) => {
          shipperOptions[shipper.id] = shipper.fullName;
        });

        if (Object.keys(shipperOptions).length === 0) {
          Swal.fire({
            title: "Thông báo",
            text: "Hiện tại không có nhân viên giao hàng nào đang hoạt động!",
            icon: "warning",
            confirmButtonColor: "#1468e3",
          });
          return;
        }

        const result = await Swal.fire({
          title: "Chọn người giao hàng",
          input: "select",
          inputOptions: shipperOptions,
          inputPlaceholder: "--- Chọn nhân viên ---",
          showCancelButton: true,
          confirmButtonColor: "#1468e3",
          cancelButtonColor: "rgb(154, 154, 154)",
          confirmButtonText: "Bắt đầu giao",
          cancelButtonText: "Hủy",
          reverseButtons: true,

          customClass: {
            popup: "swal-custom-popup",
            title: "swal-custom-title",
            input: "swal-custom-select",
          },

          inputValidator: (value) => {
            if (!value) {
              return "Bạn bắt buộc phải chọn người giao hàng!";
            }
          },
        });

        if (!result.isConfirmed) return;
        shipperId = result.value;
      } catch (error) {
        console.error("Lỗi lấy danh sách Shipper:", error);
        const errorMsg =
          error.response?.data?.message ||
          "Không thể lấy danh sách nhân viên giao hàng.";
        Swal.fire({
          title: "Lỗi",
          text: errorMsg,
          icon: "error",
          confirmButtonColor: "#1468e3",
        });
        return;
      }
    } else {
      confirmResult = await Swal.fire({
        title: "Hoàn thành đơn hàng",
        text: "Khách hàng đã nhận được nước và thanh toán đầy đủ?",
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#1468e3",
        cancelButtonColor: "rgb(154, 154, 154)",
        confirmButtonText: "Đã hoàn thành",
        cancelButtonText: "Hủy bỏ",
        reverseButtons: true,
        customClass: {
          popup: "swal-custom-popup",
          title: "swal-custom-title",
        },
      });

      if (!confirmResult.isConfirmed) return;
    }

    try {
      const payload = {
        status: newStatus,
        shipperId: shipperId,
        staffId: staffId,
      };
      const response = await orderApi.updateOrderStatus(id, payload);
      setOrder(response.data);

      Swal.fire({
        title: "Thành công!",
        text: "Đã cập nhật trạng thái đơn hàng.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("Lỗi cập nhật:", error.response?.data || error.message);
      Swal.fire({
        title: "Thất bại!",
        text: "Cập nhật trạng thái thất bại. Vui lòng thử lại.",
        icon: "error",
        confirmButtonColor: "#1468e3",
      });
    }
  };

  const handleCancelOrder = async () => {
    const { value: reason, isConfirmed } = await Swal.fire({
      title: "Hủy đơn hàng",
      input: "textarea",
      inputLabel: "Vui lòng nhập lý do hủy đơn hàng:",
      inputPlaceholder: "Nhập lý do tại đây...",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "rgb(154, 154, 154)",
      confirmButtonText: "Xác nhận Hủy",
      cancelButtonText: "Đóng",
      reverseButtons: true,

      customClass: {
        popup: "swal-danger-popup",
        title: "swal-danger-title",
        input: "swal-danger-textarea",
        icon: "swal-danger-icon",
        confirmButton: "swal-danger-confirm-btn",
      },
      inputValidator: (value) => {
        if (!value || value.trim() === "") {
          return "Bạn phải nhập lý do để hủy đơn hàng!";
        }
      },
    });
    if (!isConfirmed) return;

    try {
      const payload = {
        status: "Cancelled",
        cancelReason: reason,
      };

      const response = await orderApi.updateOrderStatus(id, payload);
      setOrder(response.data);
    } catch (error) {
      console.error("Lỗi khi hủy đơn hàng:", error);
      Swal.fire({
        title: "Lỗi!",
        text: "Không thể hủy đơn hàng. Vui lòng thử lại!",
        icon: "error",
        confirmButtonColor: "#1468e3",
      });
    }
  };

  if (isLoading)
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        Đang tải dữ liệu chi tiết...
      </div>
    );

  if (!order)
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        Không tìm thấy đơn hàng!
      </div>
    );

  const statusSteps = [
    {
      id: "Pending",
      label: "Chờ nhận đơn",
      icon: LuClipboardList,
      actor: order.staffName ? `Người nhận: ${order.staffName}` : "",
      time: order.processedAt ? formatDate(order.processedAt) : "",
    },
    {
      id: "Processing",
      label: "Đang pha chế",
      icon: LuCoffee,
      actor: order.staffName ? `Người thực hiện: ${order.staffName}` : "",
      time: order.processedAt ? formatDate(order.processedAt) : "",
    },
    {
      id: "Shipped",
      label: "Đang giao hàng",
      icon: LuTruck,
      actor: order.shipperName ? `Người giao: ${order.shipperName}` : "",
      time: order.shippedAt ? formatDate(order.shippedAt) : "",
    },
    {
      id: "Completed",
      label: "Hoàn thành",
      icon: FaCheckCircle,
      actor: order.shipperName ? `Giao bởi: ${order.shipperName}` : "",
      time: order.completedAt ? formatDate(order.completedAt) : "",
    },
  ];

  const currentStepIndex = statusSteps.findIndex(
    (step) => step.id === order.status,
  );
  const isCancelled = order.status === "Cancelled";
  const progressWidth =
    currentStepIndex > 0
      ? `${(currentStepIndex / (statusSteps.length - 1)) * 100}%`
      : "0%";

  return (
    <div className="order-container">
      <div className="order-content">
        <button onClick={() => navigate(-1)} className="order-content__backBtn">
          <FaArrowLeft />
          <p>Quay lại</p>
        </button>

        <div className="order-card">
          <h2 className="section-title">Trạng thái đơn hàng: {order.code}</h2>

          <div className="modern-timeline">
            {isCancelled ? (
              <div className="timeline-cancelled-state">
                <div className="step-icon-wrapper cancelled">
                  <FaTimesCircle size={24} />
                </div>
                <div className="cancelled-text">
                  <p className="step-label cancelled">Đơn hàng đã bị hủy</p>

                  {order.cancelReason && (
                    <p
                      className="cancel-reason"
                      style={{ textAlign: "center" }}
                    >
                      Lý do: {order.cancelReason}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="timeline-track-container">
                <div className="timeline-progress-bg"></div>

                <div
                  className="timeline-progress-fill"
                  style={{ width: progressWidth }}
                ></div>

                <div className="timeline-steps-wrapper">
                  {statusSteps.map((step, index) => {
                    const Icon = step.icon;
                    const isCompleted = index <= currentStepIndex;
                    const isActive = index === currentStepIndex;

                    return (
                      <div key={step.id} className="timeline-step">
                        <div
                          className={`step-icon-wrapper ${isCompleted ? "completed" : ""} ${isActive ? "active" : ""}`}
                        >
                          <Icon size={22} />
                        </div>

                        {/* Khu vực hiển thị thông tin Text */}
                        <div style={{ textAlign: "center", marginTop: "12px" }}>
                          <p
                            className={`step-label ${isCompleted ? "text-dark" : "text-gray"}`}
                            style={{
                              margin: 0,
                              fontWeight: isActive ? "bold" : "normal",
                            }}
                          >
                            {step.label}
                          </p>

                          {/* Chỉ hiển thị người thao tác & thời gian khi bước đó đã hoàn thành hoặc đang xử lý */}
                          {isCompleted && step.actor && (
                            <p
                              style={{
                                margin: "4px 0 0 0",
                                fontSize: "13px",
                                color: "#1468e3",
                                fontWeight: "500",
                              }}
                            >
                              {step.actor}
                            </p>
                          )}
                          {isCompleted && step.time && (
                            <p
                              style={{
                                margin: "2px 0 0 0",
                                fontSize: "12px",
                                color: "#888",
                              }}
                            >
                              {step.time}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="order-grid">
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

          <div className="order-grid-right">
            <div className="order-card">
              <h2 className="section-title">Thao tác quản trị</h2>
              <div
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    minWidth: "80%",
                    display: "flex",
                    flexDirection: "column",
                    gap: "20px",
                  }}
                >
                  {!isCancelled && order.status !== "Completed" && (
                    <>
                      {order.status === "Pending" && (
                        <Button
                          buttonName="Xác nhận đơn hàng"
                          onClick={() => handleUpdateStatus("Processing")}
                        />
                      )}

                      {order.status === "Processing" && (
                        <Button
                          buttonName="Giao hàng"
                          onClick={() => handleUpdateStatus("Shipped")}
                        />
                      )}

                      {order.status === "Shipped" && (
                        <Button
                          buttonName="Hoàn thành đơn hàng"
                          onClick={() => handleUpdateStatus("Completed")}
                        />
                      )}
                    </>
                  )}

                  <Button buttonName="In hóa đơn" onClick={handlePrint} />

                  {!isCancelled && order.status !== "Completed" && (
                    <>
                      <Button
                        buttonName="Hủy đơn hàng"
                        onClick={handleCancelOrder}
                        className="dangerButton"
                      />
                    </>
                  )}
                </div>
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
                      {order.paymentStatus === "paid"
                        ? " Đã thanh toán"
                        : " Chưa thanh toán"}
                    </p>
                  </div>
                </div>
                <OrderRouteMap order={order} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "none" }}>
        <div ref={billRef} className="print-bill-container">
          <div className="bill-header">
            <h2>NexCoffee</h2>
            <p>Đại Học Phenikaa</p>
            <p>Hotline: 0395 230 327</p>
            <hr />
            <h3>HÓA ĐƠN THANH TOÁN</h3>
          </div>

          <div className="bill-info">
            <p>
              <strong>Mã đơn:</strong> {order.code}
            </p>
            <p>
              <strong>Ngày đặt:</strong> {formatDate(order.createdAt)}
            </p>
            <hr />
            <p>
              <strong>Khách hàng:</strong> {order.customerName}
            </p>
            <p>
              <strong>SĐT:</strong> {order.phone}
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
