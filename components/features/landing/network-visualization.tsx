"use client"

import { motion } from "motion/react"
import { useState } from "react"

interface Node {
    id: number
    x: number
    y: number
    size: number
}

interface Connection {
    from: number
    to: number
}

export const NetworkVisualization = () => {
    const [nodes] = useState<Node[]>([
        { id: 1, x: 20, y: 20, size: 12 },
        { id: 2, x: 80, y: 15, size: 10 },
        { id: 3, x: 60, y: 50, size: 14 },
        { id: 4, x: 15, y: 70, size: 8 },
        { id: 5, x: 85, y: 75, size: 10 },
        { id: 6, x: 40, y: 35, size: 6 },
        { id: 7, x: 50, y: 80, size: 8 },
    ])

    const [connections] = useState<Connection[]>([
        { from: 1, to: 3 },
        { from: 1, to: 6 },
        { from: 2, to: 3 },
        { from: 3, to: 6 },
        { from: 3, to: 7 },
        { from: 4, to: 6 },
        { from: 4, to: 7 },
        { from: 5, to: 3 },
        { from: 5, to: 7 },
    ])

    const getNodePosition = (nodeId: number) => {
        const node = nodes.find(n => n.id === nodeId)
        return node ? { x: node.x, y: node.y } : { x: 0, y: 0 }
    }

    return (
        <div className="relative w-full h-full flex items-center justify-center">
            <svg
                viewBox="0 0 100 100"
                className="w-full h-full max-w-[500px] max-h-[500px]"
                style={{ filter: "drop-shadow(0 0 20px hsl(var(--primary) / 0.3))" }}
            >
                {/* Connection Lines */}
                {connections.map((connection, idx) => {
                    const from = getNodePosition(connection.from)
                    const to = getNodePosition(connection.to)
                    return (
                        <motion.line
                            key={`connection-${idx}`}
                            x1={from.x}
                            y1={from.y}
                            x2={to.x}
                            y2={to.y}
                            stroke="hsl(var(--primary) / 0.3)"
                            strokeWidth="0.5"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            transition={{
                                duration: 1.5,
                                delay: idx * 0.1 + 0.5,
                                ease: "easeInOut"
                            }}
                        />
                    )
                })}

                {/* Animated pulse lines */}
                {connections.slice(0, 3).map((connection, idx) => {
                    const from = getNodePosition(connection.from)
                    const to = getNodePosition(connection.to)
                    return (
                        <motion.line
                            key={`pulse-${idx}`}
                            x1={from.x}
                            y1={from.y}
                            x2={to.x}
                            y2={to.y}
                            stroke="hsl(var(--primary))"
                            strokeWidth="1"
                            strokeLinecap="round"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{
                                pathLength: [0, 1, 0],
                                opacity: [0, 1, 0]
                            }}
                            transition={{
                                duration: 3,
                                delay: idx * 0.8,
                                repeat: Infinity,
                                repeatDelay: 2,
                                ease: "easeInOut"
                            }}
                        />
                    )
                })}

                {/* Nodes */}
                {nodes.map((node, idx) => (
                    <g key={`node-${node.id}`}>
                        {/* Outer glow ring */}
                        <motion.circle
                            cx={node.x}
                            cy={node.y}
                            r={node.size}
                            fill="none"
                            stroke="hsl(var(--primary) / 0.2)"
                            strokeWidth="0.5"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                            transition={{
                                duration: 2,
                                delay: idx * 0.15,
                                repeat: Infinity,
                                repeatDelay: 1,
                                ease: "easeInOut"
                            }}
                        />

                        {/* Main node */}
                        <motion.circle
                            cx={node.x}
                            cy={node.y}
                            r={node.size / 2}
                            fill="hsl(var(--primary) / 0.8)"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{
                                duration: 0.6,
                                delay: idx * 0.15,
                                ease: "easeOut"
                            }}
                            whileHover={{ scale: 1.2 }}
                            style={{ cursor: "pointer" }}
                        />

                        {/* Inner highlight */}
                        <motion.circle
                            cx={node.x}
                            cy={node.y}
                            r={node.size / 4}
                            fill="hsl(var(--background))"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 0.9 }}
                            transition={{
                                duration: 0.6,
                                delay: idx * 0.15 + 0.2,
                                ease: "easeOut"
                            }}
                        />
                    </g>
                ))}
            </svg>
        </div>
    )
}
