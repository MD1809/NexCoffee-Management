const ACCESS_TOKEN_KEY = "accessToken";
const USER_KEY = "currentUser";
const AUTH_CHANGED_EVENT = "auth-changed";

const notifyAuthChanged = () => {
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
};

export const saveAuth = (authData, remember = false) => {
  clearAuth(false);

  const storage = remember ? localStorage : sessionStorage;

  storage.setItem(ACCESS_TOKEN_KEY, authData.token);
  storage.setItem(USER_KEY, JSON.stringify(authData));

  notifyAuthChanged();
};

export const getAccessToken = () => {
  return (
    localStorage.getItem(ACCESS_TOKEN_KEY) ||
    sessionStorage.getItem(ACCESS_TOKEN_KEY)
  );
};

export const getCurrentUser = () => {
  const user =
    localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);

  if (!user) return null;

  try {
    return JSON.parse(user);
  } catch {
    return null;
  }
};

export const isAuthenticated = () => {
  return Boolean(getAccessToken() && getCurrentUser());
};

export const clearAuth = (shouldNotify = true) => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);

  if (shouldNotify) {
    notifyAuthChanged();
  }
};

export const AUTH_EVENTS = {
  AUTH_CHANGED: AUTH_CHANGED_EVENT,
};
