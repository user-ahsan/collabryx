"use client";

import { motion, useAnimation } from "motion/react";
import type { Variants } from "motion/react";

interface BatteryFullProps extends React.SVGAttributes<SVGSVGElement> {
  width?: number;
  height?: number;
  strokeWidth?: number;
  stroke?: string;
}

const batteryVariants: Variants = {
  normal: {
    pathLength: 1,
    opacity: 1,
  },
  animate: (custom: number) => ({
    pathLength: [0, 1],
    opacity: [0, 1],
    transition: {
      duration: 0.3,
      delay: custom * 0.1,
    },
  }),
};

const BatteryFull = ({
  width = 28,
  height = 28,
  strokeWidth = 2,
  stroke = "#ffffff",
  ...props
}: BatteryFullProps) => {
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
        <rect width="16" height="10" x="2" y="7" rx="2" ry="2" />
        <line x1="22" x2="22" y1="11" y2="13" />
        <motion.line
          x1="6"
          x2="6"
          y1="11"
          y2="13"
          variants={batteryVariants}
          animate={controls}
          initial="normal"
          custom={0}
        />
        <motion.line
          x1="10"
          x2="10"
          y1="11"
          y2="13"
          variants={batteryVariants}
          animate={controls}
          initial="normal"
          custom={1}
        />
        <motion.line
          x1="14"
          x2="14"
          y1="11"
          y2="13"
          variants={batteryVariants}
          animate={controls}
          initial="normal"
          custom={2}
        />
      </svg>
    </div>
  );
};

export { BatteryFull };
