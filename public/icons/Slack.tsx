"use client";

import type { Variants } from "motion/react";
import { motion, useAnimation } from "motion/react";

const pathVariants: Variants = {
  normal: {
    pathLength: 1,
    opacity: 1,
  },
  animate: (i: number) => ({
    pathLength: [0, 1],
    opacity: [0, 1],
    transition: {
      duration: 0.5,
      delay: i * 0.1,
      ease: "easeInOut",
    },
  }),
};

interface SlackProps extends React.SVGAttributes<SVGSVGElement> {
  width?: number;
  height?: number;
  strokeWidth?: number;
  stroke?: string;
}

const Slack = ({
  width = 28,
  height = 28,
  strokeWidth = 2,
  stroke = "#ffffff",
  ...props
}: SlackProps) => {
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
          width="3"
          height="8"
          x="13"
          y="2"
          rx="1.5"
          variants={pathVariants}
          animate={controls}
          custom={0}
        />
        <motion.path
          d="M19 8.5V10h1.5A1.5 1.5 0 1 0 19 8.5"
          variants={pathVariants}
          animate={controls}
          custom={1}
        />
        <motion.rect
          width="3"
          height="8"
          x="8"
          y="14"
          rx="1.5"
          variants={pathVariants}
          animate={controls}
          custom={2}
        />
        <motion.path
          d="M5 15.5V14H3.5A1.5 1.5 0 1 0 5 15.5"
          variants={pathVariants}
          animate={controls}
          custom={3}
        />
        <motion.rect
          width="8"
          height="3"
          x="14"
          y="13"
          rx="1.5"
          variants={pathVariants}
          animate={controls}
          custom={4}
        />
        <motion.path
          d="M15.5 19H14v1.5a1.5 1.5 0 1 0 1.5-1.5"
          variants={pathVariants}
          animate={controls}
          custom={5}
        />
        <motion.rect
          width="8"
          height="3"
          x="2"
          y="8"
          rx="1.5"
          variants={pathVariants}
          animate={controls}
          custom={6}
        />
        <motion.path
          d="M8.5 5H10V3.5A1.5 1.5 0 1 0 8.5 5"
          variants={pathVariants}
          animate={controls}
          custom={7}
        />
      </svg>
    </div>
  );
};

export { Slack };
