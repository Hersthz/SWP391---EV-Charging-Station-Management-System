import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:8080",
    withCredentials: true,
    headers: {
        "Content-Type": "application/json"
    }
});

api.interceptors.response.use(
  (r) => r,
  async (err) => {
    const original = err.config as any;
    if (!original?._retry && err?.response?.status === 401) {
      original._retry = true;
      try {
        await api.post("/auth/refresh");  // backend đang @PostMapping("/refresh")
        return api(original);
      } catch {}
    }
    return Promise.reject(err);
  }
);

export default api;