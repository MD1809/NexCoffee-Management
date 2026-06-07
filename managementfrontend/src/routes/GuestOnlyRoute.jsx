import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { getCurrentUser, isAuthenticated } from "../utils/authStorage";
import { getRedirectPathByRole } from "../utils/roleRedirect";

const GuestOnlyRoute = ({ children }) => {
  const currentUser = getCurrentUser();

  if (isAuthenticated() && currentUser) {
    return <Navigate to={getRedirectPathByRole(currentUser.role)} replace />;
  }

  return children || <Outlet />;
};

export default GuestOnlyRoute;
