"use client"

import { Canvas, useThree } from "@react-three/fiber"
import { OrbitControls, useGLTF, Center } from "@react-three/drei"
import { Suspense, useEffect, useState } from "react"
import { Slider } from "@/components/ui/slider"
import * as THREE from "three"

// Preload the model to prevent stuttering and repeated loading
useGLTF.preload("/Models/scene.gltf")

function Model() {
    const { scene } = useGLTF("/Models/scene.gltf")
    const [isDark, setIsDark] = useState(true)

    useEffect(() => {
        // Detect theme
        const checkTheme = () => {
            const isDarkMode = document.documentElement.classList.contains('dark')
            setIsDark(isDarkMode)
        }

        checkTheme()

        // Watch for theme changes
        const observer = new MutationObserver(checkTheme)
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

        return () => observer.disconnect()
    }, [])

    useEffect(() => {
        // Apply colors based on theme
        scene.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                if (Array.isArray(child.material)) {
                    child.material = child.material.map(mat => {
                        const newMat = mat.clone()
                        // Dark mode: bright blue, Light mode: darker blue with less emissive
                        newMat.color = new THREE.Color(isDark ? 0x3b82f6 : 0x1e40af)
                        newMat.emissive = new THREE.Color(isDark ? 0x1e40af : 0x1e3a8a)
                        newMat.emissiveIntensity = isDark ? 0.2 : 0.4
                        return newMat
                    })
                } else {
                    const newMat = child.material.clone()
                    newMat.color = new THREE.Color(isDark ? 0x3b82f6 : 0x1e40af)
                    newMat.emissive = new THREE.Color(isDark ? 0x1e40af : 0x1e3a8a)
                    newMat.emissiveIntensity = isDark ? 0.2 : 0.4
                    child.material = newMat
                }
            }
        })
    }, [scene, isDark])

    return <primitive object={scene} scale={0.035} />
}

export function Hero3DViewer() {
    const [zoomLevel, setZoomLevel] = useState([50]) // Initial zoom level (middle)

    return (
        <div className="h-full w-full absolute inset-0">
            <Canvas dpr={[1, 1.5]} camera={{ fov: 50, position: [0, 0, 150] }}>
                <Suspense fallback={null}>
                    <Center>
                        <Model />
                    </Center>

                    {/* Blue ambient light */}
                    <ambientLight intensity={0.6} color="#3b82f6" />
                    {/* Blue point lights for highlights */}
                    <pointLight position={[10, 10, 10]} intensity={1.2} color="#60a5fa" />
                    <pointLight position={[-10, -10, -10]} intensity={0.5} color="#3b82f6" />
                    {/* Blue directional light for depth */}
                    <directionalLight position={[-5, 5, 5]} intensity={0.6} color="#60a5fa" />

                    <OrbitControls
                        autoRotate
                        autoRotateSpeed={0.5}
                        enableZoom={false} // Disable scroll zoom
                        minDistance={80}
                        maxDistance={250}
                        makeDefault
                    />
                    <CameraController zoomLevel={zoomLevel[0]} />
                </Suspense>
            </Canvas>

            {/* Zoom Slider */}
            {/* Zoom Slider */}
            <div className="absolute right-8 top-1/2 -translate-y-1/2 h-48 z-50">
                <Slider
                    defaultValue={[50]}
                    max={100}
                    step={1}
                    value={zoomLevel}
                    onValueChange={setZoomLevel}
                    orientation="vertical"
                    className="h-full"
                />
            </div>
        </div>
    )
}

function CameraController({ zoomLevel }: { zoomLevel: number }) {
    const { camera } = useThree()

    useEffect(() => {
        // Map zoom level (0-100) to distance (250-80)
        // 0 -> 250 (far)
        // 100 -> 80 (close)
        const minDist = 80
        const maxDist = 250
        const distance = maxDist - (zoomLevel / 100) * (maxDist - minDist)

        // Move camera along its current direction to the new distance
        const direction = new THREE.Vector3().copy(camera.position).normalize()
        camera.position.copy(direction.multiplyScalar(distance))
        camera.updateProjectionMatrix()
    }, [zoomLevel, camera])

    return null
}
