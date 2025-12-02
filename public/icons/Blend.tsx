"use client";

import { motion, useAnimation } from "motion/react";
import type { Variants } from "motion/react";

interface BlendProps extends React.SVGAttributes<SVGSVGElement> {
  width?: number;
  height?: number;
  strokeWidth?: number;
  stroke?: string;
}

const circleVariants: Variants = {
  normal: {
    scale: 1,
    opacity: 0.7,
  },
  animate: {
    scale: [1, 1.1, 1],
    opacity: [0.7, 1, 0.7],
    transition: {
      duration: 1,
      ease: "easeInOut",
      repeat: Infinity,
      repeatType: "reverse",
    },
  },
};

const Blend = ({
  width = 28,
  height = 28,
  strokeWidth = 2,
  stroke = "#ffffff",
  ...props
}: BlendProps) => {
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
        <motion.circle
          cx="9"
          cy="9"
          r="7"
          variants={circleVariants}
          animate={controls}
          initial="normal"
          custom={0}
          transition={{
            delay: 0,
          }}
        />
        <motion.circle
          cx="15"
          cy="15"
          r="7"
          variants={circleVariants}
          animate={controls}
          initial="normal"
          custom={1}
          transition={{
            delay: 0.5,
          }}
        />
      </svg>
    </div>
  );
};

export { Blend };
