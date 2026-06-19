"use client"

import { Suspense, useEffect, useState, useSyncExternalStore } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, PerspectiveCamera } from "@react-three/drei"

import AreonChurModel from "./areonChurModel"

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

export default function AreonChurCanvas() {
  const isClient = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot)
  const reducedMotion = usePrefersReducedMotion()

  if (!isClient) {
    return <AreonCanvasFallback />
  }

  return (
    <div
      data-testid="areon-stage"
      className="relative overflow-hidden rounded-[2rem] bg-[radial-gradient(circle_at_50%_38%,rgba(94,231,255,0.12),transparent_42%),#050707] [&_canvas]:!touch-pan-y"
      style={{ height: "clamp(380px, 46vw, 540px)" }}
    >
      <Canvas dpr={[1, 1.65]} gl={{ antialias: true, alpha: false }} shadows style={{ touchAction: "pan-y" }}>
        <color attach="background" args={["#060807"]} />
        <fog attach="fog" args={["#060807", 6.5, 11.5]} />
        <PerspectiveCamera makeDefault position={[4.6, 3.6, 5.6]} fov={40} />

        <hemisphereLight args={["#e3edff", "#2c3a1f", 0.95]} />
        <ambientLight intensity={0.22} />
        <directionalLight
          position={[-3.2, 5.2, 3.4]}
          intensity={2.5}
          color="#fff4e6"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.0004}
        >
          <orthographicCamera attach="shadow-camera" args={[-3, 3, 3, -3, 0.5, 18]} />
        </directionalLight>
        <directionalLight position={[4.2, 3.2, -3.2]} intensity={0.7} color="#bcd6ff" />
        <pointLight position={[0, 1.4, 3.2]} intensity={0.8} color="#ffd2a6" distance={6} />

        <Suspense fallback={null}>
          <AreonChurModel reducedMotion={reducedMotion} />
        </Suspense>

        <OrbitControls
          enablePan={false}
          enableZoom={false}
          minPolarAngle={Math.PI / 4.2}
          maxPolarAngle={Math.PI / 2.4}
          minAzimuthAngle={-Math.PI / 4.5}
          maxAzimuthAngle={Math.PI / 4.5}
          rotateSpeed={0.42}
          target={[0, 0.45, 0]}
        />
      </Canvas>
    </div>
  )
}

function AreonCanvasFallback() {
  return (
    <div
      data-testid="areon-stage-fallback"
      className="relative overflow-hidden rounded-[2rem] bg-[radial-gradient(circle_at_50%_38%,rgba(94,231,255,0.12),transparent_42%),#050707]"
      style={{ height: "clamp(380px, 46vw, 540px)" }}
    >
      <div className="absolute inset-x-[18%] bottom-[24%] h-[28%] rounded-md border border-white/10 bg-white/10 shadow-2xl shadow-black/60" />
      <div className="absolute inset-x-[15%] bottom-[48%] h-[7%] rounded-sm bg-white/70 shadow-xl shadow-white/10" />
      <div className="absolute inset-x-[23%] bottom-[31%] h-px bg-cyan-100/25" />
    </div>
  )
}
