"use client";
import { ThreeDScrollTriggerContainer, ThreeDScrollTriggerRow } from "../lightswind/3d-scroll-trigger";
import { Star } from "lucide-react";

const base = [
  { name: "Nguyen Van An",  title: "Tesla Model 3 Owner",  text: "Quick station search, easy reservations, and automatic payments." , avatar: "https://i.pravatar.cc/64?img=12" },
  { name: "Tran Thi Huong", title: "VinFast VF8 Driver",    text: "Never worry about running out of power. Wide and reliable network.", avatar: "https://i.pravatar.cc/64?img=16" },
  { name: "Le Minh Khoi",   title: "BMW iX Owner",          text: "Scheduling is convenient. Long trips are a breeze.",                 avatar: "https://i.pravatar.cc/64?img=21" },
  { name: "Doan Quoc Bao",  title: "Hyundai Ioniq 5 Owner", text: "Clear pricing, smooth payments, invoices saved automatically.",     avatar: "https://i.pravatar.cc/64?img=28" },
  { name: "Pham Gia Han",   title: "Kia EV6 Owner",         text: "Love the live status and fast updates.",                            avatar: "https://i.pravatar.cc/64?img=47" },
];

function Card({ r }: { r: (typeof base)[number] }) {
  return (
    <div className="min-w-[520px] max-w-[520px] rounded-2xl border bg-white/75 backdrop-blur p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <img src={r.avatar} alt="" className="w-10 h-10 rounded-full border" />
        <div className="font-semibold">{r.name}</div>
        <div className="ml-auto flex text-amber-500">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}</div>
      </div>
      <p className="text-sm text-muted-foreground mt-1">{r.title}</p>
      <p className="mt-3 leading-relaxed">{`“${r.text}”`}</p>
    </div>
  );
}

export default function Testimonials() {
  const rows = [
    [...base, ...base],
    [...base.slice().reverse(), ...base],
  ];

  return (
    <section id="about" className="py-20">
      <div className="container mx-auto max-w-7xl px-4">
        <h2 className="text-center text-3xl md:text-4xl font-extrabold tracking-tight
                       [text-shadow:0_6px_28px_rgba(0,0,0,.35),0_0_22px_rgba(99,102,241,.45)]">
          What customers say
        </h2>
        <p className="text-center text-muted-foreground mb-10">Real experiences from EV drivers.</p>

        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white to-transparent" />

          <ThreeDScrollTriggerContainer className="py-2">
            <ThreeDScrollTriggerRow baseVelocity={2.2} direction={1} className="py-4 will-change-transform">
              {rows[0].map((r, i) => (<div key={`r1-${i}`} className="px-4"><Card r={r} /></div>))}
            </ThreeDScrollTriggerRow>
            <ThreeDScrollTriggerRow baseVelocity={2.0} direction={-1} className="py-4 will-change-transform">
              {rows[1].map((r, i) => (<div key={`r2-${i}`} className="px-4"><Card r={r} /></div>))}
            </ThreeDScrollTriggerRow>
          </ThreeDScrollTriggerContainer>
        </div>
      </div>
    </section>
  );
}
