import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { toast } from "sonner";
import { Zap, Mail, Lock, User, Eye, EyeOff, ArrowLeft } from "lucide-react";
import api from "../api/axios";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { cn } from "../lib/utils"; 
import ReflectBackground from "../components/lightswind/reflect-background";

// ----- GoogleButton -----
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
    className="
      w-full h-11 rounded-lg 
      bg-white/10 border border-gray-700
      flex items-center justify-center gap-3
      hover:bg-white/20 active:scale-[0.99]
      transition-all duration-200
    "
    aria-label="Sign in with Google"
  >
    <GoogleIcon />
    <span className="text-sm font-medium text-gray-200">
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
  
  const [tab, setTab] = useState<"login" | "register">("login");

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    const username = loginData.username.trim();
    const password = loginData.password.trim();
    if (!username || !password) {
      toast.error("Please enter username and password");
      return;
    }
    setIsLoading(true);
    // Demo accounts 
    if (username === "driver1" && password === "123") {
      try { await api.post("/auth/logout").catch(() => { }); }
      finally {
        toast.success("Demo login successful (Driver)!");
        localStorage.setItem("isDemo", "true");
        localStorage.setItem("currentUser", "driver1");
        localStorage.setItem("role", "USER");
        navigate("/dashboard");
        setIsLoading(false);
        return;
      }
    }
    if (username === "admin1" && password === "123") {
      try { await api.post("/auth/logout").catch(() => { }); }
      finally {
        toast.success("Demo login successful (Admin)!");
        localStorage.setItem("isDemo", "true");
        localStorage.setItem("currentUser", "admin1");
        localStorage.setItem("role", "ADMIN");
        navigate("/admin");
        setIsLoading(false);
        return;
      }
    }
    if (username === "staff1" && password === "123") {
      try { await api.post("/auth/logout").catch(() => { }); }
      finally {
        toast.success("Demo login successful (Staff)!");
        localStorage.setItem("isDemo", "true");
        localStorage.setItem("currentUser", "staff1");
        localStorage.setItem("role", "STAFF");
        navigate("/staff");
        setIsLoading(false);
        return;
      }
    }
    try {
      await api.post("/auth/login", { username, password });
      let meData = null;
      try {
        const meRes = await api.get<any>("/auth/me");
        meData = meRes.data;
      } catch (meErr) {
        console.warn("Could not fetch /auth/me after login", meErr);
        throw meErr;
      }
      const usernameResp = meData?.username ?? meData?.email ?? username;
      const fullNameResp = meData?.full_name ?? meData?.fullName ?? "";
      const roleRespRaw = meData?.role ?? meData?.roleName ?? meData?.role_name ?? "";
      const roleResp = String(roleRespRaw).toUpperCase();
      if (usernameResp) localStorage.setItem("currentUser", String(usernameResp));
      if (roleResp) localStorage.setItem("role", String(roleResp));
      if (fullNameResp) localStorage.setItem("full_name", String(fullNameResp));
      toast.success("Login successful!");
      if (roleResp === "ADMIN") navigate("/admin");
      else if (roleResp === "STAFF") navigate("/staff");
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

  const formVariants: Variants = {
    hiddenLeft: {
      opacity: 0,
      x: "-100%", 
      transition: { duration: 0.4, ease: "easeInOut" }
    },
    hiddenRight: {
      opacity: 0,
      x: "100%", 
      transition: { duration: 0.4, ease: "easeInOut" }
    },
    visible: {
      opacity: 1,
      x: "0%", 
      transition: { duration: 0.5, ease: "easeInOut" }
    },
  };


  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      <ReflectBackground
        backdropBlurAmount="sm"
        className="absolute inset-0 -z-10"
      />
      
      <div className="relative z-10 w-full max-w-md">
        <motion.div 
          className="shadow-2xl border border-white/15 
            bg-gradient-to-br from-gray-950/70 via-gray-900/60 to-gray-950/70
            backdrop-blur-lg rounded-2xl overflow-hidden"
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} 
        >
          {/* CardHeader */}
          <CardHeader className="relative text-center space-y-4 pb-4">
            <Link
              to="/"
              className="absolute left-4 top-4 inline-flex items-center text-gray-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
            <div className="flex justify-center pt-8">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/30 relative overflow-hidden group">
                <Zap className="w-8 h-8 text-white relative z-10" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              </div>
            </div>
            <div>
              <CardTitle className="text-3xl font-bold text-white [text-shadow:_0_2px_10px_rgba(0,0,0,0.3)]">
                ChargeHub
              </CardTitle>
              <CardDescription className="text-gray-300">Smart EV charging station management system</CardDescription>
            </div>
          </CardHeader>

          <CardContent className="pt-4 px-6 pb-6">
            {/* Buttons + State */}
            <div className="grid w-full grid-cols-2 bg-gray-800/50 backdrop-blur-sm p-1 rounded-lg mb-6">
              <button
                onClick={() => setTab("login")}
                className={cn(
                  "py-2 rounded-md font-semibold transition-all duration-300",
                  tab === "login"
                    ? "bg-gradient-to-r from-emerald-500 to-cyan-600 text-white shadow-lg"
                    : "text-gray-300 hover:bg-white/5"
                )}
              >
                Login
              </button>
              <button
                onClick={() => setTab("register")}
                className={cn(
                  "py-2 rounded-md font-semibold transition-all duration-300",
                  tab === "register"
                    ? "bg-gradient-to-r from-emerald-500 to-cyan-600 text-white shadow-lg"
                    : "text-gray-300 hover:bg-white/5"
                )}
              >
                Register
              </button>
            </div>

            {/* Khu vực Animation */}
            <div className="relative overflow-hidden">
              <AnimatePresence mode="wait">
                {/* ===== LOGIN FORM ===== */}
                {tab === "login" && (
                  <motion.div
                    key="login"
                    variants={formVariants} 
                    initial="hiddenRight"
                    animate="visible"
                    exit="hiddenLeft"
                    className="space-y-6"
                  >
                    <form onSubmit={handleLogin} className="space-y-5">
                      {/* Input "Glow" */}
                      <div className="space-y-2">
                        <Label htmlFor="username-login" className="flex items-center gap-2 text-gray-200">
                          <User className="w-4 h-4" />
                          Username
                        </Label>
                        <Input
                          id="username-login"
                          type="text"
                          placeholder="Enter your username"
                          value={loginData.username}
                          onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                          className="h-12 bg-white/5 border-gray-700 text-white placeholder:text-gray-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="password-login" className="flex items-center gap-2 text-gray-200">
                          <Lock className="w-4 h-4" />
                          Password
                        </Label>
                        <div className="relative">
                          <Input
                            id="password-login"
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            value={loginData.password}
                            onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                            className="h-12 pr-12 bg-white/5 border-gray-700 text-white placeholder:text-gray-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30"
                            required
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-gray-400 hover:text-white"
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
                        className="w-full h-12 text-base font-semibold text-white bg-gradient-to-r from-emerald-500 to-cyan-600 hover:brightness-110 shadow-lg shadow-cyan-500/40"
                      >
                        {isLoading ? "Processing..." : "Login"}
                      </Button>
                    </form>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-px bg-gray-700" />
                      <span className="text-xs text-gray-500">or</span>
                      <div className="flex-1 h-px bg-gray-700" />
                    </div>
                    <GoogleButton
                      onClick={() => {
                        window.location.href = "http://localhost:8080/oauth2/authorization/google";
                      }}
                    />
                  </motion.div>
                )}

                {/* ===== REGISTER FORM ===== */}
                {tab === "register" && (
                  <motion.div
                    key="register"
                    variants={formVariants}
                    initial="hiddenRight"
                    animate="visible"
                    exit="hiddenLeft"
                    className="space-y-6"
                  >
                    <form onSubmit={handleRegister} className="space-y-5">
                      {/* Inputs "Glow" */}
                      <div className="space-y-2">
                        <Label htmlFor="fullName-reg" className="flex items-center gap-2 text-gray-200">
                          <User className="w-4 h-4" />
                          Full Name
                        </Label>
                        <Input
                          id="fullName-reg"
                          type="text"
                          placeholder="Enter your full name"
                          value={registerData.fullName}
                          onChange={(e) => setRegisterData({ ...registerData, fullName: e.target.value })}
                          className="h-12 bg-white/5 border-gray-700 text-white placeholder:text-gray-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email-reg" className="flex items-center gap-2 text-gray-200">
                          <Mail className="w-4 h-4" />
                          Email
                        </Label>
                        <Input
                          id="email-reg"
                          type="email"
                          placeholder="Enter your email"
                          value={registerData.email}
                          onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                          className="h-12 bg-white/5 border-gray-700 text-white placeholder:text-gray-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="regUsername-reg" className="flex items-center gap-2 text-gray-200">
                          <User className="w-4 h-4" />
                          Username
                        </Label>
                        <Input
                          id="regUsername-reg"
                          type="text"
                          placeholder="Choose a username"
                          value={registerData.username}
                          onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
className="h-12 bg-white/5 border-gray-700 text-white placeholder:text-gray-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="regPassword-reg" className="flex items-center gap-2 text-gray-200">
                          <Lock className="w-4 h-4" />
                          Password
                        </Label>
                        <div className="relative">
                          <Input
                            id="regPassword-reg"
                            type={showPassword ? "text" : "password"}
                            placeholder="Create a password (at least 6 characters)"
                            value={registerData.password}
                            onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                            className="h-12 pr-12 bg-white/5 border-gray-700 text-white placeholder:text-gray-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30"
                            required
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-gray-400 hover:text-white"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword-reg" className="flex items-center gap-2 text-gray-200">
                          <Lock className="w-4 h-4" />
                          Confirm Password
                        </Label>
                        <div className="relative">
                          <Input
                            id="confirmPassword-reg"
                            type={showConfirmPasswordRegister ? "text" : "password"}
                            placeholder="Re-enter your password"
                            value={registerData.confirmPassword}
                            onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                            className="h-12 pr-12 bg-white/5 border-gray-700 text-white placeholder:text-gray-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30" // <-- Lỗi typo ở đây nữa, đã sửa thành 30
                            required
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-gray-400 hover:text-white"
                            onClick={() => setShowConfirmPasswordRegister(!showConfirmPasswordRegister)}
                            aria-label={showConfirmPasswordRegister ? "Hide password" : "Show password"}
                          >
                            {showConfirmPasswordRegister ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                      <Button
                        type="submit"
                        className="w-full h-12 text-base font-semibold text-white bg-gradient-to-r from-emerald-500 to-cyan-600 hover:brightness-110 shadow-lg shadow-cyan-500/40"
                        disabled={isLoading}
                        aria-busy={isLoading}
                      >
                        {isLoading ? "Processing..." : "Create account"}
                      </Button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </CardContent>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;