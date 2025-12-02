"use client";

import type { Transition } from "motion/react";
import { motion, useAnimation } from "motion/react";

interface CropProps extends React.SVGAttributes<SVGSVGElement> {
  width?: number;
  height?: number;
  strokeWidth?: number;
  stroke?: string;
}

const defaultTransition: Transition = {
  type: "spring",
  stiffness: 250,
  damping: 25,
};

const Crop = ({
  width = 28,
  height = 28,
  strokeWidth = 2,
  stroke = "#ffffff",
  ...props
}: CropProps) => {
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
          variants={{
            normal: { pathLength: 1, opacity: 1 },
            animate: { pathLength: [0, 1], opacity: [0, 1] },
          }}
          transition={{ ...defaultTransition, delay: 0 }}
          animate={controls}
          initial="normal"
          d="M6 2v14a2 2 0 0 0 2 2h14"
        />
        <motion.path
          variants={{
            normal: { pathLength: 1, opacity: 1 },
            animate: { pathLength: [0, 1], opacity: [0, 1] },
          }}
          transition={{ ...defaultTransition, delay: 0.1 }}
          animate={controls}
          initial="normal"
          d="M18 22V8a2 2 0 0 0-2-2H2"
        />
      </svg>
    </div>
  );
};

export { Crop };
