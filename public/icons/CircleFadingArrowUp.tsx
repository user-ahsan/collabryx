"use client";

import type { Transition } from "motion/react";
import { motion, useAnimation } from "motion/react";

interface CircleFadingArrowUpProps extends React.SVGAttributes<SVGSVGElement> {
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

const CircleFadingArrowUp = ({
  width = 28,
  height = 28,
  strokeWidth = 2,
  stroke = "#ffffff",
  ...props
}: CircleFadingArrowUpProps) => {
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
        <path d="M12 2a10 10 0 0 1 7.38 16.75" />
        <motion.g
          variants={{
            normal: { translateY: "0%" },
            animate: { translateY: "-2px" },
          }}
          transition={defaultTransition}
          animate={controls}
          initial="normal"
        >
          <path d="m16 12-4-4-4 4" />
          <path d="M12 16V8" />
        </motion.g>
        <path d="M2.5 8.875a10 10 0 0 0-.5 3" />
        <path d="M2.83 16a10 10 0 0 0 2.43 3.4" />
        <path d="M4.636 5.235a10 10 0 0 1 .891-.857" />
        <path d="M8.644 21.42a10 10 0 0 0 7.631-.38" />
      </svg>
    </div>
  );
};

export { CircleFadingArrowUp };
