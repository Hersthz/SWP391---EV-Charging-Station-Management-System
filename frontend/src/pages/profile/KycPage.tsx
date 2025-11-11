// src/pages/KycPage.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Shield,
  ShieldCheck,
  IdCard,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Loader2,
  XCircle,
  Timer,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { useToast } from "../../hooks/use-toast";
import api from "../../api/axios";

/* ===== Types ===== */
type KycStatus = "PENDING" | "APPROVED" | "REJECTED";
type Step = "form" | "result";
type FilePick = { file: File; preview: string };

type ApiResponse<T> = { code: string; message: string; data: T };
type KycSubmission = {
  id: number;
  frontImageUrl: string;
  backImageUrl: string;
  status: string;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
};

const SS_KEY = "kycSubmissionInit";

/* ===== Helper: upload file -> URL ===== */
async function uploadToStorage(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  // optional: folder=kyc
  fd.append("folder", "kyc");

  const res = await api.post<ApiResponse<string>>("/api/upload", fd, {
    withCredentials: true,
    headers: { "Content-Type": "multipart/form-data" },
  });

  // Backend trả ApiResponse<String> với url nằm ở data
  const anyRes: any = res?.data;
  const url =
    anyRes?.data ||
    anyRes?.url ||
    anyRes?.secureUrl ||
    anyRes?.secure_url;

  if (!url || typeof url !== "string") {
    throw new Error(anyRes?.message || "Upload failed: no URL returned");
  }
  return String(url);
}

/* ---------------------------
   Page
---------------------------- */
export default function KycPage() {
  const nav = useNavigate();
  const loc = useLocation();
  const { toast } = useToast();

  // Step state (form/result)
  const fromResult = useMemo(() => (loc.state as any)?.fromResult === true, [loc.state]);
  const [step, setStep] = useState<Step>(fromResult ? "result" : "form");

  // Form state
  const [front, setFront] = useState<FilePick | null>(null);
  const [back, setBack] = useState<FilePick | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Result state
  const [status, setStatus] = useState<KycStatus | "UNKNOWN">("UNKNOWN");
  const [submittedAt, setSubmittedAt] = useState<string | undefined>();

  // Restore previews if user quay lại
  useEffect(() => {
    const raw = sessionStorage.getItem(SS_KEY);
    if (!raw) return;
    try {
      const v = JSON.parse(raw);
      if (v?.frontPreview) setFront({ file: {} as any, preview: v.frontPreview });
      if (v?.backPreview) setBack({ file: {} as any, preview: v.backPreview });
      if (v?.submittedAt) setSubmittedAt(v.submittedAt);
      if (fromResult) setStatus((v?.lastStatus as KycStatus) ?? "PENDING");
    } catch {}
  }, [fromResult]);

  const canSubmit = !!front?.preview && !!back?.preview;

  const onPick =
    (side: "front" | "back") => (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (!f) return;
      if (!f.type.startsWith("image/")) {
        setErr("Please select an image file");
        return;
      }
      if (f.size > 8 * 1024 * 1024) {
        setErr("File too large (max 8MB).");
        return;
      }
      const preview = URL.createObjectURL(f);
      const obj = { file: f, preview };
      if (side === "front") setFront(obj);
      else setBack(obj);
      setErr(null);
      sessionStorage.setItem(
        SS_KEY,
        JSON.stringify({
          frontPreview: side === "front" ? preview : front?.preview ?? null,
          backPreview: side === "back" ? preview : back?.preview ?? null,
          submittedAt,
          lastStatus: status,
        })
      );
    };

  const onSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setErr(null);
    try {
      // get user id
      const me = await api.get("/auth/me", { withCredentials: true });
      const userId =
        typeof me.data?.user_id === "number"
          ? me.data.user_id
          : typeof me.data?.id === "number"
          ? me.data.id
          : undefined;
      if (!userId) throw new Error("Cannot determine user id");

      // Require actual File object
      if (!front?.file || !back?.file || !(front.file as any).size || !(back.file as any).size) {
        throw new Error("Please reselect the images before submitting.");
      }

      // === Upload file -> URL  ===
      const [frontUrl, backUrl] = await Promise.all([
        uploadToStorage(front.file),
        uploadToStorage(back.file),
      ]);
      if (!frontUrl || !backUrl) {
        throw new Error("Upload failed: no URL returned");
      }

      // Submit với URL
      const { data } = await api.post<ApiResponse<KycSubmission>>(
        "/kyc/submit",
        {
          userId,
          frontImageUrl: frontUrl,
          backImageUrl: backUrl,
        },
        { withCredentials: true }
      );

      const kyc = data?.data;
      const submittedAtIso = kyc?.createdAt;

      // Lưu preview = URL đã upload để hiển thị lại
      sessionStorage.setItem(
        SS_KEY,
        JSON.stringify({
          frontPreview: frontUrl,
          backPreview: backUrl,
          submittedAt: submittedAtIso,
          lastStatus: (kyc?.status || "PENDING") as KycStatus,
        })
      );

      setSubmittedAt(submittedAtIso);
      setStatus(((kyc?.status || "PENDING") as KycStatus) ?? "PENDING");
      setStep("result");

      toast({
        title: "KYC submitted",
        description: data?.message || "Your verification is pending review.",
      });
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Submission failed.";
      setErr(msg);
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------------------------------
     UI: Header
  ----------------------------------*/
  const Header = (
    <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur">
      <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
        <Link to="/dashboard" className="inline-flex">
          <Button variant="ghost" size="sm" className="hover:bg-sky-50">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm bg-gradient-to-br from-sky-500 to-emerald-500">
            <IdCard className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-semibold bg-gradient-to-r from-sky-600 to-emerald-600 bg-clip-text text-transparent">
            Identity Verification (KYC)
          </span>
        </div>

        <Badge variant="outline" className="px-3 py-2 gap-2">
          <Shield className="h-4 w-4 text-primary" />
          Secured
        </Badge>
      </div>
    </header>
  );

  /* ---------------------------------
     UI: Form
  ----------------------------------*/
  const FormView = (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      <Card className="shadow-electric border-0 bg-gradient-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-sky-100">
                <UploadCloud className="h-6 w-6 text-sky-600" />
              </div>
              <div>
                <CardTitle className="text-2xl">Upload your ID</CardTitle>
                <CardDescription>Front & back images of your ID document</CardDescription>
              </div>
            </div>
            <div className="text-right hidden sm:block">
              <div className="text-sm text-slate-600">Review time</div>
              <div className="text-3xl font-extrabold bg-gradient-to-r from-sky-600 to-emerald-600 bg-clip-text text-transparent">
                ~24h
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Front */}
            <div className="p-4 bg-white/60 rounded-xl border">
              <div className="text-sm text-muted-foreground mb-2">Front side</div>
              {front?.preview ? (
                <img src={front.preview} alt="front" className="w-full rounded-lg border" />
              ) : (
                <div className="h-40 rounded-lg border-2 border-dashed flex items-center justify-center text-muted-foreground">
                  No file selected
                </div>
              )}
              <div className="mt-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={onPick("front")}
                  className="block w-full text-sm"
                />
              </div>
            </div>

            {/* Back */}
            <div className="p-4 bg-white/60 rounded-xl border">
              <div className="text-sm text-muted-foreground mb-2">Back side</div>
              {back?.preview ? (
                <img src={back.preview} alt="back" className="w-full rounded-lg border" />
              ) : (
                <div className="h-40 rounded-lg border-2 border-dashed flex items-center justify-center text-muted-foreground">
                  No file selected
                </div>
              )}
              <div className="mt-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={onPick("back")}
                  className="block w-full text-sm"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-sm">
              <ShieldCheck className="w-4 h-4" />
              <span>Your data is encrypted and securely stored.</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4" />
              <span>Only admins can review and approve your KYC.</span>
            </div>
          </div>

          {err && (
            <div className="mt-2 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-700">
              <AlertCircle className="mt-0.5 h-5 w-5" />
              <div className="text-sm">{err}</div>
            </div>
          )}

          <Button
            onClick={onSubmit}
            disabled={!canSubmit || submitting}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 text-white hover:opacity-90"
          >
            {submitting ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Submitting…
              </span>
            ) : (
              "Submit for Review"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  /* ---------------------------------
     UI: Result
  ----------------------------------*/
  const ok = status === "APPROVED";
  const rejected = status === "REJECTED";

  const ResultView = (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      <Card className="border-sky-200/60 bg-white/80 backdrop-blur">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            {ok ? (
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow bg-gradient-to-br from-emerald-500 to-sky-500">
                <CheckCircle2 className="w-7 h-7 text-white" />
              </div>
            ) : rejected ? (
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow bg-gradient-to-br from-rose-500 to-orange-500">
                <XCircle className="w-7 h-7 text-white" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow bg-gradient-to-br from-sky-500 to-emerald-500">
                <Timer className="w-7 h-7 text-white" />
              </div>
            )}
            <div>
              <CardTitle
                className={`text-2xl ${
                  ok ? "text-emerald-700" : rejected ? "text-rose-700" : "text-sky-700"
                }`}
              >
                {ok ? "KYC Approved" : rejected ? "KYC Rejected" : "KYC Pending"}
              </CardTitle>
              <CardDescription className="mt-1">
                {ok
                  ? "Your identity has been verified successfully."
                  : rejected
                  ? "Your submission was rejected. Please resubmit with clear photos."
                  : "Your submission is under review. We’ll notify you when it’s done."}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border bg-white/60">
              <div className="text-xs text-muted-foreground">Status</div>
              <div
                className={`font-bold ${
                  ok ? "text-emerald-600" : rejected ? "text-rose-600" : "text-sky-600"
                }`}
              >
                {status}
              </div>
            </div>
            <div className="p-4 rounded-xl border bg-white/60">
              <div className="text-xs text-muted-foreground">Submitted at</div>
              <div className="font-bold">
                {submittedAt ? new Date(submittedAt).toLocaleString() : "—"}
              </div>
            </div>
            <div className="p-4 rounded-xl border bg-white/60">
              <div className="text-xs text-muted-foreground">Next action</div>
              <div className="font-bold">
                {ok ? "Start booking & charging" : rejected ? "Resubmit KYC" : "Please wait"}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link to="/profile">
              <Button className="w-full h-11 rounded-xl" variant="outline">
                Back to Profile
              </Button>
            </Link>

          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-200 via-emerald-100 to-emerald-200">
      {Header}
      {step === "form" ? FormView : ResultView}
    </div>
  );
}
