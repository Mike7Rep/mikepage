"use client"

import { RoundedBox } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { useMemo, useRef } from "react"
import type { Group } from "three"

type Vec3 = [number, number, number]
type Pt = [number, number] // cross-section [z, y]

/**
 * Low-poly Talstation Unterwasser (Chäserrugg valley station,
 * Herzog & de Meuron, 2024).
 * Signature features kept readable but reduced:
 *  - large bent ("Knick") gable roof in silvery metal with a PV field
 *  - roof projecting far over an open forecourt on a slim timber colonnade
 *  - exposed timber rafter rhythm, warm larch facade
 *  - alpine meadow site, fir trees and the historic stone viaduct alongside
 */

// hall (timber box, ridge runs along X)
const HALL = { w: 6.0, d: 3.2, wallH: 0.95 }
const ROOF_LEN_X = HALL.w + 0.7

// roof cross-section in the Z/Y plane (the characteristic bend)
const SEC: Record<string, Pt> = {
  backEave: [-2.2, 1.18],
  ridge: [-0.3, 2.3],
  knick: [1.0, 1.55],
  frontEave: [3.8, 0.95],
}

const colors = {
  site: "#3f6b34",
  meadow: "#4a7a3c",
  plaza: "#b4b8ae",
  gravel: "#8c8274",
  timber: "#b3853f",
  timberDark: "#8f6a31",
  roof: "#ccd1d1",
  roofRidge: "#dde2e1",
  pv: "#2c3744",
  glass: "#9ec7cf",
  rafter: "#caa66e",
  stone: "#9a958c",
  stoneDark: "#827d74",
  water: "#7fb8c4",
  trunk: "#7a5a3a",
  fir: "#3f7a45",
  firDark: "#356b3c",
  leaf: "#69954f",
}

type PlasticProps = {
  color: string
  roughness?: number
  metalness?: number
  clearcoat?: number
  opacity?: number
}

function PlasticMaterial({
  color,
  roughness = 0.4,
  metalness = 0.02,
  clearcoat = 0.6,
  opacity,
}: PlasticProps) {
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
  radius = 0.025,
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

// one slope of the bent roof, derived from two cross-section points (low z -> high z)
function planeTransform(p1: Pt, p2: Pt, overlap = 0.16) {
  const dz = p2[0] - p1[0]
  const dy = p2[1] - p1[1]
  return {
    len: Math.hypot(dz, dy) + overlap,
    mid: [0, (p1[1] + p2[1]) / 2, (p1[0] + p2[0]) / 2] as Vec3,
    rotX: Math.atan2(-dy, dz),
  }
}

const SEG_A = planeTransform(SEC.knick, SEC.frontEave) // far front canopy
const SEG_B = planeTransform(SEC.ridge, SEC.knick) // front upper (PV field)
const SEG_C = planeTransform(SEC.backEave, SEC.ridge) // back slope

function Roof() {
  return (
    <group>
      <Slab args={[ROOF_LEN_X, 0.09, SEG_A.len]} position={SEG_A.mid} rotation={[SEG_A.rotX, 0, 0]} color={colors.roof} roughness={0.28} metalness={0.45} />
      <Slab args={[ROOF_LEN_X, 0.09, SEG_B.len]} position={SEG_B.mid} rotation={[SEG_B.rotX, 0, 0]} color={colors.roof} roughness={0.28} metalness={0.45} />
      <Slab args={[ROOF_LEN_X, 0.09, SEG_C.len]} position={SEG_C.mid} rotation={[SEG_C.rotX, 0, 0]} color={colors.roof} roughness={0.28} metalness={0.45} />

      {/* ridge cap */}
      <Slab args={[ROOF_LEN_X + 0.04, 0.07, 0.16]} position={[0, SEC.ridge[1] + 0.05, SEC.ridge[0]]} color={colors.roofRidge} roughness={0.3} metalness={0.4} />

      {/* PV field on the front-upper slope */}
      <Slab
        args={[ROOF_LEN_X - 1.4, 0.03, SEG_B.len - 0.5]}
        position={[0, SEG_B.mid[1] + 0.07, SEG_B.mid[2]]}
        rotation={[SEG_B.rotX, 0, 0]}
        color={colors.pv}
        roughness={0.2}
        metalness={0.3}
      />
    </group>
  )
}

function Hall() {
  const halfD = HALL.d / 2
  return (
    <group>
      {/* timber hall body */}
      <Mass args={[HALL.w, HALL.wallH, HALL.d]} position={[0, HALL.wallH / 2, 0]} color={colors.timber} radius={0.02} roughness={0.5} />
      {/* base plinth */}
      <Mass args={[HALL.w + 0.1, 0.16, HALL.d + 0.1]} position={[0, 0.08, 0]} color={colors.timberDark} radius={0.02} roughness={0.55} />

      {/* glazed entrance front (under the canopy) */}
      <Slab args={[HALL.w - 1.0, 0.66, 0.05]} position={[0, 0.52, halfD + 0.03]} color={colors.glass} roughness={0.14} metalness={0.05} opacity={0.66} />
      {/* glazed gable ends */}
      <Slab args={[0.05, 1.0, 1.9]} position={[HALL.w / 2 + 0.03, 1.05, 0]} color={colors.glass} roughness={0.16} opacity={0.5} />
      <Slab args={[0.05, 1.0, 1.9]} position={[-HALL.w / 2 - 0.03, 1.05, 0]} color={colors.glass} roughness={0.16} opacity={0.5} />
      {/* timber gable infill below the ridge */}
      <Slab args={[0.06, 0.7, 1.7]} position={[HALL.w / 2 + 0.02, 1.45, 0]} color={colors.timber} roughness={0.5} />
      <Slab args={[0.06, 0.7, 1.7]} position={[-HALL.w / 2 - 0.02, 1.45, 0]} color={colors.timber} roughness={0.5} />
    </group>
  )
}

function ColonnadeAndRafters() {
  const colX = useMemo(() => [-2.7, -1.8, -0.9, 0, 0.9, 1.8, 2.7], [])
  const raftX = useMemo(() => [-2.55, -1.7, -0.85, 0, 0.85, 1.7, 2.55], [])

  return (
    <group>
      {/* slim timber columns under the projecting canopy */}
      {colX.map((x) => (
        <mesh key={`c${x}`} position={[x, 0.5, 3.4]} castShadow receiveShadow>
          <cylinderGeometry args={[0.045, 0.05, 1.0, 8]} />
          <PlasticMaterial color={colors.timberDark} roughness={0.45} clearcoat={0.5} />
        </mesh>
      ))}

      {/* exposed rafter rhythm under the front canopy */}
      {raftX.map((x) => (
        <Slab
          key={`r${x}`}
          args={[0.07, 0.07, SEG_A.len - 0.2]}
          position={[x, SEG_A.mid[1] - 0.05, SEG_A.mid[2]]}
          rotation={[SEG_A.rotX, 0, 0]}
          color={colors.rafter}
          roughness={0.55}
        />
      ))}
    </group>
  )
}

function Forecourt() {
  return (
    <group>
      <Slab args={[6.8, 0.04, 2.7]} position={[0, 0.04, 2.65]} color={colors.plaza} roughness={0.5} />
      {/* fountain built from old station stones */}
      <mesh position={[1.9, 0.13, 3.0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.34, 0.36, 0.2, 8]} />
        <PlasticMaterial color={colors.stone} roughness={0.6} clearcoat={0.4} />
      </mesh>
      <mesh position={[1.9, 0.235, 3.0]}>
        <cylinderGeometry args={[0.27, 0.27, 0.04, 8]} />
        <PlasticMaterial color={colors.water} roughness={0.1} metalness={0.05} clearcoat={0.9} />
      </mesh>
    </group>
  )
}

function Viaduct() {
  const piers = useMemo(() => [-2.0, -1.0, 0, 1.0, 2.0], [])
  return (
    <group position={[0.4, 0, -4.2]} rotation={[0, 0.24, 0]}>
      {/* deck */}
      <Mass args={[5.2, 0.24, 0.8]} position={[0, 1.55, 0]} color={colors.stone} radius={0.02} roughness={0.6} />
      <Slab args={[5.2, 0.08, 0.9]} position={[0, 1.7, 0]} color={colors.stoneDark} roughness={0.6} />
      {/* piers (gaps read as arches) */}
      {piers.map((x) => (
        <Mass key={x} args={[0.42, 1.55, 0.66]} position={[x, 0.78, 0]} color={colors.stone} radius={0.03} roughness={0.62} />
      ))}
    </group>
  )
}

function Fir({ position, scale = 1 }: { position: Vec3; scale?: number }) {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.04, 0.06, 0.3, 6]} />
        <PlasticMaterial color={colors.trunk} roughness={0.6} clearcoat={0.35} />
      </mesh>
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <coneGeometry args={[0.36, 0.6, 7]} />
        <PlasticMaterial color={colors.firDark} roughness={0.6} clearcoat={0.4} />
      </mesh>
      <mesh position={[0, 0.85, 0]} castShadow receiveShadow>
        <coneGeometry args={[0.28, 0.5, 7]} />
        <PlasticMaterial color={colors.fir} roughness={0.58} clearcoat={0.4} />
      </mesh>
      <mesh position={[0, 1.15, 0]} castShadow receiveShadow>
        <coneGeometry args={[0.18, 0.4, 7]} />
        <PlasticMaterial color={colors.fir} roughness={0.56} clearcoat={0.4} />
      </mesh>
    </group>
  )
}

function RoundTree({ position, scale = 1 }: { position: Vec3; scale?: number }) {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.035, 0.05, 0.4, 6]} />
        <PlasticMaterial color={colors.trunk} roughness={0.55} clearcoat={0.4} />
      </mesh>
      <mesh position={[0, 0.56, 0]} castShadow receiveShadow>
        <icosahedronGeometry args={[0.26, 0]} />
        <PlasticMaterial color={colors.leaf} roughness={0.58} clearcoat={0.5} />
      </mesh>
    </group>
  )
}

function SiteBase() {
  return (
    <group>
      <RoundedBox args={[13, 0.2, 9.4]} position={[0, -0.1, -0.6]} radius={0.08} smoothness={1} receiveShadow>
        <PlasticMaterial color={colors.site} roughness={0.78} clearcoat={0.4} />
      </RoundedBox>
      {/* subtle meadow tint patch */}
      <Slab args={[12.4, 0.02, 4.0]} position={[0, 0.01, -2.6]} color={colors.meadow} roughness={0.85} />
      {/* gravel access loop / parking on the village side */}
      <Slab args={[9.6, 0.03, 1.0]} position={[-0.4, 0.03, 4.5]} color={colors.gravel} roughness={0.7} />
      <Slab args={[2.4, 0.03, 1.3]} position={[-4.0, 0.035, 3.7]} color={colors.gravel} roughness={0.7} />
    </group>
  )
}

function Landscape() {
  const firs = useMemo(
    () =>
      [
        [-5.3, 0.0, -3.4, 1.2],
        [-4.4, 0.0, -4.4, 0.95],
        [5.2, 0.0, -3.0, 1.1],
        [4.3, 0.0, -4.2, 0.85],
        [-5.6, 0.0, 1.4, 1.0],
        [5.6, 0.0, 1.2, 1.15],
        [-5.2, 0.0, 3.4, 0.8],
        [3.0, 0.0, -4.7, 1.0],
      ] as const,
    [],
  )
  const round = useMemo(
    () =>
      [
        [-4.6, 0.0, 3.5, 0.9],
        [5.0, 0.0, 3.4, 0.8],
      ] as const,
    [],
  )

  return (
    <group>
      {firs.map(([x, y, z, s]) => (
        <Fir key={`f${x}-${z}`} position={[x, y, z]} scale={s} />
      ))}
      {round.map(([x, y, z, s]) => (
        <RoundTree key={`t${x}-${z}`} position={[x, y, z]} scale={s} />
      ))}
    </group>
  )
}

export default function TalstationModel({ reducedMotion }: { reducedMotion: boolean }) {
  const groupRef = useRef<Group>(null)

  useFrame((state, delta) => {
    if (!groupRef.current || reducedMotion) return
    groupRef.current.rotation.y += delta * 0.035
    groupRef.current.position.y = -0.06 + Math.sin(state.clock.elapsedTime * 0.7) * 0.01
  })

  return (
    <group ref={groupRef} rotation={[0, -0.5, 0]} position={[-0.1, 0.06, 0.5]} scale={0.44}>
      <SiteBase />
      <Viaduct />
      <Hall />
      <ColonnadeAndRafters />
      <Roof />
      <Forecourt />
      <Landscape />
    </group>
  )
}
