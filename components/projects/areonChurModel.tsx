"use client"

import { RoundedBox } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { useRef } from "react"
import type { Group } from "three"

type Vec3 = [number, number, number]

type BoxProps = {
  color: string
  position: Vec3
  radius?: number
  rotation?: Vec3
  scale: Vec3
}

const colors = {
  asphalt: "#1d2324",
  concrete: "#d7dddc",
  concreteDark: "#aeb7b6",
  glass: "#5f777b",
  roof: "#eef2f1",
  shadow: "#111819",
  warm: "#a48966",
}

const roofCores: Vec3[] = [
  [-2.65, 1.86, -1.05],
  [-0.7, 1.86, 0.75],
  [1.3, 1.86, -0.95],
  [3.0, 1.86, 0.52],
]

const trees = [
  [-4.35, -0.22, 2.55, 0.58],
  [4.28, -0.22, -2.35, 0.54],
] as const

function PlasticMaterial({
  color,
  clearcoat = 0.88,
  roughness = 0.32,
}: {
  clearcoat?: number
  color: string
  roughness?: number
}) {
  return (
    <meshPhysicalMaterial
      color={color}
      clearcoat={clearcoat}
      clearcoatRoughness={0.22}
      metalness={0.02}
      roughness={roughness}
      sheen={0.18}
      sheenRoughness={0.42}
    />
  )
}

function Box({ color, position, scale, radius = 0.035, rotation = [0, 0, 0] }: BoxProps) {
  return (
    <RoundedBox
      args={scale}
      position={position}
      radius={radius}
      rotation={rotation}
      smoothness={3}
      castShadow
      receiveShadow
    >
      <PlasticMaterial color={color} />
    </RoundedBox>
  )
}

function HallMass() {
  return (
    <group>
      <Box color={colors.concrete} position={[0, 0.56, 0]} scale={[7.25, 1.86, 3.48]} radius={0.055} />
      <Box color={colors.roof} position={[0, 1.54, 0]} scale={[7.7, 0.18, 3.9]} radius={0.04} />
      <Box color={colors.roof} position={[0, 1.72, 0]} scale={[7.95, 0.08, 4.08]} radius={0.025} />

      <Box color={colors.concreteDark} position={[0, 0.54, 1.79]} scale={[7.1, 1.55, 0.08]} radius={0.012} />
      <Box color={colors.concreteDark} position={[0, 0.54, -1.79]} scale={[7.1, 1.55, 0.08]} radius={0.012} />
      <Box color={colors.concreteDark} position={[-3.68, 0.54, 0]} scale={[0.08, 1.55, 3.3]} radius={0.012} />
      <Box color={colors.concreteDark} position={[3.68, 0.54, 0]} scale={[0.08, 1.55, 3.3]} radius={0.012} />

      <Box color={colors.glass} position={[-1.85, 0.15, 1.86]} scale={[1.2, 0.42, 0.055]} radius={0.012} />
      <Box color={colors.glass} position={[0.0, 0.15, 1.86]} scale={[1.2, 0.42, 0.055]} radius={0.012} />
      <Box color={colors.glass} position={[1.85, 0.15, 1.86]} scale={[1.2, 0.42, 0.055]} radius={0.012} />
      <Box color={colors.glass} position={[3.75, 0.22, -0.45]} scale={[0.055, 0.52, 1.05]} radius={0.012} />
    </group>
  )
}

function LowAnnexes() {
  return (
    <group>
      <Box color={colors.concrete} position={[0, -0.22, 2.18]} scale={[8.35, 0.62, 0.78]} radius={0.04} />
      <Box color={colors.roof} position={[0, 0.13, 2.16]} scale={[8.75, 0.16, 1.0]} radius={0.03} />
      <Box color={colors.concrete} position={[3.95, -0.22, -1.08]} scale={[0.84, 0.6, 2.55]} radius={0.04} />
      <Box color={colors.roof} position={[4.02, 0.12, -1.08]} scale={[1.05, 0.14, 2.78]} radius={0.03} />
      <Box color={colors.concrete} position={[-4.0, -0.22, 0.18]} scale={[0.82, 0.58, 2.1]} radius={0.04} />
      <Box color={colors.roof} position={[-4.05, 0.11, 0.18]} scale={[1.0, 0.14, 2.32]} radius={0.03} />

      <Box color={colors.glass} position={[-2.72, -0.24, 2.6]} scale={[1.05, 0.32, 0.055]} radius={0.01} />
      <Box color={colors.glass} position={[2.2, -0.24, 2.6]} scale={[1.05, 0.32, 0.055]} radius={0.01} />
      <Box color={colors.glass} position={[4.55, -0.21, -1.35]} scale={[0.055, 0.32, 0.9]} radius={0.01} />
    </group>
  )
}

function RoofObjects() {
  return (
    <group>
      {roofCores.map(([x, y, z]) => (
        <Box key={`${x}-${z}`} color={colors.concrete} position={[x, y, z]} scale={[0.28, 0.3, 0.28]} radius={0.025} />
      ))}

      <Box color={colors.shadow} position={[2.1, 1.82, 0.82]} scale={[0.86, 0.035, 0.5]} radius={0.012} />
      <Box color={colors.roof} position={[2.1, 1.88, 0.82]} scale={[0.58, 0.07, 0.26]} radius={0.012} />
      <Box color={colors.shadow} position={[-1.05, 1.82, -0.74]} scale={[0.74, 0.035, 0.44]} radius={0.012} />
      <Box color={colors.roof} position={[-1.05, 1.88, -0.74]} scale={[0.48, 0.07, 0.22]} radius={0.012} />
    </group>
  )
}

function Grounds() {
  return (
    <group position={[0, -0.62, 0]}>
      <RoundedBox args={[9.25, 0.16, 5.78]} position={[0, 0, 0]} radius={0.12} smoothness={4} receiveShadow>
        <PlasticMaterial color={colors.asphalt} clearcoat={0.74} roughness={0.46} />
      </RoundedBox>

      <Box color={colors.concrete} position={[0, 0.11, 2.78]} scale={[6.4, 0.09, 0.44]} radius={0.03} />
      <Box color={colors.concreteDark} position={[3.75, 0.12, -2.3]} scale={[2.0, 0.08, 0.34]} radius={0.025} />
      <Box color={colors.concrete} position={[-5.0, 0.16, 1.7]} scale={[1.55, 0.12, 0.62]} radius={0.035} />
      <Box color={colors.concreteDark} position={[-5.0, 0.08, 1.7]} scale={[1.4, 0.12, 0.48]} radius={0.025} />

      <mesh position={[-2.95, 0.18, 2.48]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <ringGeometry args={[0.36, 0.42, 32]} />
        <meshPhysicalMaterial color={colors.concrete} clearcoat={0.7} roughness={0.42} />
      </mesh>
    </group>
  )
}

function TinyTrees() {
  return (
    <group>
      {trees.map(([x, y, z, scale]) => (
        <group key={`${x}-${z}`} position={[x, y, z]} scale={scale}>
          <mesh position={[0, 0.4, 0]} castShadow>
            <cylinderGeometry args={[0.03, 0.045, 0.8, 8]} />
            <PlasticMaterial color={colors.warm} clearcoat={0.6} roughness={0.42} />
          </mesh>
          <mesh position={[0, 0.9, 0]} castShadow>
            <icosahedronGeometry args={[0.28, 0]} />
            <PlasticMaterial color="#c8bba6" clearcoat={0.78} roughness={0.36} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

export default function AreonChurModel({ reducedMotion }: { reducedMotion: boolean }) {
  const groupRef = useRef<Group>(null)

  useFrame((state, delta) => {
    if (!groupRef.current || reducedMotion) return

    groupRef.current.rotation.y += delta * 0.055
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.028
  })

  return (
    <group ref={groupRef} rotation={[0.06, -0.58, 0]} position={[0.08, -0.14, 0]} scale={0.86}>
      <Grounds />
      <LowAnnexes />
      <HallMass />
      <RoofObjects />
      <TinyTrees />
    </group>
  )
}
