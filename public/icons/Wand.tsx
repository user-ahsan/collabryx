"use client";

import type { Variants } from "motion/react";
import { motion, useAnimation } from "motion/react";

const wandVariants: Variants = {
  normal: {
    opacity: 1,
  },
  animate: {
    opacity: 1,
  },
};

const sparkleVariants: Variants = {
  normal: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.2,
      ease: "easeOut",
    },
  },
  animate: (i: number) => ({
    opacity: [1, 0.5, 1],
    scale: [1, 1.05, 1],
    y: [0, -1, 0],
    transition: {
      duration: 1.2,
      delay: i * 0.1,
      ease: "easeInOut",
    },
  }),
};

interface WandProps extends React.SVGAttributes<SVGSVGElement> {
  width?: number;
  height?: number;
  strokeWidth?: number;
  stroke?: string;
}

const Wand = ({
  width = 28,
  height = 28,
  strokeWidth = 2,
  stroke = "#ffffff",
  ...props
}: WandProps) => {
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
        {/* Main wand */}
        <motion.path
          d="m3 21 9-9"
          variants={wandVariants}
          animate={controls}
          initial="normal"
        />
        {/* Floating sparkles */}
        <motion.path
          d="M15 4V2"
          variants={sparkleVariants}
          animate={controls}
          initial="normal"
          custom={0}
        />
        <motion.path
          d="M15 16v-2"
          variants={sparkleVariants}
          animate={controls}
          initial="normal"
          custom={1}
        />
        <motion.path
          d="M8 9h2"
          variants={sparkleVariants}
          animate={controls}
          initial="normal"
          custom={2}
        />
        <motion.path
          d="M20 9h2"
          variants={sparkleVariants}
          animate={controls}
          initial="normal"
          custom={3}
        />
        <motion.path
          d="M17.8 11.8 19 13"
          variants={sparkleVariants}
          animate={controls}
          initial="normal"
          custom={4}
        />
        <motion.path
          d="M15 9h.01"
          variants={sparkleVariants}
          animate={controls}
          initial="normal"
          custom={5}
        />
        <motion.path
          d="M17.8 6.2 19 5"
          variants={sparkleVariants}
          animate={controls}
          initial="normal"
          custom={6}
        />
        <motion.path
          d="M12.2 6.2 11 5"
          variants={sparkleVariants}
          animate={controls}
          initial="normal"
          custom={7}
        />
      </svg>
    </div>
  );
};

export { Wand };
