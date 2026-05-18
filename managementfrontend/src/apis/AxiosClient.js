// import axios from "axios";

// const axiosClient = axios.create({
//   baseURL: "http://localhost:8080/api",
//   headers: {
//     "Content-Type": "application/json",
//   },
// });

// export default axiosClient;
import axios from "axios";

const axiosClient = axios.create({
  baseURL: "http://localhost:8080/api",
  headers: {
    "Content-Type": "application/json",
  },
});

axiosClient.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("accessToken") ||
      sessionStorage.getItem("accessToken");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

export default axiosClient;
