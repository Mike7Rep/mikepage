import * as THREE from "three"

type Part = [number, number, number, number, number, number, number?]

// Illustrative exterior reconstructed from the supplied IFC screenshots, not an IFC import.
export function createSnfModel() {
  const model = new THREE.Group()
  model.name = "SNF Wankdorf – architectural exterior"
  const geometry = new THREE.BoxGeometry(1, 1, 1)
  const sideBraces: Part[] = []
  const parts: Record<string, Part[]> = {concrete: [], steel: [], glass: [], pale: [], green: [], bronze: []}
  const materials = {
    concrete: new THREE.MeshStandardMaterial({color: 0xb7bfbd, roughness: 0.65, metalness: 0.12}),
    steel: new THREE.MeshStandardMaterial({color: 0x515c60, roughness: 0.4, metalness: 0.55}),
    glass: new THREE.MeshStandardMaterial({color: 0xb1c6cc, roughness: 0.25, metalness: 0.45}),
    pale: new THREE.MeshStandardMaterial({color: 0xbbcfd0, roughness: 0.3, metalness: 0.32}),
    green: new THREE.MeshStandardMaterial({color: 0x626e50, roughness: 0.95}),
    bronze: new THREE.MeshStandardMaterial({color: 0xb5a58b, roughness: 0.65, metalness: 0.12}),
  }
  const add = (material: keyof typeof materials, ...part: Part) => parts[material].push(part)
  add("concrete", 0, 0.15, 0, 17.25, 0.30, 10.25)
  // Five glazed storeys, with continuous projecting slab edges and slender sun shelves.
  for (let floor = 0; floor < 5; floor++) {
    const base = 0.3 + floor * 1.04
    add("concrete", 0, base, 0, 17.3, 0.14, 10.3)
    for (const side of [-1, 1]) {
      for (let bay = 0; bay < 24; bay++) {
        const x = -8.1 + bay * 16.2 / 23
        add((bay + floor) % 5 === 0 ? "glass" : "pale", x, base + 0.53, side * 4.94, 0.66, 0.88, 0.04)
        add("steel", x - 0.35, base + 0.53, side * 4.985, 0.022, 0.9, 0.04)
      }
      for (let bay = 0; bay < 14; bay++) {
        const z = -4.55 + bay * 9.1 / 13
        add((bay + floor) % 5 === 0 ? "glass" : "pale", side * 8.43, base + 0.53, z, 0.04, 0.88, 0.66)
        add("steel", side * 8.47, base + 0.53, z - 0.35, 0.04, 0.9, 0.022)
      }
      add("concrete", 0, base + 0.77, side * 5.14, 17.5, 0.045, 0.38)
      add("concrete", side * 8.62, base + 0.77, 0, 0.38, 0.045, 10.45)
    }
  }
  // External columns and characteristic V branches above the ground floor.
  for (const side of [-1, 1]) {
    for (let i = 0; i < 8; i++) {
      const x = -7.6 + i * 15.2 / 7
      add("steel", x, 2.93, side * 5.02, 0.065, 5.1, 0.10)
      for (let floor = 1; floor < 5; floor++) add("steel", x, 0.3 + floor * 1.04, side * 5.04, 0.19, 0.11, 0.16)
      for (const arm of [-1, 1]) {
        const dx = arm * 0.43, dy = 0.84
        add("steel", x + dx / 2, 1.39 + dy / 2, side * 5.06, 0.055, Math.hypot(dx, dy), 0.075, -Math.atan2(dx, dy))
      }
    }
    for (let i = 0; i < 4; i++) {
      const z = -3.6 + i * 2.4
      add("steel", side * 8.51, 2.93, z, 0.1, 5.1, 0.065)
      // Side-facing braces use a quarter turn about Y below when batching.
      for (const arm of [-1, 1]) {
        const dx = arm * 0.43, dy = 0.84
        sideBraces.push([side * 8.55, 1.39 + dy / 2, z + dx / 2, 0.055, Math.hypot(dx, dy), 0.075, -Math.atan2(dx, dy)])
      }
    }
  }
  add("concrete", 0, 5.55, 0, 17.4, 0.18, 10.4)
  add("bronze", 0, 5.66, 0, 17.05, 0.035, 10.05)
  add("green", 0, 5.69, 0, 15.65, 0.04, 8.65)
  // Central roof lantern with divided glazing and two modest louvred plant units.
  add("concrete", -0.4, 5.78, 0, 8.7, 0.18, 2.95)
  add("glass", -0.4, 5.89, 0, 8.42, 0.07, 2.68)
  for (let i = 0; i <= 18; i++) add("concrete", -4.6 + i * 0.467, 5.955, 0, 0.035, 0.06, 2.77)
  for (const z of [-1.35, 0, 1.35]) add("concrete", -0.4, 5.955, z, 8.48, 0.06, 0.035)
  add("bronze", -2.6, 5.98, 0, 1.68, 0.08, 2.46)
  for (const [x, z, w] of [[-3.1, -2.35, 2.1], [5.75, 2.8, 1.8]]) {
    add("concrete", x, 5.78, z, w + 0.25, 0.15, 1.2)
    add("steel", x, 6.12, z, w, 0.56, 0.92)
    for (let slat = 0; slat < 6; slat++) {
      for (const side of [-1, 1]) add("concrete", x, 5.91 + slat * 0.085, z + side * 0.475, w, 0.018, 0.04)
    }
  }
  add("bronze", 5.65, 0.85, 5.01, 0.85, 1.02, 0.055)
  add("steel", 5.65, 1.39, 5.24, 1.3, 0.065, 0.62)
  add("concrete", 5.65, 0.14, 5.27, 1.35, 0.16, 0.55)
  const transform = new THREE.Object3D()
  function batch(name: string, placements: Part[], material: THREE.Material, side = false) {
    const mesh = new THREE.InstancedMesh(geometry, material, placements.length)
    mesh.name = name
    placements.forEach(([x,y,z,w,h,d,angle = 0], i) => {
      transform.position.set(x,y,z)
      transform.scale.set(w,h,d)
      transform.rotation.set(0, side ? -Math.PI / 2 : 0, angle)
      transform.updateMatrix()
      mesh.setMatrixAt(i, transform.matrix)
    })
    mesh.castShadow = true
    mesh.receiveShadow = true
    mesh.computeBoundingSphere()
    model.add(mesh)
  }
  for (const name of Object.keys(materials) as (keyof typeof materials)[]) batch(name, parts[name], materials[name])
  batch("Side V columns", sideBraces, materials.steel, true)
  return model
}

export function frameSnfCamera(camera: THREE.OrthographicCamera, width: number, height: number) {
  const aspect = Math.max(1, width) / Math.max(1, height)
  const span = Math.max(16.5, 23.3 / aspect)
  camera.left = -span * aspect / 2
  camera.right = span * aspect / 2
  camera.top = span / 2
  camera.bottom = -span / 2
  camera.position.set(15, 13, 21)
  camera.lookAt(0, 2.65, 0)
  camera.updateProjectionMatrix()
  camera.updateMatrixWorld()
}
