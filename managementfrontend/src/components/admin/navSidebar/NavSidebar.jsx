import SidebarItem from "./SidebarItem";
import "./navSidebar.css";
import { NavLink } from "react-router-dom";

const menuSidebarTop = [
  
  { to: "/admin", icon: "fa-solid fa-house", label: "Trang chủ", end: true, roles: ["ADMIN"] },
  { to: "/admin/daily-report", icon: "fa-solid fa-chart-simple", label: "Thống kê", roles: ["ADMIN"] },
  { to: "/admin/pos", icon: "fa-solid fa-cash-register", label: "Pos", roles: ["ADMIN"] },
  { to: "/admin/orders", icon: "fa-solid fa-cart-shopping", label: "Đơn hàng", roles: ["ADMIN"] },
  { to: "/admin/categories", icon: "fa-solid fa-shapes", label: "Danh mục", roles: ["ADMIN"] },
  { to: "/admin/products", icon: "fa-solid fa-box", label: "Sản phẩm", roles: ["ADMIN"] },
  { to: "/admin/users", icon: "fa-solid fa-users", label: "Người dùng", roles: ["ADMIN"] },
  { to: "/admin/delivery-areas", icon: "fa-solid fa-truck", label: "Khu vực GH", roles: ["ADMIN"] },

  
  { to: "/staff/pos", icon: "fa-solid fa-cash-register", label: "Pos", roles: ["STAFF"] },
  { to: "/staff/orders", icon: "fa-solid fa-cart-shopping", label: "Đơn hàng", roles: ["STAFF"] },
];

// Hàm hỗ trợ đọc role từ Session Storage
const getCurrentUserRole = () => {
  const userStr = sessionStorage.getItem("currentUser");
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user.role) return user.role; 
    } catch (error) {
      console.error("Không thể đọc thông tin user từ sessionStorage", error);
    }
  }
  return null;
};

function NavSidebar({ isOpen }) {
  const userRole = getCurrentUserRole();
  const allowedMenus = menuSidebarTop.filter((item) => 
    item.roles && item.roles.includes(userRole)
  );

  return (
    <aside className="sidebar">
      <div className="sidebar__top">
        <div className="sidebar__header">
          <h3 className="sidebar__title">{isOpen ? "NexCoffee" : "Nex"}</h3>
        </div>

        <ul className="sidebar__list">
          {allowedMenus.map((item, index) => (
            <SidebarItem key={index} {...item} isOpen={isOpen} />
          ))}
        </ul>
      </div>
    </aside>
  );
}

export default NavSidebar;