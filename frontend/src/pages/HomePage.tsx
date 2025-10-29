import Header from "../components/homepage/Header";
import Hero from "../components/homepage/Hero";
import Features from "../components/homepage/Features";
import MapPreview from "../components/homepage/MapPreview";
import Testimonials from "../components/homepage/Testimonials";
import Footer from "../components/homepage/Footer";
import { useEffect, useRef, useState } from "react";

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="space-y-0">
        <Hero />
        <SectionReveal><Features /></SectionReveal>
        <SectionReveal><MapPreview /></SectionReveal>
        <SectionReveal><Testimonials /></SectionReveal>
        <Footer />
      </main>
    </>
  );
}

function SectionReveal({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => setShow(e.isIntersecting),
      { threshold: 0.2 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 will-change-[transform,opacity] ${
        show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      }`}
    >
      {children}
    </div>
  );
}
