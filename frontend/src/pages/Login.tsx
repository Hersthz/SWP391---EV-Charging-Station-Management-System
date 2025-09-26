import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";
import { Zap, Mail, Lock, User, Eye, EyeOff, ArrowLeft } from "lucide-react";
import api from "../api/axios";

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 3l5.7-5.7C33.8 6 29.1 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.5-.4-3.5z" />
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3 0 5.7 1.1 7.8 3l5.7-5.7C33.8 6 29.1 4 24 4 16.1 4 9.2 8.5 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.3-5.3l-6.1-5c-2 1.5-4.6 2.3-7.2 2.3-5.2 0-9.6-3.3-11.2-8l-6.6 5C9.1 39.4 16 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1 2.9-3.1 5.3-5.9 6.7l6.1 5C38.9 36.8 44 31.1 44 24c0-1.3-.1-2.5-.4-3.5z" />
  </svg>
);

const GoogleButton = ({ onClick }: { onClick?: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full h-11 rounded-lg bg-white border border-gray-200
               flex items-center justify-center gap-3
               hover:border-gray-300 hover:shadow-md active:scale-[0.99]
               transition-all duration-200"
    aria-label="Đăng nhập bằng Google"
  >
    <GoogleIcon />
    <span className="text-sm font-medium text-gray-700">
      Đăng nhập bằng Google
    </span>
  </button>
);

interface LoginResponse {
  token: string;
  username: string;
  role: string;
  full_name: string;
}

const Login = () => {
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [registerData, setRegisterData] = useState({
    fullName: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPasswordRegister, setShowConfirmPasswordRegister] = useState(false);
  const [showConfirmPasswordLogin, setShowConfirmPasswordLogin] = useState(false);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };
  const [tab, setTab] = useState<"login" | "register">("login");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    const username = loginData.username.trim();
    const password = loginData.password;
    if (!username || !password) {
      toast.error("Vui lòng nhập tài khoản và mật khẩu");
      return;
    }

    setIsLoading(true);
    // Check demo account trước
    // if (loginData.username === "driver1" && loginData.password === "123") {
    //   toast.success("Đăng nhập demo thành công (Driver)!");
    //   localStorage.setItem("token", "demo-token-driver");
    //   localStorage.setItem("currentUser", "driver1");
    //   navigate("/dashboard");
    //   return;
    // }

    // if (loginData.username === "admin1" && loginData.password === "123") {
    //   toast.success("Đăng nhập demo thành công (Admin)!");
    //   localStorage.setItem("token", "demo-token-admin");
    //   localStorage.setItem("currentUser", "admin1");
    //   navigate("/admin");
    //   return;
    // }
    try {
      const { data } = await api.post<LoginResponse>("/auth/login", {
        username,
        password,
      });
      localStorage.setItem("token", data.token);
      localStorage.setItem("currentUser", data.username);
      localStorage.setItem("role", data.role);
      localStorage.setItem("full_name", data.full_name);
      toast.success("Đăng nhập thành công!");
      // Clear password from state for security 
      setLoginData({ username: data.username, password: "" });

      if (data.role === "Admin") navigate("/admin");
      else if (data.role === "Staff") navigate("/staff");
      else navigate("/dashboard");
    } catch (err: any) {
      const message = err?.response?.data?.message ?? "Username or password is incorrect!";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    const full_name = registerData.fullName.trim();
    const email = registerData.email.trim();
    const username = registerData.username.trim();
    const password = registerData.password;
    const confirmPassword = registerData.confirmPassword;

    if (!full_name || !email || !username || !password || !confirmPassword) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }
    if (!validateEmail(email)) {
      toast.error("Email không hợp lệ");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp!");
      return;
    }
    if (password.length < 6) {
      toast.error("Mật khẩu phải có ít nhất 6 ký tự!");
      return;
    }
    setIsLoading(true);
    try {
      await api.post("/auth/register", {
        full_name,
        email,
        username,
        password,
      });
      toast.success("Đăng ký thành công! Bạn có thể đăng nhập ngay.");

      setRegisterData(prev => ({ ...prev, password: "", confirmPassword: "" }));

      setTab("login");
      setLoginData({ username, password: "" });
    } catch (err: any) {
      const message = err?.response?.data?.message ?? "Đăng ký thất bại";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero relative overflow-hidden flex items-center justify-center p-4">
      {/* overlay nhạt để giống mẫu */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20" />

      <div className="relative z-10 w-full max-w-md">
        <Card className="shadow-2xl border-0 backdrop-blur-sm bg-white/95">
          <CardHeader className="relative text-center space-y-4 pb-2">
            {/* nút về trang chủ – ở trong Card, góc trên trái */}
            <Link
              to="/"
              className="absolute left-4 top-4 inline-flex items-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Về trang chủ
            </Link>

            <div className="flex justify-center">
              <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-primary relative overflow-hidden group">
                <div className="mx-auto w-16 h-16 bg-gradient-hero rounded-2xl flex items-center justify-center shadow-primary relative overflow-hidden group">
                  <Zap className="w-8 h-8 text-white relative z-10" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                </div>
              </div>
            </div>

            <div>
              <CardTitle className="text-2xl font-bold text-primary">ChargeStation</CardTitle>
              <CardDescription>Hệ thống quản lý trạm sạc thông minh</CardDescription>            -
            </div>
          </CardHeader>

          <CardContent className="pt-4">
            <Tabs value={tab} onValueChange={(v) => setTab(v as "login" | "register")} className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Đăng nhập</TabsTrigger>
                <TabsTrigger value="register">Đăng ký</TabsTrigger>
              </TabsList>

              {/* ===== LOGIN ===== */}
              <TabsContent value="login" className="space-y-6">
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Tài khoản
                    </Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="Nhập tài khoản của bạn"
                      value={loginData.username}
                      onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                      className="h-12"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Mật khẩu
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Nhập mật khẩu"
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        className="h-12 pr-12"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showConfirmPasswordLogin ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    aria-busy={isLoading}
                    className="w-full h-12 text-base font-semibold"
                  >
                    {isLoading ? "Đang xử lý..." : "Đăng nhập"}
                  </Button>
                </form>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-muted" />
                  <span className="text-xs text-muted-foreground">hoặc</span>
                  <div className="flex-1 h-px bg-muted" />
                </div>

                {/* Nút Google – UI only */}
                <GoogleButton />
              </TabsContent>

              {/* ===== REGISTER ===== */}
              <TabsContent value="register" className="space-y-6">
                <form onSubmit={handleRegister} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Họ và tên
                    </Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Nhập họ và tên"
                      value={registerData.fullName}
                      onChange={(e) => setRegisterData({ ...registerData, fullName: e.target.value })}
                      className="h-12"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Nhập địa chỉ email"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                      className="h-12"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="regUsername" className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Username
                    </Label>
                    <Input
                      id="regUsername"
                      type="text"
                      placeholder="Enter Username"
                      value={registerData.username}
                      onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                      className="h-12"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="regPassword" className="flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Mật khẩu
                    </Label>
                    <div className="relative">
                      <Input
                        id="regPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="Tạo mật khẩu (tối thiểu 6 ký tự)"
                        value={registerData.password}
                        onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                        className="h-12 pr-12"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Xác nhận mật khẩu
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPasswordRegister ? "text" : "password"}
                        placeholder="Nhập lại mật khẩu"
                        value={registerData.confirmPassword}
                        onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                        className="h-12 pr-12"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                        onClick={() => setShowConfirmPasswordRegister(!showConfirmPasswordRegister)}
                        aria-label={showConfirmPasswordRegister ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                      >
                        {showConfirmPasswordRegister ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-semibold"
                    disabled={isLoading}
                    aria-busy={isLoading}
                  >
                    {isLoading ? "Đang xử lý..." : "Tạo tài khoản"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;