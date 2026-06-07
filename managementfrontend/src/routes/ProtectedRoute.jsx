import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getAccessToken, getCurrentUser } from "../utils/authStorage";
import { getRedirectPathByRole, normalizeRole } from "../utils/roleRedirect";

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

  const currentRole = normalizeRole(currentUser.role);
  const normalizedAllowedRoles = allowedRoles.map(normalizeRole);

  if (
    normalizedAllowedRoles.length > 0 &&
    !normalizedAllowedRoles.includes(currentRole)
  ) {
    return <Navigate to={getRedirectPathByRole(currentRole)} replace />;
  }

  return children;
};

export default ProtectedRoute;
