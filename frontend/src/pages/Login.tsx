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
      try {
        const { data } = await api.post("/auth/login", {
          username: loginData.username,
          password: loginData.password,
        });
        localStorage.setItem("token", data.token);
        localStorage.setItem("currentUser", data.user.username);
        toast.success("Login successfully!");
        navigate("/dashboard");
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
      <div className="min-h-screen relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_80%,_hsl(var(--primary))_0%,_transparent_50%)] opacity-5"></div>
          <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_20%,_hsl(var(--accent))_0%,_transparent_50%)] opacity-5"></div>
          <div className="absolute bottom-0 left-1/2 w-full h-full bg-[radial-gradient(circle_at_50%_100%,_hsl(var(--primary))_0%,_transparent_50%)] opacity-10"></div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-primary/5 rounded-full blur-xl animate-float"></div>
        <div className="absolute bottom-20 right-20 w-48 h-48 bg-accent/5 rounded-full blur-2xl animate-float" style={{ animationDelay: "2s" }}></div>
        <div className="absolute top-1/2 left-10 w-24 h-24 bg-primary/10 rounded-full blur-lg animate-float" style={{ animationDelay: "4s" }}></div>

        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            {/* Back Button */}
            <div className="mb-6">
              <Button
                variant="ghost"
                onClick={() => navigate("/")}
                className="group hover:bg-primary/5"
              >
                <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                Back to Home
              </Button>
            </div>

            <Card className="shadow-glow border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-center space-y-6 pb-2">
                <div className="relative">
                  <div className="mx-auto w-16 h-16 bg-gradient-hero rounded-2xl flex items-center justify-center shadow-primary relative overflow-hidden group">
                    <Zap className="w-8 h-8 text-white relative z-10" />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                  </div>
                  <div className="absolute -top-2 -right-2">
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-xs">
                      Pro
                    </Badge>
                  </div>
                </div>

                <div>
                  <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    ChargeStation
                  </CardTitle>
                  <CardDescription className="text-base mt-2">
                    EV Charging Made Simple & Fast
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="pt-4">
                <Tabs defaultValue="login" className="space-y-6">
                  <TabsList className="grid w-full grid-cols-2 bg-muted/50">
                    <TabsTrigger value="login" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                      Login
                    </TabsTrigger>
                    <TabsTrigger value="register" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                      Register
                    </TabsTrigger>
                  </TabsList>

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
                          className="h-12 bg-background/50 border-border/50 focus:border-primary"
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
                            className="h-12 bg-background/50 border-border/50 focus:border-primary pr-12"
                            required
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>

                      <Button type="submit" className="w-full h-12 text-base font-semibold" size="lg">
                        <Shield className="w-4 h-4 mr-2" />
                        Login
                      </Button>
                    </form>


                  </TabsContent>
                
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
                          className="h-12 bg-background/50 border-border/50 focus:border-primary"
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
                          className="h-12 bg-background/50 border-border/50 focus:border-primary"
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
                          placeholder="Enter your username"
                          value={registerData.username}
                          onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                          className="h-12 bg-background/50 border-border/50 focus:border-primary"
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
                            placeholder="Enter your password (6+ characters)"
                            value={registerData.password}
                            onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                            className="h-12 bg-background/50 border-border/50 focus:border-primary pr-12"
                            required
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                            onClick={() => setShowPassword(!showPassword)}
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
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm your password"
                            value={registerData.confirmPassword}
                            onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                            className="h-12 bg-background/50 border-border/50 focus:border-primary pr-12"
                            required
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>

                      <Button type="submit" className="w-full h-12 text-base font-semibold" size="lg">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Register
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  };

  export default Login;