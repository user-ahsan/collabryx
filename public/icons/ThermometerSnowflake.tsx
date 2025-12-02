"use client";

import type { Transition, Variants } from "motion/react";
import { motion, useAnimation } from "motion/react";

const transition: Transition = {
  duration: 0.3,
  opacity: { delay: 0.15 },
};

const thermometerVariants: Variants = {
  normal: {
    pathLength: 1,
    opacity: 1,
  },
  animate: (custom: number) => ({
    pathLength: [0, 1],
    opacity: [0, 1],
    transition: {
      ...transition,
      delay: 0.1 * custom,
    },
  }),
};

const snowflakeVariants: Variants = {
  normal: {
    scale: 1,
    x: 0,
    opacity: 1,
  },
  animate: (custom: number) => ({
    scale: [0.8, 1.1, 1],
    x: [-2, 2, 0],
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20,
      delay: 0.1 * custom,
    },
  }),
};

interface ThermometerSnowflakeProps extends React.SVGAttributes<SVGSVGElement> {
  width?: number;
  height?: number;
  strokeWidth?: number;
  stroke?: string;
}

const ThermometerSnowflake = ({
  width = 28,
  height = 28,
  strokeWidth = 2,
  stroke = "#ffffff",
  ...props
}: ThermometerSnowflakeProps) => {
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
        {/* Thermometer */}
        <motion.path
          d="M20 14.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0z"
          variants={thermometerVariants}
          animate={controls}
          custom={0}
        />

        {/* Snowflake parts with spring animation */}
        <motion.g variants={snowflakeVariants} animate={controls} custom={1}>
          <path d="m10 20-1.25-2.5L6 18" />
          <path d="M10 4 8.75 6.5 6 6" />
          <path d="M10.585 15H10" />
          <path d="M2 12h6.5L10 9" />
          <path d="m4 10 1.5 2L4 14" />
          <path d="m7 21 3-6-1.5-3" />
          <path d="m7 3 3 6h2" />
        </motion.g>
      </svg>
    </div>
  );
};

export { ThermometerSnowflake };
