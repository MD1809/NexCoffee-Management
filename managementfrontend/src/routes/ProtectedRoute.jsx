import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getCurrentUser, isAuthenticated } from "../utils/authStorage";

const getRedirectPathByRole = (role) => {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "STAFF":
      return "/staff";
    case "CUSTOMER":
      return "/";
    default:
      return "/login";
  }
};

const ProtectedRoute = ({ allowedRoles = [], children }) => {
  const location = useLocation();
  const currentUser = getCurrentUser();

  if (!isAuthenticated() || !currentUser) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const userRole = currentUser.role;

  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    return <Navigate to={getRedirectPathByRole(userRole)} replace />;
  }

  return children || <Outlet />;
};

export default ProtectedRoute;
