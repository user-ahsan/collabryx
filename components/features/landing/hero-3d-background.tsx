"use client"

import * as React from "react"
import { Canvas } from "@react-three/fiber"
import { useGLTF, OrbitControls, Environment } from "@react-three/drei"
import { useTheme } from "next-themes"

const Model: React.FC<{ isDark: boolean }> = ({ isDark }) => {
    const { scene } = useGLTF("/Models/knowledge_network.glb")
    const meshRef = React.useRef<any>(null)

    React.useEffect(() => {
        if (meshRef.current) {
            meshRef.current.rotation.y += 0.001
        }
    })

    return (
        <primitive
            ref={meshRef}
            object={scene}
            scale={1.5}
            position={[0, 0, 0]}
        />
    )
}

export const Hero3DBackground: React.FC = () => {
    const { theme, systemTheme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return null
    }

    const currentTheme = theme === "system" ? systemTheme : theme
    const isDark = currentTheme === "dark"

    return (
        <div className="absolute inset-0 -z-10">
            <Canvas
                camera={{ position: [0, 0, 5], fov: 50 }}
                className="h-full w-full"
                gl={{ alpha: true, antialias: true }}
            >
                <ambientLight intensity={isDark ? 0.3 : 0.5} />
                <directionalLight
                    position={[10, 10, 5]}
                    intensity={isDark ? 0.5 : 1}
                />
                <pointLight position={[-10, -10, -5]} intensity={isDark ? 0.3 : 0.5} />

                <React.Suspense fallback={null}>
                    <Model isDark={isDark} />
                    <Environment preset={isDark ? "night" : "sunset"} />
                </React.Suspense>

                <OrbitControls
                    enableZoom={false}
                    enablePan={false}
                    autoRotate
                    autoRotateSpeed={0.5}
                    maxPolarAngle={Math.PI / 2}
                    minPolarAngle={Math.PI / 2}
                />
            </Canvas>

            {/* Gradient overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/30 to-background" />
        </div>
    )
}

// Preload the model
useGLTF.preload("/Models/knowledge_network.glb")
