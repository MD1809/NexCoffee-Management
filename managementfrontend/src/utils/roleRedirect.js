export const normalizeRole = (role) => {
  if (!role) return "";

  return String(role).replace("ROLE_", "").trim().toUpperCase();
};

export const getRedirectPathByRole = (role) => {
  const normalizedRole = normalizeRole(role);

  switch (normalizedRole) {
    case "SUPER_ADMIN":
      return "/admin";

    case "ADMIN":
      return "/admin";

    case "STAFF":
      return "/staff";

    case "CUSTOMER":
      return "/";

    default:
      return "/";
  }
};

export const isBackOfficeRole = (role) => {
  const normalizedRole = normalizeRole(role);

  return ["SUPER_ADMIN", "ADMIN", "STAFF"].includes(normalizedRole);
};
