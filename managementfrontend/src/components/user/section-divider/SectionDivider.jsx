import React from "react";
import "./SectionDivider.css";

/**
 * Component tạo đường cong lượn tự nhiên mềm mại giữa các section tương phản.
 * @param {string} type - "dark-to-light" hoặc "light-to-dark"
 * @param {boolean} flip - lật ngược đối xứng ngang để tạo sự biến hóa tự nhiên giữa các điểm cắt
 */
const SectionDivider = ({ type = "dark-to-light", flip = false }) => {
  const isDarkToLight = type === "dark-to-light";

  // Màu fill của lớp sóng chính (lớp trên cùng hòa vào section tiếp theo)
  const primaryFill = isDarkToLight ? "var(--bg-light, #fffdf9)" : "var(--bg-dark, #1c1917)";

  // Màu fill của lớp sóng đệm tạo chiều sâu (lớp phía sau)
  const accentFill = isDarkToLight
    ? "rgba(255, 253, 249, 0.45)"
    : "rgba(28, 25, 23, 0.4)";

  return (
    <div
      className={`section-divider-wrap ${type} ${flip ? "is-flipped" : ""}`}
      aria-hidden="true"
    >
      <svg
        className="section-divider-svg"
        viewBox="0 0 1440 76"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        {/* Lớp sóng đệm 1: Gợn nhẹ phía sau tạo chiều sâu 2 tầng */}
        <path
          d="M0,28 C240,65 580,8 920,52 C1140,78 1320,38 1440,24 L1440,76 L0,76 Z"
          fill={accentFill}
        />
        {/* Lớp sóng chính 2: Đường cong hữu cơ chủ đạo hòa vào nền section kế tiếp */}
        <path
          d="M0,42 C320,12 680,68 1040,26 C1220,5 1360,45 1440,36 L1440,76 L0,76 Z"
          fill={primaryFill}
        />
      </svg>
    </div>
  );
};

export default SectionDivider;
