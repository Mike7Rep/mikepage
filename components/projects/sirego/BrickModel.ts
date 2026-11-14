import * as THREE from "three"

type Part = [number, number, number, number, number, number, number?]

// Architectural illustration from the supplied elevations, section and photographs.
// Dimensions are visual proportions, not a surveyed or imported BIM model.
export function createBrickModel() {
  const model = new THREE.Group()
  model.name = "The Brick 80 – architectural exterior"
  const geometry = new THREE.BoxGeometry(1, 1, 1)
  const materials = {
    stone: new THREE.MeshStandardMaterial({color: 0xd2cec4, roughness: 0.83}),
    band: new THREE.MeshStandardMaterial({color: 0xb6a6a4, roughness: 0.8}),
    plum: new THREE.MeshStandardMaterial({color: 0x794359, roughness: 0.72}),
    frame: new THREE.MeshStandardMaterial({color: 0x4c5254, roughness: 0.55, metalness: 0.25}),
    glass: new THREE.MeshStandardMaterial({color: 0x9eafb4, roughness: 0.27, metalness: 0.4}),
    glassLight: new THREE.MeshStandardMaterial({color: 0xc1cfce, roughness: 0.3, metalness: 0.3}),
    trim: new THREE.MeshStandardMaterial({color: 0xe2dfd6, roughness: 0.65, metalness: 0.1}),
    roof: new THREE.MeshStandardMaterial({color: 0xc3c1b8, roughness: 0.94}),
  }
  const parts: Record<keyof typeof materials, Part[]> = {stone: [], band: [], plum: [], frame: [], glass: [], glassLight: [], trim: [], roof: []}
  const add = (material: keyof typeof materials, ...part: Part) => parts[material].push(part)

  // Six storeys in the original volume, with two progressively recessed roof levels.
  add("stone", 0, 3.55, 0, 20.4, 7.1, 7.2)
  add("stone", 0, 7.59, 0, 18.8, 0.98, 5.8)
  add("stone", 0, 8.47, 0, 16.6, 0.78, 4)
  add("roof", 0, 7.13, 0, 20.5, 0.12, 7.3)
  add("roof", 0, 8.11, 0, 18.92, 0.12, 5.94)
  add("roof", 0, 8.93, 0, 16.78, 0.14, 4.17)

  // Wine-coloured long elevations between the pale, horizontally banded end bays.
  for (const side of [-1, 1]) {
    add("plum", 0.4, 3.63, side * 3.64, 15.9, 6.94, 0.1)
    for (let floor = 0; floor < 6; floor++) {
      const y = 0.7 + floor * 1.16
      for (let bay = 0; bay < 20; bay++) {
        const x = -7.07 + bay * 0.77
        const h = floor === 0 ? 1.09 : 0.72
        add("frame", x, y, side * 3.715, 0.59, h + 0.065, 0.07)
        add((bay + floor) % 4 === 0 ? "glassLight" : "glass", x, y, side * 3.759, 0.50, h - 0.025, 0.025)
        add("trim", x + 0.07, y, side * 3.781, 0.023, h, 0.03)
        add("trim", x, y - h / 2 - 0.025, side * 3.79, 0.65, 0.045, 0.12)
      }
      add("band", 0.4, y - 0.58, side * 3.715, 15.9, 0.034, 0.04)
      for (const x of [-8.83, 9.47]) {
        if (floor > 1) {
          add("frame", x, y, side * 3.645, 0.7, 0.79, 0.06)
          add("glass", x, y, side * 3.685, 0.6, 0.70, 0.025)
          add("trim", x, y, side * 3.71, 0.024, 0.74, 0.03)
        }
      }
    }
    // Fine panel seams on the purple cladding.
    for (let bay = 0; bay <= 20; bay++) add("band", -7.46 + bay * 0.77, 3.62, side * 3.702, 0.012, 6.9, 0.009)
    for (const x of [-8.82, 9.45]) {
      for (let row = 0; row < 30; row++) add("band", x, 0.17 + row * 0.234, side * 3.67, x < 0 ? 2.7 : 1.5, 0.015, 0.018)
    }
    // Glazed ateliers, entrance canopies and fabric awnings at street level.
    for (const x of [-6.68, -3.60, -0.52, 2.56, 5.64]) {
      add("trim", x, 1.4, side * 3.89, 2.84, 0.1, 0.62)
      add("frame", x, 0.62, side * 3.79, 0.034, 1.1, 0.045)
    }
    for (const x of [-9.48, -8.23, 9.45]) {
      add("frame", x, 0.56, side * 3.665, 0.91, 0.78, 0.06)
      add("glass", x, 0.56, side * 3.704, 0.81, 0.68, 0.025)
      add("plum", x, 1.01, side * 3.95, 0.98, 0.045, 0.59, side * 0.30)
    }
    // Attic windows and light metal balustrades, following the stepped section.
    for (let i = 0; i < 23; i++) {
      const x = -8.85 + i * 0.8
      add("frame", x, 7.61, side * 2.93, 0.46, 0.68, 0.06)
      add("glass", x, 7.61, side * 2.974, 0.39, 0.61, 0.025)
    }
    for (let i = 0; i < 21; i++) {
      const x = -7.85 + i * 0.78
      add("frame", x, 8.48, side * 2.035, 0.48, 0.57, 0.04)
      add("glassLight", x, 8.48, side * 2.065, 0.4, 0.49, 0.025)
    }
    for (const [y, z, length] of [[7.42, 3.51, 20.12], [8.38, 2.77, 18.52]]) {
      add("frame", 0, y, side * z, length, 0.024, 0.025)
      for (let i = 0; i <= 40; i++) add("frame", -length / 2 + i * length / 40, y - 0.13, side * z, 0.018, 0.27, 0.018)
    }
  }
  // Both short elevations: repeated window groups and alternating stone courses.
  for (const side of [-1, 1]) {
    for (let row = 0; row < 30; row++) add("band", side * 10.213, 0.17 + row * 0.234, 0, 0.022, row % 5 === 0 ? 0.095 : 0.017, 7.2)
    for (let floor = 0; floor < 6; floor++) {
      for (let bay = 0; bay < 6; bay++) {
        const z = -2.65 + bay * 1.06
        const y = 0.7 + floor * 1.16
        add("frame", side * 10.25, y, z, 0.065, 0.80, 0.64)
        add("glassLight", side * 10.293, y, z, 0.025, 0.71, 0.55)
        add("trim", side * 10.32, y, z + 0.08, 0.028, 0.75, 0.026)
        add("trim", side * 10.32, y - 0.41, z, 0.14, 0.045, 0.70)
      }
    }
    for (let i = 0; i < 5; i++) add("band", side * 10.22, 3.55, -2.95 + i * 1.475, 0.018, 7.1, 0.012)
  }
  // Roof access, vents and terrace divisions, kept inside the building footprint.
  for (const x of [-6.5, 0, 6.5]) {
    add("stone", x, 9.11, -0.65, 0.52, 0.3, 0.45)
    add("trim", x, 9.29, -0.65, 0.62, 0.075, 0.54)
  }
  for (const x of [-5.2, 0, 5.2]) add("trim", x, 7.33, 3.2, 0.05, 0.35, 0.56)
  // Simple geometric lettering on the pale end bay; no downloaded textures.
  const glyphs: Record<string, string[]> = {
    T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
    H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
    E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
    B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
    R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
    I: ["111", "010", "010", "010", "010", "010", "111"],
    C: ["01111", "10000", "10000", "10000", "10000", "10000", "01111"],
    K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  }
  let cursor = -9.98
  for (const letter of "THE BRICK") {
    if (letter === " ") {cursor += 0.1; continue}
    const glyph = glyphs[letter]
    glyph.forEach((row, y) => [...row].forEach((pixel, x) => {
      if (pixel === "1") add("frame", cursor + x * 0.045, 2.06 - y * 0.045, 3.699, 0.044, 0.044, 0.014)
    }))
    cursor += (glyph[0].length + 1) * 0.045
  }

  const transform = new THREE.Object3D()
  for (const name of Object.keys(materials) as (keyof typeof materials)[]) {
    const mesh = new THREE.InstancedMesh(geometry, materials[name], parts[name].length)
    mesh.name = name
    parts[name].forEach(([x, y, z, w, h, d, tilt = 0], index) => {
      transform.position.set(x, y, z)
      transform.scale.set(w, h, d)
      transform.rotation.set(tilt, 0, 0)
      transform.updateMatrix()
      mesh.setMatrixAt(index, transform.matrix)
    })
    mesh.castShadow = true
    mesh.receiveShadow = true
    mesh.computeBoundingSphere()
    model.add(mesh)
  }
  return model
}

export function frameBrickCamera(camera: THREE.OrthographicCamera, width: number, height: number) {
  const aspect = Math.max(1, width) / Math.max(1, height)
  const span = Math.max(19, 26 / aspect)
  camera.left = -span * aspect / 2
  camera.right = span * aspect / 2
  camera.top = span / 2
  camera.bottom = -span / 2
  camera.position.set(-21, 16, 27)
  camera.lookAt(0, 4.2, 0)
  camera.updateProjectionMatrix()
  camera.updateMatrixWorld()
}
