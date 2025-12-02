"use client";

import type { Transition } from "motion/react";
import { motion, useAnimation } from "motion/react";

const defaultTransition: Transition = {
  type: "spring",
  stiffness: 250,
  damping: 25,
};

interface Maximize2Props extends React.SVGAttributes<SVGSVGElement> {
  width?: number;
  height?: number;
  strokeWidth?: number;
  stroke?: string;
}

const Maximize2 = ({
  width = 28,
  height = 28,
  strokeWidth = 2,
  stroke = "#ffffff",
  ...props
}: Maximize2Props) => {
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
        <motion.g
          variants={{
            normal: { x: 0, y: 0 },
            animate: { x: 2, y: -2 },
          }}
          transition={defaultTransition}
          animate={controls}
          initial="normal"
        >
          <polyline points="15 3 21 3 21 9" />
          <line x1="21" x2="14" y1="3" y2="10" />
        </motion.g>
        <motion.g
          variants={{
            normal: { x: 0, y: 0 },
            animate: { x: -2, y: 2 },
          }}
          transition={defaultTransition}
          animate={controls}
          initial="normal"
        >
          <polyline points="9 21 3 21 3 15" />
          <line x1="3" x2="10" y1="21" y2="14" />
        </motion.g>
      </svg>
    </div>
  );
};

export { Maximize2 };
