"use client"

import { RoundedBox } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { useMemo, useRef } from "react"
import type { Group } from "three"

type Vec3 = [number, number, number]

/**
 * Low-poly GSK Pharmacenter Marburg (vaccine manufacturing campus).
 * Kept simple:
 *  - long white production hall + taller white office block + low link
 *  - the iconic tall red exhaust stacks (plus slimmer grey ones)
 *  - orange GSK logo accent, flat roofs with plant
 *  - green field site with parking, cars, trees and a forest edge
 */

const colors = {
  site: "#3f5e34",
  field: "#587b3d",
  asphalt: "#565b5e",
  line: "#c9ccc4",
  white: "#edefec",
  white2: "#dfe2df",
  roof: "#c6c9c5",
  glass: "#2e3940",
  window: "#36434c",
  red: "#c5402a",
  redCap: "#9c2f1c",
  greyStack: "#bcbfc0",
  gsk: "#ef6a2b",
  tower: "#d7dad6",
  trunk: "#7a5a3a",
  leaf: "#5f8a48",
  fir: "#3b683b",
  cars: ["#9aa0a4", "#303337", "#b6483a", "#e2e5e4", "#586a86"],
}

type PlasticProps = { color: string; roughness?: number; metalness?: number; clearcoat?: number; opacity?: number }

function PlasticMaterial({ color, roughness = 0.5, metalness = 0.02, clearcoat = 0.45, opacity }: PlasticProps) {
  return (
    <meshPhysicalMaterial
      color={color}
      roughness={roughness}
      metalness={metalness}
      clearcoat={clearcoat}
      clearcoatRoughness={0.28}
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
  rotation,
  roughness,
  metalness,
  opacity,
}: {
  args: Vec3
  position: Vec3
  color: string
  rotation?: Vec3
  roughness?: number
  metalness?: number
  opacity?: number
}) {
  return (
    <mesh position={position} rotation={rotation} castShadow receiveShadow>
      <boxGeometry args={args} />
      <PlasticMaterial color={color} roughness={roughness} metalness={metalness} opacity={opacity} />
    </mesh>
  )
}

function ProductionHall() {
  const equip = useMemo(() => [-3.5, -2.4, -1.3, -0.2, 0.9], [])
  return (
    <group position={[-1.2, 0, 0]}>
      <Mass args={[7.0, 1.5, 3.8]} position={[0, 0.75, 0]} color={colors.white} roughness={0.55} />
      <Mass args={[7.1, 0.13, 3.9]} position={[0, 1.57, 0]} color={colors.roof} roughness={0.6} />
      {/* ground-floor glazing band + an upper cladding seam */}
      <Slab args={[6.6, 0.42, 0.05]} position={[0, 0.4, 1.91]} color={colors.glass} roughness={0.16} metalness={0.1} />
      <Slab args={[6.7, 0.04, 0.05]} position={[0, 1.06, 1.91]} color={colors.white2} roughness={0.5} />
      <Slab args={[0.05, 0.42, 3.4]} position={[-3.51, 0.4, 0]} color={colors.glass} roughness={0.16} metalness={0.1} />
      {/* rooftop plant */}
      {equip.map((x) => (
        <Mass key={x} args={[0.55, 0.26, 0.7]} position={[x, 1.76, -0.4]} color={colors.white2} radius={0.01} roughness={0.6} />
      ))}
    </group>
  )
}

function OfficeBlock() {
  const floors = useMemo(() => [0.55, 1.12, 1.69, 2.26], [])
  return (
    <group position={[3.35, 0, 0.1]}>
      <Mass args={[3.0, 2.6, 3.4]} position={[0, 1.3, 0]} color={colors.white} roughness={0.5} />
      <Mass args={[3.1, 0.13, 3.5]} position={[0, 2.62, 0]} color={colors.roof} roughness={0.6} />

      {/* window grid */}
      {floors.map((y) => (
        <Slab key={`fz${y}`} args={[2.5, 0.32, 0.04]} position={[0, y, 1.71]} color={colors.window} roughness={0.16} metalness={0.1} />
      ))}
      {floors.map((y) => (
        <Slab key={`fx${y}`} args={[0.04, 0.32, 2.7]} position={[1.51, y, 0]} color={colors.window} roughness={0.16} metalness={0.1} />
      ))}

      {/* stair / lift tower */}
      <Mass args={[0.7, 2.95, 1.0]} position={[1.5, 1.47, 1.25]} color={colors.tower} roughness={0.5} />

      {/* GSK orange logo accent */}
      <mesh position={[-0.4, 2.05, 1.73]} rotation={[Math.PI / 2, 0, Math.PI]} castShadow>
        <cylinderGeometry args={[0.28, 0.28, 0.06, 3]} />
        <PlasticMaterial color={colors.gsk} roughness={0.35} clearcoat={0.6} />
      </mesh>
    </group>
  )
}

function Stacks() {
  const red = useMemo(() => [-4.9, -4.4, -3.9], [])
  const grey = useMemo(() => [-5.3, -3.4], [])
  return (
    <group>
      {red.map((x) => (
        <group key={`r${x}`} position={[x, 0, -0.6]}>
          <mesh position={[0, 2.4, 0]} castShadow>
            <cylinderGeometry args={[0.13, 0.15, 3.6, 12]} />
            <PlasticMaterial color={colors.red} roughness={0.45} clearcoat={0.5} />
          </mesh>
          <mesh position={[0, 4.24, 0]} castShadow>
            <cylinderGeometry args={[0.14, 0.14, 0.16, 12]} />
            <PlasticMaterial color={colors.redCap} roughness={0.45} />
          </mesh>
        </group>
      ))}
      {grey.map((x) => (
        <mesh key={`g${x}`} position={[x, 1.7, -1.0]} castShadow>
          <cylinderGeometry args={[0.08, 0.1, 3.0, 10]} />
          <PlasticMaterial color={colors.greyStack} roughness={0.45} metalness={0.15} />
        </mesh>
      ))}
    </group>
  )
}

function Tree({ position, scale = 1 }: { position: Vec3; scale?: number }) {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      <mesh position={[0, 0.26, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.04, 0.055, 0.52, 6]} />
        <PlasticMaterial color={colors.trunk} roughness={0.6} clearcoat={0.4} />
      </mesh>
      <mesh position={[0, 0.66, 0]} castShadow receiveShadow>
        <icosahedronGeometry args={[0.32, 0]} />
        <PlasticMaterial color={colors.leaf} roughness={0.6} clearcoat={0.45} />
      </mesh>
    </group>
  )
}

function Fir({ position, scale = 1 }: { position: Vec3; scale?: number }) {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      <mesh position={[0, 0.12, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.04, 0.05, 0.24, 5]} />
        <PlasticMaterial color={colors.trunk} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <coneGeometry args={[0.3, 0.7, 7]} />
        <PlasticMaterial color={colors.fir} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.85, 0]} castShadow receiveShadow>
        <coneGeometry args={[0.22, 0.5, 7]} />
        <PlasticMaterial color={colors.fir} roughness={0.58} />
      </mesh>
    </group>
  )
}

function Site() {
  const cars = useMemo(() => {
    const out: Array<{ p: Vec3; c: string }> = []
    const rows = [3.0, 3.5]
    rows.forEach((z, r) => {
      for (let i = 0; i < 6; i++) out.push({ p: [-1.4 + i * 0.5, 0.08, z], c: colors.cars[(i + r) % colors.cars.length] })
    })
    return out
  }, [])
  const firs = useMemo(() => [-6, -4.8, -3.6, -2.4, 4.6, 5.6], [])

  return (
    <group>
      <RoundedBox args={[14, 0.2, 10]} position={[0, -0.1, -0.4]} radius={0.08} smoothness={1} receiveShadow>
        <PlasticMaterial color={colors.site} roughness={0.85} clearcoat={0.3} />
      </RoundedBox>
      {/* lighter field patches */}
      <Slab args={[13, 0.02, 3.0]} position={[0, 0.01, -3.6]} color={colors.field} roughness={0.88} />
      {/* parking apron */}
      <Slab args={[4.8, 0.03, 1.6]} position={[-0.2, 0.03, 3.25]} color={colors.asphalt} roughness={0.7} />
      <Slab args={[10.5, 0.03, 0.8]} position={[-0.4, 0.03, 4.5]} color={colors.asphalt} roughness={0.7} />
      {cars.map((car, i) => (
        <Mass key={i} args={[0.32, 0.13, 0.18]} position={car.p} color={car.c} radius={0.03} roughness={0.4} metalness={0.2} />
      ))}

      {/* forest edge */}
      {firs.map((x, i) => (
        <Fir key={`fir${x}`} position={[x, 0, -4.6]} scale={1.0 + (i % 3) * 0.12} />
      ))}
      <Tree position={[5.3, 0, 2.4]} scale={1.15} />
      <Tree position={[2.0, 0, 4.2]} scale={0.95} />
      <Tree position={[-5.6, 0, 2.6]} scale={1.05} />
    </group>
  )
}

export default function GskMarburgModel({ reducedMotion }: { reducedMotion: boolean }) {
  const groupRef = useRef<Group>(null)

  useFrame((state, delta) => {
    if (!groupRef.current || reducedMotion) return
    groupRef.current.rotation.y += delta * 0.035
    groupRef.current.position.y = -0.05 + Math.sin(state.clock.elapsedTime * 0.7) * 0.01
  })

  return (
    <group ref={groupRef} rotation={[0, -0.46, 0]} position={[0, 0.0, 0.2]} scale={0.4}>
      <Site />
      <ProductionHall />
      <OfficeBlock />
      <Stacks />
    </group>
  )
}
