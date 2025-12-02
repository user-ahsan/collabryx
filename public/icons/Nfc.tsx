"use client";

import { motion, useAnimation } from "motion/react";

const DURATION = 0.25;

const calculateDelay = (i: number) => {
  return i === 0 ? 0.1 : i * DURATION + 0.1;
};

interface NfcProps extends React.SVGAttributes<SVGSVGElement> {
  width?: number;
  height?: number;
  strokeWidth?: number;
  stroke?: string;
}

const Nfc = ({
  width = 28,
  height = 28,
  strokeWidth = 2,
  stroke = "#ffffff",
  ...props
}: NfcProps) => {
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
          d="M6 8.32a7.43 7.43 0 0 1 0 7.36"
          animate={controls}
          transition={{
            duration: DURATION,
            delay: calculateDelay(0),
            opacity: { delay: calculateDelay(0) },
          }}
          variants={{
            normal: {
              pathLength: 1,
              pathOffset: 0,
              opacity: 1,
              transition: { delay: 0 },
            },
            animate: {
              pathOffset: [1, 0],
              pathLength: [0, 1],
              opacity: [0, 1],
            },
          }}
        />
        <motion.path
          d="M9.46 6.21a11.76 11.76 0 0 1 0 11.58"
          animate={controls}
          transition={{
            duration: DURATION,
            delay: calculateDelay(1),
            opacity: { delay: calculateDelay(1) },
          }}
          variants={{
            normal: {
              pathLength: 1,
              pathOffset: 0,
              opacity: 1,
              transition: { delay: 0 },
            },
            animate: {
              pathOffset: [1, 0],
              pathLength: [0, 1],
              opacity: [0, 1],
            },
          }}
        />
        <motion.path
          d="M12.91 4.1a15.91 15.91 0 0 1 .01 15.8"
          animate={controls}
          transition={{
            duration: DURATION,
            delay: calculateDelay(2),
            opacity: { delay: calculateDelay(2) },
          }}
          variants={{
            normal: {
              pathLength: 1,
              pathOffset: 0,
              opacity: 1,
              transition: { delay: 0 },
            },
            animate: {
              pathOffset: [1, 0],
              pathLength: [0, 1],
              opacity: [0, 1],
            },
          }}
        />
        <motion.path
          d="M16.37 2a20.16 20.16 0 0 1 0 20"
          animate={controls}
          transition={{
            duration: DURATION,
            delay: calculateDelay(3),
            opacity: { delay: calculateDelay(3) },
          }}
          variants={{
            normal: {
              pathLength: 1,
              pathOffset: 0,
              opacity: 1,
              transition: { delay: 0 },
            },
            animate: {
              pathOffset: [1, 0],
              pathLength: [0, 1],
              opacity: [0, 1],
            },
          }}
        />
      </svg>
    </div>
  );
};

export { Nfc };
