"use client";

import type { Variants } from "motion/react";
import { motion, useAnimation } from "motion/react";

const leftBoxVariants: Variants = {
  normal: {
    x: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25,
    },
  },
  animate: {
    x: -2, // Moved left box more to the left
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25,
    },
  },
};

const rightBoxVariants: Variants = {
  normal: {
    x: 0,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25,
    },
  },
  animate: {
    x: 2, // Moved right box more to the right
    y: -10,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25,
    },
  },
};

interface UngroupProps extends React.SVGAttributes<SVGSVGElement> {
  width?: number;
  height?: number;
  strokeWidth?: number;
  stroke?: string;
}

const Ungroup = ({
  width = 28,
  height = 28,
  strokeWidth = 2,
  stroke = "#ffffff",
  ...props
}: UngroupProps) => {
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
          width="8"
          height="6"
          x="5"
          y="4"
          rx="1"
          variants={leftBoxVariants}
          animate={controls}
          initial="normal"
        />
        <motion.rect
          width="8"
          height="6"
          x="11"
          y="14"
          rx="1"
          variants={rightBoxVariants}
          animate={controls}
          initial="normal"
        />
      </svg>
    </div>
  );
};

export { Ungroup };
