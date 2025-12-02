"use client";

import { motion, useAnimation } from "motion/react";
import type { Variants } from "motion/react";

interface AppWindowMacProps extends React.SVGAttributes<SVGSVGElement> {
  width?: number;
  height?: number;
  strokeWidth?: number;
  stroke?: string;
}

const frameVariants: Variants = {
  normal: {
    opacity: 1,
  },
  animate: {
    opacity: [1, 0.8, 1],
    transition: {
      duration: 1,
      ease: "easeInOut",
    },
  },
};

const dotVariants: Variants = {
  normal: {
    scale: 1,
    opacity: 1,
  },
  animate: (i: number) => ({
    scale: [0, 1.2, 1],
    opacity: [0, 1, 1],
    transition: {
      duration: 0.3,
      delay: i * 0.15,
      ease: "easeOut",
    },
  }),
};

const AppWindowMac = ({
  width = 28,
  height = 28,
  strokeWidth = 2,
  stroke = "#ffffff",
  ...props
}: AppWindowMacProps) => {
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
        <motion.rect
          width="20"
          height="16"
          x="2"
          y="4"
          rx="2"
          variants={frameVariants}
          animate={controls}
          initial="normal"
        />
        <motion.path
          d="M6 8h.01"
          variants={dotVariants}
          animate={controls}
          initial="normal"
          custom={0}
        />
        <motion.path
          d="M10 8h.01"
          variants={dotVariants}
          animate={controls}
          initial="normal"
          custom={1}
        />
        <motion.path
          d="M14 8h.01"
          variants={dotVariants}
          animate={controls}
          initial="normal"
          custom={2}
        />
      </svg>
    </div>
  );
};

export { AppWindowMac };
