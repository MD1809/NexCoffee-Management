import React, { useState, useEffect, useMemo } from "react";
import "./ExportReportModal.css";
import { getActiveStores } from "../../../apis/storeApi";
import dailyReportApi from "../../../apis/dailyReportService";

const ExportReportModal = ({
  isOpen,
  onClose,
  defaultDate,
  selectedStoreId,
  currentUser,
  currentData = {},
}) => {
  // Preset khoảng thời gian
  const [dateRangeMode, setDateRangeMode] = useState("current"); // "current" | "today" | "7days" | "month" | "custom"
  const [customStartDate, setCustomStartDate] = useState(defaultDate || new Date().toISOString().split("T")[0]);
  const [customEndDate, setCustomEndDate] = useState(defaultDate || new Date().toISOString().split("T")[0]);

  // Chi nhánh
  const [targetStoreId, setTargetStoreId] = useState(selectedStoreId || "");
  const [storeList, setStoreList] = useState([]);

  // Dữ liệu cần xuất
  const [includeSummary, setIncludeSummary] = useState(true);
  const [includeProducts, setIncludeProducts] = useState(true);
  const [includeOrders, setIncludeOrders] = useState(true);

  // Bộ lọc đơn hàng
  const [orderStatusFilter, setOrderStatusFilter] = useState("Completed"); // "Completed" | "All" | "NotCancelled"

  // Định dạng file
  const [fileFormat, setFileFormat] = useState("xls"); // "xls" (Định dạng Excel có màu & viền) | "csv" (CSV UTF-8)

  // Trạng thái loading khi xuất
  const [isExporting, setIsExporting] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Danh sách đơn hàng preview
  const [previewOrders, setPreviewOrders] = useState([]);
  const [previewRevenue, setPreviewRevenue] = useState(0);

  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";

  // Lấy danh sách chi nhánh nếu là Super Admin
  useEffect(() => {
    if (isOpen && isSuperAdmin) {
      getActiveStores()
        .then((res) => {
          const list = Array.isArray(res) ? res : res?.data || [];
          setStoreList(list);
        })
        .catch((err) => console.error("Lỗi tải chi nhánh:", err));
    }
  }, [isOpen, isSuperAdmin]);

  // Đồng bộ storeId khi modal mở
  useEffect(() => {
    if (isOpen) {
      setTargetStoreId(selectedStoreId || "");
    }
  }, [isOpen, selectedStoreId]);

  // Tính toán nhãn chi nhánh
  const storeLabel = useMemo(() => {
    if (!isSuperAdmin) {
      return currentUser?.storeName || "Chi nhánh của tôi";
    }
    if (!targetStoreId) return "Toàn bộ hệ thống";
    const found = storeList.find((s) => String(s.id) === String(targetStoreId));
    return found ? found.name : `Chi nhánh ID ${targetStoreId}`;
  }, [isSuperAdmin, targetStoreId, storeList, currentUser]);

  // Tính toán khoảng ngày thực tế
  const resolvedDateRange = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    if (dateRangeMode === "current") {
      return { start: defaultDate, end: defaultDate, label: `Ngày ${defaultDate}` };
    }
    if (dateRangeMode === "today") {
      return { start: todayStr, end: todayStr, label: `Hôm nay (${todayStr})` };
    }
    if (dateRangeMode === "7days") {
      const past7 = new Date();
      past7.setDate(today.getDate() - 6);
      const startStr = past7.toISOString().split("T")[0];
      return { start: startStr, end: todayStr, label: `7 ngày qua (${startStr} -> ${todayStr})` };
    }
    if (dateRangeMode === "month") {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0];
      return { start: startOfMonth, end: todayStr, label: `Tháng này (${startOfMonth} -> ${todayStr})` };
    }
    return {
      start: customStartDate,
      end: customEndDate,
      label: `Từ ${customStartDate} đến ${customEndDate}`,
    };
  }, [dateRangeMode, defaultDate, customStartDate, customEndDate]);

  // Tải dữ liệu preview khi đổi bộ lọc
  useEffect(() => {
    if (!isOpen) return;

    if (dateRangeMode === "current" && targetStoreId === (selectedStoreId || "")) {
      // Dùng ngay dữ liệu hiện có trên trang
      let rawOrders = currentData.orders || [];
      if (orderStatusFilter === "Completed") {
        rawOrders = rawOrders.filter((o) => o.status === "Completed");
      } else if (orderStatusFilter === "NotCancelled") {
        rawOrders = rawOrders.filter((o) => o.status !== "Cancelled");
      }
      setPreviewOrders(rawOrders);
      const sum = rawOrders.reduce((acc, o) => acc + (o.total || 0), 0);
      setPreviewRevenue(sum);
      return;
    }

    // Nếu chọn khoảng ngày khác hoặc chi nhánh khác, fetch dữ liệu
    const fetchRangeOrders = async () => {
      try {
        setLoadingPreview(true);
        const { start, end } = resolvedDateRange;
        const startDate = new Date(start);
        const endDate = new Date(end);

        // Giới hạn tối đa 31 ngày để tránh treo UI
        const diffDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
        if (diffDays > 31) {
          return;
        }

        const dateList = [];
        const cur = new Date(startDate);
        while (cur <= endDate) {
          dateList.push(cur.toISOString().split("T")[0]);
          cur.setDate(cur.getDate() + 1);
        }

        const fetchPromises = dateList.map((d) =>
          dailyReportApi.getOrders(d, targetStoreId || null).catch(() => [])
        );
        const results = await Promise.all(fetchPromises);
        let allOrders = results.flat();

        if (orderStatusFilter === "Completed") {
          allOrders = allOrders.filter((o) => o.status === "Completed");
        } else if (orderStatusFilter === "NotCancelled") {
          allOrders = allOrders.filter((o) => o.status !== "Cancelled");
        }

        setPreviewOrders(allOrders);
        const sum = allOrders.reduce((acc, o) => acc + (o.total || 0), 0);
        setPreviewRevenue(sum);
      } catch (err) {
        console.error("Lỗi tải dữ liệu preview:", err);
      } finally {
        setLoadingPreview(false);
      }
    };

    fetchRangeOrders();
  }, [isOpen, dateRangeMode, targetStoreId, resolvedDateRange, orderStatusFilter, currentData, selectedStoreId]);

  // Tên file dự kiến
  const expectedFileName = useMemo(() => {
    const safeStore = storeLabel.replace(/[^a-zA-Z0-9\u00C0-\u1EF9]/g, "_");
    const safeRange = `${resolvedDateRange.start}_${resolvedDateRange.end}`;
    return `BaoCao_NexCoffee_${safeRange}_${safeStore}.${fileFormat}`;
  }, [storeLabel, resolvedDateRange, fileFormat]);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(val || 0);
  };

  // Hàm xử lý xuất file
  const handleExport = () => {
    try {
      setIsExporting(true);

      if (fileFormat === "xls") {
        generateFormattedExcelFile();
      } else {
        generateCleanCsvFile();
      }

      setTimeout(() => {
        setIsExporting(false);
        onClose();
      }, 500);
    } catch (err) {
      console.error("Lỗi khi xuất file báo cáo:", err);
      setIsExporting(false);
    }
  };

  // 1. Tạo file Excel định dạng HTML Spreadsheet (.xls)
  const generateFormattedExcelFile = () => {
    const nowStr = new Date().toLocaleString("vi-VN");
    const totalOrdersCount = previewOrders.length;
    const totalRev = previewRevenue;

    // Phân loại POS vs Delivery
    const posOrders = previewOrders.filter(
      (o) => !o.address || o.customerName === "Khách lẻ (Tại quầy)" || o.code?.startsWith("NEX-")
    );
    const deliveryOrders = previewOrders.filter(
      (o) => o.address && o.customerName !== "Khách lẻ (Tại quầy)" && !o.code?.startsWith("NEX-")
    );
    const posRev = posOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const deliveryRev = deliveryOrders.reduce((sum, o) => sum + (o.total || 0), 0);

    let html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" 
            xmlns:x="urn:schemas-microsoft-com:office:excel" 
            xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Báo Cáo NexCoffee</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; }
          .header-title { font-size: 16pt; font-weight: bold; color: #1468e3; text-align: center; }
          .meta-table td { font-size: 10pt; padding: 4px 8px; }
          .section-title { font-size: 12pt; font-weight: bold; background-color: #1e293b; color: #ffffff; padding: 6px; }
          .data-table { border-collapse: collapse; width: 100%; margin-top: 8px; margin-bottom: 20px; }
          .data-table th { background-color: #0f172a; color: #f8fafc; font-weight: bold; border: 1px solid #334155; padding: 8px; text-align: center; font-size: 10pt; }
          .data-table td { border: 1px solid #cbd5e1; padding: 6px 8px; font-size: 9.5pt; }
          .data-table tr:nth-child(even) { background-color: #f8fafc; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .font-bold { font-weight: bold; }
          .currency { mso-number-format:"\\#\\,\\#\\#0\\ \\đ"; }
          .total-row { background-color: #e2e8f0; font-weight: bold; }
          .badge-completed { color: #059669; font-weight: bold; }
          .badge-cancelled { color: #dc2626; font-weight: bold; }
        </style>
      </head>
      <body>
        <!-- Header -->
        <table>
          <tr><td colspan="8" class="header-title">HỆ THỐNG CÀ PHÊ NEXCOFFEE - BÁO CÁO DOANH THU & KẾT QUẢ KINH DOANH</td></tr>
          <tr><td colspan="8" class="text-center" style="font-size: 11pt; color: #64748b; font-style: italic;">
            Kỳ báo cáo: ${resolvedDateRange.label}
          </td></tr>
          <tr><td></td></tr>
        </table>

        <!-- Metadata -->
        <table class="meta-table">
          <tr>
            <td><strong>Phạm vi chi nhánh:</strong></td>
            <td>${storeLabel}</td>
            <td><strong>Thời gian kết xuất:</strong></td>
            <td>${nowStr}</td>
          </tr>
          <tr>
            <td><strong>Người xuất báo cáo:</strong></td>
            <td>${currentUser?.fullName || currentUser?.email || "Quản trị viên"}</td>
            <td><strong>Bộ lọc trạng thái:</strong></td>
            <td>${orderStatusFilter === "Completed" ? "Đơn hoàn thành" : orderStatusFilter === "All" ? "Tất cả đơn hàng" : "Không bao gồm đơn hủy"}</td>
          </tr>
        </table>
        <br/>
    `;

    // Phần 1: Tổng hợp chỉ tiêu (Summary)
    if (includeSummary) {
      const avgOrder = totalOrdersCount > 0 ? Math.round(totalRev / totalOrdersCount) : 0;
      html += `
        <table class="data-table">
          <tr><th colspan="4" class="section-title">PHẦN I. TỔNG HỢP CHỈ TIÊU KINH DOANH</th></tr>
          <tr>
            <th>Chỉ Tiêu</th>
            <th>Giá Trị</th>
            <th>Đơn Vị Tính</th>
            <th>Ghi Chú / Tỷ Trọng</th>
          </tr>
          <tr>
            <td><strong>Tổng doanh thu thực tế</strong></td>
            <td class="text-right font-bold currency">${totalRev}</td>
            <td class="text-center">VNĐ</td>
            <td>Doanh thu các đơn theo bộ lọc</td>
          </tr>
          <tr>
            <td>Tổng số lượng đơn hàng</td>
            <td class="text-right font-bold">${totalOrdersCount}</td>
            <td class="text-center">Đơn</td>
            <td>100% tổng số giao dịch</td>
          </tr>
          <tr>
            <td>Kênh bán tại quầy (POS)</td>
            <td class="text-right currency">${posRev}</td>
            <td class="text-center">VNĐ</td>
            <td>${totalRev > 0 ? ((posRev / totalRev) * 100).toFixed(1) : 0}% doanh thu (${posOrders.length} đơn)</td>
          </tr>
          <tr>
            <td>Kênh giao hàng online (Delivery)</td>
            <td class="text-right currency">${deliveryRev}</td>
            <td class="text-center">VNĐ</td>
            <td>${totalRev > 0 ? ((deliveryRev / totalRev) * 100).toFixed(1) : 0}% doanh thu (${deliveryOrders.length} đơn)</td>
          </tr>
          <tr>
            <td>Giá trị trung bình mỗi đơn (AOV)</td>
            <td class="text-right currency">${avgOrder}</td>
            <td class="text-center">VNĐ / đơn</td>
            <td>Doanh thu / Tổng đơn</td>
          </tr>
        </table>
        <br/>
      `;
    }

    // Phần 2: Thống kê sản phẩm bán ra
    if (includeProducts && currentData.salesStats && currentData.salesStats.length > 0) {
      const totalItems = currentData.salesStats.reduce((sum, s) => sum + (s.totalQuantity || 0), 0);
      html += `
        <table class="data-table">
          <tr><th colspan="5" class="section-title">PHẦN II. BẢNG KÊ DOANH SỐ THEO MÓN (TOP BÁN CHẠY)</th></tr>
          <tr>
            <th style="width: 50px;">STT</th>
            <th>Tên Món / Sản Phẩm</th>
            <th>Kích Cỡ</th>
            <th>Số Lượng Bán</th>
            <th>Tỷ Trọng Số Lượng</th>
          </tr>
      `;

      currentData.salesStats.forEach((stat, idx) => {
        const share = totalItems > 0 ? (((stat.totalQuantity || 0) / totalItems) * 100).toFixed(1) : 0;
        html += `
          <tr>
            <td class="text-center">${idx + 1}</td>
            <td><strong>${stat.productName}</strong></td>
            <td class="text-center">${stat.size || "Tiêu chuẩn"}</td>
            <td class="text-right font-bold">${stat.totalQuantity || 0}</td>
            <td class="text-center">${share}%</td>
          </tr>
        `;
      });

      html += `
          <tr class="total-row">
            <td colspan="3" class="text-center">TỔNG CỘNG MÓN BÁN RA</td>
            <td class="text-right font-bold">${totalItems}</td>
            <td class="text-center">100%</td>
          </tr>
        </table>
        <br/>
      `;
    }

    // Phần 3: Danh sách đơn hàng chi tiết
    if (includeOrders) {
      html += `
        <table class="data-table">
          <tr><th colspan="9" class="section-title">PHẦN III. NHẬT KÝ CHI TIẾT CÁC ĐƠN HÀNG</th></tr>
          <tr>
            <th style="width: 45px;">STT</th>
            <th>Mã Đơn</th>
            <th>Thời Gian</th>
            <th>Kênh Bán</th>
            <th>Khách Hàng</th>
            <th>Địa Chỉ Nhận Hàng</th>
            <th>Người Thu Ngân</th>
            <th>Thanh Toán</th>
            <th>Trạng Thái</th>
            <th style="text-align: right;">Tổng Tiền</th>
          </tr>
      `;

      if (previewOrders.length === 0) {
        html += `<tr><td colspan="10" class="text-center" style="color: #64748b; padding: 15px;">Không có đơn hàng nào phù hợp với bộ lọc</td></tr>`;
      } else {
        previewOrders.forEach((o, idx) => {
          const isPos = !o.address || o.customerName === "Khách lẻ (Tại quầy)" || o.code?.startsWith("NEX-");
          const channelName = isPos ? "Tại quầy (POS)" : "Giao hàng (Web)";
          const timeStr = o.createdAt ? new Date(o.createdAt).toLocaleString("vi-VN") : "";
          const statusClass = o.status === "Completed" ? "badge-completed" : o.status === "Cancelled" ? "badge-cancelled" : "";

          html += `
            <tr>
              <td class="text-center">${idx + 1}</td>
              <td><strong>${o.code || ""}</strong></td>
              <td class="text-center">${timeStr}</td>
              <td class="text-center">${channelName}</td>
              <td>${o.customerName || "Khách lẻ"}</td>
              <td>${o.address || "Tại quầy"}</td>
              <td>${o.staffName || "-"}</td>
              <td class="text-center">${o.paymentStatus === "paid" ? "Đã thanh toán" : "Chưa thanh toán"}</td>
              <td class="text-center ${statusClass}">${o.status || ""}</td>
              <td class="text-right font-bold currency">${o.total || 0}</td>
            </tr>
          `;
        });

        html += `
          <tr class="total-row">
            <td colspan="9" class="text-center">TỔNG CỘNG DOANH THU</td>
            <td class="text-right font-bold currency">${totalRev}</td>
          </tr>
        `;
      }

      html += `</table><br/>`;
    }

    // Chữ ký xác nhận kế toán
    html += `
      <table style="width: 100%; margin-top: 30px;">
        <tr>
          <td colspan="3" class="text-center"><strong>NGƯỜI LẬP BÁO CÁO</strong><br/><span style="font-size: 9pt; color: #64748b;">(Ký, ghi rõ họ tên)</span></td>
          <td colspan="3" class="text-center"><strong>KẾ TOÁN TRƯỞNG</strong><br/><span style="font-size: 9pt; color: #64748b;">(Ký, ghi rõ họ tên)</span></td>
          <td colspan="3" class="text-center"><strong>GIÁM ĐỐC / QUẢN LÝ</strong><br/><span style="font-size: 9pt; color: #64748b;">(Ký, đóng dấu)</span></td>
        </tr>
      </table>
      </body></html>
    `;

    const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8" });
    triggerDownload(blob, expectedFileName);
  };

  // 2. Tạo file CSV chuẩn UTF-8 có BOM
  const generateCleanCsvFile = () => {
    let csv = "\uFEFF"; // BOM
    csv += `"HỆ THỐNG CÀ PHÊ NEXCOFFEE - BÁO CÁO KINH DOANH"\n`;
    csv += `"Kỳ báo cáo:", "${resolvedDateRange.label}"\n`;
    csv += `"Chi nhánh:", "${storeLabel}"\n`;
    csv += `"Thời điểm xuất:", "${new Date().toLocaleString("vi-VN")}"\n`;
    csv += `"Người xuất:", "${currentUser?.fullName || currentUser?.email || "Quản trị viên"}"\n\n`;

    if (includeSummary) {
      csv += `"--- I. TỔNG HỢP CHỈ TIÊU KINH DOANH ---"\n`;
      csv += `"Chỉ tiêu", "Số lượng", "Đơn vị"\n`;
      csv += `"Tổng doanh thu", "${previewRevenue}", "VNĐ"\n`;
      csv += `"Tổng số đơn hàng", "${previewOrders.length}", "Đơn"\n\n`;
    }

    if (includeProducts && currentData.salesStats && currentData.salesStats.length > 0) {
      csv += `"--- II. BẢNG KÊ DOANH SỐ MÓN BÁN CHẠY ---"\n`;
      csv += `"STT", "Tên sản phẩm", "Kích cỡ", "Số lượng bán"\n`;
      currentData.salesStats.forEach((s, idx) => {
        csv += `"${idx + 1}", "${s.productName}", "${s.size || "M"}", "${s.totalQuantity || 0}"\n`;
      });
      csv += `\n`;
    }

    if (includeOrders) {
      csv += `"--- III. NHẬT KÝ CHI TIẾT ĐƠN HÀNG ---"\n`;
      csv += `"STT", "Mã đơn", "Thời gian", "Kênh bán", "Khách hàng", "Địa chỉ", "Thu ngân", "Trạng thái", "Tổng tiền (VNĐ)"\n`;
      previewOrders.forEach((o, idx) => {
        const isPos = !o.address || o.customerName === "Khách lẻ (Tại quầy)" || o.code?.startsWith("NEX-");
        const channel = isPos ? "POS Tại quầy" : "Web Giao hàng";
        const timeStr = o.createdAt ? new Date(o.createdAt).toLocaleString("vi-VN") : "";
        csv += `"${idx + 1}", "${o.code || ""}", "${timeStr}", "${channel}", "${o.customerName || "Khách lẻ"}", "${o.address || "Tại quầy"}", "${o.staffName || "-"}", "${o.status || ""}", "${o.total || 0}"\n`;
      });
    }

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    triggerDownload(blob, expectedFileName);
  };

  const triggerDownload = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="export-modal-backdrop" onClick={onClose}>
      <div className="export-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header Modal */}
        <div className="export-modal-header">
          <div>
            <h2 className="export-title">Xuất Báo Cáo</h2>
          </div>
          <button type="button" className="btn-close-modal" onClick={onClose} aria-label="Đóng">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Body Split-Panel Studio */}
        <div className="export-modal-body">
          {/* CỘT TRÁI: CẤU HÌNH XUẤT */}
          <div className="export-controls-panel">
            {/* 1. Khoảng thời gian */}
            <div className="export-section">
              <label className="section-label">Khoảng thời gian</label>
              <div className="range-presets-grid">
                <button
                  type="button"
                  className={`btn-preset ${dateRangeMode === "current" ? "active" : ""}`}
                  onClick={() => setDateRangeMode("current")}
                >
                  Ngày đang xem ({defaultDate})
                </button>
                <button
                  type="button"
                  className={`btn-preset ${dateRangeMode === "today" ? "active" : ""}`}
                  onClick={() => setDateRangeMode("today")}
                >
                  Hôm nay
                </button>
                <button
                  type="button"
                  className={`btn-preset ${dateRangeMode === "7days" ? "active" : ""}`}
                  onClick={() => setDateRangeMode("7days")}
                >
                  7 ngày qua
                </button>
                <button
                  type="button"
                  className={`btn-preset ${dateRangeMode === "month" ? "active" : ""}`}
                  onClick={() => setDateRangeMode("month")}
                >
                  Tháng này
                </button>
                <button
                  type="button"
                  className={`btn-preset ${dateRangeMode === "custom" ? "active" : ""}`}
                  onClick={() => setDateRangeMode("custom")}
                >
                  Tùy chỉnh...
                </button>
              </div>

              {dateRangeMode === "custom" && (
                <div className="custom-range-inputs">
                  <div className="range-input-group">
                    <span>Từ ngày:</span>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                    />
                  </div>
                  <div className="range-input-group">
                    <span>Đến ngày:</span>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 2. Phạm vi chi nhánh */}
            <div className="export-section">
              <label className="section-label">Chi nhánh</label>
              {isSuperAdmin ? (
                <select
                  className="export-select"
                  value={targetStoreId}
                  onChange={(e) => setTargetStoreId(e.target.value)}
                >
                  <option value="">Toàn bộ hệ thống</option>
                  {storeList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="locked-store-indicator">
                  <span>{currentUser?.storeName || "Chi nhánh của bạn"}</span>
                  <span className="locked-tag">Cố định</span>
                </div>
              )}
            </div>

            {/* 3. Lọc trạng thái đơn */}
            <div className="export-section">
              <label className="section-label">Trạng thái đơn hàng</label>
              <div className="status-filter-pills">
                <button
                  type="button"
                  className={`btn-pill ${orderStatusFilter === "Completed" ? "active" : ""}`}
                  onClick={() => setOrderStatusFilter("Completed")}
                >
                  Chỉ đơn Hoàn thành
                </button>
                <button
                  type="button"
                  className={`btn-pill ${orderStatusFilter === "NotCancelled" ? "active" : ""}`}
                  onClick={() => setOrderStatusFilter("NotCancelled")}
                >
                  Bỏ qua đơn hủy
                </button>
                <button
                  type="button"
                  className={`btn-pill ${orderStatusFilter === "All" ? "active" : ""}`}
                  onClick={() => setOrderStatusFilter("All")}
                >
                  Tất cả đơn
                </button>
              </div>
            </div>

            {/* 4. Nội dung cần đưa vào báo cáo */}
            <div className="export-section">
              <label className="section-label">Nội dung xuất</label>
              <div className="checkboxes-list">
                <label className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={includeSummary}
                    onChange={(e) => setIncludeSummary(e.target.checked)}
                  />
                  <span className="checkbox-title">Tổng quan doanh thu & đơn hàng</span>
                </label>
                <label className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={includeProducts}
                    onChange={(e) => setIncludeProducts(e.target.checked)}
                  />
                  <span className="checkbox-title">Thống kê sản phẩm đã bán</span>
                </label>
                <label className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={includeOrders}
                    onChange={(e) => setIncludeOrders(e.target.checked)}
                  />
                  <span className="checkbox-title">Danh sách chi tiết đơn hàng</span>
                </label>
              </div>
            </div>

            {/* 5. Định dạng file */}
            <div className="export-section">
              <label className="section-label">Định dạng file</label>
              <div className="format-options-grid">
                <label className={`format-card ${fileFormat === "xls" ? "active" : ""}`}>
                  <input
                    type="radio"
                    name="fileFormat"
                    value="xls"
                    checked={fileFormat === "xls"}
                    onChange={() => setFileFormat("xls")}
                  />
                  <span className="format-name">Excel Bảng Tính (.xls)</span>
                </label>
                <label className={`format-card ${fileFormat === "csv" ? "active" : ""}`}>
                  <input
                    type="radio"
                    name="fileFormat"
                    value="csv"
                    checked={fileFormat === "csv"}
                    onChange={() => setFileFormat("csv")}
                  />
                  <span className="format-name">File CSV (.csv)</span>
                </label>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: TÓM TẮT DỮ LIỆU */}
          <div className="export-preview-panel">
            <h3 className="preview-heading">Tóm tắt dữ liệu</h3>

            {loadingPreview ? (
              <div className="preview-loading-card">
                <i className="fa-solid fa-spinner fa-spin me-2"></i> Đang tính toán...
              </div>
            ) : (
              <div className="preview-metrics-card">
                <div className="metric-row">
                  <span className="metric-title">Kỳ báo cáo:</span>
                  <span className="metric-badge">{resolvedDateRange.label}</span>
                </div>
                <div className="metric-row">
                  <span className="metric-title">Chi nhánh:</span>
                  <strong className="metric-val">{storeLabel}</strong>
                </div>
                <div className="metric-row">
                  <span className="metric-title">Số đơn hàng:</span>
                  <span className="metric-count">{previewOrders.length} đơn</span>
                </div>
                <div className="metric-row highlight-row">
                  <span className="metric-title">Doanh thu dự kiến:</span>
                  <span className="metric-total">{formatCurrency(previewRevenue)}</span>
                </div>
              </div>
            )}

            {/* Khối tên file */}
            <div className="file-target-box">
              <span className="file-label">Tên file tải về:</span>
              <span className="file-name" title={expectedFileName}>{expectedFileName}</span>
            </div>

            {/* Nút hành động */}
            <div className="export-action-footer">
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={onClose}
                disabled={isExporting}
              >
                Hủy
              </button>
              <button
                type="button"
                className="btn-modal-export"
                onClick={handleExport}
                disabled={isExporting || loadingPreview}
              >
                {isExporting ? "Đang xuất file..." : "Xuất file"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportReportModal;
