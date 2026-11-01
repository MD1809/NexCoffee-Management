import { NavLink } from "react-router-dom";
import "./NavSidebar.css";

function SidebarItem({
  to,
  icon,
  label,
  end = false,
  isOpen,
  badgeCount = 0,
  badgeVariant = "default",
}) {
  const hasBadge = Number(badgeCount) > 0;

  return (
    <li
      className={`sidebar__item ${
        isOpen ? "sidebar__item--open" : "sidebar__item--close"
      }`}
      title={!isOpen && hasBadge ? `${label}: ${badgeCount}` : undefined}
    >
      <NavLink
        to={to}
        end={end}
        className={({ isActive }) =>
          isActive ? "sidebar__link sidebar__item--active" : "sidebar__link"
        }
      >
        <div className="sidebar__icon-box">
          <i className={`${icon} sidebar__icon`} aria-hidden="true"></i>
          {!isOpen && hasBadge && (
            <span
              className={`sidebar__mini-badge sidebar__mini-badge--${badgeVariant}`}
              aria-label={`${badgeCount} thông báo mới`}
            >
              {badgeCount > 9 ? "9+" : badgeCount}
            </span>
          )}
        </div>

        {isOpen && (
          <div className="sidebar__content-wrap">
            <span className="sidebar__text">{label}</span>
            {hasBadge && (
              <span
                className={`sidebar__badge sidebar__badge--${badgeVariant}`}
                aria-label={`${badgeCount} thông báo mới`}
              >
                {badgeCount > 99 ? "99+" : badgeCount}
              </span>
            )}
          </div>
        )}
      </NavLink>
    </li>
  );
}

export default SidebarItem;
