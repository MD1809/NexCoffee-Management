import axiosClient from "./axiosClient";

const unwrap = (response) => response?.data ?? response;

export const getMyOrders = async () => {
  const response = await axiosClient.get("/account/orders");
  return unwrap(response);
};

export const getMyOrderDetail = async (id) => {
  const response = await axiosClient.get(`/account/orders/${id}`);
  return unwrap(response);
};

export const cancelMyOrder = async (id, cancelReason = "") => {
  const response = await axiosClient.patch(`/account/orders/${id}/cancel`, {
    cancelReason,
  });

  return unwrap(response);
};

export const changeMyPassword = async (data) => {
  const response = await axiosClient.put("/account/password", data);
  return unwrap(response);
};
