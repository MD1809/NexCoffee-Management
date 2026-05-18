import axiosInstance from "./axios";

export const registerUser = (data) => {
  return axiosInstance.post("/auth/register", data);
};

export const loginUser = (data) => {
  return axiosInstance.post("/auth/login", data);
};

export const verifyToken = (token) => {
  return axiosInstance.get(`/auth/verify?token=${encodeURIComponent(token)}`);
};

export const resendVerification = (email) => {
  return axiosInstance.post(
    `/auth/resend-verification?email=${encodeURIComponent(email)}`,
  );
};
