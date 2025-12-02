"use client";

import { motion, useAnimation } from "motion/react";
import type { Variants } from "motion/react";

interface CakeProps extends React.SVGAttributes<SVGSVGElement> {
  width?: number;
  height?: number;
  strokeWidth?: number;
  stroke?: string;
}

const staticVariants: Variants = {
  normal: {
    opacity: 1,
  },
  animate: {
    opacity: 1,
  },
};

const flameVariants: Variants = {
  normal: (i: number) => ({
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25,
    },
  }),
  animate: (i: number) => {
    const patterns = [
      { scale: [1, 1.2, 0.9, 1.1, 1], y: [0, -1, 1, -2, 0] },
      { scale: [1, 0.9, 1.1, 0.8, 1], y: [0, 1, -1, 0, 0] },
      { scale: [1, 1.1, 0.8, 1.2, 1], y: [0, -2, 0, -1, 0] },
    ];
    return {
      ...patterns[i % patterns.length],
      transition: {
        duration: 2,
        ease: "easeInOut",
        repeat: Infinity,
        repeatType: "reverse",
      },
    };
  },
};

const Cake = ({
  width = 28,
  height = 28,
  strokeWidth = 2,
  stroke = "#ffffff",
  ...props
}: CakeProps) => {
  const controls = useAnimation();

  return (
    <div
      style={{
        cursor: "pointer",
        userSelect: "none",
        padding: "8px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onMouseEnter={() => controls.start("animate")}
      onMouseLeave={() => controls.start("normal")}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={width}
        height={height}
        viewBox="0 0 24 24"
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
      >
        {/* Static cake parts */}
        <motion.path
          d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"
          variants={staticVariants}
          animate={controls}
        />
        <motion.path
          d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1"
          variants={staticVariants}
          animate={controls}
        />
        <motion.path
          d="M2 21h20"
          variants={staticVariants}
          animate={controls}
        />

        {/* Candle sticks */}
        <motion.path d="M7 8v3" variants={staticVariants} animate={controls} />
        <motion.path d="M12 8v3" variants={staticVariants} animate={controls} />
        <motion.path d="M17 8v3" variants={staticVariants} animate={controls} />

        {/* Animated flames */}
        <motion.path
          d="M7 4h.01"
          variants={flameVariants}
          animate={controls}
          custom={0}
          style={{ transformOrigin: "center" }}
        />
        <motion.path
          d="M12 4h.01"
          variants={flameVariants}
          animate={controls}
          custom={1}
          style={{ transformOrigin: "center" }}
        />
        <motion.path
          d="M17 4h.01"
          variants={flameVariants}
          animate={controls}
          custom={2}
          style={{ transformOrigin: "center" }}
        />
      </svg>
    </div>
  );
};

export { Cake };
