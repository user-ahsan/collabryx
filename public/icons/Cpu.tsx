"use client";

import type { Transition, Variants } from "motion/react";
import { motion, useAnimation } from "motion/react";

interface CpuProps extends React.SVGAttributes<SVGSVGElement> {
  width?: number;
  height?: number;
  strokeWidth?: number;
  stroke?: string;
}

const transition: Transition = {
  duration: 0.5,
  ease: "easeInOut",
  repeat: 1,
};

const yVariants: Variants = {
  normal: {
    scale: 1,
    rotate: 0,
    opacity: 1,
  },
  animate: {
    scaleY: [1, 1.5, 1],
    opacity: [1, 0.8, 1],
  },
};

const xVariants: Variants = {
  normal: {
    scale: 1,
    rotate: 0,
    opacity: 1,
  },
  animate: {
    scaleX: [1, 1.5, 1],
    opacity: [1, 0.8, 1],
  },
};

const Cpu = ({
  width = 28,
  height = 28,
  strokeWidth = 2,
  stroke = "#ffffff",
  ...props
}: CpuProps) => {
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
        <rect width="16" height="16" x="4" y="4" rx="2" />
        <rect width="6" height="6" x="9" y="9" rx="1" />
        <motion.path
          d="M15 2v2"
          variants={yVariants}
          transition={transition}
          animate={controls}
        />
        <motion.path
          d="M15 20v2"
          variants={yVariants}
          transition={transition}
          animate={controls}
        />
        <motion.path
          d="M2 15h2"
          variants={xVariants}
          transition={transition}
          animate={controls}
        />
        <motion.path
          d="M2 9h2"
          variants={xVariants}
          transition={transition}
          animate={controls}
        />
        <motion.path
          d="M20 15h2"
          variants={xVariants}
          transition={transition}
          animate={controls}
        />
        <motion.path
          d="M20 9h2"
          variants={xVariants}
          transition={transition}
          animate={controls}
        />
        <motion.path
          d="M9 2v2"
          variants={yVariants}
          transition={transition}
          animate={controls}
        />
        <motion.path
          d="M9 20v2"
          variants={yVariants}
          transition={transition}
          animate={controls}
        />
      </svg>
    </div>
  );
};

export { Cpu };
