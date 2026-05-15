import axiosClient from "./axiosClient";

const DashboardApi = {
  getOverview: () => {
    return axiosClient.get("/dashboard/overview");
  },

  getTopProducts: () => {
    return axiosClient.get("/dashboard/top-products");
  },

  getRevenueByYear: (year) => {
    return axiosClient.get(`/dashboard/revenue?year=${year}`);
  },

  getRevenueByMonth: (year, month) => {
    return axiosClient.get(`/dashboard/revenue/daily?year=${year}&month=${month}`);
  },
};

export default DashboardApi;