import { autocompleteAddress, getPlaceDetail } from "./mapApi";

export const searchStoreAddressSuggestions = async (keyword) => {
  if (!keyword || !keyword.trim()) {
    return [];
  }

  return autocompleteAddress(keyword.trim());
};

export const getStorePlaceDetail = async (placeId) => {
  return getPlaceDetail(placeId);
};

export const reverseStoreGeocode = async (lat, lng) => {
  return {
    formattedAddress: "",
    latitude: lat,
    longitude: lng,
  };
};
