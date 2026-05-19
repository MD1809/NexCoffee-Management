import axiosClient from "./axiosClient";

const unwrapResponse = (response) => response?.data ?? response;

export const getProvinces = async () => {
  const response = await axiosClient.get("/locations/provinces");
  return unwrapResponse(response);
};

export const getWardsByProvince = async (provinceCode) => {
  const response = await axiosClient.get(
    `/locations/wards?provinceCode=${provinceCode}`,
  );

  return unwrapResponse(response);
};
