import { NavLink } from "react-router-dom";

function SidebarItem({ to, icon, label, end = false, isOpen }) {
  return (
    <li className= {`sidebar__item ${isOpen ? "sidebar__item--open" : "sidebar__item--close"}`} >
      <NavLink
        to={to}
        end={end}
        className={({ isActive }) =>
          isActive ? "sidebar__link sidebar__item--active" : "sidebar__link"
        }
      >
        <i className={`${icon} sidebar__icon`}></i>
        {isOpen ? <span className="sidebar__text">{label}</span> : ""}
      </NavLink>
    </li>
  );
}

export default SidebarItem;
