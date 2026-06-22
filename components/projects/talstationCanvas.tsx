"use client"

import { Suspense, useEffect, useState, useSyncExternalStore } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, PerspectiveCamera } from "@react-three/drei"

import TalstationModel from "./talstationModel"

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

export default function TalstationCanvas() {
  const isClient = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot)
  const reducedMotion = usePrefersReducedMotion()

  if (!isClient) {
    return <TalstationCanvasFallback />
  }

  return (
    <div
      data-testid="talstation-stage"
      className="relative overflow-visible bg-transparent [&_canvas]:!touch-pan-y"
      style={{ height: "clamp(300px, 36vw, 460px)" }}
    >
      <Canvas
        dpr={[1, 1.65]}
        gl={{ antialias: true, alpha: true }}
        shadows
        style={{ background: "transparent", touchAction: "pan-y" }}
      >
        <fog attach="fog" args={["#050505", 7.5, 14]} />
        <PerspectiveCamera makeDefault position={[6.8, 4.9, 7.8]} fov={38} />

        <hemisphereLight args={["#e3edff", "#33421f", 0.95]} />
        <ambientLight intensity={0.22} />
        <directionalLight
          position={[-3.2, 5.2, 3.4]}
          intensity={2.5}
          color="#fff4e6"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.0004}
        >
          <orthographicCamera attach="shadow-camera" args={[-3.5, 3.5, 3.5, -3.5, 0.5, 18]} />
        </directionalLight>
        <directionalLight position={[4.2, 3.2, -3.2]} intensity={0.7} color="#bcd6ff" />
        <pointLight position={[0, 1.4, 3.2]} intensity={0.8} color="#ffd2a6" distance={6} />

        <Suspense fallback={null}>
          <TalstationModel reducedMotion={reducedMotion} />
        </Suspense>

        <OrbitControls
          enablePan={false}
          enableZoom={false}
          minPolarAngle={Math.PI / 4.2}
          maxPolarAngle={Math.PI / 2.4}
          minAzimuthAngle={-Math.PI / 4.5}
          maxAzimuthAngle={Math.PI / 4.5}
          rotateSpeed={0.42}
          target={[0, 0.5, 0]}
        />
      </Canvas>
    </div>
  )
}

function TalstationCanvasFallback() {
  return (
    <div
      data-testid="talstation-stage-fallback"
      className="relative overflow-visible bg-transparent"
      style={{ height: "clamp(300px, 36vw, 460px)" }}
    >
      <div className="absolute inset-x-[22%] bottom-[26%] h-[20%] rounded-sm bg-white/12 shadow-2xl shadow-black/60" />
      <div className="absolute inset-x-[26%] bottom-[44%] h-[6%] -skew-y-3 rounded-sm bg-white/70 shadow-xl shadow-white/10" />
    </div>
  )
}
