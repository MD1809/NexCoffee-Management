import axiosClient from "./axiosClient";

const dailyReportApi = {
    // Gọi API lấy tổng doanh thu
    getRevenue: async (date, storeId) => {
        const response = await axiosClient.get('/orders/dashboard/revenue', {
            params: { date, storeId: storeId || undefined }
        });
        return response.data;
    },
    
    // Gọi API lấy thống kê số lượng món bán ra
    getSalesStats: async (date, storeId) => {
        const response = await axiosClient.get('/orders/dashboard/sales-stats', {
            params: { date, storeId: storeId || undefined }
        });
        return response.data;
    },
    
    // Gọi API lấy danh sách chi tiết đơn hàng (kèm người bán, người giao)
    getOrders: async (date, storeId) => {
        const response = await axiosClient.get('/orders/dashboard/list', {
            params: { date, storeId: storeId || undefined }
        });
        return response.data;
    }
};

export default dailyReportApi;