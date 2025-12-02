"use client";

import { motion, useAnimation } from "motion/react";
import type { Variants } from "motion/react";

interface AArrowUpProps extends React.SVGAttributes<SVGSVGElement> {
  width?: number;
  height?: number;
  strokeWidth?: number;
  stroke?: string;
}

const arrowVariants: Variants = {
  normal: {
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
    },
  },
  animate: {
    y: [0, -4, 0],
    transition: {
      duration: 0.6,
      ease: "easeInOut",
      repeat: Infinity,
      repeatDelay: 1,
    },
  },
};

const AArrowUp = ({
  width = 28,
  height = 28,
  strokeWidth = 2,
  stroke = "#ffffff",
  ...props
}: AArrowUpProps) => {
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
        {/* Letter A paths - static */}
        <path d="M3.5 13h6" />
        <path d="m2 16 4.5-9 4.5 9" />

        {/* Arrow paths - animated */}
        <motion.g variants={arrowVariants} animate={controls} initial="normal">
          <path d="M18 16V7" />
          <path d="m14 11 4-4 4 4" />
        </motion.g>
      </svg>
    </div>
  );
};

export { AArrowUp };
