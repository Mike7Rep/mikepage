"use client"

import { RoundedBox } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { useMemo, useRef } from "react"
import type { Group } from "three"

type Vec3 = [number, number, number]

/**
 * Low-poly Vantage ZRH1 data center (Winterthur, opened 2021).
 * Signature features kept readable but reduced:
 *  - long two-tone box: dark scattered solar/PV facade (with a warm amber band)
 *    on one end, light ribbed aluminium rain-screen on the long elevation
 *  - three tall slim generator exhaust stacks
 *  - dense row of rooftop chillers
 *  - perforated-mesh external stair tower + solid stair/lift core
 *  - industrial site by the rail tracks, fence, shrubs
 */

const BOX = { w: 6.8, d: 3.4, h: 2.3 }

const colors = {
  site: "#3f5a34",
  grass: "#496a3b",
  ballast: "#8a8478",
  rail: "#646468",
  asphalt: "#5b6063",
  silver: "#c3c9cc",
  silverSeam: "#9aa1a4",
  roof: "#9aa0a2",
  base: "#7c8186",
  charcoal: "#3a4047",
  charcoalDark: "#262b31",
  panel: "#49525b",
  gold: "#b58a3c",
  stack: "#dfe2e1",
  stackBand: "#b9bdbe",
  chiller: "#b6bbbd",
  chillerTop: "#7f8589",
  mesh: "#828990",
  core: "#565d63",
  sign: "#eef2f3",
  signAccent: "#2f86c9",
  fence: "#3c4147",
  trunk: "#7a5a3a",
  leaf: "#5f8a48",
  bush: "#4d7a3f",
}

type PlasticProps = {
  color: string
  roughness?: number
  metalness?: number
  clearcoat?: number
  opacity?: number
}

function PlasticMaterial({ color, roughness = 0.4, metalness = 0.02, clearcoat = 0.55, opacity }: PlasticProps) {
  return (
    <meshPhysicalMaterial
      color={color}
      roughness={roughness}
      metalness={metalness}
      clearcoat={clearcoat}
      clearcoatRoughness={0.24}
      transparent={opacity !== undefined}
      opacity={opacity}
    />
  )
}

function Mass({
  args,
  position,
  color,
  radius = 0.02,
  roughness,
  metalness,
  rotation,
}: {
  args: Vec3
  position: Vec3
  color: string
  radius?: number
  roughness?: number
  metalness?: number
  rotation?: Vec3
}) {
  return (
    <RoundedBox args={args} position={position} rotation={rotation} radius={radius} smoothness={1} castShadow receiveShadow>
      <PlasticMaterial color={color} roughness={roughness} metalness={metalness} />
    </RoundedBox>
  )
}

function Slab({
  args,
  position,
  color,
  rotation,
  roughness,
  metalness,
  clearcoat,
  opacity,
}: {
  args: Vec3
  position: Vec3
  color: string
  rotation?: Vec3
  roughness?: number
  metalness?: number
  clearcoat?: number
  opacity?: number
}) {
  return (
    <mesh position={position} rotation={rotation} castShadow receiveShadow>
      <boxGeometry args={args} />
      <PlasticMaterial color={color} roughness={roughness} metalness={metalness} clearcoat={clearcoat} opacity={opacity} />
    </mesh>
  )
}

// tone -> color for the scattered PV panels
const TONE: Record<string, string> = { d: colors.charcoalDark, m: colors.panel, g: colors.gold }

// [z, y, zSize, ySize, tone] across the dark end (-X face)
const END_PANELS: Array<[number, number, number, number, string]> = [
  [-1.3, 1.78, 0.5, 0.42, "d"],
  [-0.7, 1.9, 0.55, 0.3, "m"],
  [-0.05, 1.74, 0.72, 0.5, "d"],
  [0.6, 1.86, 0.5, 0.34, "m"],
  [1.2, 1.68, 0.55, 0.46, "d"],
  [-1.15, 1.2, 0.6, 0.42, "m"],
  [-0.4, 1.24, 0.5, 0.52, "d"],
  [0.4, 1.18, 0.68, 0.34, "d"],
  [1.1, 1.24, 0.45, 0.44, "m"],
  [-1.28, 0.74, 0.5, 0.34, "g"],
  [-0.55, 0.72, 0.62, 0.3, "g"],
  [0.25, 0.74, 0.56, 0.32, "g"],
  [1.0, 0.72, 0.5, 0.3, "g"],
  [-0.1, 0.42, 0.72, 0.26, "m"],
]

// [x, y, xSize, ySize, tone] return strip on the front-left (+Z face)
const FRONT_PANELS: Array<[number, number, number, number, string]> = [
  [-3.0, 1.74, 0.5, 0.5, "d"],
  [-2.35, 1.86, 0.55, 0.32, "m"],
  [-1.7, 1.72, 0.6, 0.46, "d"],
  [-2.7, 1.18, 0.55, 0.46, "m"],
  [-1.85, 1.2, 0.5, 0.4, "d"],
  [-2.5, 0.72, 0.6, 0.3, "g"],
  [-1.7, 0.72, 0.52, 0.3, "g"],
]

function Building() {
  const halfW = BOX.w / 2
  const halfD = BOX.d / 2
  const seams = useMemo(() => [-0.9, -0.4, 0.1, 0.6, 1.1, 1.6, 2.1, 2.6, 3.1], [])

  return (
    <group>
      {/* base plinth */}
      <Mass args={[BOX.w + 0.12, 0.36, BOX.d + 0.12]} position={[0, 0.18, 0]} color={colors.base} roughness={0.6} />
      {/* silver ribbed body */}
      <Mass args={[BOX.w, BOX.h, BOX.d]} position={[0, BOX.h / 2 + 0.18, 0]} color={colors.silver} roughness={0.32} metalness={0.34} />
      {/* roof parapet + plant deck */}
      <Mass args={[BOX.w + 0.1, 0.14, BOX.d + 0.1]} position={[0, BOX.h + 0.25, 0]} color={colors.roof} roughness={0.5} />

      {/* vertical rain-screen seams on the silver front */}
      {seams.map((x) => (
        <Slab key={`s${x}`} args={[0.03, BOX.h - 0.2, 0.05]} position={[x, BOX.h / 2 + 0.22, halfD + 0.005]} color={colors.silverSeam} roughness={0.4} />
      ))}
      {/* horizontal cladding joint */}
      <Slab args={[BOX.w * 0.62, 0.03, 0.04]} position={[1.1, 1.5, halfD + 0.008]} color={colors.silverSeam} roughness={0.4} />

      {/* dark solar facade on the -X end */}
      <Slab args={[0.06, BOX.h - 0.08, BOX.d - 0.08]} position={[-halfW - 0.02, BOX.h / 2 + 0.2, 0]} color={colors.charcoal} roughness={0.3} metalness={0.18} />
      {END_PANELS.map(([z, y, zs, ys, t], i) => (
        <Slab key={`ep${i}`} args={[0.05, ys, zs]} position={[-halfW - 0.06, y + 0.18, z]} color={TONE[t]} roughness={t === "g" ? 0.26 : 0.18} metalness={0.22} clearcoat={0.82} />
      ))}

      {/* dark facade return onto the front-left */}
      <Slab args={[2.3, BOX.h - 0.08, 0.06]} position={[-2.32, BOX.h / 2 + 0.2, halfD + 0.02]} color={colors.charcoal} roughness={0.3} metalness={0.18} />
      {FRONT_PANELS.map(([x, y, xs, ys, t], i) => (
        <Slab key={`fp${i}`} args={[xs, ys, 0.05]} position={[x, y + 0.18, halfD + 0.06]} color={TONE[t]} roughness={t === "g" ? 0.26 : 0.18} metalness={0.22} clearcoat={0.82} />
      ))}

      {/* VANTAGE sign on the silver front */}
      <Slab args={[1.0, 0.2, 0.04]} position={[0.7, 2.0, halfD + 0.04]} color={colors.sign} roughness={0.3} />
      <Slab args={[0.12, 0.17, 0.06]} position={[0.13, 2.0, halfD + 0.05]} color={colors.signAccent} roughness={0.25} metalness={0.1} />
    </group>
  )
}

function Stacks() {
  const xs = useMemo(() => [-2.95, -2.45, -1.95], [])
  return (
    <group>
      {xs.map((x) => (
        <group key={x} position={[x, 0, -0.3]}>
          <mesh position={[0, 3.1, 0]} castShadow>
            <cylinderGeometry args={[0.1, 0.13, 3.8, 12]} />
            <PlasticMaterial color={colors.stack} roughness={0.42} clearcoat={0.5} />
          </mesh>
          <mesh position={[0, 4.92, 0]} castShadow>
            <cylinderGeometry args={[0.12, 0.12, 0.18, 12]} />
            <PlasticMaterial color={colors.stackBand} roughness={0.4} metalness={0.2} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function RooftopPlant() {
  const units = useMemo(() => {
    const out: Vec3[] = []
    const rows = [0.78, 0.1]
    for (const z of rows) {
      for (let i = 0; i < 8; i++) out.push([-0.7 + i * 0.52, 2.5, z])
    }
    return out
  }, [])

  return (
    <group>
      {units.map((p, i) => (
        <group key={i} position={p}>
          <Mass args={[0.42, 0.3, 0.66]} position={[0, 0, 0]} color={colors.chiller} radius={0.015} roughness={0.45} metalness={0.15} />
          <Slab args={[0.32, 0.04, 0.5]} position={[0, 0.17, 0]} color={colors.chillerTop} roughness={0.55} />
        </group>
      ))}
    </group>
  )
}

function Cores() {
  return (
    <group>
      {/* perforated-mesh external stair tower (front) */}
      <group position={[-0.95, 0, 1.95]}>
        <Mass args={[0.95, 2.1, 0.5]} position={[0, 1.25, 0]} color={colors.core} radius={0.02} roughness={0.5} />
        {[0.6, 1.12, 1.64].map((y) => (
          <Slab key={y} args={[0.9, 0.05, 0.46]} position={[0, y, 0]} color={colors.charcoalDark} roughness={0.5} />
        ))}
        {/* mesh screen */}
        <Slab args={[0.97, 2.1, 0.04]} position={[0, 1.25, 0.27]} color={colors.mesh} roughness={0.4} metalness={0.3} opacity={0.5} />
      </group>

      {/* solid stair / lift core on the +X end */}
      <Mass args={[0.5, 2.75, 1.9]} position={[3.25, 1.55, 0.1]} color={colors.core} radius={0.02} roughness={0.5} />
    </group>
  )
}

function Bush({ position, scale = 1 }: { position: Vec3; scale?: number }) {
  return (
    <mesh position={position} scale={[scale, scale * 0.8, scale]} castShadow receiveShadow>
      <icosahedronGeometry args={[0.32, 0]} />
      <PlasticMaterial color={colors.bush} roughness={0.7} clearcoat={0.35} />
    </mesh>
  )
}

function Tree({ position, scale = 1 }: { position: Vec3; scale?: number }) {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      <mesh position={[0, 0.24, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.04, 0.055, 0.48, 6]} />
        <PlasticMaterial color={colors.trunk} roughness={0.6} clearcoat={0.4} />
      </mesh>
      <mesh position={[0, 0.62, 0]} castShadow receiveShadow>
        <icosahedronGeometry args={[0.3, 0]} />
        <PlasticMaterial color={colors.leaf} roughness={0.6} clearcoat={0.45} />
      </mesh>
    </group>
  )
}

function Site() {
  const fencePosts = useMemo(() => Array.from({ length: 13 }, (_, i) => -3.6 + i * 0.62), [])
  const sleepers = useMemo(() => Array.from({ length: 13 }, (_, i) => -3.9 + i * 0.66), [])
  const bushes = useMemo(
    () =>
      [
        [-3.4, 0.22, 2.7, 1.1],
        [-2.5, 0.2, 2.95, 0.9],
        [-1.5, 0.22, 2.8, 1.05],
        [2.2, 0.2, 2.85, 0.95],
        [3.1, 0.22, 2.7, 1.1],
      ] as const,
    [],
  )

  return (
    <group>
      <RoundedBox args={[13, 0.2, 9.2]} position={[0, -0.1, -0.4]} radius={0.08} smoothness={1} receiveShadow>
        <PlasticMaterial color={colors.site} roughness={0.82} clearcoat={0.35} />
      </RoundedBox>
      {/* grassy embankment tint near the building */}
      <Slab args={[12, 0.02, 3.2]} position={[0, 0.01, 0.2]} color={colors.grass} roughness={0.85} />
      {/* paved apron along the front */}
      <Slab args={[11.5, 0.03, 1.0]} position={[0, 0.03, 2.35]} color={colors.asphalt} roughness={0.7} />

      {/* railway: ballast, sleepers, rails (foreground) */}
      <Slab args={[12.4, 0.05, 1.5]} position={[0, 0.04, 4.2]} color={colors.ballast} roughness={0.8} />
      {sleepers.map((x) => (
        <Slab key={`sl${x}`} args={[0.14, 0.05, 1.3]} position={[x, 0.08, 4.2]} color={colors.charcoalDark} roughness={0.7} />
      ))}
      {[3.7, 4.7].map((z) => (
        <Slab key={`ra${z}`} args={[12.4, 0.07, 0.06]} position={[0, 0.11, z]} color={colors.rail} roughness={0.3} metalness={0.5} />
      ))}

      {/* security fence along the front */}
      {fencePosts.map((x) => (
        <Slab key={`fp${x}`} args={[0.04, 0.62, 0.04]} position={[x, 0.31, 3.0]} color={colors.fence} roughness={0.5} />
      ))}
      <Slab args={[8.0, 0.03, 0.03]} position={[0, 0.56, 3.0]} color={colors.fence} roughness={0.5} />
      <Slab args={[8.0, 0.03, 0.03]} position={[0, 0.18, 3.0]} color={colors.fence} roughness={0.5} />

      {bushes.map(([x, y, z, s]) => (
        <Bush key={`b${x}-${z}`} position={[x, y, z]} scale={s} />
      ))}
      <Tree position={[4.6, 0.0, 2.6]} scale={1.15} />
      <Tree position={[-4.7, 0.0, 1.4]} scale={1.0} />
    </group>
  )
}

export default function VantageZrhModel({ reducedMotion }: { reducedMotion: boolean }) {
  const groupRef = useRef<Group>(null)

  useFrame((state, delta) => {
    if (!groupRef.current || reducedMotion) return
    groupRef.current.rotation.y += delta * 0.035
    groupRef.current.position.y = -0.06 + Math.sin(state.clock.elapsedTime * 0.7) * 0.01
  })

  return (
    <group ref={groupRef} rotation={[0, 2.12, 0]} position={[0, 0.02, 0.2]} scale={0.43}>
      <Site />
      <Building />
      <Cores />
      <RooftopPlant />
      <Stacks />
    </group>
  )
}
