import axiosClient from "./axiosClient";

const unwrap = (response) => response?.data ?? response;

export const autocompleteAddress = async (input) => {
  const response = await axiosClient.get(
    `/maps/autocomplete?input=${encodeURIComponent(input)}`,
  );

  return unwrap(response);
};

export const getPlaceDetail = async (placeId) => {
  const response = await axiosClient.get(
    `/maps/place-detail?placeId=${encodeURIComponent(placeId)}`,
  );

  return unwrap(response);
};

export const previewDelivery = async ({
  formattedAddress,
  customerLatitude,
  customerLongitude,
  subtotal,
}) => {
  const response = await axiosClient.post("/maps/delivery-preview", {
    formattedAddress,
    customerLatitude,
    customerLongitude,
    subtotal,
  });

  return unwrap(response);
};
