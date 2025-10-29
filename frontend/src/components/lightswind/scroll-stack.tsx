"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "../../lib/utils";

export interface ScrollStackCard {
  title: string;
  subtitle?: string;
  badge?: string;
  gradient?: string;
  content?: React.ReactNode;
}

interface ScrollStackProps extends React.HTMLAttributes<HTMLDivElement> {
  cards?: ScrollStackCard[];
  backgroundColor?: string;
  cardHeight?: string;
  animationDuration?: string;
  sectionHeightMultiplier?: number;
  intersectionThreshold?: number;
}

const ScrollStack: React.FC<ScrollStackProps> = ({
  cards = [],
  backgroundColor = "bg-background",
  cardHeight = "70vh", 
  animationDuration = "0.6s",
  sectionHeightMultiplier = 3.3,
  intersectionThreshold = 0.1,
  className,
  ...rest
}) => {
  const safeCards = useMemo(() => (Array.isArray(cards) ? cards.slice(0, 5) : []), [cards]);
  if (safeCards.length === 0) {
    return null;
  }

  const sectionRef = useRef<HTMLDivElement>(null);
  const cardsContainerRef = useRef<HTMLDivElement>(null);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [inView, setInView] = useState(false);
  const ticking = useRef(false);

  const cardStyle: React.CSSProperties = {
    height: cardHeight,
    maxHeight: "600px",
    borderRadius: "22px",
    transition: `transform ${animationDuration} cubic-bezier(0.19,1,0.22,1), opacity ${animationDuration} cubic-bezier(0.19,1,0.22,1)`,
    willChange: "transform,opacity",
  };

  // Logic IntersectionObserver 
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: intersectionThreshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [intersectionThreshold]);

  // Logic Scroll 
  useEffect(() => {
    const onScroll = () => {
      if (!inView || ticking.current || !sectionRef.current || !cardsContainerRef.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        const rect = sectionRef.current!.getBoundingClientRect();
        const viewportH = window.innerHeight;
        const scrollableDistance = Math.max(1, rect.height - viewportH);
        let progress = 0;
        if (rect.top <= 0 && Math.abs(rect.top) <= scrollableDistance) {
          progress = Math.abs(rect.top) / scrollableDistance;
        } else if (rect.top <= 0) {
          progress = 1;
        }
        const step = 1 / safeCards.length;
        const idx = Math.min(safeCards.length - 1, Math.floor(progress / step));
        setActiveCardIndex(idx);
        ticking.current = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [inView, safeCards.length]);

  // Logic transform
  const getCardTransform = (i: number) => {
    const visible = inView && activeCardIndex >= i;
    const translateY = visible ? `${100 - i * 35}px` : "120px";
    const scale = 0.9 + i * 0.05;
    return {
      transform: `translateY(${translateY}) scale(${scale})`,
      opacity: visible ? (i === 0 ? 0.92 : 1) : 0,
      zIndex: 10 + i * 10,
      pointerEvents: visible ? ("auto" as const) : ("none" as const),
    };
  };

  return (
    <section
      ref={sectionRef}
      className={cn("relative w-full", className)}
      style={{ height: `${sectionHeightMultiplier * 85}vh` }}
      {...rest}
    >
      <div
        className={cn(
          "sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center",
          backgroundColor 
        )}
      >
        <div className="container mx-auto px-6 lg:px-8 h-full flex flex-col justify-center">
          <div
            ref={cardsContainerRef}
            className="relative w-full max-w-5xl mx-auto"
            style={{ height: cardHeight }}
          >
            {safeCards.map((card, i) => {
              const t = getCardTransform(i);
              return (
                <div
                  key={`${card.title}-${i}`}
                  className="absolute inset-x-0 mx-auto overflow-hidden shadow-2xl border border-black/5"
                  style={{
                    ...cardStyle,
                    transform: t.transform,
                    opacity: t.opacity,
                    zIndex: t.zIndex,
                    pointerEvents: t.pointerEvents,
                  }}
                >
                  <div
                    className={cn(
                      "absolute inset-0 -z-10 bg-gradient-to-br",
                      card.gradient || "from-slate-800 to-slate-950"
                    )}
                  />
                  {card.badge && (
                    <div className="absolute top-6 right-6 md:top-8 md:right-8">
                      <span className="px-3 py-1.5 text-xs font-semibold rounded-full bg-white/20 backdrop-blur text-white">
                        {card.badge}
                      </span>
                    </div>
                  )}
                  <div className="relative z-10 p-6 sm:p-10 md:p-12 h-full flex items-center">
                    {card.content ? (
                      card.content
                    ) : (
                      <div className="max-w-xl text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]">
                        <h3 className="text-4xl md:text-6xl font-extrabold tracking-tight">
                          {card.title}
                        </h3>
                        {card.subtitle && (
                          <p className="mt-4 text-xl md:text-2xl text-white/90 max-w-2xl">
                            {card.subtitle}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ScrollStack;