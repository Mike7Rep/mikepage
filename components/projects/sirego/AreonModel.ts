import * as THREE from "three"

type Part = [number, number, number, number, number, number]

// Illustrative exterior based on the supplied architectural images, not a BIM import.
export function createAreonModel() {
  const model = new THREE.Group()
  model.name = "AREON Chur – architectural exterior"
  const geometry = new THREE.BoxGeometry(1, 1, 1)
  const materials = {
    silver: new THREE.MeshStandardMaterial({color: 0xc8cecf, roughness: 0.5, metalness: 0.35}),
    ribs: new THREE.MeshStandardMaterial({color: 0xe1e4e3, roughness: 0.45, metalness: 0.4}),
    base: new THREE.MeshStandardMaterial({color: 0x747f83, roughness: 0.65, metalness: 0.15}),
    glass: new THREE.MeshStandardMaterial({color: 0x7e9aab, roughness: 0.24, metalness: 0.5}),
    roof: new THREE.MeshStandardMaterial({color: 0xd7dad7, roughness: 0.8}),
    solar: new THREE.MeshStandardMaterial({color: 0x647886, roughness: 0.35, metalness: 0.45}),
  }
  const parts: Record<keyof typeof materials, Part[]> = {silver: [], ribs: [], base: [], glass: [], roof: [], solar: []}
  const add = (material: keyof typeof materials, ...part: Part) => parts[material].push(part)
  // Main hall, long vertical metal facade, low service annexes along both sides.
  add("silver", 0, 3.75, 0, 17.6, 5.9, 12)
  add("base", 0, 0.65, 0, 17.6, 1.3, 12)
  for (const side of [-1, 1]) {
    for (let i = 0; i <= 76; i++) {
      const x = -8.75 + i * 17.5 / 76
      add("ribs", x, 3.95, side * 6.05, 0.045, 6, 0.12)
    }
    for (let i = 0; i <= 52; i++) {
      const z = -5.96 + i * 11.92 / 52
      add("ribs", side * 8.84, 3.95, z, 0.12, 6, 0.045)
    }
    for (let i = 0; i < 10; i++) {
      const x = -7.7 + i * 1.7
      add("base", x, 2.65, side * 6.13, 0.37, 2.85, 0.06)
      add("glass", x, 2.65, side * 6.17, 0.27, 2.73, 0.025)
    }
    add("silver", 0, 0.7, side * 7.05, 18.1, 1.4, 2.1)
    add("roof", 0, 1.47, side * 7.1, 18.65, 0.14, 2.5)
    for (let i = 0; i < 38; i++) {
      add("ribs", -8.8 + i * 17.6 / 37, 0.72, side * 8.12, 0.05, 1.38, 0.09)
      if (i % 3 === 0) add("glass", -8.5 + i * 17.2 / 37, 0.85, side * 8.13, 0.22, 0.68, 0.035)
    }
  }
  // Recessed roof wells remain genuinely open in the roof slab.
  add("roof", 0, 7.07, -0.85, 18.05, 0.18, 10.75)
  for (const [x, width] of [[-7.8, 2.45], [0, 8.2], [7.8, 2.45]]) add("roof", x, 7.07, 5.52, width, 0.18, 2)
  add("roof", 0, 7.07, 6.4, 18.05, 0.18, 0.24)
  for (const x of [-5.35, 5.35]) {
    add("base", x, 6.73, 5.35, 2.15, 0.035, 1.75)
    for (const side of [-1, 1]) add("silver", x + side * 1.08, 7.14, 5.35, 0.08, 0.38, 1.75)
  }
  // Closely spaced photovoltaic arrays, split by service corridors.
  for (let row = 0; row < 16; row++) {
    for (let col = 0; col < 24; col++) {
      const x = -8.2 + col * 0.71
      const z = -5.55 + row * 0.59
      add("ribs", x, 7.21, z, 0.66, 0.065, 0.51)
      add("solar", x, 7.25, z, 0.61, 0.025, 0.46)
    }
  }
  for (const x of [-6.4, -2.1, 2.1, 6.4]) add("silver", x, 7.37, 0.25, 0.38, 0.3, 0.4)
  // Taller entrance wing and its broad projecting canopy at the short end.
  add("base", -9.6, 1.28, -1.15, 1.6, 2.56, 9.75)
  add("silver", -9.62, 2.32, -1.15, 1.62, 0.45, 9.75)
  add("roof", -10.4, 2.65, -1.15, 4.1, 0.18, 10.8)
  for (let i = 0; i < 12; i++) {
    const z = -5.55 + i * 0.8
    add("glass", -10.43, 1.2, z, 0.04, 2.16, 0.64)
    add("ribs", -10.48, 1.25, z + 0.36, 0.08, 2.5, 0.055)
    add("base", -10.55, 2.52, z, 3.65, 0.08, 0.065)
  }
  // Detached low pavilion visible in the model reference; no site ground plane.
  add("silver", -8, 0.55, 10.8, 4.8, 1.1, 1.15)
  add("roof", -8, 1.14, 10.8, 5.25, 0.12, 1.65)
  for (let i = 0; i < 10; i++) add("glass", -10.1 + i * 0.46, 0.59, 11.39, 0.31, 0.68, 0.035)
  const transform = new THREE.Object3D()
  for (const name of Object.keys(materials) as (keyof typeof materials)[]) {
    const mesh = new THREE.InstancedMesh(geometry, materials[name], parts[name].length)
    mesh.name = name
    parts[name].forEach(([x, y, z, w, h, d], index) => {
      transform.position.set(x, y, z)
      transform.scale.set(w, h, d)
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

export function frameAreonCamera(camera: THREE.OrthographicCamera, width: number, height: number) {
  const aspect = Math.max(1, width) / Math.max(1, height)
  const span = Math.max(23.8, 33.5 / aspect)
  camera.left = -span * aspect / 2
  camera.right = span * aspect / 2
  camera.top = span / 2
  camera.bottom = -span / 2
  camera.position.set(-19, 20, 26)
  camera.lookAt(0, 2.5, 0)
  camera.updateProjectionMatrix()
  camera.updateMatrixWorld()
}
