import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
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
    aria-label="Sign in with Google"
  >
    <GoogleIcon />
    <span className="text-sm font-medium text-gray-700">
      Sign in with Google
    </span>
  </button>
);

interface LoginResponse {
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
      toast.error("Please enter username and password");
      return;
    }

    setIsLoading(true);
    // Demo accounts
    if (username === "driver1" && password === "123") {
      try {
        // gọi logout để chắc chắn xóa cookie JWT HttpOnly nếu có (endpoint logout server cần có)
        await api.post("/auth/logout").catch(() => {/* ignore */ });
      } finally {
        toast.success("Demo login successful (Driver)!");
        // lưu flag demo và thông tin cần thiết (KHÔNG lưu token)
        localStorage.setItem("isDemo", "true");
        localStorage.setItem("currentUser", "driver1");
        localStorage.setItem("role", "User");
        navigate("/dashboard");
        setIsLoading(false);
        return;
      }
    }
    if (username === "admin1" && password === "123") {
      try {
        await api.post("/auth/logout").catch(() => {/* ignore */ });
      } finally {
        toast.success("Demo login successful (Admin)!");
        localStorage.setItem("isDemo", "true");
        localStorage.setItem("currentUser", "admin1");
        localStorage.setItem("role", "Admin");
        navigate("/admin");
        setIsLoading(false);
        return;
      }
    }
    try {
      const { data } = await api.post<LoginResponse>("/auth/login", {
        username,
        password,
      });

      if (data.username) localStorage.setItem("currentUser", data.username);
      if (data.role) localStorage.setItem("role", data.role);
      if ((data as any).full_name) localStorage.setItem("full_name", (data as any).full_name);
      toast.success("Login successful!");
      setLoginData({ username: data.username, password: "" });

      if (data.role === "Admin") navigate("/admin");
      else if (data.role === "Staff") navigate("/staff");
      else navigate("/dashboard");
    } catch (err: any) {
      const message = err?.response?.data?.message ?? "Invalid username or password!";
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
      toast.error("Please fill in all fields");
      return;
    }
    if (!validateEmail(email)) {
      toast.error("Invalid email address");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters!");
      return;
    }
    setIsLoading(true);
    try {
      const res = await api.post("/auth/register", {
        full_name,
        email,
        username,
        password,
      });

      const message =
        typeof res.data === "string"
          ? res.data
          : "Registration successful! Please check your email for verification.";

      toast.success(message);

      setRegisterData(prev => ({ ...prev, password: "", confirmPassword: "" }));

      setTab("login");
      setLoginData({ username, password: "" });
    } catch (err: any) {
      const message = err?.response?.data?.message ?? "Registration failed";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero relative overflow-hidden flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20" />

      <div className="relative z-10 w-full max-w-md">
        <Card className="shadow-2xl border-0 backdrop-blur-sm bg-white/95">
          <CardHeader className="relative text-center space-y-4 pb-2">
            <Link
              to="/"
              className="absolute left-4 top-4 inline-flex items-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
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
              <CardDescription>Smart EV charging station management system</CardDescription>
            </div>
          </CardHeader>

          <CardContent className="pt-4">
            <Tabs value={tab} onValueChange={(v) => setTab(v as "login" | "register")} className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              {/* ===== LOGIN ===== */}
              <TabsContent value="login" className="space-y-6">
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Username
                    </Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="Enter your username"
                      value={loginData.username}
                      onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                      className="h-12"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
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
                        aria-label={showPassword ? "Hide password" : "Show password"}
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
                    {isLoading ? "Processing..." : "Login"}
                  </Button>
                </form>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-muted" />
                  <span className="text-xs text-muted-foreground">or</span>
                  <div className="flex-1 h-px bg-muted" />
                </div>

                <GoogleButton
                  onClick={() => {
                    window.location.href = "http://localhost:8080/oauth2/authorization/google";
                  }}
                />
              </TabsContent>

              {/* ===== REGISTER ===== */}
              <TabsContent value="register" className="space-y-6">
                <form onSubmit={handleRegister} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Full Name
                    </Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Enter your full name"
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
                      placeholder="Enter your email"
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
                      placeholder="Choose a username"
                      value={registerData.username}
                      onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                      className="h-12"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="regPassword" className="flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="regPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a password (at least 6 characters)"
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
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPasswordRegister ? "text" : "password"}
                        placeholder="Re-enter your password"
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
                        aria-label={showConfirmPasswordRegister ? "Hide password" : "Show password"}
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
                    {isLoading ? "Processing..." : "Create account"}
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
