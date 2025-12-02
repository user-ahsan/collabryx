"use client";

import { motion, useAnimation } from "motion/react";
import type { Variants } from "motion/react";

interface ChevronsLeftProps extends React.SVGAttributes<SVGSVGElement> {
  width?: number;
  height?: number;
  strokeWidth?: number;
  stroke?: string;
}

const chevronVariants: Variants = {
  normal: {
    x: 0,
    opacity: 1,
  },
  animate: {
    x: [-4, 0],
    opacity: [0.3, 1],
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

const ChevronsLeft = ({
  width = 28,
  height = 28,
  strokeWidth = 2,
  stroke = "#ffffff",
  ...props
}: ChevronsLeftProps) => {
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
          d="m11 17-5-5 5-5"
          variants={chevronVariants}
          animate={controls}
          initial="normal"
          custom={0}
          transition={{ delay: 0 }}
        />
        <motion.path
          d="m18 17-5-5 5-5"
          variants={chevronVariants}
          animate={controls}
          initial="normal"
          custom={1}
          transition={{ delay: 0.1 }}
        />
      </svg>
    </div>
  );
};

export { ChevronsLeft };
