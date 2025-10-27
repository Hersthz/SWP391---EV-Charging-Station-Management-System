import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Star, MapPin, Send } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { useToast } from "../hooks/use-toast";
import api from "../api/axios";

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
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => !disabled && onChange(n)}
          className="p-1"
          aria-label={`rating-${n}`}
        >
          <Star
            className={[
              "w-7 h-7",
              n <= value ? "fill-yellow-400 text-yellow-500" : "text-slate-300",
            ].join(" ")}
          />
        </button>
      ))}
    </div>
  );
}

export default function StationReviewPage() {
  const { stationId } = useParams<{ stationId: string }>();
  const { state } = useLocation() as { state?: { stationName?: string; pillarCode?: string } };
  const navigate = useNavigate();
  const { toast } = useToast();

  const [userId, setUserId] = useState<number | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const me = await api.get<Me>("/auth/me", { withCredentials: true });
        const id = typeof me.data?.user_id === "number" ? me.data.user_id : me.data?.id;
        if (!id) throw new Error("No user id");
        setUserId(id);
      } catch {
        toast({ title: "Please sign in", variant: "destructive" });
        navigate("/login", { replace: true, state: { redirect: location.pathname } as any });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async () => {
    if (!stationId || !userId) return;
    if (rating < 1 || rating > 5) {
      toast({
        title: "Pick a star rating",
        description: "Please choose between 1 and 5 stars.",
        variant: "destructive",
      });
      return;
    }
    if (!comment.trim()) {
      toast({
        title: "Enter a review",
        description: "Review cannot be empty.",
        variant: "destructive",
      });
      return;
    }
    if (comment.length > 200) {
      toast({
        title: "Review too long",
        description: "Maximum 200 characters.",
        variant: "destructive",
      });
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
          comment: comment.trim(),
        },
        { withCredentials: true }
      );
      toast({ title: "Review submitted", description: "Thanks for sharing!" });
      navigate("/dashboard");
    } catch (e: any) {
      const msg: string =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        "Failed to submit review.";
      toast({ title: "Submission failed", description: msg, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-6 py-8">
      <Card className="rounded-2xl border-primary/20">
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="font-semibold">Station Review</div>
                <div className="text-sm text-muted-foreground">
                  {state?.stationName ?? "Charging Station"}{" "}
                  {state?.pillarCode ? (
                    <Badge variant="secondary" className="ml-2 rounded-full">
                      Port {state.pillarCode}
                    </Badge>
                  ) : null}
                </div>
              </div>
            </div>
            <Badge variant="outline" className="rounded-full">
              Station #{stationId}
            </Badge>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Rating</div>
            <StarRating value={rating} onChange={setRating} />
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Review (max 200 characters)</div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={5}
              maxLength={200}
              className="w-full border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Share your charging experience…"
            />
            <div className="text-xs text-muted-foreground text-right">{comment.length}/200</div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button onClick={onSubmit} disabled={submitting || !userId}>
              <Send className="w-4 h-4 mr-2" />
              {submitting ? "Submitting…" : "Submit Review"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
