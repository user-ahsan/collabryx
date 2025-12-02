"use client";

import { motion, useAnimation } from "motion/react";
import type { Variants } from "motion/react";

interface AudioLinesProps extends React.SVGAttributes<SVGSVGElement> {
  width?: number;
  height?: number;
  strokeWidth?: number;
  stroke?: string;
}

const lineVariants: Variants = {
  normal: {
    scaleY: 0.5,
    opacity: 0.5,
  },
  animate: {
    scaleY: [0.5, 1, 0.5],
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 1,
      ease: "easeInOut",
      repeat: Infinity,
    },
  },
};

const AudioLines = ({
  width = 28,
  height = 28,
  strokeWidth = 2,
  stroke = "#ffffff",
  ...props
}: AudioLinesProps) => {
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
          variants={lineVariants}
          animate={controls}
          initial="normal"
          style={{ originY: 0.5 }}
        >
          <motion.path d="M2 10v3" custom={0} transition={{ delay: 0 }} />
          <motion.path d="M6 6v11" custom={1} transition={{ delay: 0.1 }} />
          <motion.path d="M10 3v18" custom={2} transition={{ delay: 0.2 }} />
          <motion.path d="M14 8v7" custom={3} transition={{ delay: 0.3 }} />
          <motion.path d="M18 5v13" custom={4} transition={{ delay: 0.4 }} />
          <motion.path d="M22 10v3" custom={5} transition={{ delay: 0.5 }} />
        </motion.g>
      </svg>
    </div>
  );
};

export { AudioLines };
