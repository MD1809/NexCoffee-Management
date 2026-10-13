import { toast } from "react-toastify";

/**
 * Tự động chặn hiển thị trùng lặp (Deduplication) cho react-toastify:
 * 1. Nếu không truyền toastId, tự động gán toastId theo nội dung thông báo.
 * 2. Nếu một toast cùng nội dung đang hiển thị (isActive), bỏ qua lời gọi trùng lặp tiếp theo.
 * 3. Hỗ trợ cơ chế debounce chống bão toast từ StrictMode hoặc Promise.all song song.
 */
const recentToasts = new Map();
const DEDUPE_WINDOW_MS = 600;

const wrapToastMethod = (originalMethod, type) => {
  return (content, options = {}) => {
    const messageKey =
      typeof content === "string" || typeof content === "number"
        ? `${type}:${content}`
        : null;

    const toastId = options?.toastId || messageKey || undefined;

    // Kiểm tra xem toast có cùng ID đang hiển thị trên màn hình không
    if (toastId && typeof toast.isActive === "function" && toast.isActive(toastId)) {
      return toastId;
    }

    // Kiểm tra cửa sổ thời gian debounce nếu 2 hàm cùng gọi trong thời gian cực ngắn
    if (messageKey) {
      const now = Date.now();
      const lastTime = recentToasts.get(messageKey);
      if (lastTime && now - lastTime < DEDUPE_WINDOW_MS) {
        return toastId;
      }
      recentToasts.set(messageKey, now);

      // Tự động dọn dẹp bộ nhớ map
      setTimeout(() => {
        recentToasts.delete(messageKey);
      }, DEDUPE_WINDOW_MS * 2);
    }

    return originalMethod(content, {
      ...options,
      toastId: toastId || options?.toastId,
    });
  };
};

const toastMethods = ["error", "success", "info", "warn", "warning", "dark"];

toastMethods.forEach((method) => {
  if (typeof toast[method] === "function") {
    toast[method] = wrapToastMethod(toast[method], method);
  }
});

export default toast;
