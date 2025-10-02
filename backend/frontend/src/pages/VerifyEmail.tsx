import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { toast } from "sonner";

const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState("Đang xác minh...");

    interface VerifyResponse {
        message: string;
    }

    useEffect(() => {
        const token = searchParams.get("token");
        if (!token) {
            setStatus("Thiếu token!");
            return;
        }

        const verify = async () => {
            try {
                const res = await api.get<VerifyResponse>(`/auth/verify?token=${token}`);
                toast.success(res.data.message || "Xác minh email thành công!");
                setStatus("Xác minh email thành công! Bạn có thể đăng nhập.");
                setTimeout(() => navigate("/login"), 2000); // tự động điều hướng về login
            } catch (err: any) {
                const msg = err?.response?.data?.message ?? "Token không hợp lệ hoặc đã hết hạn.";
                toast.error(msg);
                setStatus(msg);
            }
        };

        verify();
    }, [searchParams, navigate]);

    return (
        <div className="h-screen flex items-center justify-center">
            <p className="text-lg font-medium">{status}</p>
        </div>
    );
};

export default VerifyEmail;
