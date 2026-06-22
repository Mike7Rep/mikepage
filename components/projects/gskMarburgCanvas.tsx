"use client"

import { Suspense, useEffect, useState, useSyncExternalStore } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, PerspectiveCamera } from "@react-three/drei"

import GskMarburgModel from "./gskMarburgModel"

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

export default function GskMarburgCanvas() {
  const isClient = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot)
  const reducedMotion = usePrefersReducedMotion()

  if (!isClient) {
    return <GskCanvasFallback />
  }

  return (
    <div
      data-testid="gsk-stage"
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
        <PerspectiveCamera makeDefault position={[6.8, 5.0, 7.8]} fov={40} />

        <hemisphereLight args={["#e3edff", "#33421f", 0.95]} />
        <ambientLight intensity={0.26} />
        <directionalLight
          position={[-3.2, 5.4, 3.4]}
          intensity={2.4}
          color="#fff4e6"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.0004}
        >
          <orthographicCamera attach="shadow-camera" args={[-4.2, 4.2, 4.4, -4.2, 0.5, 20]} />
        </directionalLight>
        <directionalLight position={[4.2, 3.2, -3.2]} intensity={0.7} color="#bcd6ff" />
        <pointLight position={[0, 1.6, 3.2]} intensity={0.6} color="#ffd2a6" distance={6} />

        <Suspense fallback={null}>
          <GskMarburgModel reducedMotion={reducedMotion} />
        </Suspense>

        <OrbitControls
          enablePan={false}
          enableZoom={false}
          minPolarAngle={Math.PI / 4.4}
          maxPolarAngle={Math.PI / 2.4}
          minAzimuthAngle={-Math.PI / 4.5}
          maxAzimuthAngle={Math.PI / 4.5}
          rotateSpeed={0.42}
          target={[0, 0.8, 0]}
        />
      </Canvas>
    </div>
  )
}

function GskCanvasFallback() {
  return (
    <div
      data-testid="gsk-stage-fallback"
      className="relative overflow-visible bg-transparent"
      style={{ height: "clamp(300px, 36vw, 460px)" }}
    >
      <div className="absolute inset-x-[20%] bottom-[26%] h-[22%] rounded-sm bg-white/14 shadow-2xl shadow-black/60" />
      <div className="absolute left-[26%] bottom-[40%] h-[28%] w-[2px] bg-orange-400/40" />
      <div className="absolute left-[30%] bottom-[40%] h-[28%] w-[2px] bg-orange-400/40" />
    </div>
  )
}
