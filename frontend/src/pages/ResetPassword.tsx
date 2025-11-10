import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Zap, Lock, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import api from "../api/axios";

// Reuse visual style tương tự Login
const EnergyParticleBackground = () => {
  const [dots, setDots] = useState(
    Array.from({ length: 160 }).map(() => ({
      x: Math.random() * 110 - 5,
      y: Math.random() * 120 - 15,
      s: Math.random() * 7 + 2,
      vx: (Math.random() - 0.5) * 0.08,
      vy: Math.random() * 0.6 + 0.25,
      o: Math.random() * 0.6 + 0.4,
    }))
  );
  useEffect(() => {
    let raf: number;
    const loop = () => {
      setDots((prev) =>
        prev.map((d) => {
          let x = d.x + d.vx;
          let y = d.y + d.vy;
          if (y > 110 || x < -10 || x > 110) {
            x = Math.random() * 110 - 5;
            y = -5;
          }
          return { ...d, x, y };
        })
      );
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-gradient-to-br from-teal-300 via-emerald-300 to-cyan-300 opacity-70" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.12)_0%,rgba(0,0,0,0)_60%)]" />
      {dots.map((d, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${d.x}%`,
            top: `${d.y}%`,
            width: d.s,
            height: d.s,
            background: "rgba(255,255,255,0.95)",
            opacity: d.o,
            boxShadow: "0 0 10px rgba(255,255,255,0.5)",
            filter: "blur(0.6px)",
            transform: "translateZ(0)",
          }}
        />
      ))}
    </div>
  );
};

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = (params.get("token") || "").trim();

  const nav = useNavigate();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [show1, setShow1] = useState(false);
  const [show2, setShow2] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      toast.error("Invalid reset link");
    }
  }, [token]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    const p1 = pw.trim();
    const p2 = pw2.trim();
    if (!token) {
      toast.error("Missing or invalid token");
      return;
    }
    if (!p1 || !p2) {
      toast.error("Please enter your new password");
      return;
    }
    if (p1.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (p1 !== p2) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await api.post(
        "/auth/reset-password",
        { token, newPassword: p1 },
        { _skipAuthRefresh: true } as any
      );
      toast.success("Password updated. Please login again.");
      nav("/login");
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Failed to reset password";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      <EnergyParticleBackground />

      <div className="relative z-10 w-full max-w-md">
        <div
          className="shadow-2xl border border-white/50 bg-white/70
            backdrop-blur-xl rounded-2xl overflow-hidden"
        >
          <CardHeader className="relative text-center space-y-4 pb-4">
            <Link
              to="/login"
              className="absolute left-4 top-4 inline-flex items-center text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </Link>
            <div className="flex justify-center pt-8">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/30">
                <Zap className="w-8 h-8 text-white" />
              </div>
            </div>
            <div>
              <CardTitle className="text-3xl font-extrabold text-slate-900 tracking-tight">
                Reset password
              </CardTitle>
              <CardDescription className="text-slate-600">
                Enter your new password to continue
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="pt-2 px-6 pb-6">
            <form onSubmit={submit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="pw1" className="flex items-center gap-2 text-slate-700">
                  <Lock className="w-4 h-4" />
                  New password
                </Label>
                <div className="relative">
                  <Input
                    id="pw1"
                    type={show1 ? "text" : "password"}
                    placeholder="At least 6 characters"
                    value={pw}
                    onChange={(e) => setPw(e.target.value)}
                    className="h-12 pr-12 bg-white/60 border-slate-300 text-slate-900 placeholder:text-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-slate-500 hover:text-slate-900"
                    onClick={() => setShow1((v) => !v)}
                    aria-label={show1 ? "Hide password" : "Show password"}
                  >
                    {show1 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pw2" className="flex items-center gap-2 text-slate-700">
                  <Lock className="w-4 h-4" />
                  Confirm new password
                </Label>
                <div className="relative">
                  <Input
                    id="pw2"
                    type={show2 ? "text" : "password"}
                    placeholder="Re-enter your new password"
                    value={pw2}
                    onChange={(e) => setPw2(e.target.value)}
                    className="h-12 pr-12 bg-white/60 border-slate-300 text-slate-900 placeholder:text-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-slate-500 hover:text-slate-900"
                    onClick={() => setShow2((v) => !v)}
                    aria-label={show2 ? "Hide password" : "Show password"}
                  >
                    {show2 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading || !token}
                aria-busy={loading}
                className="w-full h-12 text-base font-semibold text-white bg-gradient-to-r from-emerald-500 to-cyan-600 hover:brightness-110 shadow-lg shadow-cyan-500/40"
              >
                {loading ? "Updating..." : "Update password"}
              </Button>

              {!token && (
                <p className="text-xs text-red-600">
                  Reset link is invalid or missing token.
                </p>
              )}
            </form>
          </CardContent>
        </div>
      </div>
    </div>
  );
}
