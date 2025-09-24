import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";
import { Zap, Mail, Lock, User, Eye, EyeOff, Shield, ArrowLeft, CheckCircle } from "lucide-react";

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
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    // Check demo account trước
    if (loginData.username === "driver1" && loginData.password === "123") {
      toast.success("Đăng nhập demo thành công (Driver)!");
      localStorage.setItem("token", "demo-token-driver");
      localStorage.setItem("currentUser", "driver1");
      navigate("/dashboard");
      return;
    }

    if (loginData.username === "admin1" && loginData.password === "123") {
      toast.success("Đăng nhập demo thành công (Admin)!");
      localStorage.setItem("token", "demo-token-admin");
      localStorage.setItem("currentUser", "admin1");
      navigate("/admin");
      return;
    }
    try {
      const { data } = await api.post("/auth/login", {
        username: loginData.username,
        password: loginData.password,
      });
      localStorage.setItem("token", data.token);
      localStorage.setItem("currentUser", data.user.username);
      localStorage.setItem("role", data.user.role);
      toast.success("Login successfully!");
      switch (data.user.role) {
        case "admin":
          navigate("/admin");
          break;
        case "staff":
          navigate("/staff");
          break;
        default: // user
          navigate("/dashboard");
          break;
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Username or password is incorrect!");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (registerData.password !== registerData.confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp!");
      return;
    }
    if (registerData.password.length < 6) {
      toast.error("Mật khẩu phải có ít nhất 6 ký tự!");
      return;
    }

    try {
      await api.post("/auth/register", {
        fullName: registerData.fullName,
        email: registerData.email,
        username: registerData.username,
        password: registerData.password,
      });
      toast.success("Đăng ký thành công! Bạn có thể đăng nhập ngay.");
      setLoginData({
        username: registerData.username,
        password: registerData.password,
      });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Đăng ký thất bại");
    }

    // Switch to login tab
    setTimeout(() => {
      setLoginData({ username: registerData.username, password: registerData.password });
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-hero relative overflow-hidden flex items-center justify-center p-4">
      {/* overlay nhạt để giống mẫu */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20" />

      <div className="relative z-10 w-full max-w-md">
        {/* nút về trang chủ */}
        <Link
          to="/"
          className="flex items-center text-white mb-6 hover:text-white/80 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Về trang chủ
        </Link>

        <Card className="shadow-2xl border-0 backdrop-blur-sm bg-white/95">
          <CardHeader className="text-center space-y-4 pb-2">
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
              <CardDescription>Hệ thống quản lý trạm sạc thông minh</CardDescription>
              <div className="mt-2">
                <Badge className="bg-primary/10 text-primary border-primary/20">Pro</Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-4">
            <Tabs defaultValue="login" className="space-y-6">
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
                        aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full h-12 text-base font-semibold">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Đăng nhập an toàn
                  </Button>
                </form>

                {/* Hàng demo như ảnh */}
                <div className="bg-accent/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground text-center">
                    <strong>Demo:</strong> Tài xế: <code>driver1/123</code> | Admin: <code>admin1/123</code>
                  </p>
                </div>
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
                      Tài khoản
                    </Label>
                    <Input
                      id="regUsername"
                      type="text"
                      placeholder="Chọn tài khoản"
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
                        type={showConfirmPassword ? "text" : "password"}
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
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        aria-label={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full h-12 text-base font-semibold">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Tạo tài khoản
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