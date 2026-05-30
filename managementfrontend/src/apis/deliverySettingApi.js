import axiosClient from "./axiosClient";

const unwrap = (response) => response?.data ?? response;

export const getDeliverySetting = async () => {
  const response = await axiosClient.get("/admin/delivery-setting");
  return unwrap(response);
};

export const updateDeliverySetting = async (payload) => {
  const response = await axiosClient.put("/admin/delivery-setting", payload);
  return unwrap(response);
};
