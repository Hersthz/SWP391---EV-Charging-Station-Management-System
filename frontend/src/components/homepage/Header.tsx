"use client";
import { useEffect, useMemo, useState } from "react";
import { Menu, X, Zap, LogIn, Map, Gauge, Sparkles, Info } from "lucide-react"; 
import { Button } from "../ui/button";
import { DynamicNavigation } from "../lightswind/dynamic-navigation";

const SECTIONS = ["features", "map", "about"] as const; 
type SectionId = typeof SECTIONS[number];

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [active, setActive] = useState<SectionId>("features");

  const links = useMemo(
    () => [
      { id: "features", label: "Features", href: "#features", icon: <Gauge className="w-4 h-4" /> },
      { id: "map",      label: "Map",      href: "#map",      icon: <Map className="w-4 h-4" /> },
      { id: "about",    label: "About",    href: "#about",    icon: <Info className="w-4 h-4" /> },
    ],
    []
  );

  // Scroll-spy
  useEffect(() => {
    const nodes = SECTIONS.map((id) => document.getElementById(id));
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => Math.abs(a.boundingClientRect.top) - Math.abs(b.boundingClientRect.top));
        if (visible[0]) setActive(visible[0].target.id as SectionId);
      },
      { rootMargin: "-35% 0px -55% 0px", threshold: 0.01 }
    );
    nodes.forEach((n) => n && io.observe(n));
    return () => io.disconnect();
  }, []);

  const smoothGoto = (hash: string) => {
    const id = hash.replace("#", "");
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <header
      className="
        fixed top-0 inset-x-0 z-50
        border-b border-white/10
        bg-[radial-gradient(1200px_220px_at_30%_-80px,rgba(56,189,248,.25),rgba(16,185,129,.15)_35%,transparent_70%)]
        bg-slate-900/40
        backdrop-blur-2xl
        supports-[backdrop-filter]:bg-slate-900/35
        shadow-[0_10px_40px_rgba(0,0,0,0.35)]
      "
    >
      <div className="pointer-events-none absolute inset-x-6 -bottom-px h-px bg-gradient-to-r from-cyan-300/60 via-white/70 to-emerald-300/60 blur-[1px]" />
      <div className="container mx-auto max-w-7xl px-4 h-16 grid grid-cols-3 items-center">
        {/* Brand */}
        <div className="flex justify-start">
          <a href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 grid place-items-center text-white shadow-[0_12px_45px_rgba(16,185,129,0.55)] ring-1 ring-white/40">
                <Zap className="w-5 h-5 drop-shadow-[0_2px_6px_rgba(255,255,255,.45)]" />
              </div>
              <Sparkles className="absolute -bottom-1 -right-1 w-3.5 h-3.5 text-emerald-400 opacity-95" />
            </div>
            <div className="leading-tight hidden lg:block">
              <span className="text-[1.25rem] font-extrabold tracking-tight text-white drop-shadow-[0_2px_12px_rgba(255,255,255,.45)]">
                ChargeHub
              </span>
              <div className="text-xs text-cyan-100/90 -mt-0.5">secure & real-time</div>
            </div>
          </a>
        </div>

        {/* Center Nav */}
        <div className="hidden md:flex justify-center">
          <div
            className="
              relative rounded-full p-[2px]
              bg-[conic-gradient(from_180deg_at_50%_50%,rgba(255,255,255,.65),rgba(148,245,229,.9),rgba(59,130,246,.85),rgba(255,255,255,.65))]
              shadow-[0_10px_30px_rgba(34,211,238,.25)]
            "
          >
            <div className="absolute inset-0 -z-10 rounded-full blur-md bg-cyan-300/25" />
            <span className="pointer-events-none absolute inset-0 rounded-full overflow-hidden">
              <span className="absolute -left-1/3 top-0 h-full w-1/3 rotate-12 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,.9),transparent)] animate-navShine" />
            </span>

            {/* width nhẹ để 3 mục trông đều nhau */}
            <div
              className="
                rounded-full
                bg-white/25 backdrop-blur-xl
                ring-1 ring-white/70
                shadow-[inset_0_1px_0_rgba(255,255,255,.7),0_8px_28px_rgba(0,0,0,.25)]
                w-[420px]  /* <-- đảm bảo bố cục cân đối cho 3 tab */
            "
            >
              <DynamicNavigation
                links={links}
                activeId={active}
                glowIntensity={10}
                showLabelsOnMobile
                className="!bg-transparent !rounded-full"
                highlightColor="rgba(255,255,255,0.45)"
                onLinkClick={(id) => smoothGoto(`#${id}`)}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2">
          <Button
            onClick={() => (window.location.href = "/login")}
            className="
              gap-2 rounded-full text-white
              bg-gradient-to-r from-emerald-400 via-cyan-400 to-sky-500
              ring-1 ring-white/60
              shadow-[0_10px_30px_rgba(56,189,248,.45)]
              hover:brightness-110 transition-all hidden sm:flex
            "
          >
            <LogIn className="w-4 h-4" />
            Login
          </Button>

          {/* Mobile toggle */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-md text-white/90 hover:bg-white/20 ring-1 ring-white/40 transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile sheet */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-white/20 bg-white/20 backdrop-blur-xl">
          <nav className="flex flex-col gap-4 p-4">
            {links.map((l) => (
              <a
                key={l.id}
                href={l.href}
                className={`flex items-center gap-2 text-white/90 hover:text-white transition-colors ${
                  active === l.id ? "font-semibold text-white" : ""
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  setIsMenuOpen(false);
                  smoothGoto(l.href);
                }}
              >
                {l.icon}
                {l.label}
              </a>
            ))}
            <div className="flex gap-2 pt-3 border-t border-white/20">
              <Button
                variant="outline"
                size="sm"
                onClick={() => (window.location.href = "/login")}
                className="w-full text-white border-white/60 hover:bg-white/15 hover:text-white"
              >
                Login
              </Button>
              <Button
                size="sm"
                onClick={() => (window.location.href = "/register")}
                className="w-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-sky-500 text-white hover:brightness-110 ring-1 ring-white/60"
              >
                Register
              </Button>
            </div>
          </nav>
        </div>
      )}

      <style>{`
        @keyframes navShine {
          0% { transform: translateX(-120%) rotate(12deg); opacity: .0; }
          40% { opacity: .45; }
          60% { opacity: .45; }
          100% { transform: translateX(280%) rotate(12deg); opacity: 0; }
        }
        .animate-navShine {
          animation: navShine 3.2s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-navShine { animation: none !important; }
        }
      `}</style>
    </header>
  );
}
