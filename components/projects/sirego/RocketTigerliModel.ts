import * as THREE from "three"

type Part = [number, number, number, number, number, number]

// Illustrative exterior based on the supplied design images, not an imported BIM model.
export function createRocketTigerliModel() {
  const model = new THREE.Group()
  model.name = "Rocket Tigerli – architectural ensemble"
  const geometry = new THREE.BoxGeometry(1, 1, 1)
  const materials = {
    terracotta: new THREE.MeshStandardMaterial({color: 0xa96650, roughness: 0.82}),
    edge: new THREE.MeshStandardMaterial({color: 0xc5a58a, roughness: 0.75}),
    recess: new THREE.MeshStandardMaterial({color: 0x704638, roughness: 0.88}),
    glass: new THREE.MeshStandardMaterial({color: 0x7798ac, roughness: 0.28, metalness: 0.4}),
    warmGlass: new THREE.MeshStandardMaterial({color: 0xb5ada0, roughness: 0.35, metalness: 0.25}),
    rail: new THREE.MeshStandardMaterial({color: 0x675651, roughness: 0.6, metalness: 0.3}),
    roof: new THREE.MeshStandardMaterial({color: 0xaaa69a, roughness: 0.95}),
    solar: new THREE.MeshStandardMaterial({color: 0x3a4f59, roughness: 0.4, metalness: 0.35}),
  }
  type Material = keyof typeof materials
  const parts: Record<Material, Part[]> = {terracotta: [], edge: [], recess: [], glass: [], warmGlass: [], rail: [], roof: [], solar: []} satisfies Record<Material, Part[]>
  const add = (material: Material, ...part: Part) => parts[material].push(part)

  function building(cx: number, cz: number, width: number, depth: number, floors: number, nx: number, nz: number, tower = false) {
    const floorHeight = 0.82
    const groundHeight = 1.22
    const height = groundHeight + (floors - 1) * floorHeight
    // Raised bodies leave clear passages through the ground floor of the Tigerlis.
    add("recess", cx, (height + groundHeight) / 2, cz, width - 0.12, height - groundHeight, depth - 0.12)
    add("roof", cx, height + 0.035, cz, width + 0.12, 0.12, depth + 0.12)
    add("recess", cx, groundHeight / 2, cz, width * 0.34, groundHeight, depth * 0.42)

    // Each facade uses the same module: recessed glazing, deep terracotta frames,
    // alternating balcony bays and light horizontal edges on the tower.
    for (let face = 0; face < 4; face++) {
      const alongX = face < 2
      const side = face % 2 === 0 ? 1 : -1
      const length = alongX ? width : depth
      const bays = alongX ? nx : nz
      const spacing = length / bays
      const surface = (alongX ? depth : width) / 2
      const box = (material: Material, u: number, y: number, outward: number, w: number, h: number, d: number) => {
        if (alongX) add(material, cx + u, y, cz + side * (surface + outward), w, h, d)
        else add(material, cx + side * (surface + outward), y, cz + u, d, h, w)
      }
      for (let floor = 0; floor < floors; floor++) {
        const bottom = floor === 0 ? 0 : groundHeight + (floor - 1) * floorHeight
        const fh = floor === 0 ? groundHeight : floorHeight
        box(tower ? "edge" : "terracotta", 0, bottom + fh, 0.04, length + 0.24, 0.10, 0.29)
        for (let bay = 0; bay <= bays; bay++) {
          box("terracotta", -length / 2 + bay * spacing, bottom + fh / 2, 0.03, 0.13, fh, 0.24)
          if (tower) box("edge", -length / 2 + bay * spacing - 0.045, bottom + fh / 2, 0.164, 0.035, fh, 0.025)
        }
        for (let bay = 0; bay < bays; bay++) {
          const u = -length / 2 + (bay + 0.5) * spacing
          // Open arcade bays give access to the shared courtyard.
          if (!tower && floor === 0 && bay % 4 === 1) continue
          const balcony = floor > 0 && (tower ? (bay === 0 && floor % 2 === 0) || (bay === bays - 1 && floor % 2 === 1) : bay % 3 === floor % 2)
          const inset = balcony ? -0.23 : -0.035
          box((bay + floor + face) % 5 === 0 ? "warmGlass" : "glass", u, bottom + fh / 2, inset, spacing - 0.2, fh - 0.16, 0.035)
          box("rail", u + spacing * 0.13, bottom + fh / 2, inset + 0.025, 0.022, fh - 0.16, 0.025)
          if (balcony) {
            const projection = tower ? 0.27 : 0.42
            box(tower ? "edge" : "terracotta", u, bottom + 0.04, projection / 2, spacing - 0.04, 0.085, projection + 0.3)
            box("rail", u, bottom + 0.35, projection + 0.13, spacing - 0.13, 0.028, 0.025)
            for (let bar = 0; bar < 8; bar++) box("rail", u - spacing * 0.4 + bar * spacing * 0.8 / 7, bottom + 0.2, projection + 0.13, 0.018, 0.3, 0.018)
          }
        }
      }
      box("edge", 0, height + 0.16, 0, length + 0.18, 0.15, 0.14)
    }
    if (!tower) {
      add("terracotta", cx, height + 0.25, cz - depth * 0.15, width * 0.26, 0.38, depth * 0.32)
      for (let x = 0; x < nx; x++) for (let z = 0; z < 2; z++) {
        add("solar", cx - width * 0.42 + x * width * 0.84 / nx, height + 0.14, cz + depth * 0.21 + z * 0.4, width * 0.7 / nx, 0.055, 0.32)
      }
    }
  }

  building(-3.5, -5, 6.1, 6.1, 32, 7, 7, true)
  building(-7, 2.4, 3.8, 6.4, 7, 4, 7)
  building(6, -2.2, 3.8, 6.4, 7, 4, 7)
  building(1.8, 6.3, 10.8, 4.2, 7, 12, 5)

  const transform = new THREE.Object3D()
  for (const key of Object.keys(materials) as Material[]) {
    const mesh = new THREE.InstancedMesh(geometry, materials[key], parts[key].length)
    mesh.name = key
    parts[key].forEach(([x, y, z, w, h, d], index) => {
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

export function frameRocketTigerliCamera(camera: THREE.OrthographicCamera, width: number, height: number) {
  const aspect = Math.max(1, width) / Math.max(1, height)
  const span = Math.max(33, 30 / aspect)
  camera.left = -span * aspect / 2
  camera.right = span * aspect / 2
  camera.top = span / 2
  camera.bottom = -span / 2
  camera.position.set(-29, 28, 34)
  camera.lookAt(0, 11.5, 0)
  camera.updateProjectionMatrix()
  camera.updateMatrixWorld()
}
