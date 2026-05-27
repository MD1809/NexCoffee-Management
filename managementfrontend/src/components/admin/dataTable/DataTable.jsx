import React from "react";
import { useState, useEffect, useMemo } from "react";
import { removeAccents } from "../../../utils/stringUtils";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import "./DataTable.css";

const DataTable = ({ columns, data, itemsPerPage = 5, searchQuery = "" }) => {
  const [currentPage, setCurrentPage] = useState(1);

  // Gộp chung logic Lọc (Filter) và Sắp xếp (Sort) vào 1 useMemo
  const filteredAndSortedData = useMemo(() => {
    // 1. Lọc dữ liệu theo search query
    let result = data;
    if (searchQuery) {
      const normalizedQuery = removeAccents(searchQuery);
      result = data.filter((row) =>
        columns.some((col) => {
          const cellValue = String(row[col.accessor] || "");
          return removeAccents(cellValue).includes(normalizedQuery);
        })
      );
    }

    // 2. Sắp xếp dữ liệu mới nhất lên đầu
    return [...result].sort((a, b) => {
      // Ưu tiên 1: Sắp xếp theo trường ngày tháng 'createdAt' nếu có
      if (a.createdAt && b.createdAt) {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      // Ưu tiên 2: Nếu không có ngày tháng, sắp xếp theo 'id' giảm dần
      if (a.id && b.id) {
        return b.id - a.id;
      }
      return 0; // Giữ nguyên nếu không có trường nào để so sánh
    });
  }, [data, searchQuery, columns]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentData = filteredAndSortedData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);

  return (
    <>
      <div className="table-container">
        {/* Thêm tableLayout: "fixed" để ép bảng tuân thủ kích thước cột */}
        <table className="table" style={{ tableLayout: "fixed", width: "100%" }}>
          <thead>
            <tr>
              {columns.map((col, index) => (
                <th 
                  key={index}
                  style={{
                    width: col.width || "auto", // Hỗ trợ set cứng width từ mảng columns truyền vào
                  }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentData.length > 0 ? (
              currentData.map((row) => (
                <tr key={row.id || Math.random()}>
                  {columns.map((col, colIndex) => (
                    <td 
                      key={colIndex} 
                      className={col.className}
                      style={{
                        maxWidth: col.maxWidth || "150px", // Giới hạn độ dài mặc định là 150px
                        whiteSpace: "nowrap", // Ép text hiển thị trên 1 dòng
                        overflow: "hidden", // Ẩn phần text thừa
                        textOverflow: "ellipsis", // Thêm dấu "..." ở cuối
                      }}
                      // Dùng title để hiện đầy đủ thông tin khi người dùng di chuột (hover) vào ô
                      title={typeof row[col.accessor] === 'string' || typeof row[col.accessor] === 'number' ? String(row[col.accessor]) : ""}
                    >
                      {col.render ? col.render(row) : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} style={{ textAlign: "center" }}>
                  Không tìm thấy kết quả
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(currentPage - 1)}
        >
          Trước
        </button>

        <span>
          Trang {currentPage} / {totalPages || 1}
        </span>

        <button
          disabled={currentPage === totalPages || totalPages === 0}
          onClick={() => setCurrentPage(currentPage + 1)}
        >
          Sau
        </button>
      </div>
    </>
  );
};

export default DataTable;