import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { getCurrentUser, isAuthenticated } from "../utils/authStorage";

const getRedirectPathByRole = (role) => {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "STAFF":
      return "/";
    case "CUSTOMER":
      return "/";
    default:
      return "/";
  }
};

const GuestOnlyRoute = ({ children }) => {
  const currentUser = getCurrentUser();

  if (isAuthenticated() && currentUser) {
    return <Navigate to={getRedirectPathByRole(currentUser.role)} replace />;
  }

  return children || <Outlet />;
};

export default GuestOnlyRoute;
