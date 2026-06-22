"use client"

import { RoundedBox } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { useMemo, useRef } from "react"
import { DoubleSide } from "three"
import type { Group } from "three"

type Vec3 = [number, number, number]

/**
 * Low-poly Theilerhaus Zug.
 * Signature features kept readable but reduced:
 *  - protected historic brick building with a long middle wing
 *  - two taller end pavilions, grey hipped roofs and strong eaves
 *  - pale brick facade, reddish belt courses and arched window heads
 *  - light basement plinth, steps and understated Zug street context
 */

const colors = {
  site: "#2f332b",
  asphalt: "#61676a",
  concrete: "#c8c9c3",
  plinth: "#d8dedb",
  brick: "#d9bf87",
  brickLight: "#ead7a9",
  brickShadow: "#b99b68",
  redBrick: "#a96546",
  redBrickDark: "#7c4939",
  roof: "#6f7880",
  roofLight: "#8e979d",
  gutter: "#b8c2c6",
  glass: "#25282f",
  glassLight: "#7997aa",
  frame: "#3c2822",
  stair: "#b7b8b2",
  rail: "#a9b2b6",
  treeTrunk: "#7a5a3a",
  tree: "#5f7c50",
  hedge: "#496b3f",
}

const MAIN = { w: 5.35, d: 1.85, plinthH: 0.38, bodyH: 2.12 }
const TOWER = { w: 1.45, d: 2.15, plinthH: 0.38, bodyH: 2.68 }
const towerX = 3.32
const mainFrontZ = MAIN.d / 2
const towerFrontZ = TOWER.d / 2
const mainTop = MAIN.plinthH + MAIN.bodyH
const towerTop = TOWER.plinthH + TOWER.bodyH

type PlasticProps = {
  color: string
  roughness?: number
  metalness?: number
  clearcoat?: number
  opacity?: number
  doubleSide?: boolean
}

function PlasticMaterial({
  color,
  roughness = 0.42,
  metalness = 0.02,
  clearcoat = 0.65,
  opacity,
  doubleSide,
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
      side={doubleSide ? DoubleSide : undefined}
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

function FaceBox({
  args,
  position,
  color,
  roughness,
  metalness,
  clearcoat,
  opacity,
}: {
  args: Vec3
  position: Vec3
  color: string
  roughness?: number
  metalness?: number
  clearcoat?: number
  opacity?: number
}) {
  return (
    <mesh position={position} castShadow receiveShadow>
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

function FacadeWindow({
  position,
  rotationY = 0,
  scale = 1,
  arched = true,
}: {
  position: Vec3
  rotationY?: number
  scale?: number
  arched?: boolean
}) {
  const w = 0.25 * scale
  const h = 0.46 * scale
  const archR = 0.17 * scale

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <FaceBox
        args={[w + 0.09 * scale, h + 0.12 * scale, 0.035]}
        position={[0, 0, 0.012]}
        color={colors.redBrick}
        roughness={0.46}
      />
      {arched ? (
        <mesh position={[0, h * 0.55, 0.034]} castShadow>
          <circleGeometry args={[archR, 12, 0, Math.PI]} />
          <PlasticMaterial color={colors.redBrick} roughness={0.46} clearcoat={0.68} doubleSide />
        </mesh>
      ) : (
        <FaceBox
          args={[w + 0.12 * scale, 0.09 * scale, 0.04]}
          position={[0, h * 0.58, 0.035]}
          color={colors.redBrick}
          roughness={0.44}
        />
      )}
      <FaceBox
        args={[w, h, 0.05]}
        position={[0, -0.03 * scale, 0.055]}
        color={colors.glass}
        roughness={0.18}
        metalness={0.08}
        clearcoat={0.95}
      />
      <FaceBox
        args={[0.035 * scale, h + 0.02 * scale, 0.06]}
        position={[-w * 0.2, -0.03 * scale, 0.085]}
        color={colors.glassLight}
        roughness={0.12}
        opacity={0.5}
      />
      <FaceBox
        args={[w + 0.12 * scale, 0.045 * scale, 0.07]}
        position={[0, -h * 0.64, 0.07]}
        color={colors.frame}
        roughness={0.32}
      />
    </group>
  )
}

function BeltCourse({ width, z, y, x = 0 }: { width: number; z: number; y: number; x?: number }) {
  return (
    <group>
      <Slab args={[width, 0.055, 0.055]} position={[x, y, z]} color={colors.redBrick} roughness={0.52} />
      <Slab args={[width, 0.026, 0.06]} position={[x, y + 0.035, z + 0.005]} color={colors.brickShadow} roughness={0.55} />
    </group>
  )
}

function BrickRelief({ width, z, yBase, yTop, x = 0 }: { width: number; z: number; yBase: number; yTop: number; x?: number }) {
  const courses = useMemo(() => {
    const out: number[] = []
    for (let y = yBase; y <= yTop; y += 0.22) out.push(Number(y.toFixed(2)))
    return out
  }, [yBase, yTop])

  return (
    <group>
      {courses.map((y) => (
        <Slab
          key={`${x}-${z}-${y}`}
          args={[width - 0.18, 0.012, 0.035]}
          position={[x, y, z]}
          color={colors.brickLight}
          roughness={0.58}
          clearcoat={0.5}
        />
      ))}
    </group>
  )
}

function MainFacade() {
  const centralRows = useMemo(
    () => [
      { y: 0.8, xs: [-2.1, -1.45, -0.8, -0.15, 0.5, 1.15, 1.8] },
      { y: 1.42, xs: [-2.1, -1.4, -0.7, 0, 0.7, 1.4, 2.1] },
      { y: 2.02, xs: [-2.0, -1.45, -0.9, -0.35, 0.2, 0.75, 1.3, 1.85] },
    ],
    [],
  )
  const towerRows = useMemo(
    () => [
      { y: 0.78, xs: [-0.28, 0.28] },
      { y: 1.45, xs: [-0.28, 0.28] },
      { y: 2.15, xs: [-0.28, 0.28] },
      { y: 2.72, xs: [-0.28, 0.28] },
    ],
    [],
  )

  return (
    <group>
      <BrickRelief width={MAIN.w} z={mainFrontZ + 0.03} yBase={0.6} yTop={2.28} />
      {[0.98, 1.58, 2.2].map((y) => (
        <BeltCourse key={y} width={MAIN.w - 0.12} z={mainFrontZ + 0.055} y={y} />
      ))}
      {centralRows.map((row) =>
        row.xs.map((x) => (
          <FacadeWindow key={`main-${row.y}-${x}`} position={[x, row.y, mainFrontZ + 0.065]} scale={0.88} />
        )),
      )}
      {[-1.45, 0, 1.45].map((x) => (
        <FacadeWindow key={`attic-${x}`} position={[x, 2.44, mainFrontZ + 0.07]} scale={0.74} />
      ))}

      {[-towerX, towerX].map((baseX) => (
        <group key={baseX}>
          <BrickRelief width={TOWER.w} z={towerFrontZ + 0.035} yBase={0.58} yTop={2.86} x={baseX} />
          {[1.0, 1.64, 2.32].map((y) => (
            <BeltCourse key={`${baseX}-${y}`} width={TOWER.w - 0.1} z={towerFrontZ + 0.06} y={y} x={baseX} />
          ))}
          {towerRows.map((row) =>
            row.xs.map((x) => (
              <FacadeWindow
                key={`tower-${baseX}-${row.y}-${x}`}
                position={[baseX + x, row.y, towerFrontZ + 0.07]}
                scale={row.y > 2.5 ? 0.86 : 0.82}
                arched={row.y < 2.5}
              />
            )),
          )}
        </group>
      ))}
    </group>
  )
}

function SideFacades() {
  const sideRows = useMemo(
    () => [
      { y: 0.82, zs: [-0.56, 0.02, 0.6] },
      { y: 1.48, zs: [-0.56, 0.02, 0.6] },
      { y: 2.16, zs: [-0.48, 0.42] },
    ],
    [],
  )

  return (
    <group>
      {[-1, 1].map((side) => {
        const x = side * (towerX + TOWER.w / 2 + 0.04)
        const rot = side > 0 ? Math.PI / 2 : -Math.PI / 2

        return (
          <group key={side}>
            {sideRows.map((row) =>
              row.zs.map((z) => (
                <FacadeWindow
                  key={`${side}-${row.y}-${z}`}
                  position={[x, row.y, z]}
                  rotationY={rot}
                  scale={row.y > 2 ? 0.76 : 0.8}
                />
              )),
            )}
            {[1.0, 1.66, 2.34].map((y) => (
              <Slab
                key={`${side}-belt-${y}`}
                args={[0.055, 0.052, TOWER.d - 0.18]}
                position={[x, y, 0]}
                color={colors.redBrick}
                roughness={0.52}
              />
            ))}
          </group>
        )
      })}
    </group>
  )
}

function BuildingMasses() {
  return (
    <group>
      <Mass args={[MAIN.w, MAIN.plinthH, MAIN.d]} position={[0, MAIN.plinthH / 2, 0]} color={colors.plinth} radius={0.025} roughness={0.52} />
      <Mass
        args={[MAIN.w, MAIN.bodyH, MAIN.d]}
        position={[0, MAIN.plinthH + MAIN.bodyH / 2, 0]}
        color={colors.brick}
        radius={0.018}
        roughness={0.46}
      />
      {[-towerX, towerX].map((x) => (
        <group key={x}>
          <Mass args={[TOWER.w, TOWER.plinthH, TOWER.d]} position={[x, TOWER.plinthH / 2, 0]} color={colors.plinth} radius={0.025} roughness={0.52} />
          <Mass
            args={[TOWER.w, TOWER.bodyH, TOWER.d]}
            position={[x, TOWER.plinthH + TOWER.bodyH / 2, 0]}
            color={colors.brick}
            radius={0.018}
            roughness={0.46}
          />
          <Slab args={[TOWER.w + 0.22, 0.08, TOWER.d + 0.26]} position={[x, 2.36, 0]} color={colors.roofLight} roughness={0.38} metalness={0.18} />
        </group>
      ))}
      <Slab args={[MAIN.w + 0.16, 0.08, MAIN.d + 0.22]} position={[0, 2.28, 0]} color={colors.roofLight} roughness={0.38} metalness={0.18} />
      <MainFacade />
      <SideFacades />
    </group>
  )
}

function GabledRoof({
  width,
  depth,
  x,
  y,
  color = colors.roof,
}: {
  width: number
  depth: number
  x: number
  y: number
  color?: string
}) {
  return (
    <group position={[x, y, 0]}>
      <Slab
        args={[width + 0.28, 0.08, depth * 0.62]}
        position={[0, 0.18, -depth * 0.22]}
        rotation={[0.34, 0, 0]}
        color={color}
        roughness={0.3}
        metalness={0.32}
      />
      <Slab
        args={[width + 0.28, 0.08, depth * 0.62]}
        position={[0, 0.18, depth * 0.22]}
        rotation={[-0.34, 0, 0]}
        color={color}
        roughness={0.3}
        metalness={0.32}
      />
      <Slab args={[width + 0.38, 0.055, 0.16]} position={[0, 0.44, 0]} color={colors.roofLight} roughness={0.32} metalness={0.28} />
      <Slab args={[width + 0.46, 0.055, depth + 0.24]} position={[0, -0.04, 0]} color={colors.gutter} roughness={0.38} metalness={0.22} />
    </group>
  )
}

function HippedTowerRoof({ x }: { x: number }) {
  return (
    <group position={[x, towerTop + 0.1, 0]}>
      <mesh position={[0, 0.34, 0]} rotation={[0, Math.PI / 4, 0]} scale={[0.88, 1, 1.18]} castShadow receiveShadow>
        <coneGeometry args={[1.05, 0.82, 4]} />
        <PlasticMaterial color={colors.roof} roughness={0.32} metalness={0.34} clearcoat={0.62} />
      </mesh>
      <Slab args={[TOWER.w + 0.48, 0.075, TOWER.d + 0.48]} position={[0, -0.02, 0]} color={colors.gutter} roughness={0.38} metalness={0.22} />
      <Slab args={[0.22, 0.42, 0.18]} position={[0.1, 0.86, -0.16]} color={colors.plinth} roughness={0.42} />
      <Slab args={[0.26, 0.05, 0.22]} position={[0.1, 1.1, -0.16]} color={colors.roof} roughness={0.3} metalness={0.3} />
    </group>
  )
}

function Roofs() {
  return (
    <group>
      <GabledRoof width={MAIN.w} depth={MAIN.d + 0.2} x={0} y={mainTop + 0.02} />
      <HippedTowerRoof x={-towerX} />
      <HippedTowerRoof x={towerX} />
      {[-1.65, 0, 1.65].map((x) => (
        <Slab
          key={x}
          args={[0.5, 0.04, 0.18]}
          position={[x, mainTop + 0.48, -0.26]}
          rotation={[0.34, 0, 0]}
          color={colors.glassLight}
          roughness={0.16}
          metalness={0.12}
          opacity={0.65}
        />
      ))}
      {[-0.9, 1.15].map((x) => (
        <group key={x} position={[x, mainTop + 0.5, 0.32]}>
          <Slab args={[0.18, 0.42, 0.18]} position={[0, 0.2, 0]} color={colors.plinth} roughness={0.44} />
          <Slab args={[0.23, 0.05, 0.23]} position={[0, 0.43, 0]} color={colors.roofLight} roughness={0.34} metalness={0.25} />
        </group>
      ))}
      {[-3.98, 3.98].map((x) => (
        <mesh key={x} position={[x, 1.75, towerFrontZ + 0.13]} rotation={[0, 0, 0]} castShadow>
          <cylinderGeometry args={[0.025, 0.025, 2.6, 8]} />
          <PlasticMaterial color={colors.gutter} roughness={0.34} metalness={0.4} clearcoat={0.5} />
        </mesh>
      ))}
    </group>
  )
}

function StairsAndStreet() {
  return (
    <group>
      <Slab args={[11.6, 0.04, 1.4]} position={[0, 0.03, 2.6]} color={colors.asphalt} roughness={0.72} />
      <Slab args={[9.6, 0.04, 0.6]} position={[0.2, 0.045, 1.68]} color={colors.concrete} roughness={0.64} />
      {[0, 1, 2, 3, 4].map((i) => (
        <Slab
          key={i}
          args={[1.5 + i * 0.16, 0.05, 0.22]}
          position={[0.9, 0.08 + i * 0.055, 1.15 + i * 0.16]}
          color={colors.stair}
          roughness={0.58}
        />
      ))}
      <Slab args={[0.05, 0.5, 1.15]} position={[1.86, 0.42, 1.5]} color={colors.rail} roughness={0.38} metalness={0.42} />
      <Slab args={[0.05, 0.44, 1.0]} position={[0.1, 0.38, 1.42]} color={colors.rail} roughness={0.38} metalness={0.42} />
      <Mass args={[0.85, 0.55, 1.1]} position={[-4.65, 0.28, 0.5]} color={colors.plinth} radius={0.025} roughness={0.55} />
      <Slab args={[0.9, 0.08, 1.2]} position={[-4.65, 0.6, 0.5]} color={colors.roofLight} roughness={0.38} metalness={0.18} />
    </group>
  )
}

function Tree({ position, scale = 1 }: { position: Vec3; scale?: number }) {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      <mesh position={[0, 0.27, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.04, 0.055, 0.54, 6]} />
        <PlasticMaterial color={colors.treeTrunk} roughness={0.6} clearcoat={0.4} />
      </mesh>
      <mesh position={[0, 0.72, 0]} castShadow receiveShadow>
        <icosahedronGeometry args={[0.34, 0]} />
        <PlasticMaterial color={colors.tree} roughness={0.62} clearcoat={0.45} />
      </mesh>
    </group>
  )
}

function Site() {
  return (
    <group>
      <RoundedBox args={[12.8, 0.2, 8.4]} position={[0, -0.1, -0.25]} radius={0.08} smoothness={1} receiveShadow>
        <PlasticMaterial color={colors.site} roughness={0.84} clearcoat={0.34} />
      </RoundedBox>
      <StairsAndStreet />
      <Mass args={[1.0, 0.34, 0.35]} position={[-5.25, 0.17, 0.9]} color={colors.hedge} radius={0.07} roughness={0.78} />
      <Mass args={[1.0, 0.32, 0.35]} position={[5.1, 0.16, 0.85]} color={colors.hedge} radius={0.07} roughness={0.78} />
      <Tree position={[-5.1, 0, 1.95]} scale={1.05} />
      <Tree position={[4.7, 0, 2.0]} scale={0.95} />
      <Tree position={[2.8, 0, 2.25]} scale={0.82} />
    </group>
  )
}

export default function TheilerhausModel({ reducedMotion }: { reducedMotion: boolean }) {
  const groupRef = useRef<Group>(null)

  useFrame((state, delta) => {
    if (!groupRef.current || reducedMotion) return
    groupRef.current.rotation.y += delta * 0.035
    groupRef.current.position.y = -0.05 + Math.sin(state.clock.elapsedTime * 0.7) * 0.01
  })

  return (
    <group ref={groupRef} rotation={[0, -0.36, 0]} position={[0, 0.02, 0.15]} scale={0.42}>
      <Site />
      <BuildingMasses />
      <Roofs />
    </group>
  )
}
