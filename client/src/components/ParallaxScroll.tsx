import React, { useEffect, useRef, useState } from "react";

interface ParallaxScrollProps {
  children: React.ReactNode;
  intensity?: number; // 0.1 to 1.0, controls parallax strength
  className?: string;
  maxOffset?: number;
}

function shouldReduceMotion() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }

  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * ParallaxScroll - Implements parallax scrolling effect
 * Child element moves slower than scroll speed, creating depth illusion
 */
export const ParallaxScroll: React.FC<ParallaxScrollProps> = ({ 
  children, 
  intensity = 0.5,
  className = '',
  maxOffset = 120,
}) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  const reduceMotion = shouldReduceMotion();

  useEffect(() => {
    if (reduceMotion) {
      return;
    }

    let rafId = 0;

    const handleScroll = () => {
      if (rafId) return;

      rafId = window.requestAnimationFrame(() => {
        rafId = 0;
        if (!elementRef.current) return;

        // Calculate parallax offset based on element position and scroll.
        const element = elementRef.current;
        const rect = element.getBoundingClientRect();
        const windowHeight = window.innerHeight;

        // Only apply parallax when element is in view.
        if (rect.top < windowHeight && rect.bottom > 0) {
          const yPos = window.scrollY * intensity;
          const nextOffset = Math.max(-maxOffset, Math.min(maxOffset, yPos));
          setOffset(nextOffset);
        }
      });
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
      window.removeEventListener('scroll', handleScroll);
    };
  }, [intensity, maxOffset, reduceMotion]);

  return (
    <div
      ref={elementRef}
      className={`parallax-scroll-container ${className}`}
      style={{
        transform: reduceMotion ? 'none' : `translateY(${offset * -1}px)`,
        transition: reduceMotion ? 'none' : 'transform 0.12s linear',
        willChange: reduceMotion ? 'auto' : 'transform',
      }}
    >
      {children}
    </div>
  );
};

interface RevealOnScrollProps {
  children: React.ReactNode;
  threshold?: number;
  className?: string;
  yOffset?: number;
}

/**
 * RevealOnScroll - Fade and scale in elements as they enter viewport
 */
export const RevealOnScroll: React.FC<RevealOnScrollProps> = ({ 
  children, 
  threshold = 0.1,
  className = '',
  yOffset = 40,
}) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(shouldReduceMotion());

  useEffect(() => {
    if (isVisible) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [isVisible, threshold]);

  return (
    <div
      ref={elementRef}
      className={`transition-all duration-700 ${isVisible ? 'opacity-100' : 'opacity-0'} ${className}`}
      style={{
        transform: isVisible ? 'translateY(0)' : `translateY(${yOffset}px)`,
      }}
    >
      {children}
    </div>
  );
};

export default ParallaxScroll;
