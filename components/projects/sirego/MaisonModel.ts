import * as THREE from "three"

type Placement = [x: number, y: number, z: number, width: number, height: number, depth: number, rotation?: number]
type Point = [x: number, z: number]

// Architectural reconstruction from the supplied IFC screenshots, not an IFC import.
// Proportions describe the exterior; they are not measured project dimensions.
export function createMaisonModel() {
  const model = new THREE.Group()
  model.name = "Maison de la Santé – architectural exterior"
  const box = new THREE.BoxGeometry(1, 1, 1)
  const concrete = new THREE.MeshStandardMaterial({color: 0xbfc5c7, roughness: 0.66, metalness: 0.1})
  const frame = new THREE.MeshStandardMaterial({color: 0x434e54, roughness: 0.37, metalness: 0.55})
  const glass = new THREE.MeshStandardMaterial({color: 0x72909b, roughness: 0.22, metalness: 0.66})
  const paleGlass = new THREE.MeshStandardMaterial({color: 0xa6bcc2, roughness: 0.27, metalness: 0.53})
  const panels = new THREE.MeshStandardMaterial({color: 0x646e71, roughness: 0.44, metalness: 0.36})
  const roof = new THREE.MeshStandardMaterial({color: 0x9fa8ad, roughness: 0.86})
  const concreteBoxes: Placement[] = []
  const frames: Placement[] = []
  const windows: Placement[] = []
  const lightWindows: Placement[] = []
  const solarPanels: Placement[] = []
  const roofBoxes: Placement[] = []
  const footprint: Point[] = [[-9, -2.65], [9, -2.65], [9, 2.65], [-7.8, 2.65]]
  const transform = new THREE.Object3D()

  function batch(geometry: THREE.BufferGeometry, material: THREE.Material, placements: Placement[], name: string) {
    const mesh = new THREE.InstancedMesh(geometry, material, placements.length)
    mesh.name = name
    placements.forEach(([x, y, z, width, height, depth, rotation = 0], index) => {
      transform.position.set(x, y, z)
      transform.scale.set(width, height, depth)
      transform.rotation.set(0, rotation, 0)
      transform.updateMatrix()
      mesh.setMatrixAt(index, transform.matrix)
    })
    mesh.castShadow = true
    mesh.receiveShadow = true
    mesh.computeBoundingSphere()
    model.add(mesh)
  }

  function slabGeometry(points: Point[], atrium: boolean) {
    const shape = new THREE.Shape(points.map(([x, z]) => new THREE.Vector2(x, -z)))
    if (atrium) {
      const opening = new THREE.Path()
      opening.absellipse(0, 0, 1.19, 0.63, 0, Math.PI * 2, true)
      shape.holes.push(opening)
    }
    const geometry = new THREE.ExtrudeGeometry(shape, {depth: 1, bevelEnabled: false, steps: 1, curveSegments: 24})
    geometry.rotateX(-Math.PI / 2)
    geometry.translate(0, -0.5, 0)
    return geometry
  }

  // Five horizontal bands, with the elliptical atrium continuing through the plates.
  const plates: Placement[] = Array.from({length: 5}, (_, level) => [0, 1.3 + level * 1.08, 0, 1, 0.25, 1])
  batch(slabGeometry(footprint, true), concrete, plates, "Floor plates with atrium")
  batch(slabGeometry(footprint, false), roof, [[0, -0.015, 0, 1.015, 0.15, 1.05]], "Building footing")

  function beamBetween(target: Placement[], a: Point, b: Point, y: number, height: number, depth: number) {
    const dx = b[0] - a[0], dz = b[1] - a[1]
    target.push([(a[0] + b[0]) / 2, y, (a[1] + b[1]) / 2, Math.hypot(dx, dz), height, depth, -Math.atan2(dz, dx)])
  }

  function facade(a: Point, b: Point, bottom: number, height: number, moduleWidth: number, seed: number) {
    const dx = b[0] - a[0], dz = b[1] - a[1]
    const length = Math.hypot(dx, dz)
    const bays = Math.round(length / moduleWidth)
    const step = length / bays
    const angle = -Math.atan2(dz, dx)
    for (let bay = 0; bay < bays; bay++) {
      const t = (bay + 0.5) / bays
      const x = a[0] + dx * t, z = a[1] + dz * t
      const pane: Placement = [x, bottom + height / 2, z, step - 0.038, height, 0.065, angle]
      // Opaque reflective glazing avoids transparency sorting while preserving the facade rhythm.
      if ((bay + seed) % 7 === 0) solarPanels.push(pane)
      else if ((bay * 3 + seed) % 5 < 2) lightWindows.push(pane)
      else windows.push(pane)
      frames.push([a[0] + dx * bay / bays, bottom + height / 2, a[1] + dz * bay / bays, 0.038, height + 0.06, 0.105, angle])
    }
    frames.push([b[0], bottom + height / 2, b[1], 0.045, height + 0.06, 0.105, angle])
    beamBetween(frames, a, b, bottom + 0.025, 0.05, 0.1)
    beamBetween(frames, a, b, bottom + height - 0.025, 0.05, 0.1)
  }

  // The angled west end and open upper loggia follow the supplied model views.
  for (let level = 0; level < 4; level++) {
    const y = 1.425 + level * 1.08
    const westBack: Point = level === 3 ? [-7.45, -2.59] : [-8.86, -2.59]
    const westFront: Point = level === 3 ? [-7.45, 2.59] : [-7.70, 2.59]
    facade(westBack, [8.94, -2.59], y, 0.83, 0.43, level)
    facade([8.94, 2.59], westFront, y, 0.83, 0.43, level + 2)
    facade([8.94, -2.59], [8.94, 2.59], y, 0.83, 0.43, level + 1)
    facade(westFront, westBack, y, 0.83, 0.43, level + 3)
    if (level < 3) for (const [x, z] of footprint) concreteBoxes.push([x * 0.995, y + 0.415, z * 0.98, 0.12, 0.83, 0.12])
  }

  // Recessed ground-floor glazing leaves a real colonnade along both long elevations.
  facade([-8.12, -1.92], [8.86, -1.92], 0.09, 1.07, 0.57, 0)
  facade([8.86, 1.92], [-7.26, 1.92], 0.09, 1.07, 0.57, 2)
  facade([8.86, -1.92], [8.86, 1.92], 0.09, 1.07, 0.57, 1)
  facade([-7.26, 1.92], [-8.12, -1.92], 0.09, 1.07, 0.57, 3)
  const columns: Placement[] = []
  for (const z of [-2.56, 2.56]) for (let column = 0; column < 11; column++) {
    const x = -7.5 + column * 1.61
    columns.push([x, 0.63, z, 0.15, 1.18, 0.15])
    columns.push([x, 0.11, z, 0.23, 0.09, 0.23])
  }
  batch(new THREE.CylinderGeometry(0.5, 0.5, 1, 12), concrete, columns, "Arcade columns and bases")

  for (let edge = 0; edge < footprint.length; edge++) {
    beamBetween(frames, footprint[edge], footprint[(edge + 1) % footprint.length], 5.795, 0.10, 0.065)
  }
  // West roof terrace: open corner frame and a fine railing, without glazing across the loggia.
  for (const [x, z] of [footprint[0], footprint[3]]) {
    frames.push([x, 5.12, z, 0.065, 1.13, 0.065])
  }
  beamBetween(frames, footprint[0], footprint[3], 4.98, 0.035, 0.035)
  for (let rail = 0; rail <= 8; rail++) {
    const t = rail / 8
    frames.push([-9 + 1.2 * t, 4.77, -2.65 + 5.3 * t, 0.018, 0.42, 0.018])
  }

  // Raised rectangular lantern with a visible oval light well below its slim frame.
  const collar: Point[] = [[-1.4, -0.84], [1.4, -0.84], [1.4, 0.84], [-1.4, 0.84]]
  batch(slabGeometry(collar, true), frame, [[0, 5.82, 0, 1, 0.08, 1]], "Elliptical skylight rim")
  const oval = new THREE.CircleGeometry(1, 48)
  oval.rotateX(-Math.PI / 2)
  batch(oval, glass, [[0, 5.51, 0, 1.18, 1, 0.62]], "Atrium glazing")
  for (let edge = 0; edge < collar.length; edge++) {
    beamBetween(frames, collar[edge], collar[(edge + 1) % collar.length], 6.02, 0.045, 0.045)
  }
  for (const [x, z] of collar) frames.push([x, 5.91, z, 0.035, 0.22, 0.035])
  frames.push([0, 5.52, 0, 2.34, 0.02, 0.025])
  for (const x of [-4.7, 4.4]) {
    roofBoxes.push([x, 5.80, -0.2, 1.13, 0.12, 0.7])
    frames.push([x, 5.74, -0.2, 1.18, 0.035, 0.75])
    roofBoxes.push([x + 0.95, 5.755, 0.63, 0.10, 0.03, 1.05])
  }
  batch(box, concrete, concreteBoxes, "Facade corner piers")
  batch(box, frame, frames, "Mullions, parapets and roof frames")
  batch(box, glass, windows, "Blue-grey glazing")
  batch(box, paleGlass, lightWindows, "Light glazing")
  batch(box, panels, solarPanels, "Facade panels")
  batch(box, roof, roofBoxes, "Roof hatches")
  return model
}

export function frameMaisonCamera(camera: THREE.OrthographicCamera, width: number, height: number) {
  const aspect = Math.max(1, width) / Math.max(1, height)
  const span = Math.max(15.6, 21.4 / aspect)
  camera.left = -span * aspect / 2
  camera.right = span * aspect / 2
  camera.top = span / 2
  camera.bottom = -span / 2
  camera.position.set(14, 13, 20)
  camera.lookAt(0, 2.4, 0)
  camera.updateProjectionMatrix()
  camera.updateMatrixWorld()
}
