// src/pages/session/SessionVoucher.tsx
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { useToast } from "../../hooks/use-toast";
import { ArrowLeft, Gift, TicketPercent, Loader2 } from "lucide-react";

type UserVoucher = {
  userVoucherId: number;
  code: string;
  name: string;
  discountType: "AMOUNT" | "PERCENT";
  discountValue: number;
  minAmount?: number;
  maxDiscount?: number;
  status?: "NEW" | "USED" | "EXPIRED";
  expireAt?: string | null;
};

const fmtVnd = (n: number) => `${Math.round(n || 0).toLocaleString("vi-VN")} đ`;
const fmtDate = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString() : "—");

export default function SessionVoucher() {
  const nav = useNavigate();
  const { toast } = useToast();
  const state = (useLocation().state || {}) as {
    returnTo?: string;
    sessionId?: number;
    amount?: number;
    tab?: string;
  };

  const sessionId = Number(state.sessionId || 0);
  const returnTo = state.returnTo || "/dashboard";

  const [loading, setLoading] = useState(true);
  const [list, setList] = useState<UserVoucher[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const me = await api.get("/auth/me", { withCredentials: true });
        const userId =
          me?.data?.id ??
          me?.data?.data?.id ??
          me?.data?.user?.id;
        if (!userId) throw new Error("Không xác định được userId từ /auth/me");

        const { data } = await api.get(`/api/vouchers/user/${userId}`, {
          withCredentials: true,
        });
        // ====================================================================

        const arr =
          Array.isArray(data?.data) ? data.data :
          Array.isArray(data?.content) ? data.content :
          Array.isArray(data) ? data : [];

        const mapped: UserVoucher[] = arr.map((x: any, idx: number) => {
          // cố gắng tìm id từ các khả năng khác nhau
          const rawId =
            x?.userVoucherId ?? x?.id ?? x?.user_voucher_id ?? x?.userVoucherID ?? null;
          const safeId = Number.isFinite(Number(rawId)) ? Number(rawId) : idx + 1;

          return {
            userVoucherId: safeId,
            code: String(x?.code ?? x?.voucher?.code ?? x?.voucherCode ?? "").toUpperCase(),
            name: String(x?.name ?? x?.voucher?.name ?? "Voucher"),
            discountType: String(x?.discountType ?? x?.type ?? "AMOUNT").toUpperCase() as any,
            // backend của bạn đang dùng discountAmount
            discountValue: Number(x?.discountAmount ?? x?.voucher?.discountAmount ?? x?.value ?? x?.amount ?? 0),
            minAmount: x?.minAmount ?? x?.minOrder ?? undefined,
            maxDiscount: x?.maxDiscount ?? x?.cap ?? undefined,
            status: String(x?.status ?? (x?.used ? "USED" : "NEW")).toUpperCase() as any,
            expireAt: x?.expireAt ?? x?.expiredAt ?? x?.endDate ?? x?.voucher?.endDate ?? null,
          };
        });
        setList(mapped);
      } catch (e: any) {
        const msg = e?.response?.data?.message || e?.message || "Không tải được danh sách voucher.";
        setList([]);
        toast({ title: "Load vouchers failed", description: msg, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  const apply = (uv: UserVoucher) => {
    if (!sessionId) {
      toast({
        title: "Thiếu sessionId",
        description: "Trang này nên mở từ Receipt/Payment.",
        variant: "destructive",
      });
      return;
    }
    const packed = {
      type: "USER_VOUCHER",
      userVoucherId: uv.userVoucherId,
      code: uv.code,
      discountType: uv.discountType,
      discountValue: uv.discountValue,
      minAmount: uv.minAmount,
      maxDiscount: uv.maxDiscount,
      name: uv.name,
    };
    localStorage.setItem(`apply_voucher_session_${sessionId}`, JSON.stringify(packed));
    toast({ title: "Đã chọn voucher", description: `${uv.name} (${uv.code})` });
    nav(returnTo, { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-sky-50">
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <Button variant="ghost" onClick={() => nav(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-emerald-500 text-white flex items-center justify-center">
              <TicketPercent className="w-4 h-4" />
            </div>
            <span className="text-lg font-semibold">My Vouchers</span>
          </div>
          <div />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <Card className="bg-white/80 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-primary" />
              Choose voucher
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-sm text-slate-500 flex items-center">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading…
              </div>
            ) : list.length === 0 ? (
              <div className="p-6 text-sm text-slate-500">No voucher available</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {list.map((v, idx) => {
                  const disabled = v.status !== "NEW";
                  return (
                    <Card key={`${v.userVoucherId}-${v.code}-${idx}`} className="border">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="truncate">{v.name}</CardTitle>
                          <Badge variant="outline">{v.code}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="text-sm">
                          {v.discountType === "PERCENT" ? `${v.discountValue}%` : fmtVnd(v.discountValue)}
                          {v.maxDiscount ? (
                            <span className="text-slate-500"> · Max {fmtVnd(v.maxDiscount)}</span>
                          ) : null}
                        </div>
                        {v.minAmount ? (
                          <div className="text-xs text-slate-500">Min order: {fmtVnd(v.minAmount)}</div>
                        ) : null}
                        {v.expireAt ? (
                          <div className="text-xs text-slate-500">Exp: {fmtDate(v.expireAt)}</div>
                        ) : null}
                        <div className="pt-2">
                          <Button className="w-full" onClick={() => apply(v)} disabled={disabled}>
                            Apply now
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
