"use client"

import { Canvas } from "@react-three/fiber"
import { OrbitControls, useGLTF, Center, Environment } from "@react-three/drei"
import { Suspense } from "react"

// Preload the model to prevent stuttering and repeated loading
useGLTF.preload("/Models/scene.gltf")

function Model() {
    const { scene } = useGLTF("/Models/scene.gltf")
    return <primitive object={scene} scale={0.02} />
}

export function Hero3DViewer() {
    return (
        <div className="h-[400px] w-full lg:h-[600px]">
            <Canvas dpr={[1, 1.5]} camera={{ fov: 50, position: [0, 0, 150] }}>
                <Suspense fallback={null}>
                    <Center>
                        <Model />
                    </Center>

                    {/* Blue ambient light for tint */}
                    <ambientLight intensity={0.5} color="#3b82f6" />
                    {/* Blue point light for highlights */}
                    <pointLight position={[10, 10, 10]} intensity={1} color="#60a5fa" />

                    <OrbitControls
                        autoRotate
                        autoRotateSpeed={0.5}
                        enableZoom={false}
                        makeDefault
                    />
                    <Environment preset="city" />
                </Suspense>
            </Canvas>
        </div>
    )
}
