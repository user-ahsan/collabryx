"use client";

import type { Transition, Variants } from "motion/react";
import { motion, useAnimation } from "motion/react";

const transition: Transition = {
  duration: 0.3,
  opacity: { delay: 0.15 },
};

const stemVariants: Variants = {
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

const grapeVariants: Variants = {
  normal: {
    scale: 1,
    opacity: 1,
  },
  animate: (custom: number) => ({
    scale: [0, 1],
    opacity: [0, 1],
    transition: {
      ...transition,
      delay: 0.1 * custom,
    },
  }),
};

interface GrapeProps extends React.SVGAttributes<SVGSVGElement> {
  width?: number;
  height?: number;
  strokeWidth?: number;
  stroke?: string;
}

const Grape = ({
  width = 28,
  height = 28,
  strokeWidth = 2,
  stroke = "#ffffff",
  ...props
}: GrapeProps) => {
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
          d="M22 5V2l-5.89 5.89"
          variants={stemVariants}
          animate={controls}
          initial="normal"
          custom={0}
        />
        <motion.circle
          cx="12.35"
          cy="11.65"
          r="3"
          variants={grapeVariants}
          animate={controls}
          initial="normal"
          custom={1}
        />
        <motion.circle
          cx="13.91"
          cy="5.85"
          r="3"
          variants={grapeVariants}
          animate={controls}
          initial="normal"
          custom={2}
        />
        <motion.circle
          cx="18.15"
          cy="10.09"
          r="3"
          variants={grapeVariants}
          animate={controls}
          initial="normal"
          custom={3}
        />
        <motion.circle
          cx="16.6"
          cy="15.89"
          r="3"
          variants={grapeVariants}
          animate={controls}
          initial="normal"
          custom={4}
        />
        <motion.circle
          cx="10.8"
          cy="17.44"
          r="3"
          variants={grapeVariants}
          animate={controls}
          initial="normal"
          custom={5}
        />
        <motion.circle
          cx="8.11"
          cy="7.4"
          r="3"
          variants={grapeVariants}
          animate={controls}
          initial="normal"
          custom={6}
        />
        <motion.circle
          cx="6.56"
          cy="13.2"
          r="3"
          variants={grapeVariants}
          animate={controls}
          initial="normal"
          custom={7}
        />
        <motion.circle
          cx="5"
          cy="19"
          r="3"
          variants={grapeVariants}
          animate={controls}
          initial="normal"
          custom={8}
        />
      </svg>
    </div>
  );
};

export { Grape };
