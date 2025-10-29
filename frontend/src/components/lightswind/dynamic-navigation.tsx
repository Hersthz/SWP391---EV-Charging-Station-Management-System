import React, { useEffect, useRef, useState } from "react";
import { cn } from "../../lib/utils";

export interface DynamicNavigationProps {
  /** Navigation links */
  links: {
    id: string;
    label: string;
    href: string;
    icon?: React.ReactNode;
  }[];
  /** Background color (inline) */
  backgroundColor?: string;
  /** Text color (inline) */
  textColor?: string;
  /** Highlight color (inline or tailwind class via highlightClass) */
  highlightColor?: string;
  /** Glow effect intensity (0-10) */
  glowIntensity?: number;
  /** Extra class */
  className?: string;
  /** Show labels on mobile */
  showLabelsOnMobile?: boolean;
  /** Click callback */
  onLinkClick?: (id: string) => void;
  /** ✅ Preferred: controlled active id */
  activeId?: string;
  /** ⚠️ Deprecated: kept for backward-compat */
  activeLink?: string;
  /** Enable ripple on click */
  enableRipple?: boolean;
}

export const DynamicNavigation = ({
  links,
  backgroundColor,
  textColor,
  highlightColor,
  glowIntensity = 5,
  className,
  showLabelsOnMobile = false,
  onLinkClick,
  activeId,            
  activeLink,          
  enableRipple = true,
}: DynamicNavigationProps) => {
  const navRef = useRef<HTMLElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  // pick controlled value if provided (activeId first, then legacy activeLink)
  const controlledActive = activeId ?? activeLink ?? (links[0]?.id ?? null);

  const [active, setActive] = useState<string | null>(controlledActive);

  // Theme defaults (use tailwind classes)
  const theme = {
    bg: "bg-background",
    border: "border",
    text: "text-foreground",
    highlightClass: "bg-foreground/10",
    glow: `shadow-[0_0_${glowIntensity}px_rgba(0,0,0,0.06)]`,
  };

  const updateHighlightPosition = (id?: string) => {
    if (!navRef.current || !highlightRef.current) return;
    const targetId = id ?? active ?? undefined;
    if (!targetId) return;

    const linkEl = navRef.current.querySelector(
      `#nav-item-${CSS.escape(targetId)}`
    ) as HTMLElement | null;
    if (!linkEl) return;

    const { left, width } = linkEl.getBoundingClientRect();
    const navRect = navRef.current.getBoundingClientRect();
    highlightRef.current.style.transform = `translateX(${left - navRect.left}px)`;
    highlightRef.current.style.width = `${width}px`;
  };

  const createRipple = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (!enableRipple) return;
    const btn = event.currentTarget;
    const circle = document.createElement("span");
    const diameter = Math.max(btn.clientWidth, btn.clientHeight);
    const rect = btn.getBoundingClientRect();

    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${event.clientX - rect.left - diameter / 2}px`;
    circle.style.top = `${event.clientY - rect.top - diameter / 2}px`;
    circle.className =
      "absolute bg-white rounded-full pointer-events-none opacity-30 animate-ripple";

    btn.appendChild(circle);
    setTimeout(() => circle.remove(), 600);
  };

  const handleLinkClick = (
    id: string,
    e: React.MouseEvent<HTMLAnchorElement>
  ) => {
    if (enableRipple) createRipple(e);
    setActive(id);
    onLinkClick?.(id);
  };

  const handleLinkHover = (id: string) => updateHighlightPosition(id);

  // mount + resize
  useEffect(() => {
    updateHighlightPosition();
    const onResize = () => updateHighlightPosition();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [links, active]);

  // keep in sync with controlled prop(s)
  useEffect(() => {
    if (controlledActive && controlledActive !== active) {
      setActive(controlledActive);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controlledActive]);

  return (
    <nav
      ref={navRef}
      className={cn(
        "relative rounded-full backdrop-blur-md border shadow-lg transition-all duration-300",
        theme.bg,
        theme.border,
        theme.glow,
        className
      )}
      style={{
        backgroundColor,
        color: textColor,
      }}
    >
      {/* highlight */}
      <div
        ref={highlightRef}
        className={cn(
          "absolute top-0 left-0 h-full rounded-full transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] z-0",
          theme.highlightClass
        )}
        style={{ backgroundColor: highlightColor }}
      />

      <ul className="flex justify-between items-center gap-4 py-2 relative z-10">
        {links.map((link) => (
          <li
            key={link.id}
            className="flex-1 rounded-full mx-1 lg:mx-2 px-4"
            id={`nav-item-${link.id}`}
            data-active={active === link.id}
          >
            <a
              href={link.href}
              className={cn(
                "flex gap-1 items-center justify-center h-8 md:h-8 text-xs md:text-sm rounded-full font-medium transition-all duration-300 hover:scale-105 relative overflow-hidden",
                theme.text,
                active === link.id && "font-semibold"
              )}
              onClick={(e) => {
                e.preventDefault();
                handleLinkClick(link.id, e);
              }}
              onMouseEnter={() => handleLinkHover(link.id)}
            >
              {link.icon && <span className="text-current text-xs">{link.icon}</span>}
              <span className={cn(showLabelsOnMobile ? "flex" : "hidden sm:flex")}>
                {link.label}
              </span>
            </a>
          </li>
        ))}
      </ul>

      <style
        dangerouslySetInnerHTML={{
          __html: `
@keyframes ripple { to { transform: scale(4); opacity: 0; } }
.animate-ripple { animation: ripple 0.6s linear; }
`,
        }}
      />
    </nav>
  );
};

export default DynamicNavigation;
