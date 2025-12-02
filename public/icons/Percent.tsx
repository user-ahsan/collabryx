"use client";

import type { Variants } from "motion/react";
import { motion, useAnimation } from "motion/react";

const lineVariants: Variants = {
  normal: {
    pathLength: 1,
    opacity: 1,
  },
  animate: {
    pathLength: [0, 1],
    opacity: [0, 1],
    transition: {
      duration: 0.3,
      ease: "easeInOut",
    },
  },
};

const circleVariants: Variants = {
  normal: (custom: { x: number; y: number }) => ({
    x: custom.x,
    y: custom.y,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  }),
  animate: (custom: { x: number; y: number }) => ({
    x: custom.x === 6.5 ? 17.5 : 6.5,
    y: custom.y === 6.5 ? 17.5 : 6.5,
    transition: {
      duration: 0.6,
      ease: "easeInOut",
    },
  }),
};

interface PercentProps extends React.SVGAttributes<SVGSVGElement> {
  width?: number;
  height?: number;
  strokeWidth?: number;
  stroke?: string;
}

const Percent = ({
  width = 28,
  height = 28,
  strokeWidth = 2,
  stroke = "#ffffff",
  ...props
}: PercentProps) => {
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
        <motion.line
          x1="19"
          x2="5"
          y1="5"
          y2="19"
          variants={lineVariants}
          animate={controls}
        />
        <motion.circle
          r="2.5"
          variants={circleVariants}
          animate={controls}
          custom={{ x: 6.5, y: 6.5 }}
          initial={{ x: 6.5, y: 6.5 }}
        />
        <motion.circle
          r="2.5"
          variants={circleVariants}
          animate={controls}
          custom={{ x: 17.5, y: 17.5 }}
          initial={{ x: 17.5, y: 17.5 }}
        />
      </svg>
    </div>
  );
};

export { Percent };
