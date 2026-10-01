"use client";

// AnimatedCounter — compte de 0 à la valeur finale (effet "count-up").
// Utilise Framer Motion useMotionValue + animate + useTransform.
import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";

interface Props {
  value: number;
  duration?: number;        // secondes (default 1.2)
  format?: (n: number) => string;  // formateur (ex: formatFCFA)
  className?: string;
  delay?: number;           // délai avant start (stagger)
}

export function AnimatedCounter({ value, duration = 1.2, format, className, delay = 0 }: Props) {
  const motionValue = useMotionValue(0);
  const [display, setDisplay] = useState("0");
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;

    const timeout = setTimeout(() => {
      const controls = animate(motionValue, value, {
        duration,
        ease: [0.22, 1, 0.36, 1], // easeOutQuint
        onUpdate: (v) => {
          setDisplay(format ? format(Math.round(v)) : String(Math.round(v)));
        },
      });
      return () => controls.stop();
    }, delay * 1000);

    return () => clearTimeout(timeout);
  }, [value, duration, format, delay, motionValue]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}
