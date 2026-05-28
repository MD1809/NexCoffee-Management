import axios from "./axios";

export const getSearchProducts = async () => {
  const response = await axios.get("/products");
  return response?.data ?? response;
};
