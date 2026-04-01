import { useCallback, useRef, MouseEvent } from "react";

/**
 * RippleButton — wraps any interactive element with a ripple click effect.
 * Usage: <RippleButton><Button ...>Click</Button></RippleButton>
 */
export function RippleButton({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  const createRipple = useCallback((e: MouseEvent<HTMLDivElement>) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const size = Math.max(rect.width, rect.height) * 2;

    const ripple = document.createElement("span");
    ripple.className = "ripple";
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x - size / 2}px`;
    ripple.style.top = `${y - size / 2}px`;
    el.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  }, []);

  return (
    <div ref={containerRef} className={`ripple-container inline-flex ${className}`} onClick={createRipple}>
      {children}
    </div>
  );
}
