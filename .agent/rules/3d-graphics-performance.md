# 🎨 3D Graphics Performance Optimization

**Trigger:** `always_on`

**Priority:** HIGH - Critical for Collabryx's 3D visualizations and user experience

---

## 🎯 Objective

Achieve smooth 60fps 3D rendering with:
- Frame time < 16.67ms
- Draw calls < 100 per frame
- Triangle count < 100K per scene
- Memory usage < 200MB for 3D assets

---

## ⚛️ React Three Fiber Patterns

### 1. **Component Optimization**

```typescript
// ✅ Use React.memo for static 3D components
const StaticModel = memo(() => (
  <mesh>
    <boxGeometry args={[1, 1, 1]} />
    <meshStandardMaterial color="blue" />
  </mesh>
))

// ✅ Use useMemo for expensive computations
function ProceduralMesh() {
  const geometry = useMemo(() => {
    const geo = new THREE.SphereGeometry(1, 32, 32)
    // Modify geometry
    return geo
  }, [])
  
  return <primitive object={geometry} />
}

// ✅ Use useCallback for event handlers
function InteractiveObject() {
  const handleClick = useCallback((e) => {
    console.log("Clicked!")
  }, [])
  
  return (
    <mesh onClick={handleClick}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="blue" />
    </mesh>
  )
}
```

### 2. **Dynamic Imports (MANDATORY)**

```typescript
// ✅ Always lazy load 3D components
const ModelViewer = dynamic(
  () => import("@/components/shared/model-viewer"),
  { 
    ssr: false,
    loading: () => <Skeleton className="w-full h-64" />
  }
)

const Globe = dynamic(
  () => import("@/components/ui/globe"),
  { 
    ssr: false,
    loading: () => <div className="h-96 bg-muted animate-pulse" />
  }
)

const GridBackground = dynamic(
  () => import("@/components/ui/grid-background"),
  { ssr: false }
)
```

**Why SSR: false?**
- Three.js requires `window` object
- WebGL not available server-side
- Reduces hydration time
- Smaller initial bundle

### 3. **Instancing for Multiple Objects**

```typescript
// ✅ Use InstancedMesh for 100+ identical objects
function ParticleField({ count = 1000 }) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  
  useEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    
    const dummy = new THREE.Object3D()
    for (let i = 0; i < count; i++) {
      dummy.position.set(
        Math.random() * 10 - 5,
        Math.random() * 10 - 5,
        Math.random() * 10 - 5
      )
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }
  }, [count])
  
  return (
    <instancedMesh ref={meshRef} args={[null, null, count]}>
      <sphereGeometry args={[0.05, 8, 8]} />
      <meshBasicMaterial color="#6366F1" />
    </instancedMesh>
  )
}

// ❌ AVOID - Individual meshes (1000 draw calls)
{Array.from({ length: 1000 }).map((_, i) => (
  <mesh key={i}>
    <sphereGeometry args={[0.05, 8, 8]} />
    <meshBasicMaterial color="#6366F1" />
  </mesh>
))}
```

---

## 🎭 Drei Helpers Optimization

### 1. **Environment & Lighting**

```typescript
// ✅ Use preset environments (optimized)
import { Environment, ContactShadows } from "@react-three/drei"

<Environment preset="studio" />
<ContactShadows 
  resolution={1024}  // ✅ Lower resolution
  scale={10}
  blur={2}
  opacity={0.5}
  far={10}
/>

// ❌ AVOID - HDRI with high resolution
<Environment resolution={2048} />  // Too heavy
```

### 2. **Model Loading**

```typescript
// ✅ Use GLTF with Draco compression
import { useGLTF } from "@react-three/drei"

function Model({ url }) {
  const { scene } = useGLTF(url)
  return <primitive object={scene} />
}

// Preload models
useGLTF.preload("/Models/scene.gltf")

// ✅ Optimize GLTF loader
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader"
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader"

const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath("/draco/")

const loader = new GLTFLoader()
loader.setDRACOLoader(dracoLoader)
```

### 3. **Performance Monitor**

```typescript
// ✅ Add performance monitoring
import { PerformanceMonitor } from "@react-three/drei"

<PerformanceMonitor
  onIncline={() => console.log("Performance improving")}
  onDecline={() => console.log("Performance declining")}
  onCritical={() => console.log("Performance critical")}
/>
```

---

## 🔧 Three.js Optimization

### 1. **Geometry Optimization**

```typescript
// ✅ Reduce polygon count
const lowPolySphere = new THREE.SphereGeometry(1, 16, 16)   // ✅ 512 vertices
const highPolySphere = new THREE.SphereGeometry(1, 64, 64)  // ❌ 8192 vertices

// ✅ Reuse geometries
const geometry = new THREE.BoxGeometry(1, 1, 1)

function Box({ position }) {
  return <mesh geometry={geometry} position={position}>
    <meshStandardMaterial color="blue" />
  </mesh>
}

// ❌ AVOID - New geometry for each mesh
function Box({ position }) {
  return <mesh position={position}>
    <boxGeometry args={[1, 1, 1]} />  // Creates new geometry
    <meshStandardMaterial color="blue" />
  </mesh>
}
```

### 2. **Material Optimization**

```typescript
// ✅ Reuse materials
const material = new THREE.MeshStandardMaterial({ color: "#6366F1" })

function Box({ position }) {
  return <mesh position={position} material={material} />
}

// ✅ Use simpler materials when possible
<meshBasicMaterial color="#6366F1" />  // ✅ No lighting calculation
<meshStandardMaterial color="#6366F1" />  // ❌ More expensive

// ✅ Dispose materials on unmount
useEffect(() => {
  return () => {
    material.dispose()
  }
}, [])
```

### 3. **Texture Optimization**

```typescript
// ✅ Use compressed textures
import { useTexture } from "@react-three/drei"

function TexturedMesh() {
  const texture = useTexture("/textures/compressed.ktx2")  // ✅ KTX2 format
  texture.compression = true
  
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial map={texture} />
    </mesh>
  )
}

// ✅ Set appropriate texture size
texture.minFilter = THREE.LinearMipmapLinearFilter
texture.magFilter = THREE.LinearFilter
texture.anisotropy = 4  // ✅ Lower anisotropy
```

---

## 🎬 Animation Performance

### 1. **useFrame Optimization**

```typescript
// ✅ Use delta time for smooth animation
import { useFrame } from "@react-three/fiber"

function RotatingObject() {
  const meshRef = useRef<THREE.Mesh>(null)
  
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5  // ✅ Frame-rate independent
    }
  })
  
  return <mesh ref={meshRefRef}>...</mesh>
}

// ✅ Optimize useFrame frequency
useFrame((state, delta) => {
  // Only update if visible
  if (!meshRef.current.visible) return
  
  // Only update every other frame
  if (state.clock.getElapsedTime() % 2 < 0.016) return
}, 1)  // ✅ Run at 30fps instead of 60fps

// ❌ AVOID - Heavy computations in useFrame
useFrame(() => {
  const positions = new Float32Array(10000)  // ❌ Allocates every frame
  for (let i = 0; i < 10000; i++) {
    positions[i] = Math.sin(Date.now() * 0.001 + i)  // ❌ 10000 sin calls
  }
})
```

### 2. **GSAP with Three.js**

```typescript
// ✅ Use GSAP for complex animations
import gsap from "gsap"

function AnimatedCamera() {
  const cameraRef = useRef<THREE.Group>(null)
  
  useEffect(() => {
    gsap.to(cameraRef.current.position, {
      x: 5,
      y: 3,
      z: 5,
      duration: 2,
      ease: "power2.inOut"
    })
  }, [])
  
  return <group ref={cameraRef}>...</group>
}
```

---

## 📊 Performance Checklist

### Pre-Commit Review

- [ ] Dynamic imports with `ssr: false`?
- [ ] Instancing for 100+ objects?
- [ ] Reused geometries and materials?
- [ ] Compressed textures (KTX2/Basis)?
- [ ] Draco compression for GLTF?
- [ ] useFrame optimized (delta time)?
- [ ] Disposed resources on unmount?
- [ ] Performance monitor added?

### Performance Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| FPS | 60fps | Chrome DevTools |
| Frame time | < 16.67ms | R3F PerformanceMonitor |
| Draw calls | < 100 | Chrome DevTools |
| Triangles | < 100K | Chrome DevTools |
| GPU memory | < 200MB | Chrome DevTools |
| Load time | < 2s | Lighthouse |

---

## 🛠️ Debugging Tools

### Chrome DevTools Three.js Tab

1. Open Chrome DevTools
2. Go to "Three.js" tab
3. Check:
   - Scene graph
   - Geometry count
   - Material count
   - Texture memory
   - Render calls

### R3F Devtools

```bash
npm install @react-three/drei
```

```typescript
import { Stats } from "@react-three/drei"

<Canvas>
  <Stats />  // ✅ Shows FPS, draw calls, memory
  <Scene />
</Canvas>
```

---

## ⚠️ STRICT RULES

1. **NEVER** SSR 3D components (always `ssr: false`)
2. **NEVER** create geometries in render loop
3. **NEVER** create materials in render loop
4. **ALWAYS** dispose resources on unmount
5. **ALWAYS** use instancing for 100+ objects
6. **ALWAYS** compress textures and models

---

## 🎯 Agent Actions

When working with 3D:

1. **Add dynamic import** with `ssr: false`
2. **Check model size** (compress if >1MB)
3. **Use instancing** for multiple objects
4. **Reuse geometries/materials**
5. **Add performance monitor**
6. **Test on mobile** (lower specs)

**Remember:** 3D is expensive. Every polygon counts.

---

## 📚 Existing Components

- **ModelViewer** - `components/shared/model-viewer.tsx`
- **Globe** - `components/ui/globe.tsx` (Cobe)
- **GridBackground** - `components/ui/grid-background.tsx`
- **Orb** - `components/shared/orb.tsx`
- **OrbitingCircles** - `components/ui/orbiting-circles.tsx`

**Reference:** All use proper optimization patterns. Study before creating new 3D components.
