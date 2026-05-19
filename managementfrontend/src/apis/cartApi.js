import axiosInstance from "./axios";
import { getGuestCartToken, saveGuestCartToken } from "../utils/cartSession";

const buildGuestHeaders = () => {
  const cartToken = getGuestCartToken();

  return cartToken
    ? {
        "X-Cart-Token": cartToken,
      }
    : {};
};

const persistCartToken = (response) => {
  if (response?.cartToken) {
    saveGuestCartToken(response.cartToken);
  }

  return response;
};

export const getCart = async () => {
  const response = await axiosInstance.get("/cart", {
    headers: buildGuestHeaders(),
  });

  return persistCartToken(response);
};

export const addCartItem = async ({ variantId, quantity = 1 }) => {
  const response = await axiosInstance.post(
    "/cart/items",
    { variantId, quantity },
    {
      headers: buildGuestHeaders(),
    },
  );

  return persistCartToken(response);
};

export const updateCartItem = async (cartItemId, quantity) => {
  const response = await axiosInstance.patch(
    `/cart/items/${cartItemId}`,
    { quantity },
    {
      headers: buildGuestHeaders(),
    },
  );

  return persistCartToken(response);
};

export const removeCartItem = async (cartItemId) => {
  const response = await axiosInstance.delete(`/cart/items/${cartItemId}`, {
    headers: buildGuestHeaders(),
  });

  return persistCartToken(response);
};

export const mergeGuestCart = async () => {
  const cartToken = getGuestCartToken();

  if (!cartToken) {
    return null;
  }

  return axiosInstance.post(
    "/cart/merge",
    {},
    {
      headers: {
        "X-Cart-Token": cartToken,
      },
    },
  );
};
