"use client";

import type { Variants } from "motion/react";
import { motion, useAnimation } from "motion/react";

const dotVariants: Variants = {
  normal: {
    opacity: 1,
    scale: 1,
  },
  animate: (i: number) => ({
    opacity: [1, 0.4, 1],
    scale: [1, 0.8, 1],
    transition: {
      duration: 1.2,
      repeat: Infinity,
      repeatDelay: 0.2,
      delay: i * 0.15,
      ease: "easeInOut",
    },
  }),
};

const containerVariants: Variants = {
  normal: {
    rotate: 0,
  },
  animate: {
    rotate: [0, -2, 0],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

interface SprayCanProps extends React.SVGAttributes<SVGSVGElement> {
  width?: number;
  height?: number;
  strokeWidth?: number;
  stroke?: string;
}

const SprayCan = ({
  width = 28,
  height = 28,
  strokeWidth = 2,
  stroke = "#ffffff",
  ...props
}: SprayCanProps) => {
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
      <motion.svg
        xmlns="http://www.w3.org/2000/svg"
        width={width}
        height={height}
        viewBox="0 0 24 24"
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        variants={containerVariants}
        animate={controls}
      >
        <motion.path
          d="M3 3h.01"
          variants={dotVariants}
          animate={controls}
          custom={0}
        />
        <motion.path
          d="M7 5h.01"
          variants={dotVariants}
          animate={controls}
          custom={1}
        />
        <motion.path
          d="M11 7h.01"
          variants={dotVariants}
          animate={controls}
          custom={2}
        />
        <motion.path
          d="M3 7h.01"
          variants={dotVariants}
          animate={controls}
          custom={3}
        />
        <motion.path
          d="M7 9h.01"
          variants={dotVariants}
          animate={controls}
          custom={4}
        />
        <motion.path
          d="M3 11h.01"
          variants={dotVariants}
          animate={controls}
          custom={5}
        />
        <rect width="4" height="4" x="15" y="5" />
        <path d="m19 9 2 2v10c0 .6-.4 1-1 1h-6c-.6 0-1-.4-1-1V11l2-2" />
        <path d="m13 14 8-2" />
        <path d="m13 19 8-2" />
      </motion.svg>
    </div>
  );
};

export { SprayCan };
