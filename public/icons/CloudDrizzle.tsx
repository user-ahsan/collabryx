"use client";

import type { Transition, Variants } from "motion/react";
import { motion, useAnimation } from "motion/react";

interface CloudDrizzleProps extends React.SVGAttributes<SVGSVGElement> {
  width?: number;
  height?: number;
  strokeWidth?: number;
  stroke?: string;
}

const transition: Transition = {
  duration: 0.3,
  opacity: { delay: 0.15 },
};

const variants: Variants = {
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

const dropVariants: Variants = {
  normal: { y: 0, opacity: 1 },
  animate: {
    y: [0, 3, 0],
    opacity: [1, 0.3, 1],
    transition: { repeat: Infinity },
  },
};

const CloudDrizzle = ({
  width = 28,
  height = 28,
  strokeWidth = 2,
  stroke = "#ffffff",
  ...props
}: CloudDrizzleProps) => {
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
          variants={variants}
          animate={controls}
          custom={0}
          d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"
        />
        <motion.path variants={dropVariants} animate={controls} d="M8 19v1" />
        <motion.path variants={dropVariants} animate={controls} d="M8 14v1" />
        <motion.path variants={dropVariants} animate={controls} d="M16 19v1" />
        <motion.path variants={dropVariants} animate={controls} d="M16 14v1" />
        <motion.path variants={dropVariants} animate={controls} d="M12 21v1" />
        <motion.path variants={dropVariants} animate={controls} d="M12 16v1" />
      </svg>
    </div>
  );
};

export { CloudDrizzle };
