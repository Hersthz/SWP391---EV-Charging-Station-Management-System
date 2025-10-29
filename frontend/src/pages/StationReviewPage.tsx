import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Star, MapPin, Send } from "lucide-react";
import { Card, CardContent } from "../components/ui/card"; // Giữ Card làm container
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner"; 
import api from "../api/axios";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../lib/utils"; 


type Me = { id?: number; user_id?: number; full_name?: string };

function StarRating({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  return (
    <div className="flex items-center gap-1.5"> 
      {[1, 2, 3, 4, 5].map((n) => (
        <motion.button
          key={n}
          type="button"
          onClick={() => !disabled && onChange(n)}
          onMouseEnter={() => !disabled && setHoverValue(n)}
          onMouseLeave={() => !disabled && setHoverValue(null)}
          whileHover={{ scale: disabled ? 1 : 1.15 }} 
          whileTap={{ scale: disabled ? 1 : 0.95 }}
          className="p-1 cursor-pointer disabled:cursor-not-allowed"
          aria-label={`rating-${n}`}
          disabled={disabled}
          initial={false} 
          animate={{ 
             color: n <= (hoverValue ?? value) ? "#f59e0b" /* amber-500 */ : "#cbd5e1" /* slate-300 */,
             // fill: n <= (hoverValue ?? value) ? "#fbbf24" /* amber-400 */ : "none" // Dùng fill SVG trực tiếp tốt hơn class
          }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <Star
            className="w-9 h-9" // To hơn
            style={{
              fill: n <= (hoverValue ?? value) ? "#fbbf24" /* amber-400 */ : "transparent"
            }}
          />
        </motion.button>
      ))}
    </div>
  );
}


export default function StationReviewPage() {
  const { stationId } = useParams<{ stationId: string }>();
  const location = useLocation();
  const state = location.state as { stationName?: string; pillarCode?: string } | undefined;
  const navigate = useNavigate();

  const [userId, setUserId] = useState<number | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const me = await api.get<Me>("/auth/me", { withCredentials: true });
        const id = typeof me.data?.id === "number" ? me.data.id : me.data?.user_id;
        if (typeof id !== 'number') throw new Error("No valid user id found");
        setUserId(id);
      } catch (err) {
        console.error("Failed to fetch user:", err);
        toast.error("Please sign in to submit a review.");
        navigate("/login", { replace: true, state: { from: location.pathname } });
      }
    })();
  }, [navigate]); 

  const onSubmit = async () => {
    if (!stationId || !userId) {
       toast.error("User or Station ID missing. Cannot submit.");
       return;
    }
    if (rating < 1 || rating > 5) {
      toast.error("Please select a star rating (1-5).");
      return;
    }
    const trimmedComment = comment.trim();
    if (!trimmedComment) {
      toast.error("Please enter your review comment.");
      return;
    }
    if (trimmedComment.length > 200) {
      toast.error("Review is too long (maximum 200 characters).");
      return;
    }

    setSubmitting(true);
    try {
      await api.post(
        "/reviews/add", 
        {
          stationId: Number(stationId),
          userId,
          rating,
          comment: trimmedComment,
        },
        { withCredentials: true }
      );
      toast.success("Review submitted successfully!", { description: "Thank you for your feedback." });
      navigate("/dashboard"); 
    } catch (e: any) {
      const msg: string = e?.response?.data?.message || e?.response?.data?.error || "Failed to submit review due to a server error.";
      toast.error("Submission Failed", { description: msg });
    } finally {
      setSubmitting(false);
    }
  };

  /* ===================== UI ===================== */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <motion.div
        className="w-full max-w-2xl"
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} 
      >
        <Card className="rounded-3xl shadow-2xl border border-slate-200/70 bg-white overflow-hidden">
          <CardContent className="p-8 md:p-10 space-y-8">
            {/* Header Card */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-600 shadow-lg shadow-cyan-500/30 flex-shrink-0">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-xl font-semibold text-slate-900">Station Review</div>
                  <div className="text-sm text-slate-600 flex items-center flex-wrap gap-x-2 mt-1">
                    <span>{state?.stationName ?? "Charging Station"}</span>
                    {state?.pillarCode && (
                      <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 font-medium rounded-full px-2.5 py-0.5">
                        Port {state.pillarCode}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <Badge variant="outline" className="rounded-full border-slate-300 text-slate-600 px-3 py-1 self-start">
                Station #{stationId}
              </Badge>
            </div>

            {/* Khu vực Rating */}
            <div className="space-y-3">
              <div className="text-base font-semibold text-slate-800">Your Rating</div>
              <StarRating value={rating} onChange={setRating} disabled={submitting} />
            </div>

            {/* Khu vực Text Area */}
            <div className="space-y-3">
              <div className="text-base font-semibold text-slate-800">Your Review</div>
              <div className="relative">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={5}
                  maxLength={200}
                  className="w-full bg-slate-100 rounded-xl p-4 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-400 resize-none transition duration-200"
                  placeholder="Share details of your own experience at this station…"
                  disabled={submitting}
                />
                <div className={cn(
                  "absolute bottom-3 right-3 text-xs font-medium",
                  comment.length > 190 ? "text-red-500" : "text-slate-400"
                  )}>
                    {comment.length}/200
                 </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-2">
              <Button
                 variant="ghost"
                 onClick={() => navigate(-1)}
                 disabled={submitting}
                 className="text-slate-600 hover:bg-slate-100 h-11 px-6"
              >
                Cancel
              </Button>
              <Button
                 onClick={onSubmit}
                 disabled={submitting || !userId}
                 className="h-11 px-6 text-base font-semibold text-white bg-gradient-to-r from-emerald-500 to-cyan-600 hover:brightness-110 shadow-lg shadow-cyan-500/30 group relative overflow-hidden"
                 aria-busy={submitting}
              >
                 <motion.span
                    className="inline-block mr-2"
                    animate={{ x: submitting ? [0, -2, 2, 0] : 0 }}
                    transition={{ repeat: submitting ? Infinity : 0, duration: 0.5 }}
                 >
                    <Send className="w-4 h-4" />
                 </motion.span>
                 {submitting ? "Submitting…" : "Submit Review"}
                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out"/>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}