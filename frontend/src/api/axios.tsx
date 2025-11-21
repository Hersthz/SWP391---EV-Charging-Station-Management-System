import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from "axios";

declare module "axios" {
  export interface AxiosRequestConfig {
    _skipAuthRefresh?: boolean;
    _retry?: boolean;
  }
}

const api = axios.create({
  baseURL: "http://localhost:8080",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// --- Helper Check Cờ ---
const isCharging = () => sessionStorage.getItem("IS_CHARGING") === "true";

api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Kiểm tra nếu API trả về HTML (dấu hiệu của trang Login bị redirect)
    const contentType = response.headers["content-type"];
    if (contentType && contentType.includes("text/html")) {
        // Nếu API lẽ ra phải trả về JSON mà lại trả về HTML -> LỖI AUTH
        if (response.config.responseType !== 'text' && response.config.responseType !== 'blob') {
            
            // Nếu đang sạc -> BIẾN NÓ THÀNH LỖI để lọt xuống catch phía dưới xử lý
            if (isCharging()) {
                console.warn("Blocked HTML response (Login Page) during charging.");
                // Ném lỗi giả để kích hoạt cơ chế bảo vệ ở dưới
                return Promise.reject(new Error("BLOCKED_BY_CHARGING_MODE"));
            }
            
            // Nếu không sạc -> Chấp nhận số phận, redirect ra login
            window.location.href = "/login";
            return Promise.reject(new Error("AUTH_REDIRECT"));
        }
    }
    return response;
  },

  async (err: AxiosError | any) => {
    // CẤM REDIRECT KHI ĐANG SẠC 
    if (isCharging()) {
        console.warn("Auth/Network error caught. Charging Mode active. Redirect suppressed.");
        return Promise.reject(err);
    }
    // --------------------------------------------------------

    const originalConfig = err.config as InternalAxiosRequestConfig;
    const status = err.response?.status;

    // Bỏ qua nếu không phải lỗi 401 hoặc config không tồn tại (lỗi do ta ném ở trên)
    if (!originalConfig || originalConfig._skipAuthRefresh || status !== 401) {
      return Promise.reject(err);
    }

    // Nếu chính API refresh lỗi -> Reject
    if (originalConfig.url?.includes("/auth/refresh")) {
      return Promise.reject(err);
    }

    if (originalConfig._retry) {
      // Đã retry mà vẫn lỗi -> Logout
      try { await api.post("/auth/logout", {}, { _skipAuthRefresh: true }); } catch {}
      localStorage.clear();
      window.location.href = "/login";
      return Promise.reject(err);
    }

    originalConfig._retry = true;

    if (isRefreshing) {
      return new Promise(function (resolve, reject) {
        failedQueue.push({
          resolve: () => resolve(api(originalConfig)),
          reject: (err: any) => reject(err),
        });
      });
    }

    isRefreshing = true;

    try {
      await api.post("/auth/refresh", {}, { _skipAuthRefresh: true });
      processQueue(null, "success");
      return api(originalConfig);
    } catch (refreshErr: any) {
      // Thử cứu vớt bằng /auth/me
      try {
         await api.get("/auth/me", { _skipAuthRefresh: true });
         processQueue(null, "revived");
         return api(originalConfig);
      } catch (checkErr) {
         processQueue(refreshErr, null);
         
         const s = refreshErr.response?.status;
         // Chỉ logout nếu không phải đang sạc (đã check ở đầu hàm rồi, check lại cho chắc)
         if (!isCharging() && (s === 401 || s === 403 || s === 400)) {
            try { await api.post("/auth/logout", {}, { _skipAuthRefresh: true }); } catch {}
            localStorage.clear();
            window.location.href = "/login"; 
         }
         return Promise.reject(refreshErr);
      }
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;