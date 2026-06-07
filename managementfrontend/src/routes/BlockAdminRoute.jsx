import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { getCurrentUser } from "../utils/authStorage";
import { getRedirectPathByRole, isBackOfficeRole } from "../utils/roleRedirect";

const BlockAdminRoute = ({ children }) => {
  const currentUser = getCurrentUser();

  if (currentUser && isBackOfficeRole(currentUser.role)) {
    return <Navigate to={getRedirectPathByRole(currentUser.role)} replace />;
  }

  return children || <Outlet />;
};

export default BlockAdminRoute;
