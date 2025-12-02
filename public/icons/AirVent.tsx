"use client";

import { motion, useAnimation } from "motion/react";
import type { Variants } from "motion/react";

interface AirVentProps extends React.SVGAttributes<SVGSVGElement> {
  width?: number;
  height?: number;
  strokeWidth?: number;
  stroke?: string;
}

const pathVariants: Variants = {
  normal: {
    pathLength: 1,
    opacity: 1,
    strokeWidth: 2,
  },
  animate: {
    pathLength: [0, 1],
    opacity: 1,
    strokeWidth: 2,
    transition: {
      duration: 0.8,
      ease: "easeInOut",
      pathLength: {
        duration: 0.8,
      },
    },
  },
};

const AirVent = ({
  width = 28,
  height = 28,
  strokeWidth = 2,
  stroke = "#ffffff",
  ...props
}: AirVentProps) => {
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
        <path d="M6 12H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
        <path d="M6 8h12" />
        <g>
          <motion.path
            d="M18.3 17.7a2.5 2.5 0 0 1-3.16 3.83 2.53 2.53 0 0 1-1.14-2V12"
            variants={pathVariants}
            animate={controls}
            initial="normal"
            custom={1}
          />
          <motion.path
            d="M6.6 15.6A2 2 0 1 0 10 17v-5"
            variants={pathVariants}
            animate={controls}
            initial="normal"
            custom={2}
          />
        </g>
      </svg>
    </div>
  );
};

export { AirVent };
