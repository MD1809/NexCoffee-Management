import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { getCurrentUser } from "../utils/authStorage";

const BlockAdminRoute = ({ children }) => {
  const currentUser = getCurrentUser();

  if (currentUser?.role === "ADMIN") {
    return <Navigate to="/admin" replace />;
  }

  //   if (currentUser?.role === "STAFF") {
  //   return <Navigate to="/staff" replace />;
  // }

  return children || <Outlet />;
};

export default BlockAdminRoute;
