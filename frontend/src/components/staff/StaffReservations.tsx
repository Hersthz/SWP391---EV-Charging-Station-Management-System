// src/pages/StaffReservations.tsx
import { JSX, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import StaffLayout from "./StaffLayout";
import api from "../../api/axios";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { CalendarClock, PlugZap, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

/* ===== Types (khớp BE) ===== */
type ReservationResponse = {
  reservationId?: number;
  stationId?: number;
  stationName?: string;
  pillarId?: number;
  connectorId?: number;
  status?: string;
  holdFee?: number;
  startTime?: string;
  endTime?: string;
  createdAt?: string;
  expiredAt?: string;
};
type ListResponse<T> = { code?: string; message?: string; data?: T } | T;

/* ===== Helpers ===== */
const STATUS_STYLE: Record<
  string,
  { badge: string; icon?: JSX.Element }
> = {
  PENDING: {
    badge: "bg-slate-100 text-slate-700 border-slate-200",
    icon: <CalendarClock className="w-3.5 h-3.5 mr-1" />,
  },
  SCHEDULED: {
    badge: "bg-sky-100 text-sky-700 border-sky-200",
    icon: <CalendarClock className="w-3.5 h-3.5 mr-1" />,
  },
  VERIFYING: {
    badge: "bg-blue-100 text-blue-700 border-blue-200",
  },
  VERIFIED: {
    badge: "bg-cyan-100 text-cyan-700 border-cyan-200",
  },
  PLUGGED: {
    badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: <PlugZap className="w-3.5 h-3.5 mr-1" />,
  },
  CANCELLED: {
    badge: "bg-amber-100 text-amber-700 border-amber-200",
    icon: <AlertTriangle className="w-3.5 h-3.5 mr-1" />,
  },
  EXPIRED: {
    badge: "bg-rose-100 text-rose-700 border-rose-200",
    icon: <XCircle className="w-3.5 h-3.5 mr-1" />,
  },
  COMPLETED: {
    badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
    icon: <CheckCircle2 className="w-3.5 h-3.5 mr-1" />,
  },
};

const fmtDT = (iso?: string) =>
  iso ? new Date(iso).toLocaleString() : "—";
const vnd = (n?: number) =>
  typeof n === "number" ? n.toLocaleString("vi-VN") + " đ" : "—";

/* ===== Page ===== */
export default function StaffReservations() {
  const navigate = useNavigate();
  const [stationId, setStationId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<ReservationResponse[]>([]);
  const [error, setError] = useState<string | null>(null);

  // filters
  const [status, setStatus] = useState<string>("ALL");
  const [q, setQ] = useState<string>("");

  // Find stationId by current staff 
  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setError(null);

        const meRes = await api.get("/auth/me", { signal: controller.signal });
        const me = meRes.data;
        const userId =
          me?.user_id ?? me?.id ?? me?.userId ?? Number(localStorage.getItem("userId"));
        if (!userId) throw new Error("Không tìm thấy userId từ /auth/me");

        const res = await api.get(`/station-managers/${userId}`, { signal: controller.signal });
        const raw = res.data?.data ?? res.data;

        let st: any = null;
        if (Array.isArray(raw)) {
          if (raw.length === 0) {
            setStationId(null);
            return;
          }
          const first = raw[0];
          st = first.station ?? first.stationDto ?? first;
        } else {
          st = raw.station ?? raw.stationDto ?? raw;
        }
        const sid = st?.id ?? st?.stationId;
        setStationId(sid ?? null);

        if (sid) {
          // fetch reservations of this station
          const rv = await api.get<ListResponse<ReservationResponse[]>>(`/book/station/${sid}`, {
            signal: controller.signal,
          });
          const list = Array.isArray((rv as any).data?.data)
            ? ((rv as any).data.data as ReservationResponse[])
            : Array.isArray(rv.data)
            ? (rv.data as ReservationResponse[])
            : [];
          setRows(list);
        } else {
          setRows([]);
        }
      } catch (err: any) {
        if (err?.code === "ERR_CANCELED") return;
        console.error("StaffReservations err:", err);
        if (err?.response?.status === 401) {
          localStorage.clear();
          navigate("/login");
        } else {
          setError(err?.message ?? "Request failed");
        }
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [navigate]);

  // KPI summary
  const kpi = useMemo(() => {
    const total = rows.length;
    const by = (s: string) => rows.filter((r) => (r.status || "").toUpperCase() === s).length;
    return {
      total,
      scheduled: by("SCHEDULED"),
      plugged: by("PLUGGED"),
      cancelled: by("CANCELLED"),
      expired: by("EXPIRED"),
    };
  }, [rows]);

  // Filtering
  const filtered = useMemo(() => {
    const upper = q.trim().toUpperCase();
    return rows.filter((r) => {
      const okStatus = status === "ALL" || (r.status || "").toUpperCase() === status;
      if (!okStatus) return false;
      if (!upper) return true;
      const key = `${r.pillarId ?? ""} ${r.connectorId ?? ""} ${r.status ?? ""}`.toUpperCase();
      return key.includes(upper);
    });
  }, [rows, status, q]);

  return (
    <StaffLayout
      title="Reservations"
      actions={
        stationId ? (
          <Badge variant="secondary" className="rounded-full">
            Station ID: {stationId}
          </Badge>
        ) : null
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        <KpiCard label="Total" value={kpi.total} />
        <KpiCard label="Scheduled" value={kpi.scheduled} color="text-sky-600" />
        <KpiCard label="Plugged" value={kpi.plugged} color="text-emerald-600" />
        <KpiCard label="Cancelled/Expired" value={kpi.cancelled + kpi.expired} color="text-rose-600" />
      </div>

      <Card className="bg-white/80 backdrop-blur-md border border-white/50 shadow-2xl shadow-slate-900/15">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl font-bold text-slate-900">Reservation List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mb-4">
            <div className="flex gap-3">
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All status</SelectItem>
                  {Object.keys(STATUS_STYLE).map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search pillar/connector/status…"
                className="w-[260px]"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {filtered.length} / {rows.length} shown
            </div>
          </div>

          {loading ? (
            <div className="p-6 text-sm text-muted-foreground">Loading…</div>
          ) : error ? (
            <div className="p-6 text-sm text-destructive">Failed to load ({error}).</div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">No reservations found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-b-slate-300 hover:bg-transparent">
                  <TableHead className="w-[100px] font-semibold text-slate-900">#ID</TableHead>
                  <TableHead className="w-[100px] font-semibold text-slate-900">Pillar</TableHead>
                  <TableHead className="w-[120px] font-semibold text-slate-900">Connector</TableHead>
                  <TableHead className="w-[160px] font-semibold text-slate-900">Hold Fee</TableHead>
                  <TableHead className="font-semibold text-slate-900">Start</TableHead>
                  <TableHead className="font-semibold text-slate-900">End</TableHead>
                  <TableHead className="w-[140px] font-semibold text-slate-900">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => {
                  const S = (r.status || "").toUpperCase();
                  const sStyle = STATUS_STYLE[S] || STATUS_STYLE.PENDING;
                  return (
                    <TableRow key={r.reservationId} className="border-b-slate-200/80 hover:bg-slate-50/50">
                      <TableCell className="font-semibold text-slate-900">{r.reservationId}</TableCell>
                      <TableCell className="text-slate-800">{r.pillarId ?? "—"}</TableCell>
                      <TableCell className="text-slate-800">{r.connectorId ?? "—"}</TableCell>
                      <TableCell className="text-slate-800">{vnd(r.holdFee as any)}</TableCell>
                      <TableCell className="text-slate-800">{fmtDT(r.startTime)}</TableCell>
                      <TableCell className="text-slate-800">{fmtDT(r.endTime)}</TableCell>
                      <TableCell>
                        <Badge className={`${sStyle.badge} rounded-full`}>
                          {sStyle.icon}
                          {S || "—"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </StaffLayout>
  );
}

/* === Small KPI card === */
function KpiCard({ label, value, color = "text-slate-900" }: { label: string; value: number; color?: string }) {
  return (
    <Card className="bg-white/80 backdrop-blur-md border border-white/50 shadow-xl">
      <CardContent className="py-4">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={`text-3xl font-extrabold ${color}`}>{value}</div>
      </CardContent>
    </Card>
  );
}
