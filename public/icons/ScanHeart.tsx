"use client";

import type { Variants } from "motion/react";
import { motion, useAnimation } from "motion/react";

const heartVariants: Variants = {
  normal: {
    pathLength: 1,
    opacity: 1,
  },
  animate: {
    pathLength: [0, 1],
    opacity: [0, 1],
    transition: {
      duration: 0.8,
      ease: "easeInOut",
    },
  },
};

const frameVariants: Variants = {
  normal: {
    x: 0,
    y: 0,
  },
  animate: (i: number) => ({
    x: i % 2 === 0 ? [-3, 0] : [3, 0],
    y: i < 2 ? [-3, 0] : [3, 0],
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 10,
      mass: 0.5,
    },
  }),
};

interface ScanHeartProps extends React.SVGAttributes<SVGSVGElement> {
  width?: number;
  height?: number;
  strokeWidth?: number;
  stroke?: string;
}

const ScanHeart = ({
  width = 28,
  height = 28,
  strokeWidth = 2,
  stroke = "#ffffff",
  ...props
}: ScanHeartProps) => {
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
        <motion.path
          d="M11.246 16.657a1 1 0 0 0 1.508 0l3.57-4.101A2.75 2.75 0 1 0 12 9.168a2.75 2.75 0 1 0-4.324 3.388z"
          variants={heartVariants}
          animate={controls}
        />
        <motion.path
          d="M17 3h2a2 2 0 0 1 2 2v2"
          variants={frameVariants}
          animate={controls}
          custom={0}
        />
        <motion.path
          d="M21 17v2a2 2 0 0 1-2 2h-2"
          variants={frameVariants}
          animate={controls}
          custom={1}
        />
        <motion.path
          d="M3 7V5a2 2 0 0 1 2-2h2"
          variants={frameVariants}
          animate={controls}
          custom={2}
        />
        <motion.path
          d="M7 21H5a2 2 0 0 1-2-2v-2"
          variants={frameVariants}
          animate={controls}
          custom={3}
        />
      </svg>
    </div>
  );
};

export { ScanHeart };
