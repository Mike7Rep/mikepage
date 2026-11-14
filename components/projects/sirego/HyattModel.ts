import * as THREE from "three"

type Point = [x: number, z: number]
type Placement = [x: number, y: number, z: number, width: number, height: number, depth: number, rotationY?: number]

// Architectural exterior reconstructed from the supplied elevations, roof plan and
// IFC perspectives. Dimensions are illustrative; no source IFC has been imported.
export function createHyattModel() {
  const model = new THREE.Group()
  model.name = "Park Hyatt Zürich – architectural exterior"
  const box = new THREE.BoxGeometry(1, 1, 1)
  const concrete = new THREE.MeshStandardMaterial({color: 0xd8d8d4, roughness: 0.67, metalness: 0.09})
  const metal = new THREE.MeshStandardMaterial({color: 0x59636a, roughness: 0.36, metalness: 0.56})
  const glass = new THREE.MeshStandardMaterial({color: 0x91a9b0, roughness: 0.24, metalness: 0.59})
  const paleGlass = new THREE.MeshStandardMaterial({color: 0xc0d0d3, roughness: 0.28, metalness: 0.46})
  const bronze = new THREE.MeshStandardMaterial({color: 0x988473, roughness: 0.54, metalness: 0.31})
  const dark = new THREE.MeshStandardMaterial({color: 0x737a7d, roughness: 0.87})
  const concreteBoxes: Placement[] = []
  const metalBoxes: Placement[] = []
  const glazing: Placement[] = []
  const lightGlazing: Placement[] = []
  const warmPanels: Placement[] = []
  const shadowBoxes: Placement[] = []
  const windowFrames: Placement[] = []
  const transform = new THREE.Object3D()

  // The two deep upper-level incisions remain empty through all five hotel floors.
  // The low entrance cut-out is represented separately in the podium facade.
  const outline: Point[] = [
    [-8.8, -5.2], [2.4, -5.2], [2.4, 2.3], [6.3, 2.3],
    [6.3, -5.2], [8.8, -5.2], [8.8, 5.2], [-8.8, 5.2],
    [-8.8, 2.3], [-1.4, 2.3], [-1.4, -2.3], [-8.8, -2.3],
  ]
  const roofShape = new THREE.Shape(outline.map(([x, z]) => new THREE.Vector2(x, -z)))
  const slab = new THREE.ExtrudeGeometry(roofShape, {depth: 1, bevelEnabled: false, steps: 1})
  slab.rotateX(-Math.PI / 2)
  slab.translate(0, -0.5, 0)

  const frameShape = new THREE.Shape([
    new THREE.Vector2(-0.5, -0.5), new THREE.Vector2(0.5, -0.5),
    new THREE.Vector2(0.5, 0.5), new THREE.Vector2(-0.5, 0.5),
  ])
  frameShape.holes.push(new THREE.Path([
    new THREE.Vector2(-0.435, -0.425), new THREE.Vector2(-0.435, 0.425),
    new THREE.Vector2(0.435, 0.425), new THREE.Vector2(0.435, -0.425),
  ]))
  const bayFrame = new THREE.ExtrudeGeometry(frameShape, {depth: 1, bevelEnabled: false, steps: 1})
  bayFrame.translate(0, 0, -0.5)

  function batch(geometry: THREE.BufferGeometry, material: THREE.Material, placements: Placement[], name: string) {
    const mesh = new THREE.InstancedMesh(geometry, material, placements.length)
    mesh.name = name
    placements.forEach(([x, y, z, w, h, d, rotation = 0], index) => {
      transform.position.set(x, y, z)
      transform.scale.set(w, h, d)
      transform.rotation.set(0, rotation, 0)
      transform.updateMatrix()
      mesh.setMatrixAt(index, transform.matrix)
    })
    mesh.castShadow = true
    mesh.receiveShadow = true
    mesh.computeBoundingSphere()
    model.add(mesh)
  }

  const plates: Placement[] = Array.from({length: 6}, (_, level) => [0, 1.35 + level * 0.94, 0, 1, level === 5 ? 0.17 : 0.13, 1])
  batch(slab, concrete, plates, "Stepped floor plates and roof")

  function elevation(a: Point, b: Point, level: number, edge: number) {
    const dx = b[0] - a[0], dz = b[1] - a[1]
    const length = Math.hypot(dx, dz)
    const nx = dz / length, nz = -dx / length
    const rotation = Math.atan2(nx, nz)
    const centerY = 1.35 + level * 0.94 + 0.47
    const bays = Math.max(1, Math.round(length / 0.88))
    const step = length / bays
    concreteBoxes.push([(a[0] + b[0]) / 2, centerY, (a[1] + b[1]) / 2, length, 0.81, 0.14, rotation])
    for (let bay = 0; bay < bays; bay++) {
      const t = (bay + 0.5) / bays
      const x = a[0] + dx * t, z = a[1] + dz * t
      const width = step * 0.91
      // Each projecting bay has a real hollow frame, rather than a flat facade texture.
      windowFrames.push([x + nx * 0.13, centerY, z + nz * 0.13, width, 0.76, 0.19, rotation])
      const pane: Placement = [x + nx * 0.13, centerY, z + nz * 0.13, width * 0.88, 0.66, 0.045, rotation]
      if ((bay + level * 2 + edge) % 4 === 0) glazing.push(pane)
      else lightGlazing.push(pane)
      // A slim offset sash picks up light across the individual oriel windows.
      if (bay % 2 === 0) metalBoxes.push([x + nx * 0.245 + dx / length * width * 0.31, centerY, z + nz * 0.245 + dz / length * width * 0.31, 0.013, 0.62, 0.018, rotation])
      if (level === 0 && edge === 6 && bay > bays / 2 - 1 && bay < bays / 2 + 1) {
        warmPanels.push([x + nx * 0.26, centerY, z + nz * 0.26, width * 0.85, 0.64, 0.02, rotation])
      }
    }
  }
  for (let level = 0; level < 5; level++) {
    outline.forEach((a, edge) => elevation(a, outline[(edge + 1) % outline.length], level, edge))
  }

  // A glazed public base supports the upper wings. Dark inset terrace floors make
  // the incisions readable, with no surrounding ground slab or site objects.
  concreteBoxes.push([0, 0.065, 0, 17.6, 0.13, 10.4])
  glazing.push([0, 0.7, 0, 17.36, 1.11, 10.16])
  concreteBoxes.push([0, 1.265, 0, 17.62, 0.10, 10.42])
  shadowBoxes.push([-5.17, 1.33, 0, 7.14, 0.035, 4.37], [4.35, 1.33, -1.53, 3.64, 0.035, 7.13])
  for (const side of [-1, 1]) {
    for (let bay = -10; bay <= 10; bay++) metalBoxes.push([bay * 0.84, 0.7, side * 5.09, 0.045, 1.1, 0.055])
    for (let bay = -6; bay <= 6; bay++) metalBoxes.push([side * 8.69, 0.7, bay * 0.8, 0.055, 1.1, 0.045])
    for (const x of [-5.4, -2.5, 3.5, 6.4]) warmPanels.push([x, 0.63, side * 5.10, 0.30, 1.03, 0.03])
  }
  // Third incision: the recessed entrance between two glazed portions of the base.
  shadowBoxes.push([0.4, 0.62, 5.095, 1.32, 1.0, 0.018])
  lightGlazing.push([0.4, 0.61, 5.11, 0.91, 0.94, 0.012])
  warmPanels.push([-0.18, 0.62, 5.18, 0.16, 1.1, 0.15], [0.98, 0.62, 5.18, 0.16, 1.1, 0.15])
  concreteBoxes.push([0.4, 1.23, 5.39, 1.65, 0.085, 0.72])
  for (let step = 0; step < 3; step++) concreteBoxes.push([0.4, 0.035 + step * 0.025, 5.61 - step * 0.15, 1.52, 0.07 + step * 0.05, 0.3])

  // Low roof enclosures follow the photographed plant layout. IFC selection colours
  // are intentionally replaced by the building's grey and muted bronze materials.
  function plantCourt(x: number, z: number, width: number, depth: number, height: number, closed = false) {
    const y = 6.14 + height / 2
    shadowBoxes.push([x, 6.15, z, width, 0.03, depth])
    concreteBoxes.push([x, y, z - depth / 2, width, height, 0.065], [x, y, z + depth / 2, width, height, 0.065])
    concreteBoxes.push([x - width / 2, y, z, 0.065, height, depth], [x + width / 2, y, z, 0.065, height, depth])
    for (const side of [-1, 1]) metalBoxes.push([x, 6.145 + height, z + side * depth / 2, width + 0.06, 0.025, 0.085])
    warmPanels.push([x + width * 0.2, y, z + depth / 2 + 0.038, 0.18, height * 0.67, 0.012])
    if (closed) concreteBoxes.push([x, 6.15 + height, z, width + 0.06, 0.07, depth + 0.06])
    else {
      for (let unit = 0; unit < Math.max(1, Math.floor(width)); unit++) {
        const px = x - width / 2 + 0.6 + unit * 0.83
        metalBoxes.push([px, 6.29, z, 0.53, 0.25, depth * 0.53])
      }
    }
  }
  plantCourt(-4.5, 3.65, 4.4, 1.17, 0.44)
  plantCourt(5.45, 3.65, 3.1, 1.18, 0.43)
  plantCourt(0.38, 0.20, 1.25, 2.55, 0.52, true)
  plantCourt(0.35, -4.15, 1.40, 1.21, 0.66, true)
  plantCourt(0.4, 3.40, 1.8, 1.8, 0.63)

  batch(box, concrete, concreteBoxes, "Facade, glazed podium structure and roof enclosures")
  batch(bayFrame, metal, windowFrames, "Projecting individual window frames")
  batch(box, glass, glazing, "Cool glazing")
  batch(box, paleGlass, lightGlazing, "Reflective oriel glazing")
  batch(box, metal, metalBoxes, "Window sashes and roof plant")
  batch(box, bronze, warmPanels, "Entrance and warm facade details")
  batch(box, dark, shadowBoxes, "Recessed terraces and plant courts")
  return model
}

export function frameHyattCamera(camera: THREE.OrthographicCamera, width: number, height: number) {
  const aspect = Math.max(1, width) / Math.max(1, height)
  const span = Math.max(17.0, 23.2 / aspect)
  camera.left = -span * aspect / 2
  camera.right = span * aspect / 2
  camera.top = span / 2
  camera.bottom = -span / 2
  camera.position.set(15, 15, 21)
  camera.lookAt(0, 2.8, 0)
  camera.updateProjectionMatrix()
  camera.updateMatrixWorld()
}
