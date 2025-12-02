"use client";

import type { Variants } from "motion/react";
import { motion, useAnimation } from "motion/react";

const sparkleVariants: Variants = {
  normal: {
    opacity: 1,
  },
  animate: (i: number) => ({
    opacity: [1, 0.3, 1],
    transition: {
      duration: 0.8,
      repeat: Infinity,
      repeatDelay: 0.2,
      delay: i * 0.1,
      ease: "easeInOut",
    },
  }),
};

interface WandSparklesProps extends React.SVGAttributes<SVGSVGElement> {
  width?: number;
  height?: number;
  strokeWidth?: number;
  stroke?: string;
}

const WandSparkles = ({
  width = 28,
  height = 28,
  strokeWidth = 2,
  stroke = "#ffffff",
  ...props
}: WandSparklesProps) => {
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
        <path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72" />
        <motion.path
          d="m14 7 3 3"
          variants={sparkleVariants}
          animate={controls}
          custom={0}
        />
        <motion.path
          d="M5 6v4"
          variants={sparkleVariants}
          animate={controls}
          custom={1}
        />
        <motion.path
          d="M19 14v4"
          variants={sparkleVariants}
          animate={controls}
          custom={2}
        />
        <motion.path
          d="M10 2v2"
          variants={sparkleVariants}
          animate={controls}
          custom={3}
        />
        <motion.path
          d="M7 8H3"
          variants={sparkleVariants}
          animate={controls}
          custom={4}
        />
        <motion.path
          d="M21 16h-4"
          variants={sparkleVariants}
          animate={controls}
          custom={5}
        />
        <motion.path
          d="M11 3H9"
          variants={sparkleVariants}
          animate={controls}
          custom={6}
        />
      </svg>
    </div>
  );
};

export { WandSparkles };
