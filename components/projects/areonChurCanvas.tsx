"use client"

import { Suspense, useEffect, useState, useSyncExternalStore } from "react"
import { Canvas } from "@react-three/fiber"
import { ContactShadows, OrbitControls, PerspectiveCamera } from "@react-three/drei"

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
        <color attach="background" args={["#050707"]} />
        <fog attach="fog" args={["#050707", 8.8, 13.6]} />
        <PerspectiveCamera makeDefault position={[5.8, 4.4, 8.4]} fov={39} />

        <ambientLight intensity={0.9} />
        <directionalLight position={[-4.5, 6, 4.5]} intensity={2.7} color="#ffffff" castShadow />
        <directionalLight position={[4.5, 3.2, -3.5]} intensity={1.45} color="#cceeff" />
        <pointLight position={[0, 1.8, 4.8]} intensity={1.35} color="#d2ac91" distance={9} />

        <Suspense fallback={null}>
          <AreonChurModel reducedMotion={reducedMotion} />
          <ContactShadows
            position={[0, -0.52, 0]}
            opacity={0.42}
            scale={9.5}
            blur={2.8}
            far={4}
            color="#000000"
          />
        </Suspense>

        <OrbitControls
          enablePan={false}
          enableZoom={false}
          minPolarAngle={Math.PI / 3.8}
          maxPolarAngle={Math.PI / 2.35}
          minAzimuthAngle={-Math.PI / 4.5}
          maxAzimuthAngle={Math.PI / 4.5}
          rotateSpeed={0.42}
          target={[0, 0.35, 0]}
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
