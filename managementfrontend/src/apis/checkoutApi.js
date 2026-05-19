import axiosClient from "./axiosClient";
import { getGuestCartToken } from "../utils/cartSession";

const unwrapResponse = (response) => response?.data ?? response;

const buildGuestHeaders = () => {
  const accessToken =
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("accessToken");

  if (accessToken) {
    return {};
  }

  const cartToken = getGuestCartToken();

  return cartToken
    ? {
        "X-Cart-Token": cartToken,
      }
    : {};
};

export const checkDeliveryArea = async ({ provinceCode, wardCode }) => {
  const params = new URLSearchParams();

  params.append("provinceCode", provinceCode);

  if (wardCode) {
    params.append("wardCode", wardCode);
  }

  const response = await axiosClient.get(
    `/delivery/check?${params.toString()}`,
  );

  return unwrapResponse(response);
};

export const placeOrder = async (payload) => {
  const response = await axiosClient.post("/checkout/place-order", payload);

  return response?.data ?? response;
};
