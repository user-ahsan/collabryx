"use client";

import type { Variants } from "motion/react";
import { motion, useAnimation, cubicBezier } from "motion/react";

const customEasing = cubicBezier(0.25, 0.1, 0.25, 1);

const arrowVariants: Variants = {
  normal: {
    x: 0,
    y: 0,
    rotate: 0,
    transition: {
      duration: 0.6,
      ease: customEasing,
    },
  },
  animate: {
    x: [0, 2.1, 0],
    y: [0, -1.4, 0],
    rotate: [0, 12, 0],
    transition: {
      duration: 0.6,
      ease: customEasing,
    },
  },
};

const pathVariants: Variants = {
  normal: {
    pathLength: 1,
    transition: {
      duration: 0.6,
      ease: customEasing,
    },
  },
  animate: {
    pathLength: [1, 0.8, 1],
    transition: {
      duration: 0.6,
      ease: customEasing,
    },
  },
};

interface UndoProps extends React.SVGAttributes<SVGSVGElement> {
  width?: number;
  height?: number;
  strokeWidth?: number;
  stroke?: string;
}

const Undo = ({
  width = 28,
  height = 28,
  strokeWidth = 2,
  stroke = "#ffffff",
  ...props
}: UndoProps) => {
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
        <motion.path d="M3 7v6h6" variants={arrowVariants} animate={controls} />
        <motion.path
          d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"
          variants={pathVariants}
          animate={controls}
        />
      </svg>
    </div>
  );
};

export { Undo };
