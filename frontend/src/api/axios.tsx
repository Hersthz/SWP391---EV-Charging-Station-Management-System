import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:8080/identity",
    withCredentials: false,
});

export default api;