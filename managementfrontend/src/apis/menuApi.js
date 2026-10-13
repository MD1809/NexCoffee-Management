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

export const getBestSellerProducts = (limit = 4) => {
  return axiosInstance.get(`/products/best-sellers?limit=${limit}`);
};
