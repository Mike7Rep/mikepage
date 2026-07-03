"use client"

import { RoundedBox } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { useRef } from "react"
import type { Group } from "three"

type Vec3 = [number, number, number]
type Pt = [number, number]

const colors = {
  grass: "#375f2e",
  grassLight: "#4d7b3a",
  path: "#c8c9bf",
  facade: "#86a79d",
  facadeDark: "#66877e",
  roof: "#d8ded9",
  window: "#26343a",
  balcony: "#cfd7d2",
  trunk: "#75583d",
  leaf: "#628f4c",
  leafDark: "#4c7a3d",
}

const blocks: Array<{ angle: number; key: string; position: Pt }> = [
  { key: "a", position: [-3.2, 1.55], angle: -0.42 },
  { key: "b", position: [-1.45, 0.32], angle: 0.18 },
  { key: "c", position: [0.45, 1.05], angle: -0.2 },
  { key: "d", position: [2.55, 2.05], angle: 0.32 },
  { key: "e", position: [2.55, -0.45], angle: -0.1 },
  { key: "f", position: [0.78, -1.68], angle: 0.24 },
  { key: "g", position: [-1.15, -2.92], angle: -0.38 },
  { key: "h", position: [2.58, -2.88], angle: 0.42 },
]

const connectors: Array<[Pt, Pt]> = [
  [[-3.2, 1.55], [-1.45, 0.32]],
  [[-1.45, 0.32], [0.45, 1.05]],
  [[0.45, 1.05], [2.55, 2.05]],
  [[0.45, 1.05], [2.55, -0.45]],
  [[2.55, -0.45], [0.78, -1.68]],
  [[0.78, -1.68], [-1.15, -2.92]],
  [[0.78, -1.68], [2.58, -2.88]],
]

type PlasticProps = {
  clearcoat?: number
  color: string
  metalness?: number
  opacity?: number
  roughness?: number
}

function PlasticMaterial({
  clearcoat = 0.62,
  color,
  metalness = 0.02,
  opacity,
  roughness = 0.44,
}: PlasticProps) {
  return (
    <meshPhysicalMaterial
      clearcoat={clearcoat}
      clearcoatRoughness={0.24}
      color={color}
      metalness={metalness}
      opacity={opacity}
      roughness={roughness}
      transparent={opacity !== undefined}
    />
  )
}

function Mass({
  args,
  color,
  position,
  radius = 0.035,
  rotation,
  roughness,
}: {
  args: Vec3
  color: string
  position: Vec3
  radius?: number
  rotation?: Vec3
  roughness?: number
}) {
  return (
    <RoundedBox args={args} position={position} radius={radius} rotation={rotation} smoothness={1} castShadow receiveShadow>
      <PlasticMaterial color={color} roughness={roughness} />
    </RoundedBox>
  )
}

function Slab({
  args,
  color,
  position,
  rotation,
  roughness,
}: {
  args: Vec3
  color: string
  position: Vec3
  rotation?: Vec3
  roughness?: number
}) {
  return (
    <mesh position={position} rotation={rotation} castShadow receiveShadow>
      <boxGeometry args={args} />
      <PlasticMaterial color={color} roughness={roughness} />
    </mesh>
  )
}

function WindowBand({ rotationY, x, z }: { rotationY: number; x: number; z: number }) {
  return (
    <group position={[x, 0, z]} rotation={[0, rotationY, 0]}>
      <Slab args={[0.72, 0.16, 0.035]} position={[0, 0.48, 0.78]} color={colors.window} roughness={0.18} />
      <Slab args={[0.72, 0.16, 0.035]} position={[0, 0.88, 0.78]} color={colors.window} roughness={0.18} />
      <Slab args={[0.54, 0.055, 0.05]} position={[0, 0.28, 0.8]} color={colors.balcony} roughness={0.5} />
      <Slab args={[0.54, 0.055, 0.05]} position={[0, 0.68, 0.8]} color={colors.balcony} roughness={0.5} />
    </group>
  )
}

function HouseBlock({ angle, position }: { angle: number; position: Pt }) {
  const wingAngles = [angle, angle + (Math.PI * 2) / 3, angle - (Math.PI * 2) / 3]

  return (
    <group position={[position[0], 0, position[1]]} rotation={[0, angle, 0]}>
      <Mass args={[0.78, 1.15, 0.78]} position={[0, 0.58, 0]} color={colors.facadeDark} radius={0.05} roughness={0.42} />
      <Mass args={[0.9, 0.12, 0.9]} position={[0, 1.22, 0]} color={colors.roof} radius={0.025} roughness={0.34} />

      {wingAngles.map((wingAngle, index) => (
        <group key={wingAngle} rotation={[0, wingAngle - angle, 0]}>
          <Mass
            args={[0.74, 1.05, 1.55]}
            position={[0, 0.53, 0.72]}
            color={index === 1 ? colors.facadeDark : colors.facade}
            radius={0.04}
            roughness={0.42}
          />
          <Mass args={[0.86, 0.12, 1.66]} position={[0, 1.13, 0.72]} color={colors.roof} radius={0.02} roughness={0.34} />
          <WindowBand rotationY={0} x={0} z={0} />
        </group>
      ))}
    </group>
  )
}

function Connector({ from, to }: { from: Pt; to: Pt }) {
  const dx = to[0] - from[0]
  const dz = to[1] - from[1]
  const length = Math.hypot(dx, dz) + 0.18
  const angle = Math.atan2(dx, dz)
  const mid: Vec3 = [(from[0] + to[0]) / 2, 0.42, (from[1] + to[1]) / 2]

  return (
    <group>
      <Mass args={[0.58, 0.84, length]} position={mid} rotation={[0, angle, 0]} color={colors.facade} radius={0.035} roughness={0.43} />
      <Mass args={[0.68, 0.1, length + 0.08]} position={[mid[0], 0.9, mid[2]]} rotation={[0, angle, 0]} color={colors.roof} radius={0.02} roughness={0.34} />
    </group>
  )
}

function Path({ from, to, width = 0.32 }: { from: Pt; to: Pt; width?: number }) {
  const dx = to[0] - from[0]
  const dz = to[1] - from[1]
  const length = Math.hypot(dx, dz)
  const angle = Math.atan2(dx, dz)

  return (
    <Slab
      args={[width, 0.026, length]}
      color={colors.path}
      position={[(from[0] + to[0]) / 2, 0.02, (from[1] + to[1]) / 2]}
      rotation={[0, angle, 0]}
      roughness={0.72}
    />
  )
}

function Tree({ position, scale = 1 }: { position: Vec3; scale?: number }) {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.035, 0.05, 0.5, 6]} />
        <PlasticMaterial color={colors.trunk} roughness={0.62} />
      </mesh>
      <mesh position={[0, 0.72, 0]} castShadow receiveShadow>
        <icosahedronGeometry args={[0.32, 0]} />
        <PlasticMaterial color={colors.leaf} roughness={0.58} />
      </mesh>
      <mesh position={[0.12, 0.56, 0.08]} castShadow receiveShadow>
        <icosahedronGeometry args={[0.22, 0]} />
        <PlasticMaterial color={colors.leafDark} roughness={0.58} />
      </mesh>
    </group>
  )
}

function Site() {
  return (
    <group>
      <RoundedBox args={[10.6, 0.18, 9.2]} position={[0, -0.09, -0.35]} radius={0.08} smoothness={1} receiveShadow>
        <PlasticMaterial color={colors.grass} roughness={0.84} clearcoat={0.34} />
      </RoundedBox>
      <Slab args={[4.8, 0.022, 2.2]} position={[-1.0, 0.012, -0.28]} color={colors.grassLight} roughness={0.8} />
      <Slab args={[3.1, 0.022, 2.0]} position={[2.25, 0.014, -1.45]} color={colors.grassLight} roughness={0.8} />

      {connectors.map(([from, to], index) => (
        <Path key={`path-${index}`} from={from} to={to} width={0.42} />
      ))}
      <Path from={[-4.8, -3.9]} to={[4.8, -3.9]} width={0.5} />
      <Path from={[-4.8, 3.1]} to={[4.4, 3.1]} width={0.38} />

      <Tree position={[-4.35, 0, 0.2]} scale={1.05} />
      <Tree position={[-3.55, 0, -2.4]} scale={0.85} />
      <Tree position={[-0.25, 0, -0.58]} scale={0.7} />
      <Tree position={[1.35, 0, 0.05]} scale={0.75} />
      <Tree position={[4.1, 0, 0.95]} scale={1.0} />
      <Tree position={[3.9, 0, -3.6]} scale={0.92} />
      <Tree position={[-2.65, 0, 3.0]} scale={0.8} />
    </group>
  )
}

function Wohnpark() {
  return (
    <group>
      <Site />
      {connectors.map(([from, to], index) => (
        <Connector key={`connector-${index}`} from={from} to={to} />
      ))}
      {blocks.map((block) => (
        <HouseBlock key={block.key} angle={block.angle} position={block.position} />
      ))}
    </group>
  )
}

export default function WohnparkBuchholzModel({ reducedMotion }: { reducedMotion: boolean }) {
  const groupRef = useRef<Group>(null)

  useFrame((state, delta) => {
    if (!groupRef.current || reducedMotion) return
    groupRef.current.rotation.y += delta * 0.028
    groupRef.current.position.y = -0.05 + Math.sin(state.clock.elapsedTime * 0.6) * 0.01
  })

  return (
    <group ref={groupRef} position={[0, 0, -0.1]} rotation={[0, -0.42, 0]} scale={0.5}>
      <Wohnpark />
    </group>
  )
}
