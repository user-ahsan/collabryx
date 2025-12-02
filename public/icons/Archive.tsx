"use client";

import { motion, useAnimation } from "motion/react";
import type { Variants } from "motion/react";

interface ArchiveProps extends React.SVGAttributes<SVGSVGElement> {
  width?: number;
  height?: number;
  strokeWidth?: number;
  stroke?: string;
}

const rectVariants: Variants = {
  normal: {
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25,
    },
  },
  animate: {
    y: -1.5,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25,
    },
  },
};

const pathVariants: Variants = {
  normal: {
    d: "M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8",
    transition: {
      duration: 0.3,
      ease: "easeInOut",
    },
  },
  animate: {
    d: "M4 11v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V11",
    transition: {
      duration: 0.3,
      ease: "easeInOut",
    },
  },
};

const lineVariants: Variants = {
  normal: {
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeInOut",
    },
  },
  animate: {
    y: 3,
    transition: {
      duration: 0.3,
      ease: "easeInOut",
    },
  },
};

const Archive = ({
  width = 28,
  height = 28,
  strokeWidth = 2,
  stroke = "#ffffff",
  ...props
}: ArchiveProps) => {
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
          width="20"
          height="5"
          x="2"
          y="3"
          rx="1"
          variants={rectVariants}
          animate={controls}
          initial="normal"
        />
        <motion.path
          d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"
          variants={pathVariants}
          animate={controls}
          initial="normal"
        />
        <motion.path
          d="M10 12h4"
          variants={lineVariants}
          animate={controls}
          initial="normal"
        />
      </svg>
    </div>
  );
};

export { Archive };
