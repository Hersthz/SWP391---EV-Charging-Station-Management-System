import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/axios";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Loader2, QrCode, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "../hooks/use-toast";

type ViewState = "idle" | "loading" | "ok" | "fail";

export default function Checkin() {
  const [sp] = useSearchParams();
  const token = sp.get("token") || "";
  const navigate = useNavigate();
  const { toast } = useToast();

  const [state, setState] = useState<ViewState>("idle");
  const [message, setMessage] = useState("Verifying…");

  useEffect(() => {
    const run = async () => {
      setState("loading");
      setMessage("Verifying…");

      try {
        if (!token) throw new Error("Missing token");
        // lấy userId 
        let userId: number | undefined;
        try {
          const me = await api.get("/auth/me", { withCredentials: true });
          userId =
            typeof me.data?.user_id === "number"
              ? me.data.user_id
              : typeof me.data?.id === "number"
              ? me.data.id
              : undefined;
        } catch {
  
        }

        // verify token 
        const body = userId ? { token, userId } : { token };
        const { data } = await api.post("/api/token/verify", body, {
          withCredentials: true,
        });

        const payload = data?.data ?? data;
        setState("ok");
        setMessage(data?.message || "Check-in successful");
        toast({
          title: "Check-in",
          description:
            data?.message ||
            `Reservation #${payload?.reservationId ?? ""} is now ${payload?.newStatus ?? "CHARGING"}.`,
        });

        setTimeout(() => navigate("/dashboard"), 30000);
      } catch (e: any) {
        setState("fail");
        setMessage(e?.response?.data?.message || e?.message || "Verify failed");
      }
    };

    run();
  }, [token, navigate, toast]);

  const icon =
    state === "loading" || state === "idle" ? (
      <Loader2 className="w-5 h-5 animate-spin" />
    ) : state === "ok" ? (
      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
    ) : (
      <XCircle className="w-5 h-5 text-rose-600" />
    );

  const badgeVariant =
    state === "ok" ? "default" : state === "fail" ? "destructive" : "secondary";

  return (
    <div className="min-h-screen grid place-items-center p-6 bg-gradient-to-b from-background to-muted/30">
      <Card className="w-full max-w-md shadow-card border-2 border-transparent hover:border-primary/20 transition">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="p-2 rounded-lg bg-primary/10">
              <QrCode className="w-5 h-5 text-primary" />
            </span>
            Check-in
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-center justify-center">
            <Badge variant={badgeVariant as any} className="gap-2">
              {icon}
              {state === "ok" ? "Success" : state === "fail" ? "Failed" : "Verifying"}
            </Badge>
          </div>

          <div className="text-center text-sm text-muted-foreground break-all">
            Token: <span className="font-mono">{token || "—"}</span>
          </div>

          <div
            className={[
              "text-center text-sm",
              state === "ok"
                ? "text-emerald-700"
                : state === "fail"
                ? "text-rose-600"
                : "text-muted-foreground",
            ].join(" ")}
          >
            {message}
          </div>

          <div className="pt-2 flex justify-center">
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              Back to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
