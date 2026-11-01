import axiosClient from "./axiosClient";

const DashboardApi = {
  getOverview: (storeId) => {
    return axiosClient.get("/dashboard/overview", {
      params: { storeId: storeId || undefined },
    });
  },

  getTopProducts: (storeId) => {
    return axiosClient.get("/dashboard/top-products", {
      params: { storeId: storeId || undefined },
    });
  },

  getRevenueByYear: (year, storeId) => {
    return axiosClient.get("/dashboard/revenue", {
      params: { year, storeId: storeId || undefined },
    });
  },

  getRevenueByMonth: (year, month, storeId) => {
    return axiosClient.get("/dashboard/revenue/daily", {
      params: { year, month, storeId: storeId || undefined },
    });
  },

  getChannelStats: (year, month, storeId) => {
    return axiosClient.get("/dashboard/channel-stats", {
      params: {
        year,
        month: month || undefined,
        storeId: storeId || undefined,
      },
    });
  },

  getStoreComparison: (year, month) => {
    return axiosClient.get("/dashboard/store-comparison", {
      params: { year, month: month || undefined },
    });
  },
};

export default DashboardApi;