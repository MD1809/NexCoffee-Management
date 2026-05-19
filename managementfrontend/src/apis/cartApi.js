import axiosClient from "./axiosClient";
import {
  clearGuestCartToken,
  getGuestCartToken,
  saveGuestCartToken,
} from "../utils/cartSession";

const getAccessToken = () => {
  return (
    localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken")
  );
};

const isLoggedIn = () => {
  return Boolean(getAccessToken());
};

const buildCartHeaders = () => {
  // Đã đăng nhập thì KHÔNG gửi X-Cart-Token.
  // Backend sẽ lấy giỏ hàng theo JWT user.
  if (isLoggedIn()) {
    return {};
  }

  const cartToken = getGuestCartToken();

  return cartToken
    ? {
        "X-Cart-Token": cartToken,
      }
    : {};
};

const unwrapResponse = (response) => {
  return response?.data ?? response;
};

const persistGuestCartToken = (cartData) => {
  // Đã đăng nhập thì không giữ token guest nữa.
  if (isLoggedIn()) {
    clearGuestCartToken();
    return cartData;
  }

  if (cartData?.cartToken) {
    saveGuestCartToken(cartData.cartToken);
  }

  return cartData;
};

export const getCart = async () => {
  const response = await axiosClient.get("/cart", {
    headers: buildCartHeaders(),
  });

  const cartData = unwrapResponse(response);

  return persistGuestCartToken(cartData);
};

export const addCartItem = async ({ variantId, quantity = 1 }) => {
  const response = await axiosClient.post(
    "/cart/items",
    { variantId, quantity },
    {
      headers: buildCartHeaders(),
    },
  );

  const cartData = unwrapResponse(response);

  return persistGuestCartToken(cartData);
};

export const updateCartItem = async (cartItemId, quantity) => {
  const response = await axiosClient.patch(
    `/cart/items/${cartItemId}`,
    { quantity },
    {
      headers: buildCartHeaders(),
    },
  );

  const cartData = unwrapResponse(response);

  return persistGuestCartToken(cartData);
};

export const removeCartItem = async (cartItemId) => {
  const response = await axiosClient.delete(`/cart/items/${cartItemId}`, {
    headers: buildCartHeaders(),
  });

  const cartData = unwrapResponse(response);

  return persistGuestCartToken(cartData);
};

export const mergeGuestCart = async () => {
  const cartToken = getGuestCartToken();
  const accessToken = getAccessToken();

  // Không có giỏ guest hoặc chưa login thì không gọi merge.
  if (!cartToken || !accessToken) {
    return null;
  }

  const response = await axiosClient.post(
    "/cart/merge",
    {},
    {
      headers: {
        "X-Cart-Token": cartToken,
      },
    },
  );

  const cartData = unwrapResponse(response);

  // Chỉ xóa token guest sau khi merge thành công.
  clearGuestCartToken();
  window.dispatchEvent(new Event("cart-changed"));

  return cartData;
};
