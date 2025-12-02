"use client";

import { motion, useAnimation } from "motion/react";
import type { Variants } from "motion/react";

interface AlbumProps extends React.SVGAttributes<SVGSVGElement> {
  width?: number;
  height?: number;
  strokeWidth?: number;
  stroke?: string;
}

const bookmarkVariants: Variants = {
  normal: {
    scaleY: 1,
    originY: 0,
  },
  animate: {
    scaleY: [1.2, 0.8, 1],
    transition: {
      duration: 0.6,
      times: [0.4, 0.7, 1],
      type: "spring",
      stiffness: 300,
      damping: 10,
    },
  },
};

const Album = ({
  width = 28,
  height = 28,
  strokeWidth = 2,
  stroke = "#ffffff",
  ...props
}: AlbumProps) => {
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
        <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
        <motion.path
          d="M11 3 L11 11 L14 8 L17 11 L17 3"
          variants={bookmarkVariants}
          animate={controls}
          initial="normal"
        />
      </svg>
    </div>
  );
};

export { Album };
