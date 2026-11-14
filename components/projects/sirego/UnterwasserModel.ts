import * as THREE from "three"

type Point = [number, number, number]
// Architectural illustration from reference photographs and section; not surveyed BIM geometry.
export function createUnterwasserModel() {
  const model = new THREE.Group()
  model.name = "Talstation Unterwasser – timber station"
  const materials = {
    timber: new THREE.MeshStandardMaterial({color: 0xc8ac78, roughness: 0.88}),
    lightWood: new THREE.MeshStandardMaterial({color: 0xe0c598, roughness: 0.85}),
    darkWood: new THREE.MeshStandardMaterial({color: 0x9e825a, roughness: 0.91}),
    metal: new THREE.MeshStandardMaterial({color: 0xb8c1c2, roughness: 0.55, metalness: 0.35, side: THREE.DoubleSide}),
    solar: new THREE.MeshStandardMaterial({color: 0x354650, roughness: 0.38, metalness: 0.35, side: THREE.DoubleSide}),
    glass: new THREE.MeshStandardMaterial({color: 0x435a60, roughness: 0.32, metalness: 0.3}),
    concrete: new THREE.MeshStandardMaterial({color: 0xb6b7b1, roughness: 0.97}),
    rail: new THREE.MeshStandardMaterial({color: 0x687071, roughness: 0.5, metalness: 0.5}),
    red: new THREE.MeshStandardMaterial({color: 0xa73129, roughness: 0.7}),
  }
  type Material = keyof typeof materials
  const parts = Object.fromEntries(Object.keys(materials).map(key => [key, [] as THREE.Matrix4[]])) as Record<Material, THREE.Matrix4[]>
  const transform = new THREE.Object3D()
  function box(material: Material, x: number, y: number, z: number, w: number, h: number, d: number) {
    transform.position.set(x, y, z); transform.scale.set(w, h, d); transform.quaternion.identity(); transform.updateMatrix()
    parts[material].push(transform.matrix.clone())
  }
  function beam(material: Material, a: Point, b: Point, width: number, depth = width) {
    const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b), delta = end.clone().sub(start)
    transform.position.copy(start).add(end).multiplyScalar(0.5)
    transform.scale.set(width, delta.length(), depth)
    transform.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize())
    transform.updateMatrix(); parts[material].push(transform.matrix.clone())
  }
  const surfaces = Object.fromEntries(Object.keys(materials).map(key => [key, [] as number[]])) as Record<Material, number[]>
  function surface(material: Material, points: Point[]) {
    const positions = surfaces[material]
    for (let i = 1; i < points.length - 1; i++) positions.push(...points[0], ...points[i], ...points[i + 1])

  }
  // Front faces +Z. The rear ridge rises above the inclined funicular platform.
  const ridge = (z: number) => z < 2 ? 3.55 + (2 - z) * 0.295 : 3.55 + (z - 2) * 0.02
  const roof = (x: number, z: number) => {
    const edge = Math.abs(x) / 6.25
    // Diagonal folds run from the rear eaves to the low point of the ridge.
    if (z < 2 - edge * 10) return 3.55 + (2 - z) * 0.295 - edge * 3.5
    return 3.55 + (z - 2) * 0.02 - edge * 0.35
  }
  box("concrete", 0, 0.12, 0, 11.9, 0.24, 15.8)
  for (const side of [-1, 1]) {
    box("timber", side * 3.82, 1.58, 0, 3.85, 2.7, 15.4)
    // Recessed tall side windows interleaved with timber piers.
    for (let i = 0; i < 20; i++) {
      const z = -7.25 + i * 0.73
      box("darkWood", side * 5.78, 1.54, z, 0.07, 2.47, 0.5)
      box("glass", side * 5.83, 1.59, z, 0.035, 2.26, 0.40)
      box("lightWood", side * 5.87, 1.59, z + 0.31, 0.17, 2.72, 0.16)
    }
    // Front timber wings and their broad openings.
    box("glass", side * 3.85, 1.78, 7.735, 2.15, 1.05, 0.035)
    box("darkWood", side * 3.85, 1.17, 7.78, 2.25, 0.08, 0.12)
    for (let i = 0; i < 39; i++) {
      const x = side * (1.98 + i * 0.096)
      if (Math.abs(x) > 2.73 && Math.abs(x) < 4.98) {
        box("lightWood", x, 0.64, 7.77, 0.061, 0.8, 0.085)
        box("lightWood", x, 2.66, 7.77, 0.061, 0.63, 0.085)
      } else box("lightWood", x, 1.6, 7.77, 0.061, 2.72, 0.085)
    }
    // Tall rear gable leaves the railway portal open.
    for (let i = 0; i < 49; i++) {
      const x = side * (1.2 + i * 0.095), top = roof(x, -7.7) - 0.12
      box(i % 4 === 0 ? "timber" : "lightWood", x, (top + 0.24) / 2, -7.72, 0.068, top - 0.24, 0.14)
    }
    const eRear: Point = [side * 6.25, roof(6.25, -8), -8]
    const eFront: Point = [side * 6.25, roof(6.25, 8.6), 8.6]
    const rRear: Point = [0, ridge(-8), -8], kink: Point = [0, ridge(2), 2], rFront: Point = [0, ridge(8.6), 8.6]
    surface("metal", [rRear, eRear, kink])
    surface("metal", [eRear, eFront, rFront, kink])
    for (const [a, b] of [[rRear, eRear], [eRear, eFront], [eFront, rFront], [eRear, kink]] as [Point, Point][]) beam("lightWood", a, b, 0.14, 0.18)
    // Exposed transverse rafters below the overhanging roof.
    for (let z = -7.8; z <= 8.6; z += 0.61) {
      const foldX = Math.max(0, (2 - z) / 10 * 6.25)
      const center: Point = [0, ridge(z) - 0.16, z]
      const edge: Point = [side * 6.24, roof(6.24, z) - 0.16, z]
      if (foldX > 0 && foldX < 6.24) {
        const fold: Point = [side * foldX, roof(foldX, z) - 0.16, z]
        beam("timber", center, fold, 0.09, 0.13); beam("timber", fold, edge, 0.09, 0.13)
      } else beam("timber", center, edge, 0.09, 0.13)
    }
    // PV banks follow the shallow plane, with stepped ends along the roof fold.
    for (let x = 0.52; x < 5.7; x += 0.49) for (let z = -6.9; z < 7.75; z += 0.88) {
      if (z < 2 - x / 6.25 * 10 + 0.35) continue
      const p = (px: number, pz: number): Point => [side * px, roof(px, pz) + 0.035, pz]
      surface("solar", [p(x,z), p(x+0.455,z), p(x+0.455,z+0.82), p(x,z+0.82)])
    }
    for (let x = 0.3; x <= 6; x += 0.37) {
      const foldZ = 2 - x / 6.25 * 10
      beam("metal", [side*x,roof(x,-8)+0.025,-8], [side*x,roof(x,foldZ)+0.025,foldZ], 0.016)
    }
    // Open entrance portico with braced timber supports.
    box("timber", side * 2.0, 1.7, 7.96, 0.2, 3.1, 0.25)
    beam("lightWood", [side*2,2.05,7.96], [side*3.15,3.1,7.96], 0.16)
    box("timber", side * 5.66, 1.7, 7.96, 0.21, 3.1, 0.24)
    beam("lightWood", [side*5.66,2.05,7.96], [side*4.65,3.17,7.96], 0.16)
  }
  beam("metal", [0,ridge(-8)+0.03,-8], [0,ridge(2)+0.03,2], 0.07)
  beam("metal", [0,ridge(2)+0.03,2], [0,ridge(8.6)+0.03,8.6], 0.07)
  // Inclined track and stepped boarding platforms continue through the hall.
  const trackY = (z: number) => 0.3 + (6 - z) * 0.16
  for (let z = -10.8; z < 6; z += 0.42) box("rail", 0, trackY(z), z, 1.62, 0.09, 0.13)
  for (const x of [-0.54, 0.54]) beam("rail", [x,trackY(-11)+0.1,-11], [x,trackY(6)+0.1,6], 0.07)
  for (let i = 0; i < 22; i++) {
    const z = 5.7 - i * 0.6, h = trackY(z)
    for (const side of [-1, 1]) box("concrete", side*1.34, h/2, z, 0.7, h, 0.6)
  }
  box("concrete", 0, 1.12, -9.25, 2.1, 2.1, 3.0)
  // Small red funicular car, recognisable through the entrance.
  box("red", 0, 2.06, 0.0, 1.05, 1.52, 2.4)
  box("glass", 0, 2.3, 1.215, 0.85, 0.83, 0.03)
  box("metal", 0, 2.88, 0, 1.13, 0.12, 2.51)
  for (const side of [-1, 1]) for (const z of [-0.77,0,0.77]) box("glass", side*0.536,2.3,z,0.035,0.8,0.61)

  for (const material of Object.keys(materials) as Material[]) {
    if (!surfaces[material].length) continue
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(surfaces[material], 3)); geometry.computeVertexNormals()
    const mesh = new THREE.Mesh(geometry, materials[material]); mesh.castShadow = true; mesh.receiveShadow = true; model.add(mesh)
  }
  const geometry = new THREE.BoxGeometry(1, 1, 1)
  for (const material of Object.keys(materials) as Material[]) {
    if (!parts[material].length) continue
    const mesh = new THREE.InstancedMesh(geometry, materials[material], parts[material].length)
    parts[material].forEach((matrix, index) => mesh.setMatrixAt(index, matrix))
    mesh.name = material; mesh.castShadow = true; mesh.receiveShadow = true; mesh.computeBoundingSphere(); model.add(mesh)
  }
  return model
}

export function frameUnterwasserCamera(camera: THREE.OrthographicCamera, width: number, height: number) {
  const aspect = Math.max(1, width) / Math.max(1, height)
  const span = Math.max(22, 27 / aspect)
  camera.left = -span * aspect / 2; camera.right = span * aspect / 2
  camera.top = span / 2; camera.bottom = -span / 2
  camera.position.set(-22, 18, 28); camera.lookAt(0, 2.3, -0.8)
  camera.updateProjectionMatrix(); camera.updateMatrixWorld()
}
