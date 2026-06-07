import axiosClient from "./axiosClient";

const unwrap = (response) => response?.data ?? response;

export const getAllStores = async () => {
  const response = await axiosClient.get("/admin/stores");
  return unwrap(response);
};

export const getStoreById = async (id) => {
  const response = await axiosClient.get(`/admin/stores/${id}`);
  return unwrap(response);
};

export const createStore = async (payload) => {
  const response = await axiosClient.post("/admin/stores", payload);
  return unwrap(response);
};

export const updateStore = async (id, payload) => {
  const response = await axiosClient.put(`/admin/stores/${id}`, payload);
  return unwrap(response);
};

export const updateStoreStatus = async (id, status) => {
  const response = await axiosClient.patch(`/admin/stores/${id}/status`, null, {
    params: { status },
  });
  return unwrap(response);
};

export const deleteStore = async (id) => {
  const response = await axiosClient.delete(`/admin/stores/${id}`);
  return unwrap(response);
};

export const getActiveStores = async () => {
  const response = await axiosClient.get("/api/stores/active");
  return response.data;
};
