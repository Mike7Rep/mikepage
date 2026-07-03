"use client"

import { Suspense, useEffect, useState, useSyncExternalStore } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, PerspectiveCamera } from "@react-three/drei"

import WohnparkBuchholzModel from "./wohnparkBuchholzModel"

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

export default function WohnparkBuchholzCanvas() {
  const isClient = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot)
  const reducedMotion = usePrefersReducedMotion()

  if (!isClient) {
    return <WohnparkBuchholzCanvasFallback />
  }

  return (
    <div
      data-testid="wohnpark-buchholz-stage"
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
        <PerspectiveCamera makeDefault position={[6.4, 6.3, 7.2]} fov={41} />

        <hemisphereLight args={["#e7f1ff", "#28351f", 1.0]} />
        <ambientLight intensity={0.22} />
        <directionalLight
          position={[3.5, 6.0, 4.8]}
          intensity={2.35}
          color="#fff4e6"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.0004}
        >
          <orthographicCamera attach="shadow-camera" args={[-4.6, 4.6, 4.6, -4.6, 0.5, 20]} />
        </directionalLight>
        <directionalLight position={[-4.4, 3.4, -3.0]} intensity={0.62} color="#bcd6ff" />
        <pointLight position={[0.8, 2.0, 3.8]} intensity={0.72} color="#d8ffe2" distance={8} />

        <Suspense fallback={null}>
          <WohnparkBuchholzModel reducedMotion={reducedMotion} />
        </Suspense>

        <OrbitControls
          enablePan={false}
          enableZoom={false}
          minPolarAngle={Math.PI / 4.2}
          maxPolarAngle={Math.PI / 2.35}
          minAzimuthAngle={-Math.PI / 4.5}
          maxAzimuthAngle={Math.PI / 4.5}
          rotateSpeed={0.4}
          target={[0, 0.72, -0.2]}
        />
      </Canvas>
    </div>
  )
}

function WohnparkBuchholzCanvasFallback() {
  return (
    <div
      data-testid="wohnpark-buchholz-stage-fallback"
      className="relative overflow-visible bg-transparent"
      style={{ height: "clamp(300px, 36vw, 460px)" }}
    >
      <div className="absolute inset-x-[12%] bottom-[16%] h-[58%] rounded-sm bg-green-600/15 shadow-2xl shadow-black/60" />
      <div className="absolute left-[18%] top-[26%] size-16 rounded-sm bg-emerald-200/20" />
      <div className="absolute left-[38%] top-[38%] size-16 rounded-sm bg-emerald-200/20" />
      <div className="absolute right-[18%] top-[30%] size-16 rounded-sm bg-emerald-200/20" />
      <div className="absolute bottom-[22%] right-[24%] size-16 rounded-sm bg-emerald-200/20" />
    </div>
  )
}
