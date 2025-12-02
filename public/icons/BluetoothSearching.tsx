"use client";

import { motion, useAnimation } from "motion/react";
import type { Variants } from "motion/react";

interface BluetoothSearchingProps extends React.SVGAttributes<SVGSVGElement> {
  width?: number;
  height?: number;
  strokeWidth?: number;
  stroke?: string;
}

const pathVariants: Variants = {
  normal: {
    scale: 1,
    transition: {
      repeat: 0,
    },
  },
  animate: {
    scale: [0, 1, 0.8],
  },
};

const secondVariants: Variants = {
  normal: {
    opacity: 1,
  },
  animate: {
    opacity: [1, 0.8, 1],
    transition: { repeat: Infinity },
  },
};

const BluetoothSearching = ({
  width = 28,
  height = 28,
  strokeWidth = 2,
  stroke = "#ffffff",
  ...props
}: BluetoothSearchingProps) => {
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
          variants={secondVariants}
          animate={controls}
          d="m7 7 10 10-5 5V2l5 5L7 17"
        />
        <motion.path
          variants={pathVariants}
          animate={controls}
          transition={{
            duration: 0.6,
            delay: 0.2,
            repeat: Infinity,
          }}
          d="M20.83 14.83a4 4 0 0 0 0-5.66"
        />
        <motion.path
          variants={pathVariants}
          animate={controls}
          transition={{
            duration: 0.6,
            repeat: Infinity,
          }}
          d="M18 12h.01"
        />
      </svg>
    </div>
  );
};

export { BluetoothSearching };
