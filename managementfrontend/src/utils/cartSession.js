const GUEST_CART_TOKEN_KEY = "guestCartToken";

export const getGuestCartToken = () => {
  return sessionStorage.getItem(GUEST_CART_TOKEN_KEY);
};

export const saveGuestCartToken = (token) => {
  if (!token) return;
  sessionStorage.setItem(GUEST_CART_TOKEN_KEY, token);
};

export const clearGuestCartToken = () => {
  sessionStorage.removeItem(GUEST_CART_TOKEN_KEY);
};
