import axiosClient from "./axiosClient";

export const getProvinces = () => {
  return axiosClient.get("/locations/provinces");
};

export const getWardsByProvince = (provinceCode) => {
  return axiosClient.get(`/locations/wards?provinceCode=${provinceCode}`);
};

export const getDeliveryAreas = (status = "") => {
  const query = status ? `?status=${status}` : "";
  return axiosClient.get(`/delivery-areas${query}`);
};

export const getDeliveryAreaById = (id) => {
  return axiosClient.get(`/delivery-areas/${id}`);
};

export const createDeliveryArea = (data) => {
  return axiosClient.post("/delivery-areas", data);
};

export const updateDeliveryArea = (id, data) => {
  return axiosClient.put(`/delivery-areas/${id}`, data);
};

export const updateDeliveryAreaStatus = (id, status) => {
  return axiosClient.patch(`/delivery-areas/${id}/status?status=${status}`);
};

export const deleteDeliveryArea = (id) => {
  return axiosClient.delete(`/delivery-areas/${id}`);
};
