"use client"

import { RoundedBox } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { useMemo, useRef } from "react"
import type { Group } from "three"

type Vec3 = [number, number, number]

/**
 * Low-poly "The Brick 80" (Umnutzung Bürogebäude Nordring, Zürich,
 * Züst Gübeli Gambetti). Kept deliberately simple:
 *  - chunky office block, wider podium base, stepped-back penthouse
 *  - two-tone facade: warm beige stone with strong horizontal banding on the
 *    long sides, a purple -> magenta gradient facade on the end
 *  - prominent concrete corner piers, "THE BRICK" sign
 *  - simple green site, hedges and a tree
 */

const W = 5.6 // along X (long faces = +/-Z get the beige banding)
const D = 4.2 // along Z (short ends = +/-X get the purple gradient)
const PODIUM_H = 0.6
const FLOORS = 6
const FLOOR_H = 0.4
const MAIN_H = FLOORS * FLOOR_H // 2.4
const MAIN_TOP = PODIUM_H + MAIN_H // 3.0

const floorCenters = Array.from({ length: FLOORS }, (_, i) => PODIUM_H + FLOOR_H * i + FLOOR_H / 2)
// bottom -> top purple gradient
const PURPLE = ["#c06a9f", "#b0568f", "#9e457e", "#8a3a70", "#723061", "#5e2a54"]

const colors = {
  site: "#3f5e34",
  hedge: "#3c6a33",
  sidewalk: "#b7b9b4",
  asphalt: "#54585b",
  stone: "#b6a48f",
  concrete: "#c9c5bc",
  podium: "#7c878a",
  window: "#2c353c",
  windowWarm: "#caa86a",
  roof: "#999d9b",
  sign: "#15161a",
  neighbor: "#aeb4b6",
  trunk: "#7a5a3a",
  leaf: "#5f8a48",
}

type PlasticProps = { color: string; roughness?: number; metalness?: number; clearcoat?: number; opacity?: number }

function PlasticMaterial({ color, roughness = 0.45, metalness = 0.02, clearcoat = 0.5, opacity }: PlasticProps) {
  return (
    <meshPhysicalMaterial
      color={color}
      roughness={roughness}
      metalness={metalness}
      clearcoat={clearcoat}
      clearcoatRoughness={0.26}
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
}: {
  args: Vec3
  position: Vec3
  color: string
  radius?: number
  roughness?: number
  metalness?: number
}) {
  return (
    <RoundedBox args={args} position={position} radius={radius} smoothness={1} castShadow receiveShadow>
      <PlasticMaterial color={color} roughness={roughness} metalness={metalness} />
    </RoundedBox>
  )
}

function Slab({
  args,
  position,
  color,
  roughness,
  metalness,
  opacity,
}: {
  args: Vec3
  position: Vec3
  color: string
  roughness?: number
  metalness?: number
  opacity?: number
}) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={args} />
      <PlasticMaterial color={color} roughness={roughness} metalness={metalness} opacity={opacity} />
    </mesh>
  )
}

function BeigeFace({ z }: { z: number }) {
  const sign = Math.sign(z)
  return (
    <group>
      {/* ribbon windows per floor */}
      {floorCenters.map((y, i) => (
        <Slab key={`w${i}`} args={[W - 0.5, 0.22, 0.04]} position={[0, y, z + sign * 0.012]} color={colors.window} roughness={0.16} metalness={0.1} />
      ))}
      {/* concrete bands */}
      {[PODIUM_H, PODIUM_H + MAIN_H / 2, MAIN_TOP].map((y) => (
        <Slab key={`b${y}`} args={[W + 0.02, 0.1, 0.05]} position={[0, y, z + sign * 0.014]} color={colors.concrete} roughness={0.6} />
      ))}
    </group>
  )
}

function PurpleFace({ x }: { x: number }) {
  const sign = Math.sign(x)
  return (
    <group>
      {/* gradient panels per floor */}
      {floorCenters.map((y, i) => (
        <Slab key={`p${i}`} args={[0.04, FLOOR_H - 0.02, D - 0.1]} position={[x + sign * 0.012, y, 0]} color={PURPLE[i]} roughness={0.34} metalness={0.12} />
      ))}
      {/* dark window strips */}
      {floorCenters.map((y, i) => (
        <Slab key={`pw${i}`} args={[0.04, 0.2, D - 0.5]} position={[x + sign * 0.03, y, 0]} color={colors.window} roughness={0.16} metalness={0.1} />
      ))}
    </group>
  )
}

function Building() {
  const halfW = W / 2
  const halfD = D / 2

  return (
    <group>
      {/* wider glazed podium / base */}
      <Mass args={[W + 0.45, PODIUM_H, D + 0.45]} position={[0, PODIUM_H / 2, 0]} color={colors.podium} roughness={0.3} metalness={0.2} />
      <Slab args={[W + 0.2, 0.28, 0.04]} position={[0, 0.34, halfD + 0.24]} color={colors.window} roughness={0.14} metalness={0.15} opacity={0.92} />
      <Slab args={[0.04, 0.28, D + 0.2]} position={[halfW + 0.24, 0.34, 0]} color={colors.window} roughness={0.14} metalness={0.15} opacity={0.92} />

      {/* main stone volume */}
      <Mass args={[W, MAIN_H, D]} position={[0, PODIUM_H + MAIN_H / 2, 0]} color={colors.stone} roughness={0.62} />

      <BeigeFace z={halfD} />
      <BeigeFace z={-halfD} />
      <PurpleFace x={halfW} />
      <PurpleFace x={-halfW} />

      {/* concrete corner piers */}
      {[
        [halfW, halfD],
        [halfW, -halfD],
        [-halfW, halfD],
        [-halfW, -halfD],
      ].map(([x, z]) => (
        <Mass key={`${x}-${z}`} args={[0.42, MAIN_H + PODIUM_H, 0.42]} position={[x, (MAIN_H + PODIUM_H) / 2, z]} color={colors.concrete} radius={0.015} roughness={0.55} />
      ))}

      {/* stepped-back penthouse + roof plant */}
      <Mass args={[W - 0.9, 0.44, D - 0.9]} position={[0, MAIN_TOP + 0.22, 0]} color={colors.concrete} roughness={0.55} />
      <Slab args={[W - 1.3, 0.2, 0.04]} position={[0, MAIN_TOP + 0.24, halfD - 0.43]} color={colors.window} roughness={0.16} metalness={0.1} />
      <Mass args={[1.0, 0.36, 1.0]} position={[0.4, MAIN_TOP + 0.62, -0.2]} color={colors.roof} roughness={0.6} />

      {/* THE BRICK sign on the beige front */}
      <Slab args={[1.5, 0.26, 0.05]} position={[1.0, 0.92, halfD + 0.02]} color={colors.sign} roughness={0.4} />
      <Slab args={[0.26, 0.26, 0.06]} position={[0.05, 0.92, halfD + 0.03]} color={colors.sign} roughness={0.4} />
    </group>
  )
}

function Tree({ position, scale = 1 }: { position: Vec3; scale?: number }) {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.045, 0.06, 0.6, 6]} />
        <PlasticMaterial color={colors.trunk} roughness={0.6} clearcoat={0.4} />
      </mesh>
      <mesh position={[0, 0.78, 0]} castShadow receiveShadow>
        <icosahedronGeometry args={[0.36, 0]} />
        <PlasticMaterial color={colors.leaf} roughness={0.6} clearcoat={0.45} />
      </mesh>
    </group>
  )
}

function Site() {
  const hedgesZ = useMemo(() => [-1.6, -0.5, 0.6, 1.7], [])
  const hedgesX = useMemo(() => [-1.2, 0.0, 1.2], [])

  return (
    <group>
      <RoundedBox args={[13, 0.2, 9.4]} position={[0, -0.1, -0.4]} radius={0.08} smoothness={1} receiveShadow>
        <PlasticMaterial color={colors.site} roughness={0.82} clearcoat={0.35} />
      </RoundedBox>

      {/* street wrapping the camera-facing corner (L shape) + sidewalks */}
      <Slab args={[13, 0.03, 1.6]} position={[0, 0.02, 4.3]} color={colors.asphalt} roughness={0.7} />
      <Slab args={[1.6, 0.03, 9.4]} position={[4.4, 0.02, -0.4]} color={colors.asphalt} roughness={0.7} />
      <Slab args={[11.5, 0.03, 0.5]} position={[-0.4, 0.035, 3.3]} color={colors.sidewalk} roughness={0.7} />
      <Slab args={[0.5, 0.03, 8.4]} position={[3.4, 0.035, -0.4]} color={colors.sidewalk} roughness={0.7} />

      {/* hedges along the building */}
      {hedgesZ.map((z) => (
        <Mass key={`hz${z}`} args={[0.8, 0.34, 0.34]} position={[-3.5, 0.17, z]} color={colors.hedge} radius={0.06} roughness={0.8} />
      ))}
      {hedgesX.map((x) => (
        <Mass key={`hx${x}`} args={[0.34, 0.34, 0.8]} position={[x, 0.17, 2.85]} color={colors.hedge} radius={0.06} roughness={0.8} />
      ))}

      {/* context neighbour block (the long building down the street) */}
      <Mass args={[1.6, 1.5, 4.6]} position={[-5.2, 0.75, -1.6]} color={colors.neighbor} radius={0.03} roughness={0.6} />

      <Tree position={[3.9, 0, 1.5]} scale={1.2} />
      <Tree position={[2.9, 0, 3.7]} scale={0.95} />
      <Tree position={[-4.4, 0, 2.6]} scale={1.0} />
    </group>
  )
}

export default function Brick80Model({ reducedMotion }: { reducedMotion: boolean }) {
  const groupRef = useRef<Group>(null)

  useFrame((state, delta) => {
    if (!groupRef.current || reducedMotion) return
    groupRef.current.rotation.y += delta * 0.035
    groupRef.current.position.y = -0.05 + Math.sin(state.clock.elapsedTime * 0.7) * 0.01
  })

  return (
    <group ref={groupRef} rotation={[0, 0.46, 0]} position={[0, 0.0, 0.2]} scale={0.42}>
      <Site />
      <Building />
    </group>
  )
}
