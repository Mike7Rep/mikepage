import * as THREE from "three"

type Part = [number, number, number, number, number, number]

// Exterior reconstructed from supplied screenshots. Illustrative dimensions, no IFC import.
export function createWacheNordModel() {
  const model = new THREE.Group()
  const box = new THREE.BoxGeometry(1, 1, 1)
  const parts: Record<string, Part[]> = {wall: [], trim: [], glass: [], roof: [], solar: [], concrete: []}
  const materials = {
    wall: new THREE.MeshStandardMaterial({color: 0x858d8d, roughness: 0.5, metalness: 0.42}),
    trim: new THREE.MeshStandardMaterial({color: 0xbfc5c3, roughness: 0.4, metalness: 0.55}),
    glass: new THREE.MeshStandardMaterial({color: 0xc3d7db, roughness: 0.24, metalness: 0.44}),
    roof: new THREE.MeshStandardMaterial({color: 0x62696c, roughness: 0.8}),
    solar: new THREE.MeshStandardMaterial({color: 0x718b9b, roughness: 0.32, metalness: 0.54}),
    concrete: new THREE.MeshStandardMaterial({color: 0xd7d8d3, roughness: 0.85}),
  }
  function add(key: keyof typeof materials, ...part: Part) {parts[key].push(part)}
  // A stepped L: four-storey street wing, three-storey middle, lower rear wing.
  function volume(x: number, z: number, width: number, depth: number, floors: number) {
    const height = floors * 1.15
    add("wall", x, height / 2 + 0.14, z, width, height, depth)
    add("roof", x, height + 0.17, z, width - 0.12, 0.09, depth - 0.12)
    for (const side of [-1, 1]) {
      add("trim", x, height + 0.26, z + side * depth / 2, width + 0.08, 0.16, 0.065)
      add("trim", x + side * width / 2, height + 0.26, z, 0.065, 0.16, depth)
      // Ribbed metal cladding is shared instanced geometry, with glazing placed in front.
      for (let rib = 0; rib <= Math.floor(width / 0.14); rib++) add("trim", x - width / 2 + rib * 0.14, height / 2 + 0.14, z + side * (depth / 2 + 0.025), 0.018, height, 0.045)
      for (let rib = 0; rib <= Math.floor(depth / 0.14); rib++) add("trim", x + side * (width / 2 + 0.025), height / 2 + 0.14, z - depth / 2 + rib * 0.14, 0.045, height, 0.018)
      for (let floor = 1; floor < floors; floor++) {
        const y = 0.14 + floor * 1.15 + 0.56
        const bays = Math.floor((width - 2.4) / 0.59)
        for (let bay = 0; bay < bays; bay++) {
          const bx = x + (bay - (bays - 1) / 2) * 0.59
          add("trim", bx, y, z + side * (depth / 2 + 0.055), 0.57, 1.05, 0.07)
          add("glass", bx, y, z + side * (depth / 2 + 0.1), 0.49, 0.94, 0.03)
          add("trim", bx, y, z + side * (depth / 2 + 0.125), 0.012, 0.94, 0.018)
        }
        const shortBays = Math.max(2, Math.floor((depth - 1.2) / 0.59))
        for (let bay = 0; bay < shortBays; bay++) {
          const bz = z + (bay - (shortBays - 1) / 2) * 0.59
          add("trim", x + side * (width / 2 + 0.06), y, bz, 0.07, 1.05, 0.57)
          add("glass", x + side * (width / 2 + 0.1), y, bz, 0.03, 0.94, 0.49)
        }
        add("trim", x, floor * 1.15 + 0.14, z + side * (depth / 2 + 0.12), width + 0.25, 0.035, 0.09)
      }
    }
  }
  volume(0, 3.4, 17, 4.8, 4)
  volume(0, -0.45, 17, 2.9, 3)
  volume(5.55, -5.0, 5.9, 6.2, 2)
  // Recessed courtyard between the lower wing and the street block, without terrain.
  add("concrete", 0, 0.055, -1.15, 17.15, 0.11, 14.1)
  // Vehicle hall doors across the street facade, with a small pedestrian entrance.
  for (let door = 0; door < 8; door++) {
    const x = -4.65 + door * 1.05
    add("trim", x, 0.75, 5.84, 1.0, 1.2, 0.10)
    add("glass", x, 0.81, 5.91, 0.86, 0.95, 0.035)
    add("trim", x, 0.75, 5.94, 0.025, 1.18, 0.025)
  }
  add("concrete", -0.97, 1.43, 5.99, 8.7, 0.12, 0.42)
  add("glass", 6.55, 0.76, 5.91, 0.7, 1.2, 0.045)
  // Three roof lights and large photovoltaic fields on the two lower terraces.
  for (const x of [-4.4, 0, 4.4]) {
    add("trim", x, 3.65, -1.02, 2.2, 0.13, 1.18)
    add("glass", x, 3.74, -1.02, 2.05, 0.06, 1.06)
  }
  function panels(cx: number, cz: number, cols: number, rows: number, y: number) {
    for (let col = 0; col < cols; col++) for (let row = 0; row < rows; row++) {
      const x = cx + (col - (cols - 1) / 2) * 0.57, z = cz + (row - (rows - 1) / 2) * 0.67
      add("trim", x, y, z, 0.53, 0.055, 0.62)
      add("solar", x, y + 0.035, z, 0.47, 0.025, 0.55)
    }
  }
  panels(0, 0.1, 27, 2, 3.78)
  panels(5.55, -5.3, 9, 7, 2.59)
  // Long, set-back roof plant block, mast and external ladder.
  add("concrete", 0, 5.12, 3.65, 14.1, 0.78, 1.18)
  add("roof", 0, 5.53, 3.65, 14.12, 0.05, 1.2)
  add("trim", -5.6, 6.67, 4.35, 0.07, 4.0, 0.07)
  add("trim", -5.6, 8.98, 4.35, 0.022, 0.64, 0.022)
  for (const x of [-2, 1.8]) add("trim", x, 5.74, 3.6, 0.12, 0.42, 0.12)
  for (const z of [3.1, 3.6]) add("trim", -8.73, 3.15, z, 0.035, 5.55, 0.035)
  for (let rung = 0; rung < 30; rung++) add("trim", -8.73, 0.5 + rung * 0.185, 3.35, 0.05, 0.025, 0.52)
  // Small open canopy at the rear edge of the yard.
  add("concrete", -4.4, 1.4, -6.6, 3.3, 0.09, 1.9)
  for (const x of [-5.85, -2.95]) for (const z of [-7.35, -5.85]) add("trim", x, 0.74, z, 0.06, 1.32, 0.06)
  const transform = new THREE.Object3D()
  for (const key of Object.keys(materials) as (keyof typeof materials)[]) {
    const mesh = new THREE.InstancedMesh(box, materials[key], parts[key].length)
    mesh.name = key
    parts[key].forEach(([x,y,z,w,h,d], index) => {
      transform.position.set(x,y,z); transform.scale.set(w,h,d); transform.updateMatrix()
      mesh.setMatrixAt(index, transform.matrix)
    })
    mesh.castShadow = true; mesh.receiveShadow = true; mesh.computeBoundingSphere(); model.add(mesh)
  }
  return model
}

export function frameWacheNordCamera(camera: THREE.OrthographicCamera, width: number, height: number) {
  const aspect = Math.max(1, width) / Math.max(1, height)
  const span = Math.max(18.5, 25.8 / aspect)
  camera.left = -span * aspect / 2; camera.right = span * aspect / 2
  camera.top = span / 2; camera.bottom = -span / 2
  camera.position.set(17, 15, 23); camera.lookAt(0, 3.25, -0.6)
  camera.updateProjectionMatrix(); camera.updateMatrixWorld()
}
