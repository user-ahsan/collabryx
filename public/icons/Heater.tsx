"use client";

import type { Variants } from "motion/react";
import { motion, useAnimation } from "motion/react";

const waveVariants: Variants = {
  normal: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.2,
      ease: "easeOut",
    },
  },
  animate: (i: number) => ({
    y: [-1, 1, -1],
    opacity: [0.6, 1, 0.6],
    transition: {
      duration: 2,
      ease: "easeInOut",
      delay: i * 0.2,
      repeat: Infinity,
      repeatType: "loop",
    },
  }),
};

const staticVariants: Variants = {
  normal: {
    opacity: 1,
  },
  animate: {
    opacity: 1,
  },
};

interface HeaterProps extends React.SVGAttributes<SVGSVGElement> {
  width?: number;
  height?: number;
  strokeWidth?: number;
  stroke?: string;
}

const Heater = ({
  width = 28,
  height = 28,
  strokeWidth = 2,
  stroke = "#ffffff",
  ...props
}: HeaterProps) => {
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
        {/* Heat waves */}
        <motion.path
          d="M11 8c2-3-2-3 0-6"
          variants={waveVariants}
          animate={controls}
          initial="normal"
          custom={0}
        />
        <motion.path
          d="M15.5 8c2-3-2-3 0-6"
          variants={waveVariants}
          animate={controls}
          initial="normal"
          custom={1}
        />

        {/* Static parts */}
        <motion.g variants={staticVariants} animate={controls} initial="normal">
          <path d="M6 10h.01" />
          <path d="M6 14h.01" />
          <path d="M10 16v-4" />
          <path d="M14 16v-4" />
          <path d="M18 16v-4" />
          <path d="M20 6a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3" />
          <path d="M5 20v2" />
          <path d="M19 20v2" />
        </motion.g>
      </svg>
    </div>
  );
};

export { Heater };
