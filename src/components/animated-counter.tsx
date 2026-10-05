"use client";

// AnimatedCounter — compte de 0 à la valeur finale (effet "count-up").
// Animation flip 3D pour chaque chiffre.
import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, animate } from "framer-motion";

interface Props {
  value: number;
  duration?: number;
  format?: (n: number) => string;
  className?: string;
  delay?: number;
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
        ease: [0.22, 1, 0.36, 1],
        onUpdate: (v) => {
          setDisplay(format ? format(Math.round(v)) : String(Math.round(v)));
        },
      });
      return () => controls.stop();
    }, delay * 1000);

    return () => clearTimeout(timeout);
  }, [value, duration, format, delay, motionValue]);

  return (
    <motion.span
      ref={ref}
      className={className}
      initial={{ rotateX: -90, opacity: 0 }}
      animate={{ rotateX: 0, opacity: 1 }}
      transition={{ delay: delay + 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      style={{ transformStyle: "preserve-3d", display: "inline-block" }}
    >
      {display}
    </motion.span>
  );
}
