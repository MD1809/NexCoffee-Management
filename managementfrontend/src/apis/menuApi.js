import axiosInstance from "./axios";

export const getMenuProducts = () => {
  return axiosInstance.get("/products");
};

export const getMenuCategories = () => {
  return axiosInstance.get("/categories");
};
export const getMenuProductById = (id) => {
  return axiosInstance.get(`/products/${id}`);
};
