// src/components/homepage/NotificationModal.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import {
  Bell,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Zap,
  CreditCard,
  Car,
  Info,
  RefreshCcw,
  WifiOff,
  Check,
} from "lucide-react";
import api from "../../api/axios";
import { cn } from "../../lib/utils";

/* =========================
   Types 
========================= */
type NotificationResponse = {
  notificationId: number;
  type: string;          // ví dụ: 'success' | 'warning' | 'info' | 'error' | 'payment' | ...
  message: string;
  isRead: boolean;
  createdAt: string;     // ISO
};

type NotificationType = "success" | "warning" | "info" | "error" | "payment" | "charging" | "reservation" | "vehicle" | "other";

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnreadChange?: (count: number) => void;
  userId?: number;
}

/* =========================
   Helpers
========================= */
const toType = (raw?: string): NotificationType => {
  const t = (raw || "").toLowerCase();
  if (t.includes("success")) return "success";
  if (t.includes("warn") || t.includes("expire")) return "warning";
  if (t.includes("error") || t.includes("fail")) return "error";
  if (t.includes("payment") || t.includes("paid")) return "payment";
  if (t.includes("charge")) return "charging";
  if (t.includes("reserv")) return "reservation";
  if (t.includes("vehicle") || t.includes("car")) return "vehicle";
  if (t.includes("info") || t === "") return "info";
  return "other";
};

const iconOf = (t: NotificationType) => {
  switch (t) {
    case "success": return CheckCircle2;
    case "warning": return AlertTriangle;
    case "error": return AlertTriangle;
    case "payment": return CreditCard;
    case "charging": return Zap;
    case "reservation": return Clock;
    case "vehicle": return Car;
    case "info":
    case "other":
    default: return Info;
  }
};

const colorToken = (t: NotificationType) => {
  switch (t) {
    case "success": return { dot: "bg-emerald-500", chip: "text-emerald-700 bg-emerald-50 border-emerald-200" };
    case "warning": return { dot: "bg-amber-500",  chip: "text-amber-700 bg-amber-50 border-amber-200" };
    case "error":   return { dot: "bg-rose-500",   chip: "text-rose-700 bg-rose-50 border-rose-200" };
    case "payment": return { dot: "bg-cyan-500",   chip: "text-cyan-700 bg-cyan-50 border-cyan-200" };
    case "charging":return { dot: "bg-emerald-500",chip: "text-emerald-700 bg-emerald-50 border-emerald-200" };
    case "reservation": return { dot: "bg-indigo-500", chip: "text-indigo-700 bg-indigo-50 border-indigo-200" };
    case "vehicle": return { dot: "bg-sky-500",    chip: "text-sky-700 bg-sky-50 border-sky-200" };
    case "info":
    case "other":
    default: return { dot: "bg-slate-400", chip: "text-slate-700 bg-slate-50 border-slate-200" };
  }
};

const timeAgo = (iso: string) => {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, Math.floor((now - then) / 1000));
  if (diff < 60) return `${diff}s ago`;
  const m = Math.floor(diff / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
};

/* =========================
   Component
========================= */
const NotificationModal = ({ isOpen, onClose, onUnreadChange, userId: userIdProp }: NotificationModalProps) => {
  const [items, setItems] = useState<NotificationResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [savingIds, setSavingIds] = useState<Set<number>>(new Set());
  const pollerRef = useRef<number | null>(null);

  const userId = useMemo(() => {
    if (typeof userIdProp === "number") return userIdProp;
    const fromLS = Number(localStorage.getItem("userId"));
    return Number.isFinite(fromLS) ? fromLS : undefined;
  }, [userIdProp]);

  const unread = useMemo(() => items.filter(i => !i.isRead).length, [items]);

  const notifyUnread = useCallback((n: number) => {
    try { onUnreadChange?.(n); } catch { /* noop */ }
  }, [onUnreadChange]);

  const fetchAll = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setErr(null);
    try {
      const { data } = await api.get<NotificationResponse[]>(`/notifications/${userId}`, { withCredentials: true });
      setItems(Array.isArray(data) ? data : []);
      notifyUnread((Array.isArray(data) ? data : []).filter(i => !i.isRead).length);
    } catch (e: any) {
      setErr(e?.response?.data?.message || e?.message || "Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  }, [userId, notifyUnread]);

  // Polling nhẹ mỗi 30s khi modal mở
  useEffect(() => {
    if (!isOpen) {
      if (pollerRef.current) {
        window.clearInterval(pollerRef.current);
        pollerRef.current = null;
      }
      return;
    }
    fetchAll();
    pollerRef.current = window.setInterval(fetchAll, 30000) as unknown as number;
    return () => {
      if (pollerRef.current) {
        window.clearInterval(pollerRef.current);
        pollerRef.current = null;
      }
    };
  }, [isOpen, fetchAll]);

  const markOne = useCallback(async (id: number) => {
    // optimistic
    setItems(prev => prev.map(n => n.notificationId === id ? { ...n, isRead: true } : n));
    setSavingIds(s => new Set(s).add(id));
    notifyUnread(Math.max(0, unread - 1));
    try {
      await api.put(`/notifications/read/${id}`, {}, { withCredentials: true });
    } catch {
      // revert on fail
      setItems(prev => prev.map(n => n.notificationId === id ? { ...n, isRead: !n.isRead } : n));
    } finally {
      setSavingIds(s => {
        const next = new Set(s);
        next.delete(id);
        return next;
      });
    }
  }, [notifyUnread, unread]);

  const markAll = useCallback(async () => {
    const unreadIds = items.filter(i => !i.isRead).map(i => i.notificationId);
    if (!unreadIds.length) return;
    // optimistic
    setItems(prev => prev.map(n => ({ ...n, isRead: true })));
    notifyUnread(0);
    try {
      await Promise.all(unreadIds.map(id => api.put(`/notifications/read/${id}`, {}, { withCredentials: true })));
    } catch {
      // reload if any fail
      fetchAll();
    }
  }, [items, fetchAll, notifyUnread]);

  /* =========================
     UI
  ========================== */
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          "max-w-md w-[92vw] max-h-[82vh] overflow-hidden p-0 border border-white/60",
          "bg-white/85 backdrop-blur-2xl",
          "shadow-[0_20px_80px_-28px_rgba(2,6,23,.45)]"
        )}
      >
        <div className="relative">
          {/* Top accent bar */}
          <div className="h-[6px] bg-[linear-gradient(90deg,#0EA5E9_0%,#10B981_100%)]" />
          <DialogHeader className="px-5 sm:px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 grid place-items-center rounded-xl bg-gradient-to-br from-sky-500 to-emerald-500 shadow-lg shadow-cyan-500/30">
                  <Bell className="w-5 h-5 text-white" />
                </div>
                <DialogTitle className="text-lg font-semibold text-slate-900">Notifications</DialogTitle>
                {unread > 0 && (
                  <Badge className="rounded-full bg-sky-600/10 text-sky-700 border-sky-300">{unread}</Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchAll}
                  className="h-8 px-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full"
                >
                  <RefreshCcw className="w-4 h-4 mr-1" /> Refresh
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAll}
                  className="h-8 px-3 text-sky-700 hover:bg-sky-50 rounded-full"
                >
                  Mark all as read
                </Button>
              </div>
            </div>
          </DialogHeader>
        </div>

        <ScrollArea className="h-[52vh] sm:h-[56vh] px-5 sm:px-6 pb-2">
          {/* States */}
          {loading && (
            <div className="space-y-3 py-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="p-4 rounded-2xl border border-slate-200/70 bg-white/70 animate-pulse"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-200" />
                    <div className="flex-1">
                      <div className="h-4 w-40 bg-slate-200 rounded mb-2" />
                      <div className="h-3 w-72 bg-slate-200 rounded mb-1" />
                      <div className="h-3 w-48 bg-slate-200 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && err && (
            <div className="py-10 text-center">
              <div className="mx-auto w-12 h-12 rounded-2xl grid place-items-center bg-rose-50 border border-rose-200 mb-3">
                <WifiOff className="w-6 h-6 text-rose-600" />
              </div>
              <p className="text-sm text-rose-600 font-medium">{err}</p>
              <Button onClick={fetchAll} className="mt-3 rounded-full">Try again</Button>
            </div>
          )}

          {!loading && !err && items.length === 0 && (
            <div className="py-10 text-center">
              <p className="text-sm text-slate-600">No notification.</p>
            </div>
          )}

          {!loading && !err && items.length > 0 && (
            <div className="space-y-3 pb-3">
              {items.map((n) => {
                const kind = toType(n.type);
                const Icon = iconOf(kind);
                const colors = colorToken(kind);
                const unreadDot = !n.isRead ? "ring-2 ring-white" : "opacity-0";
                return (
                  <button
                    key={n.notificationId}
                    onClick={() => (n.isRead ? null : markOne(n.notificationId))}
                    className={cn(
                      "w-full text-left p-4 rounded-2xl border transition-all",
                      "hover:shadow-lg hover:translate-y-[-1px]",
                      n.isRead
                        ? "bg-white/65 border-slate-200/70"
                        : "bg-gradient-to-br from-sky-50/60 via-white to-emerald-50/60 border-sky-200/60 shadow-md"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn("relative w-10 h-10 grid place-items-center rounded-xl border", colors.chip)}>
                        <Icon className="w-5 h-5" />
                        <span className={cn("absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full", colors.dot, unreadDot)} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-slate-900 capitalize">
                            {kind === "other" ? "Notification" : kind}
                          </span>
                          <span className={cn("text-[11px] px-2 py-[2px] rounded-full border", colors.chip)}>
                            {new Date(n.createdAt).toLocaleDateString()}
                          </span>
                          <span className="text-[11px] text-slate-500">{timeAgo(n.createdAt)}</span>
                        </div>
                        <p className={cn("text-sm leading-relaxed", n.isRead ? "text-slate-600" : "text-slate-800")}>
                          {n.message}
                        </p>
                      </div>

                      {!n.isRead && (
                        <span
                          className={cn(
                            "ml-2 mt-1 inline-flex shrink-0 items-center px-2 py-1 text-[11px] font-medium",
                            "rounded-full border border-emerald-300 text-emerald-700 bg-emerald-50"
                          )}
                        >
                          New
                        </span>
                      )}
                    </div>

                    {/* saving indicator */}
                    {savingIds.has(n.notificationId) && (
                      <div className="mt-2 text-[11px] text-slate-500">Updating…</div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <div className="px-5 sm:px-6 py-4 border-t bg-white/70 backdrop-blur">
          <Button variant="outline" className="w-full rounded-full" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NotificationModal;
