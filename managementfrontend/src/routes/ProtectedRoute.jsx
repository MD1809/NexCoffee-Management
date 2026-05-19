import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getAccessToken, getCurrentUser } from "../utils/authStorage";

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const location = useLocation();

  const token = getAccessToken();
  const currentUser = getCurrentUser();

  if (!token || !currentUser) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname + location.search,
        }}
      />
    );
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(currentUser.role)) {
    if (currentUser.role === "ADMIN") {
      return <Navigate to="/admin" replace />;
    }

    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
