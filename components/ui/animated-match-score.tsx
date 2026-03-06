"use client";

import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";

export function AnimatedMatchScore() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });
    const [progress, setProgress] = useState(65);

    useEffect(() => {
        if (isInView) {
            let start = 65;
            const end = 94;
            const duration = 1200;
            const increment = (end - start) / (duration / 16);

            const timer = setInterval(() => {
                start += increment;
                if (start >= end) {
                    start = end;
                    clearInterval(timer);
                }
                setProgress(Math.floor(start));
            }, 16);

            return () => clearInterval(timer);
        }
    }, [isInView]);

    const circumference = 2 * Math.PI * 46; // radius 46
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
        <div ref={ref} className="flex flex-col items-center relative z-10 shrink-0 mx-auto">
            {/* Glowing ring container */}
            <div className="relative w-40 h-40">
                <svg className="w-40 h-40 -rotate-90" viewBox="0 0 100 100">
                    {/* Background circle */}
                    <circle
                        cx="50"
                        cy="50"
                        r="46"
                        fill="none"
                        stroke="#1f2937"
                        strokeWidth="8"
                    />
                    {/* Animated progress circle */}
                    <motion.circle
                        cx="50"
                        cy="50"
                        r="46"
                        fill="none"
                        stroke="#22d3ee" // brand accent color
                        strokeWidth="8"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset }}
                        transition={{ duration: 1.4, ease: "easeOut" }}
                    />
                </svg>

                {/* Center content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <motion.span
                        className="text-5xl font-bold tracking-tighter text-white"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.6 }}
                    >
                        {progress}%
                    </motion.span>
                    <span className="text-[10px] uppercase tracking-[3px] text-zinc-400 mt-1 font-medium">MATCH</span>
                </div>
            </div>

            <div className="mt-4 text-center">
                <div className="text-[10px] font-medium text-cyan-400 tracking-widest mb-1">INTELLIGENT MATCH</div>
                <div className="text-xs text-zinc-500 font-medium">Based on skills • goals • availability</div>
            </div>
        </div>
    );
}
