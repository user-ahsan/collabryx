"use client";

import type { Variants } from "motion/react";
import { motion, useAnimation } from "motion/react";

interface BoxesProps extends React.SVGAttributes<SVGSVGElement> {
  width?: number;
  height?: number;
  strokeWidth?: number;
  stroke?: string;
}

const pathVariants: Variants = {
  normal: {
    pathLength: 1,
    transition: {
      duration: 0.3,
      ease: "easeInOut",
    },
  },
  animate: {
    pathLength: [0, 1],
    transition: {
      duration: 1,
      ease: "easeInOut",
    },
  },
};

const boxVariants: Variants = {
  normal: {
    offsetDistance: "0%",
    transition: {
      duration: 0.3,
      ease: "easeInOut",
    },
  },
  animate: {
    offsetDistance: "100%",
    transition: {
      duration: 1,
      ease: "easeInOut",
    },
  },
};

const Boxes = ({
  width = 28,
  height = 28,
  strokeWidth = 2,
  stroke = "#ffffff",
  ...props
}: BoxesProps) => {
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
        {/* Bottom left box */}
        <motion.path
          d="M2.97 12.92A2 2 0 0 0 2 14.63v3.24a2 2 0 0 0 .97 1.71l3 1.8a2 2 0 0 0 2.06 0L12 19v-5.5l-5-3-4.03 2.42Z"
          variants={pathVariants}
          animate={controls}
        />
        <motion.path
          d="m7 16.5-4.74-2.85"
          variants={pathVariants}
          animate={controls}
        />
        <motion.path
          d="m7 16.5 5-3"
          variants={pathVariants}
          animate={controls}
        />
        <motion.path
          d="M7 16.5v5.17"
          variants={pathVariants}
          animate={controls}
        />

        {/* Bottom right box */}
        <motion.path
          d="M12 13.5V19l3.97 2.38a2 2 0 0 0 2.06 0l3-1.8a2 2 0 0 0 .97-1.71v-3.24a2 2 0 0 0-.97-1.71L17 10.5l-5 3Z"
          variants={pathVariants}
          animate={controls}
        />
        <motion.path
          d="m17 16.5-5-3"
          variants={pathVariants}
          animate={controls}
        />
        <motion.path
          d="m17 16.5 4.74-2.85"
          variants={pathVariants}
          animate={controls}
        />
        <motion.path
          d="M17 16.5v5.17"
          variants={pathVariants}
          animate={controls}
        />

        {/* Top box */}
        <motion.path
          d="M7.97 4.42A2 2 0 0 0 7 6.13v4.37l5 3 5-3V6.13a2 2 0 0 0-.97-1.71l-3-1.8a2 2 0 0 0-2.06 0l-3 1.8Z"
          variants={pathVariants}
          animate={controls}
        />
        <motion.path
          d="M12 8 7.26 5.15"
          variants={pathVariants}
          animate={controls}
        />
        <motion.path
          d="m12 8 4.74-2.85"
          variants={pathVariants}
          animate={controls}
        />
        <motion.path
          d="M12 13.5V8"
          variants={pathVariants}
          animate={controls}
        />

        {/* Dot that follows the path */}
        <motion.circle
          cx="12"
          cy="12"
          r="1"
          fill="currentColor"
          style={{
            offsetPath:
              "path('M7.97 4.42A2 2 0 0 0 7 6.13v4.37l5 3 5-3V6.13a2 2 0 0 0-.97-1.71l-3-1.8a2 2 0 0 0-2.06 0l-3 1.8Z M12 8 7.26 5.15 M12 8 4.74-2.85 M12 13.5V8 M2.97 12.92A2 2 0 0 0 2 14.63v3.24a2 2 0 0 0 .97 1.71l3 1.8a2 2 0 0 0 2.06 0L12 19v-5.5l-5-3-4.03 2.42Z M7 16.5l-4.74-2.85 M7 16.5l5-3 M7 16.5v5.17 M12 13.5V19l3.97 2.38a2 2 0 0 0 2.06 0l3-1.8a2 2 0 0 0 .97-1.71v-3.24a2 2 0 0 0-.97-1.71L17 10.5l-5 3Z')",
          }}
          variants={boxVariants}
          animate={controls}
        />
      </svg>
    </div>
  );
};

export { Boxes };
