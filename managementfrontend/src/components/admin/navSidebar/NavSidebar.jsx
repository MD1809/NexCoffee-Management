import SidebarItem from "./SidebarItem";
import "./navSidebar.css";
import { NavLink } from "react-router-dom";
const menuSidebarTop = [
  { to: "/admin", icon: "fa-solid fa-house", label: "Trang chủ", end: true },
  {
    to: "/admin/categories",
    icon: "fa-solid fa-shapes",
    label: "Danh mục",
  },
  { to: "/admin/products", icon: "fa-solid fa-box", label: "Sản phẩm" },
  { to: "/admin/orders", icon: "fa-solid fa-cart-shopping", label: "Đơn hàng" },
  { to: "/admin/daily-report", icon: "fa-solid fa-chart-simple", label: "Thống kê"},
  { to: "/admin/users", icon: "fa-solid fa-users", label: "Người dùng" },
  {
    to: "/admin/delivery-areas",
    icon: "fa-solid fa-truck",
    label: "Khu vực GH",
  },
];

function NavSidebar({ isOpen }) {
  return (
    <aside className="sidebar">
      <div className="sidebar__top">
        <div className="sidebar__header">
          <h3 className="sidebar__title">{isOpen ? "NexCoffee" : "Nex"}</h3>
        </div>

        <ul className="sidebar__list">
          {menuSidebarTop.map((item, index) => (
            <SidebarItem key={index} {...item} isOpen={isOpen} />
          ))}
        </ul>
      </div>

      <div className="sidebar__bottom">
        <ul className="sidebar__list">
          <li
            className={`sidebar__item ${isOpen ? "sidebar__item--open" : "sidebar__item--close"}`}
          >
            <div className="sidebar__link">
              <i className="fa-solid fa-gear sidebar__icon"></i>
              {isOpen ? <span className="sidebar__text">Cài đặt</span> : ""}
            </div>
          </li>

          <li
            className={`sidebar__item ${isOpen ? "sidebar__item--open" : "sidebar__item--close"}`}
          >
            <div className="sidebar__link">
              <i className="fa-solid fa-right-from-bracket sidebar__icon sidebar__icon-logout"></i>
              {isOpen ? (
                <span className="sidebar__text sidebar__item--logout">
                  Đăng xuất
                </span>
              ) : (
                ""
              )}
            </div>
          </li>
        </ul>
      </div>
    </aside>
  );
}

export default NavSidebar;
