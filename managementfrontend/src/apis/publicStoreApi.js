import axios from "./axios";

export const getActiveStores = async () => {
  return axios.get("/stores/active");
};
