"use client";

import type { Variants } from "motion/react";
import { motion, useAnimation } from "motion/react";

const waveVariants: Variants = {
  normal: {
    scale: 1,
    opacity: 1,
  },
  animate: (custom: number) => ({
    scale: [1, 1.2, 1],
    opacity: [1, 0.5, 1],
    transition: {
      duration: 1.5,
      delay: custom * 0.2,
      repeat: Infinity,
    },
  }),
};

const dotVariant: Variants = {
  normal: {
    scale: 1,
  },
  animate: {
    scale: [1, 1.2, 1],
    transition: {
      duration: 0.6,
      repeat: Infinity,
    },
  },
};

interface PodcastProps extends React.SVGAttributes<SVGSVGElement> {
  width?: number;
  height?: number;
  strokeWidth?: number;
  stroke?: string;
}

const Podcast = ({
  width = 28,
  height = 28,
  strokeWidth = 2,
  stroke = "#ffffff",
  ...props
}: PodcastProps) => {
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
          d="M16.85 18.58a9 9 0 1 0-9.7 0"
          variants={waveVariants}
          animate={controls}
          custom={0}
        />
        <motion.path
          d="M8 14a5 5 0 1 1 8 0"
          variants={waveVariants}
          animate={controls}
          custom={1}
        />
        <motion.circle
          cx="12"
          cy="11"
          r="1"
          variants={dotVariant}
          animate={controls}
        />
        <path d="M13 17a1 1 0 1 0-2 0l.5 4.5a.5.5 0 1 0 1 0Z" />
      </svg>
    </div>
  );
};

export { Podcast };
