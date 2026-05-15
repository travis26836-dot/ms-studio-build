import React, { useEffect, useState } from "react";

function prefersReducedMotion() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }

  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * PageLoadAnimator - top-level wrapper for a clean flash-in page reveal.
 */
export const PageLoadAnimator: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAnimating, setIsAnimating] = useState(!prefersReducedMotion());

  useEffect(() => {
    if (!isAnimating) {
      return;
    }

    const timer = setTimeout(() => setIsAnimating(false), 700);
    return () => clearTimeout(timer);
  }, [isAnimating]);

  return (
    <div
      className={`transition-all duration-700 ${
        isAnimating ? "opacity-0" : "opacity-100"
      }`}
      style={{
        transform: isAnimating ? "translateY(14px)" : "translateY(0)",
        transitionProperty: "opacity, transform",
        transitionDuration: "700ms",
        transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    >
      {children}
    </div>
  );
};

/**
 * FlashInElement - per-element reveal with optional staggered delay.
 */
export const FlashInElement: React.FC<{
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  yOffset?: number;
}> = ({ children, delay = 0, duration = 550, yOffset = 20 }) => {
  const [isVisible, setIsVisible] = useState(prefersReducedMotion());

  useEffect(() => {
    if (isVisible) {
      return;
    }

    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay, isVisible]);

  return (
    <div
      className={`transition-all ${isVisible ? "opacity-100" : "opacity-0"}`}
      style={{
        transform: isVisible
          ? "translateY(0) scale(1)"
          : `translateY(${yOffset}px) scale(0.985)`,
        transitionProperty: "opacity, transform",
        transitionDuration: `${duration}ms`,
        transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {children}
    </div>
  );
};

export default PageLoadAnimator;
