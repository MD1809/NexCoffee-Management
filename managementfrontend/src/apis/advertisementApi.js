import axiosClient from "./axiosClient";

const unwrap = (response) => response?.data ?? response;

export const getActiveHomeAdvertisement = async () => {
  const response = await axiosClient.get("/advertisements/home-active");
  return unwrap(response);
};

export const getAdminAdvertisements = async () => {
  const response = await axiosClient.get("/admin/advertisements");
  return unwrap(response);
};

export const createAdminAdvertisement = async (payload) => {
  const response = await axiosClient.post("/admin/advertisements", payload, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return unwrap(response);
};

export const updateAdminAdvertisement = async (id, payload) => {
  const response = await axiosClient.put(
    `/admin/advertisements/${id}`,
    payload,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return unwrap(response);
};

export const activateAdminAdvertisement = async (id) => {
  const response = await axiosClient.patch(
    `/admin/advertisements/${id}/activate`,
  );
  return unwrap(response);
};

export const deleteAdminAdvertisement = async (id) => {
  const response = await axiosClient.delete(`/admin/advertisements/${id}`);
  return unwrap(response);
};
