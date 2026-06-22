"use client"

import { Suspense, useEffect, useState, useSyncExternalStore } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, PerspectiveCamera } from "@react-three/drei"

import TheilerhausModel from "./theilerhausModel"

const emptySubscribe = () => () => undefined
const getClientSnapshot = () => true
const getServerSnapshot = () => false

function usePrefersReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    const updatePreference = () => setReducedMotion(mediaQuery.matches)

    updatePreference()
    mediaQuery.addEventListener("change", updatePreference)

    return () => mediaQuery.removeEventListener("change", updatePreference)
  }, [])

  return reducedMotion
}

export default function TheilerhausCanvas() {
  const isClient = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot)
  const reducedMotion = usePrefersReducedMotion()

  if (!isClient) {
    return <TheilerhausCanvasFallback />
  }

  return (
    <div
      data-testid="theilerhaus-stage"
      className="relative overflow-visible bg-transparent [&_canvas]:!touch-pan-y"
      style={{ height: "clamp(300px, 36vw, 460px)" }}
    >
      <Canvas
        dpr={[1, 1.65]}
        gl={{ antialias: true, alpha: true }}
        shadows
        style={{ background: "transparent", touchAction: "pan-y" }}
      >
        <fog attach="fog" args={["#050505", 8, 15]} />
        <PerspectiveCamera makeDefault position={[7.2, 4.9, 7.5]} fov={39} />

        <hemisphereLight args={["#e7efff", "#3a3527", 0.95]} />
        <ambientLight intensity={0.24} />
        <directionalLight
          position={[3.4, 5.6, 4.0]}
          intensity={2.45}
          color="#fff1dd"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.0004}
        >
          <orthographicCamera attach="shadow-camera" args={[-3.9, 3.9, 4.4, -3.9, 0.5, 20]} />
        </directionalLight>
        <directionalLight position={[-4.2, 3.2, -3.4]} intensity={0.66} color="#bcd6ff" />
        <pointLight position={[0.8, 1.8, 3.4]} intensity={0.72} color="#ffd8ad" distance={7} />

        <Suspense fallback={null}>
          <TheilerhausModel reducedMotion={reducedMotion} />
        </Suspense>

        <OrbitControls
          enablePan={false}
          enableZoom={false}
          minPolarAngle={Math.PI / 4.4}
          maxPolarAngle={Math.PI / 2.4}
          minAzimuthAngle={-Math.PI / 4.6}
          maxAzimuthAngle={Math.PI / 4.6}
          rotateSpeed={0.42}
          target={[0, 1.0, 0]}
        />
      </Canvas>
    </div>
  )
}

function TheilerhausCanvasFallback() {
  return (
    <div
      data-testid="theilerhaus-stage-fallback"
      className="relative overflow-visible bg-transparent"
      style={{ height: "clamp(300px, 36vw, 460px)" }}
    >
      <div className="absolute inset-x-[18%] bottom-[25%] h-[42%] rounded-sm bg-yellow-100/15 shadow-2xl shadow-black/60" />
      <div className="absolute left-[18%] bottom-[25%] h-[52%] w-[15%] rounded-sm bg-yellow-100/20" />
      <div className="absolute right-[18%] bottom-[25%] h-[52%] w-[15%] rounded-sm bg-yellow-100/20" />
      <div className="absolute inset-x-[22%] bottom-[66%] h-[8%] rounded-sm bg-slate-300/35" />
    </div>
  )
}
