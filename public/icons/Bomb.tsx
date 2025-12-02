"use client";

import { motion, useAnimation } from "motion/react";
import type { Variants } from "motion/react";

interface BombProps extends React.SVGAttributes<SVGSVGElement> {
  width?: number;
  height?: number;
  strokeWidth?: number;
  stroke?: string;
}

const bombVariants: Variants = {
  normal: {
    scale: 1,
  },
  animate: {
    scale: [1, 1.1, 1],
    transition: {
      duration: 0.5,
      ease: "easeInOut",
      repeat: 2,
      repeatType: "reverse",
    },
  },
};

const sparkVariants: Variants = {
  normal: {
    pathLength: 1,
    opacity: 1,
  },
  animate: {
    pathLength: 1,
    opacity: [1, 0.8, 1],
    transition: {
      duration: 0.8,
      ease: "easeInOut",
      repeat: 1,
    },
  },
};

const Bomb = ({
  width = 28,
  height = 28,
  strokeWidth = 2,
  stroke = "#ffffff",
  ...props
}: BombProps) => {
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
        <motion.circle
          cx="11"
          cy="13"
          r="9"
          variants={bombVariants}
          animate={controls}
          initial="normal"
        />
        <motion.g variants={sparkVariants} animate={controls} initial="normal">
          <path d="M14.35 4.65 16.3 2.7a2.41 2.41 0 0 1 3.4 0l1.6 1.6a2.4 2.4 0 0 1 0 3.4l-1.95 1.95" />
          <path d="m22 2-1.5 1.5" />
        </motion.g>
      </svg>
    </div>
  );
};

export { Bomb };
