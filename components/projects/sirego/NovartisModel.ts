import * as THREE from "three"

type Placement = [x: number, y: number, z: number, width: number, height: number, depth: number, rotateX?: number, rotateY?: number]

// Architectural reconstruction from the five supplied IFC views. This is not an IFC
// import: facade divisions, plant and proportions are illustrative, not measured data.
export function createNovartisModel() {
  const model = new THREE.Group()
  model.name = "Novartis WSJ 25 – architectural exterior"
  const box = new THREE.BoxGeometry(1, 1, 1)
  const cylinder = new THREE.CylinderGeometry(0.5, 0.5, 1, 24)
  const facade = new THREE.MeshStandardMaterial({color: 0xc5cbce, roughness: 0.61, metalness: 0.18})
  const glass = new THREE.MeshStandardMaterial({color: 0x7b99a3, roughness: 0.23, metalness: 0.64})
  const lightGlass = new THREE.MeshStandardMaterial({color: 0xbacdd1, roughness: 0.28, metalness: 0.5})
  const metal = new THREE.MeshStandardMaterial({color: 0x69767c, roughness: 0.4, metalness: 0.54})
  const charcoal = new THREE.MeshStandardMaterial({color: 0x343e43, roughness: 0.66, metalness: 0.15})
  const roofGreen = new THREE.MeshStandardMaterial({color: 0x829175, roughness: 0.94})
  const roofPanel = new THREE.MeshStandardMaterial({color: 0xc4d2d5, roughness: 0.3, metalness: 0.48})
  const concrete: Placement[] = []
  const glazing: Placement[] = []
  const paleGlazing: Placement[] = []
  const frames: Placement[] = []
  const dark: Placement[] = []
  const vegetation: Placement[] = []
  const panels: Placement[] = []
  const roundFrames: Placement[] = []
  const roundGlass: Placement[] = []
  const caps: Placement[] = []
  const transform = new THREE.Object3D()

  function batch(geometry: THREE.BufferGeometry, material: THREE.Material, placements: Placement[], name: string) {
    const mesh = new THREE.InstancedMesh(geometry, material, placements.length)
    mesh.name = name
    placements.forEach(([x, y, z, w, h, d, rx = 0, ry = 0], index) => {
      transform.position.set(x, y, z)
      transform.scale.set(w, h, d)
      transform.rotation.set(rx, ry, 0)
      transform.updateMatrix()
      mesh.setMatrixAt(index, transform.matrix)
    })
    mesh.castShadow = true
    mesh.receiveShadow = true
    mesh.computeBoundingSphere()
    model.add(mesh)
  }

  // Ground floor and seven upper ribbon-glazed levels; no surrounding site or plinth.
  glazing.push([0, 0.56, 0, 8.9, 1.1, 7.5])
  concrete.push([0, 0.04, 0, 9.2, 0.08, 7.8])
  for (let level = 0; level < 7; level++) {
    const y = 1.15 + level * 0.8
    concrete.push([0, y, 0, 9.2, 0.28, 7.8])
    glazing.push([0, y + 0.4, 0, 9.05, 0.52, 7.65])
    for (let bay = 0; bay <= 24; bay++) {
      const x = -4.44 + bay * 0.37
      for (const side of [-1, 1]) {
        frames.push([x, y + 0.4, side * 3.837, 0.027, 0.54, 0.04])
        if (bay < 24 && (bay + level * 3) % 5 === 0) paleGlazing.push([x + 0.18, y + 0.4, side * 3.843, 0.32, 0.49, 0.022])
      }
    }
    for (let bay = 0; bay <= 20; bay++) {
      const z = -3.67 + bay * 0.367
      for (const side of [-1, 1]) {
        frames.push([side * 4.537, y + 0.4, z, 0.04, 0.54, 0.027])
        if (bay < 20 && (bay + level) % 5 === 1) paleGlazing.push([side * 4.543, y + 0.4, z + 0.17, 0.022, 0.49, 0.31])
      }
    }
  }
  for (const x of [-4.47, 4.47]) for (const z of [-3.78, 3.78]) concrete.push([x, 3.54, z, 0.23, 7.08, 0.24])
  for (let bay = -11; bay <= 11; bay++) {
    for (const side of [-1, 1]) frames.push([bay * 0.39, 0.58, side * 3.77, 0.043, 1.07, 0.055])
  }
  for (let bay = -9; bay <= 9; bay++) {
    for (const side of [-1, 1]) frames.push([side * 4.47, 0.58, bay * 0.39, 0.055, 1.07, 0.043])
  }

  // Tall sheet-metal crown and the four projecting side cores seen in the roof plan.
  concrete.push([0, 7.62, 0, 9.2, 1.5, 7.8])
  for (const side of [-1, 1]) {
    for (let seam = 0; seam <= 26; seam++) frames.push([-4.6 + seam * (9.2 / 26), 7.62, side * 3.906, 0.012, 1.48, 0.012])
    for (let seam = 0; seam <= 22; seam++) frames.push([side * 4.606, 7.62, -3.9 + seam * (7.8 / 22), 0.012, 1.48, 0.012])
    frames.push([0, 7.62, side * 3.91, 9.2, 0.012, 0.012], [side * 4.61, 7.62, 0, 0.012, 0.012, 7.8])
    for (const x of [-2.85, 2.85]) {
      dark.push([x, 7.6, side * 3.918, 1.95, 0.29, 0.025])
      for (let slat = 0; slat < 4; slat++) frames.push([x, 7.49 + slat * 0.073, side * 3.936, 1.95, 0.015, 0.02])
    }
    for (const x of [-3.05, 2.85]) {
      concrete.push([x, 4.2, side * 3.98, 1.22, 8.4, 0.64])
      for (const dx of [-0.6, -0.3, 0, 0.3, 0.6]) frames.push([x + dx, 4.2, side * 4.308, 0.01, 8.4, 0.014])
      for (let joint = 1; joint <= 5; joint++) frames.push([x, joint * 1.55, side * 4.31, 1.22, 0.01, 0.014])
    }
    // The round windows form a vertical stack on the outer stair core, not on the roof crown.
    const coreX = side === 1 ? -3.05 : 2.85
    for (let level = 0; level < 8; level++) {
      roundFrames.push([coreX, 0.84 + level * 0.92, side * 4.33, 0.31, 0.046, 0.31, Math.PI / 2])
      roundGlass.push([coreX, 0.84 + level * 0.92, side * 4.358, 0.255, 0.018, 0.255, Math.PI / 2])
    }
  }

  // Main roof: green surface, perimeter rails and low repeated panels.
  concrete.push([0, 8.38, 0, 9.28, 0.12, 7.88])
  vegetation.push([-2.1, 8.455, 0, 3.85, 0.045, 7.03])
  function rail(x: number, z: number, width: number, depth: number, base: number) {
    frames.push([x, base + 0.22, z - depth / 2, width, 0.028, 0.028], [x, base + 0.22, z + depth / 2, width, 0.028, 0.028])
    frames.push([x - width / 2, base + 0.22, z, 0.028, 0.028, depth], [x + width / 2, base + 0.22, z, 0.028, 0.028, depth])
    for (let px = -width / 2; px <= width / 2 + 0.01; px += width / Math.ceil(width / 0.45)) for (const side of [-1, 1]) frames.push([x + px, base + 0.11, z + side * depth / 2, 0.021, 0.22, 0.021])
    for (let pz = -depth / 2; pz <= depth / 2 + 0.01; pz += depth / Math.ceil(depth / 0.45)) for (const side of [-1, 1]) frames.push([x + side * width / 2, base + 0.11, z + pz, 0.021, 0.22, 0.021])
  }
  rail(0, 0, 9.05, 7.65, 8.45)
  function panel(x: number, y: number, z: number, width: number, depth: number) {
    frames.push([x, y, z, width + 0.045, 0.045, depth + 0.045, -0.1])
    panels.push([x, y + 0.03, z, width, 0.02, depth, -0.1])
  }
  for (let row = 0; row < 11; row++) for (let column = 0; column < 4; column++) {
    if ((row === 3 || row === 8) && column === 1) continue
    panel(-3.55 + column * 0.86, 8.57, -3.03 + row * 0.60, 0.67, 0.46)
  }
  for (const z of [-1.2, 1.8]) {
    concrete.push([-2.65, 8.85, z, 0.49, 0.77, 0.5])
    caps.push([-2.65, 9.28, z, 0.69, 0.18, 0.69])
  }

  // Off-centre charcoal roof house with fine vertical fins and a second planted roof.
  dark.push([2.23, 9.22, 0, 3.43, 1.55, 6.65])
  for (const side of [-1, 1]) {
    for (let fin = 0; fin <= 66; fin++) frames.push([2.23 + side * 1.72, 9.22, -3.32 + fin * (6.64 / 66), 0.022, 1.53, 0.022])
    for (let fin = 0; fin <= 34; fin++) frames.push([0.52 + fin * 0.1, 9.22, side * 3.33, 0.022, 1.53, 0.022])
    for (let opening = 0; opening < 5; opening++) {
      const z = -2.3 + opening * 1.08
      concrete.push([2.23 + side * 1.74, 8.97, z, 0.03, 0.43, 0.40])
      paleGlazing.push([2.23 + side * 1.76, 8.97, z, 0.015, 0.36, 0.32])
    }
  }
  concrete.push([2.23, 10.015, 0, 3.54, 0.10, 6.76])
  vegetation.push([2.23, 10.083, 0, 3.32, 0.038, 6.54])
  for (let row = 0; row < 10; row++) for (let column = 0; column < 3; column++) {
    if ((row === 2 || row === 6) && column === 1) continue
    panel(1.22 + column * 1.0, 10.17, -2.78 + row * 0.61, 0.76, 0.45)
  }
  for (const z of [-1.55, 0.9]) {
    concrete.push([2.23, 10.28, z, 0.78, 0.32, 0.71])
    for (let slat = 0; slat < 6; slat++) frames.push([1.89 + slat * 0.135, 10.445, z, 0.022, 0.023, 0.69])
  }
  for (const z of [-3.05, 3.05]) frames.push([3.7, 10.46, z, 0.022, 0.86, 0.022])
  // Recessed entrance, integrated threshold and a light canopy; no terrain geometry.
  concrete.push([0.7, 1.06, 4.0, 2.05, 0.09, 0.49])
  frames.push([0.18, 0.53, 3.808, 0.043, 1.00, 0.06], [1.22, 0.53, 3.808, 0.043, 1.00, 0.06])

  batch(box, facade, concrete, "Cladding, side cores and roof plant")
  batch(box, glass, glazing, "Ribbon glazing")
  batch(box, lightGlass, paleGlazing, "Light panes and roof-house windows")
  batch(box, metal, frames, "Mullions, cladding seams and railings")
  batch(box, charcoal, dark, "Roof house and ventilation grilles")
  batch(box, roofGreen, vegetation, "Green roof surfaces")
  batch(box, roofPanel, panels, "Roof panel arrays")
  batch(cylinder, metal, roundFrames, "Circular stair-window frames")
  batch(cylinder, lightGlass, roundGlass, "Circular stair-window glazing")
  const capGeometry = new THREE.CylinderGeometry(0.34, 0.5, 1, 4)
  capGeometry.rotateY(Math.PI / 4)
  batch(capGeometry, facade, caps, "Ventilation hoods")
  return model
}

export function frameNovartisCamera(camera: THREE.OrthographicCamera, width: number, height: number) {
  const aspect = Math.max(1, width) / Math.max(1, height)
  const span = Math.max(15.5, 15.8 / aspect)
  camera.left = -span * aspect / 2
  camera.right = span * aspect / 2
  camera.top = span / 2
  camera.bottom = -span / 2
  camera.position.set(13, 13, 18)
  camera.lookAt(0, 4.7, 0)
  camera.updateProjectionMatrix()
  camera.updateMatrixWorld()
}
