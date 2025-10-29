"use client";
import React from "react";
import ScrollStack from "../lightswind/scroll-stack";
import { Badge } from "../../components/ui/badge";

export default function Features() {
  const cards = [
    {
      title: "Remote monitoring",
      subtitle: "Control pillars & connectors, alarms, and live sessions.",
      badge: "Ops",
      gradient: "from-slate-800 to-slate-950", 
    },
    {
      title: "Smart scheduling",
      subtitle: "Queue-aware reservations, arrival buffers, and overbooking guard.",
      badge: "Booking",
      gradient: "from-sky-600 to-blue-800", 
    },
    {
      title: "Secure payments",
      subtitle: "Invoices, holds, retries with audit-ready history.",
      badge: "Finance",
      gradient: "from-emerald-600 to-teal-800", 
    },
    {
      title: "Analytics",
      subtitle: "Revenue, utilization, and cost trends in one glance.",
      badge: "Reports",
      gradient: "from-purple-600 to-indigo-800", 
    },
    {
      title: "Driver delight",
      subtitle: "Clean, fast UI on every screen size.",
      badge: "UX",
      gradient: "from-rose-600 to-red-800", 
    },
  ];

  return (
    <section id="features" className="py-16 bg-slate-100 text-slate-900">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="flex items-center justify-center gap-3 mb-3">
          <Badge
            variant="secondary"
            className="rounded-full px-3 py-1 bg-white text-emerald-700 border border-slate-300"
          >
            Features
          </Badge>
          <span className="text-sm text-slate-600">
            Built for clarity, speed, and maintainability
          </span>
        </div>

        <h2 className="text-center text-3xl md:text-4xl font-extrabold tracking-tight">
          Powerful features
        </h2>
        <p className="text-center text-slate-600 mt-2 mb-10">
          Real-time operations, reliable booking, secure payments, and elegant dashboards.
        </p>
      </div>

      <ScrollStack
        cards={cards}
        backgroundColor="bg-slate-100"
        cardHeight="70vh"
        sectionHeightMultiplier={3.3}
        animationDuration="0.6s"
        className="select-none"
      />
    </section>
  );
}