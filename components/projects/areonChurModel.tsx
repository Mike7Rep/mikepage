"use client"

import { RoundedBox } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { useMemo, useRef } from "react"
import type { Group } from "three"

type Vec3 = [number, number, number]

/**
 * Low-poly AREON Eventhalle Chur.
 * The proportions follow the supplied HTML draft: 58 x 50 m hall,
 * full-width southern foyer, two lower side annexes and a projecting entrance canopy.
 * PV fields and dense facade lisenes are intentionally omitted for a calmer miniature.
 */

const scale = {
  hallW: 5.8,
  hallD: 5.0,
  baseH: 0.5,
  upperH: 0.75,
  foyerD: 1.6,
  sideW: 1.2,
  sideD: 2.8,
  sideH: 0.45,
}

const hallH = scale.baseH + scale.upperH
const foyerW = scale.hallW + scale.sideW * 2
const foyerZ = -(scale.hallD / 2 + scale.foyerD / 2)
const sideZ = scale.hallD * 0.18

const colors = {
  site: "#263125",
  plaza: "#bfc3bd",
  asphalt: "#666d6b",
  base: "#8a9091",
  baseDark: "#62696a",
  timber: "#d7d0bf",
  timberShadow: "#b9b09b",
  roof: "#eceee8",
  roofEdge: "#c9c6ba",
  glass: "#89b5bd",
  skylight: "#c7e8ee",
  terrace: "#789a58",
  trunk: "#93734f",
  leaves: "#739b59",
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
  roughness = 0.38,
  metalness = 0.02,
  clearcoat = 0.82,
  opacity,
}: PlasticProps) {
  return (
    <meshPhysicalMaterial
      color={color}
      roughness={roughness}
      metalness={metalness}
      clearcoat={clearcoat}
      clearcoatRoughness={0.2}
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
  clearcoat,
  rotation,
}: {
  args: Vec3
  position: Vec3
  color: string
  radius?: number
  roughness?: number
  metalness?: number
  clearcoat?: number
  rotation?: Vec3
}) {
  return (
    <RoundedBox
      args={args}
      position={position}
      rotation={rotation}
      radius={radius}
      smoothness={1}
      castShadow
      receiveShadow
    >
      <PlasticMaterial color={color} roughness={roughness} metalness={metalness} clearcoat={clearcoat} />
    </RoundedBox>
  )
}

function Slab({
  args,
  position,
  color,
  roughness,
  metalness,
  clearcoat,
  opacity,
  rotation,
}: {
  args: Vec3
  position: Vec3
  color: string
  roughness?: number
  metalness?: number
  clearcoat?: number
  opacity?: number
  rotation?: Vec3
}) {
  return (
    <mesh position={position} rotation={rotation} castShadow receiveShadow>
      <boxGeometry args={args} />
      <PlasticMaterial
        color={color}
        roughness={roughness}
        metalness={metalness}
        clearcoat={clearcoat}
        opacity={opacity}
      />
    </mesh>
  )
}

function Column({ position, height = 0.72 }: { position: Vec3; height?: number }) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <cylinderGeometry args={[0.035, 0.04, height, 8]} />
      <PlasticMaterial color={colors.baseDark} roughness={0.28} metalness={0.12} clearcoat={0.88} />
    </mesh>
  )
}

function SiteBase() {
  return (
    <group>
      <RoundedBox args={[12.4, 0.2, 9.4]} position={[0, -0.1, -0.55]} radius={0.08} smoothness={1} receiveShadow>
        <PlasticMaterial color={colors.site} roughness={0.64} clearcoat={0.55} />
      </RoundedBox>
      <Slab args={[9.8, 0.035, 2.35]} position={[0, 0.025, -4.45]} color={colors.plaza} roughness={0.45} />
      <Slab args={[10.8, 0.03, 1.0]} position={[0, 0.035, 3.35]} color={colors.asphalt} roughness={0.55} />
      <Slab args={[0.95, 0.03, 6.8]} position={[-5.25, 0.04, -0.45]} color={colors.asphalt} roughness={0.58} />
      <Slab args={[0.95, 0.03, 6.8]} position={[5.25, 0.04, -0.45]} color={colors.asphalt} roughness={0.58} />
    </group>
  )
}

function HallBody() {
  return (
    <group>
      <Mass
        args={[scale.hallW, scale.baseH, scale.hallD]}
        position={[0, scale.baseH / 2, 0]}
        color={colors.base}
        radius={0.03}
        roughness={0.42}
      />
      <Mass
        args={[scale.hallW, scale.upperH, scale.hallD]}
        position={[0, scale.baseH + scale.upperH / 2, 0]}
        color={colors.timber}
        radius={0.025}
        roughness={0.34}
      />

      {/* broad glass/readability bands only, no dense facade beams */}
      <Slab
        args={[4.4, 0.34, 0.045]}
        position={[0, 0.34, -scale.hallD / 2 - 0.025]}
        color={colors.glass}
        roughness={0.16}
        metalness={0.04}
        opacity={0.72}
      />
      <Slab
        args={[3.6, 0.24, 0.045]}
        position={[0.05, scale.baseH + 0.36, -scale.hallD / 2 - 0.03]}
        color={colors.timberShadow}
        roughness={0.42}
      />
      <Slab
        args={[0.045, 0.34, 2.4]}
        position={[scale.hallW / 2 + 0.025, 0.34, 0.35]}
        color={colors.glass}
        roughness={0.16}
        opacity={0.58}
      />
      <Slab
        args={[0.045, 0.34, 2.1]}
        position={[-scale.hallW / 2 - 0.025, 0.34, 0.55]}
        color={colors.glass}
        roughness={0.16}
        opacity={0.52}
      />
    </group>
  )
}

function Roof() {
  const roofY = hallH + 0.07

  return (
    <group>
      <Mass
        args={[scale.hallW + 0.38, 0.14, scale.hallD + 0.38]}
        position={[0, roofY, 0]}
        color={colors.roof}
        radius={0.02}
        roughness={0.32}
      />
      <Slab
        args={[scale.hallW + 0.55, 0.035, scale.hallD + 0.55]}
        position={[0, roofY - 0.09, 0]}
        color={colors.roofEdge}
        roughness={0.44}
      />

      {/* smooth roof fields instead of PV/detail grid */}
      <Slab args={[1.6, 0.025, 4.15]} position={[-1.0, roofY + 0.085, 0]} color="#f6f7f2" roughness={0.26} />
      <Slab args={[1.6, 0.025, 4.15]} position={[1.05, roofY + 0.085, 0]} color="#f6f7f2" roughness={0.26} />

      {[-1.7, -0.45, 0.85, 2.0].map((x, index) => (
        <Mass
          key={x}
          args={[0.28, 0.22, 0.28]}
          position={[x, roofY + 0.19, index % 2 === 0 ? -0.85 : 0.95]}
          color={colors.roofEdge}
          radius={0.025}
          roughness={0.35}
        />
      ))}

      <Slab
        args={[0.72, 0.03, 0.54]}
        position={[-1.65, roofY + 0.11, -1.35]}
        rotation={[0, 0.12, 0]}
        color={colors.skylight}
        roughness={0.12}
        metalness={0.03}
        opacity={0.7}
      />
      <Slab
        args={[0.72, 0.03, 0.54]}
        position={[1.75, roofY + 0.11, 1.1]}
        rotation={[0, -0.1, 0]}
        color={colors.skylight}
        roughness={0.12}
        metalness={0.03}
        opacity={0.7}
      />
    </group>
  )
}

function FoyerAndCanopy() {
  const foyerH = scale.baseH
  const frontZ = foyerZ - scale.foyerD / 2
  const canopyZ = frontZ - 0.55

  return (
    <group>
      <Mass
        args={[foyerW, foyerH, scale.foyerD]}
        position={[0, foyerH / 2, foyerZ]}
        color={colors.base}
        radius={0.03}
        roughness={0.42}
      />
      <Mass
        args={[foyerW + 0.22, 0.09, scale.foyerD + 0.22]}
        position={[0, foyerH + 0.045, foyerZ]}
        color={colors.roof}
        radius={0.02}
        roughness={0.32}
      />
      <Slab
        args={[foyerW - 0.85, 0.32, 0.045]}
        position={[0, 0.3, frontZ - 0.035]}
        color={colors.glass}
        roughness={0.16}
        opacity={0.66}
      />
      <Slab
        args={[foyerW * 0.72, 0.045, scale.foyerD * 0.58]}
        position={[0, foyerH + 0.12, foyerZ + 0.04]}
        color={colors.terrace}
        roughness={0.6}
        clearcoat={0.62}
      />

      <Mass
        args={[2.35, 0.08, 1.18]}
        position={[0, 0.74, canopyZ]}
        color={colors.roof}
        radius={0.018}
        roughness={0.3}
      />
      {[-0.86, -0.28, 0.28, 0.86].map((x) => (
        <Column key={x} position={[x, 0.37, canopyZ - 0.42]} height={0.72} />
      ))}
      <Slab
        args={[1.45, 0.22, 0.045]}
        position={[0, 0.26, frontZ - 0.1]}
        color={colors.skylight}
        roughness={0.16}
        opacity={0.72}
      />
    </group>
  )
}

function SideAnnexes() {
  const sideX = scale.hallW / 2 + scale.sideW / 2

  return (
    <group>
      {[-sideX, sideX].map((x) => (
        <group key={x} position={[x, 0, sideZ]}>
          <Mass
            args={[scale.sideW, scale.sideH, scale.sideD]}
            position={[0, scale.sideH / 2, 0]}
            color={colors.base}
            radius={0.03}
            roughness={0.43}
          />
          <Mass
            args={[scale.sideW + 0.18, 0.075, scale.sideD + 0.2]}
            position={[0, scale.sideH + 0.04, 0]}
            color={colors.roof}
            radius={0.018}
            roughness={0.34}
          />
          <Slab
            args={[0.045, 0.24, scale.sideD * 0.64]}
            position={[x < 0 ? -scale.sideW / 2 - 0.025 : scale.sideW / 2 + 0.025, 0.27, 0.12]}
            color={colors.glass}
            roughness={0.18}
            opacity={0.55}
          />
        </group>
      ))}
    </group>
  )
}

function Tree({ position, scale = 1 }: { position: Vec3; scale?: number }) {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      <mesh position={[0, 0.22, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.035, 0.05, 0.45, 6]} />
        <PlasticMaterial color={colors.trunk} roughness={0.55} clearcoat={0.45} />
      </mesh>
      <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
        <icosahedronGeometry args={[0.24, 0]} />
        <PlasticMaterial color={colors.leaves} roughness={0.58} clearcoat={0.58} />
      </mesh>
    </group>
  )
}

function Landscape() {
  const trees = useMemo(
    () => [
      [-4.65, 0.02, -4.9, 1.15],
      [4.55, 0.02, -4.8, 1.0],
      [-5.15, 0.02, 2.6, 0.92],
      [5.15, 0.02, 2.75, 1.08],
      [-3.6, 0.02, 3.78, 0.85],
      [3.55, 0.02, 3.75, 0.9],
    ] as const,
    [],
  )

  return (
    <group>
      {trees.map(([x, y, z, s]) => (
        <Tree key={`${x}-${z}`} position={[x, y, z]} scale={s} />
      ))}
    </group>
  )
}

export default function AreonChurModel({ reducedMotion }: { reducedMotion: boolean }) {
  const groupRef = useRef<Group>(null)

  useFrame((state, delta) => {
    if (!groupRef.current || reducedMotion) return
    groupRef.current.rotation.y += delta * 0.035
    groupRef.current.position.y = -0.08 + Math.sin(state.clock.elapsedTime * 0.7) * 0.01
  })

  return (
    <group ref={groupRef} rotation={[0, -0.58, 0]} position={[-0.08, -0.07, 0.38]} scale={0.54}>
      <SiteBase />
      <SideAnnexes />
      <HallBody />
      <FoyerAndCanopy />
      <Roof />
      <Landscape />
    </group>
  )
}
