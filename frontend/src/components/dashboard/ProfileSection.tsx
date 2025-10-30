"use client";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, User as UserIcon, CalendarClock, ShieldCheck, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";
import { Button } from "../../components/ui/button";
import api from "../../api/axios";

type Me = {
  id?: number;
  user_id?: number;
  full_name?: string;
  email?: string;
  role?: string;
  createdAt?: string;
  created_at?: string;
  member_since?: string;
};

function initialsOf(name?: string) {
  if (!name) return "U";
  return name.split(" ").filter(Boolean).map((w) => w[0]?.toUpperCase()).join("").slice(0, 2);
}
function monthYear(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", { month: "short", year: "numeric" });
}

export default function ProfileSection() {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        const res = await api.get("/auth/me", { withCredentials: true });
        const raw: Record<string, any> =
          (res?.data && typeof res.data === "object" && "data" in res.data
            ? (res.data as any).data
            : res?.data) ?? {};
        const name =
          (raw.full_name as string) ?? localStorage.getItem("full_name") ?? "Unknown User";
        const role =
          (raw.role as string) ??
          localStorage.getItem("role") ??
          (raw.authorities?.[0] as string) ??
          (raw.userRole as string) ??
          "USER";
        const created =
          (raw.member_since as string) ??
          (raw.createdAt as string) ??
          (raw.created_at as string) ??
          localStorage.getItem("member_since") ??
          new Date().toISOString();

        if (!ignore) {
          setMe({
            id: (raw.user_id as number) ?? (raw.id as number),
            user_id: (raw.user_id as number) ?? (raw.id as number),
            full_name: name,
            email: (raw.email as string) ?? "",
            role,
            member_since: created,
          });
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  const initials = useMemo(() => initialsOf(me?.full_name), [me?.full_name]);

  return (
    <div className="group [perspective:1200px]">
      <Card
        className="
          relative overflow-hidden rounded-3xl border border-white/40 bg-white/70
          shadow-[0_24px_80px_-28px_rgba(2,6,23,0.28)] backdrop-blur-xl
          transition-transform duration-300 group-hover:[transform:rotateX(2deg)_rotateY(-2deg)_translateZ(8px)]
        "
      >
        {/* glow ring */}
        <div className="pointer-events-none absolute inset-0 rounded-3xl
                        [mask-image:radial-gradient(60%_80%_at_50%_-20%,#000_20%,transparent_60%)]
                        before:absolute before:inset-[-2px] before:rounded-[inherit]
                        before:bg-[conic-gradient(from_0deg,theme(colors.sky.400),theme(colors.emerald.400),theme(colors.sky.400))]
                        before:opacity-70 before:blur-[10px]" />
        <div className="pointer-events-none absolute -top-24 -left-20 h-64 w-64 rounded-full blur-3xl bg-sky-400/15" />
        <div className="pointer-events-none absolute -top-28 -right-16 h-64 w-64 rounded-full blur-3xl bg-emerald-400/15" />

        <CardHeader className="relative z-[1] pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-slate-800">
            <UserIcon className="w-5 h-5 text-slate-500" />
            Driver Profile
            <Badge className="ml-2 rounded-full bg-emerald-50 text-emerald-700 border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 mr-1" />
              Verified
            </Badge>
          </CardTitle>
        </CardHeader>

        <CardContent className="relative z-[1] space-y-6">
          {/* identity */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="shadow-sm ring-2 ring-white">
                  <AvatarFallback className="bg-gradient-to-br from-sky-500 to-emerald-500 text-white font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white" />
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-slate-900">
                    {loading ? "Loading…" : me?.full_name ?? "—"}
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 animate-in fade-in" />
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className="bg-gradient-to-r from-emerald-500/15 to-sky-500/15 text-emerald-700 border-emerald-500/20">
                    Premium
                  </Badge>
                  <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-700 border-slate-200">
                    {(me?.role ?? "USER").toString().toUpperCase()}
                  </Badge>
                  <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-800 border-emerald-200">
                    Active
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Basic info */}
          <div
            className="
              grid gap-3 items-stretch
              [grid-template-columns:92px_1fr]       
              sm:[grid-template-columns:108px_1fr]
              pr-2 sm:pr-3
            "
          >
            <InfoTile
              icon={<CalendarClock className="w-4 h-4" />}
              label="Member Since"
              className="px-3 py-2"                   
            >
              <span className="font-semibold leading-tight whitespace-nowrap">
                {loading ? "…" : monthYear(me?.member_since ?? me?.createdAt ?? me?.created_at)}
              </span>
            </InfoTile>

            <InfoTile
              icon={<Mail className="w-4 h-4" />}
              label="Email"
              className="px-4 py-2 mr-2 sm:mr-3"      
            >
              <span className="block truncate pr-1" title={me?.email || ""}>
                {loading ? "…" : me?.email || "—"}
              </span>
            </InfoTile>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function InfoTile({
  icon, label, children, className = "",
}: { icon: React.ReactNode; label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={
      "h-full min-h-[70px] rounded-2xl border border-slate-200/60 " +
      "bg-white/70 backdrop-blur flex flex-col justify-center " + className
    }>
      <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
        {icon} {label}
      </div>
      <div className="mt-0.5 text-base font-semibold text-slate-900 leading-tight">
        {children}
      </div>
    </div>
  );
}


