import React from "react";
import { useState, useEffect, useMemo } from "react";
import { removeAccents } from "../../../utils/stringUtils";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import "./DataTable.css";

const DataTable = ({ columns, data, itemsPerPage = 5, searchQuery = "" }) => {
  const [currentPage, setCurrentPage] = useState(1);

  const filteredData = useMemo(() => {
    if (!searchQuery) return data;
    const normalizedQuery = removeAccents(searchQuery);
    return data.filter((row) =>
      columns.some((col) => {
        const cellValue = String(row[col.accessor] || "");
        return removeAccents(cellValue).includes(normalizedQuery);
      })
    );
  }, [data, searchQuery, columns]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentData = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  return (
    <>
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              {columns.map((col, index) => (
                <th key={index}>{col.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentData.length > 0 ? (
              currentData.map((row) => (
                <tr key={row.id}>
                  {columns.map((col, colIndex) => (
                    <td key={colIndex} className={col.className}>
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
