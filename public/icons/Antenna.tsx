"use client";

import { motion, useAnimation } from "motion/react";
import type { Variants } from "motion/react";

interface AntennaProps extends React.SVGAttributes<SVGSVGElement> {
  width?: number;
  height?: number;
  strokeWidth?: number;
  stroke?: string;
}

const lineVariants: Variants = {
  normal: {
    pathLength: 1,
    opacity: 1,
  },
  animate: (i: number) => ({
    pathLength: [0, 1],
    opacity: [0, 1],
    transition: {
      duration: 0.5,
      delay: i * 0.1,
      ease: "easeInOut",
    },
  }),
};

const Antenna = ({
  width = 28,
  height = 28,
  strokeWidth = 2,
  stroke = "#ffffff",
  ...props
}: AntennaProps) => {
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
        <motion.path
          d="M2 12 7 2"
          variants={lineVariants}
          animate={controls}
          custom={0}
        />
        <motion.path
          d="m7 12 5-10"
          variants={lineVariants}
          animate={controls}
          custom={1}
        />
        <motion.path
          d="m12 12 5-10"
          variants={lineVariants}
          animate={controls}
          custom={2}
        />
        <motion.path
          d="m17 12 5-10"
          variants={lineVariants}
          animate={controls}
          custom={3}
        />
        <motion.path
          d="M4.5 7h15"
          variants={lineVariants}
          animate={controls}
          custom={4}
        />
        <motion.path
          d="M12 16v6"
          variants={lineVariants}
          animate={controls}
          custom={5}
        />
      </svg>
    </div>
  );
};

export { Antenna };
