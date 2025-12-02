"use client";

import type { Variants } from "motion/react";
import { motion, useAnimation } from "motion/react";

const containerVariants: Variants = {
  normal: {
    rotate: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25,
    },
  },
  animate: {
    rotate: -45,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25,
    },
  },
};

const liquidVariants: Variants = {
  normal: {
    pathLength: 1,
    pathOffset: 0,
    transition: {
      duration: 0.4,
      ease: "easeInOut",
    },
  },
  animate: {
    pathLength: 1.2,
    pathOffset: 0.1,
    transition: {
      duration: 0.4,
      ease: "easeInOut",
      delay: 0.1,
    },
  },
};

interface TestTubesProps extends React.SVGAttributes<SVGSVGElement> {
  width?: number;
  height?: number;
  strokeWidth?: number;
  stroke?: string;
}

const TestTubes = ({
  width = 28,
  height = 28,
  strokeWidth = 2,
  stroke = "#ffffff",
  ...props
}: TestTubesProps) => {
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
      <motion.svg
        xmlns="http://www.w3.org/2000/svg"
        width={width}
        height={height}
        viewBox="0 0 24 24"
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        variants={containerVariants}
        animate={controls}
        style={{ originX: "50%", originY: "50%" }}
      >
        <path d="M14.5 2v17.5c0 1.4-1.1 2.5-2.5 2.5c-1.4 0-2.5-1.1-2.5-2.5V2" />
        <path d="M8.5 2h7" />
        <motion.path
          d="M14.5 16h-5"
          variants={liquidVariants}
          animate={controls}
          initial="normal"
          strokeDasharray="6 3"
          style={{ originX: "50%", originY: "50%" }}
        />
      </motion.svg>
    </div>
  );
};

export { TestTubes };
