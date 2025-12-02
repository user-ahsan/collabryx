"use client";

import { motion, useAnimation } from "motion/react";
import type { Variants } from "motion/react";

interface AlignCenterProps extends React.SVGAttributes<SVGSVGElement> {
  width?: number;
  height?: number;
  strokeWidth?: number;
  stroke?: string;
}

const lineVariants: Variants = {
  normal: {
    pathLength: 1,
    opacity: 1,
  },
  animate: {
    pathLength: [0, 1],
    opacity: [0.3, 1],
    transition: {
      duration: 0.8,
      ease: "easeInOut",
      repeat: Infinity,
      repeatDelay: 0.5,
    },
  },
};

const AlignCenter = ({
  width = 28,
  height = 28,
  strokeWidth = 2,
  stroke = "#ffffff",
  ...props
}: AlignCenterProps) => {
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
          d="M17 12H7"
          variants={lineVariants}
          animate={controls}
          initial="normal"
          custom={0}
        />
        <motion.path
          d="M19 18H5"
          variants={lineVariants}
          animate={controls}
          initial="normal"
          custom={1}
        />
        <motion.path
          d="M21 6H3"
          variants={lineVariants}
          animate={controls}
          initial="normal"
          custom={2}
        />
      </svg>
    </div>
  );
};

export { AlignCenter };
