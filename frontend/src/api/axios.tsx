// src/api/axios.ts
import axios from "axios";

declare module "axios" {
  // cờ tùy chọn để bỏ qua refresh trong một số call (logout, login, /me sau login...)
  export interface AxiosRequestConfig {
    _skipAuthRefresh?: boolean;
    _retry?: boolean;
  }
}

const api = axios.create({
  baseURL: "http://localhost:8080",
  withCredentials: true, // QUAN TRỌNG: gửi kèm cookie JWT/REFRESH
  headers: { "Content-Type": "application/json" },
});

// Tuyệt đối KHÔNG gắn Authorization header từ localStorage
// vì BE đang đọc token từ cookie, không phải header.

api.interceptors.response.use(
  (r) => r,
  async (err) => {
    const original = err.config || {};
    const status = err?.response?.status;

    // Nếu request này được đánh dấu bỏ qua refresh thì trả lỗi luôn
    if (original._skipAuthRefresh) {
      return Promise.reject(err);
    }

    // Không cố refresh khi lỗi chính là /auth/refresh để tránh loop
    const url = (original?.url || "") as string;
    if (url.includes("/auth/refresh")) {
      return Promise.reject(err);
    }

    // Nếu 401 và chưa retry → gọi refresh bằng COOKIE
    if (status === 401 && !original._retry) {
      original._retry = true;
      try {
        // KHÔNG gửi body; BE đọc cookie REFRESH và set lại cookie JWT
        await api.post("/auth/refresh", {}, { withCredentials: true, _skipAuthRefresh: true });
        // Retry request cũ (cookie JWT mới đã được set từ Set-Cookie)
        return api(original);
      } catch (e) {
        // Refresh fail → clear localStorage (chỉ info hiển thị) và về /login
        try { await api.post("/auth/logout", {}, { _skipAuthRefresh: true }); } catch {}
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(e);
      }
    }

    return Promise.reject(err);
  }
);

export default api;
