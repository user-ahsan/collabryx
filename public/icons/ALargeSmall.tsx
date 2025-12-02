"use client";

import { motion, useAnimation } from "motion/react";
import type { Variants } from "motion/react";

interface ALargeSmallProps extends React.SVGAttributes<SVGSVGElement> {
  width?: number;
  height?: number;
  strokeWidth?: number;
  stroke?: string;
}

const largeAVariants: Variants = {
  normal: {
    scale: 1,
  },
  animate: {
    scale: [1, 1.2, 1],
    transition: {
      duration: 0.8,
      ease: "easeInOut",
      repeat: Infinity,
      repeatDelay: 1,
    },
  },
};

const smallAVariants: Variants = {
  normal: {
    scale: 1,
  },
  animate: {
    scale: [1, 0.8, 1],
    transition: {
      duration: 0.8,
      ease: "easeInOut",
      repeat: Infinity,
      repeatDelay: 1,
    },
  },
};

const ALargeSmall = ({
  width = 28,
  height = 28,
  strokeWidth = 2,
  stroke = "#ffffff",
  ...props
}: ALargeSmallProps) => {
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
        {/* Large A - animated */}
        <motion.g variants={largeAVariants} animate={controls} initial="normal">
          <path d="M21 14h-5" />
          <path d="M16 16v-3.5a2.5 2.5 0 0 1 5 0V16" />
        </motion.g>

        {/* Small A - animated */}
        <motion.g variants={smallAVariants} animate={controls} initial="normal">
          <path d="M4.5 13h6" />
          <path d="m3 16 4.5-9 4.5 9" />
        </motion.g>
      </svg>
    </div>
  );
};

export { ALargeSmall };
