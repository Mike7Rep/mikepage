import * as THREE from "three"
import { mountBuildingScene, type BuildingSceneCallbacks } from "./BuildingSceneRenderer"

// Abstract UI models based on the supplied screenshots. No customer data or metrics.
function createSoftwareModel(kind: 'crm' | 'realbim') {
  const group = new THREE.Group()
  const white = new THREE.MeshStandardMaterial({ color: '#f5f8fa', roughness: .65 })
  const panel = new THREE.MeshStandardMaterial({ color: '#e5edf0', roughness: .6 })
  const blue = new THREE.MeshStandardMaterial({ color: '#08acf1', roughness: .35 })
  const green = new THREE.MeshStandardMaterial({ color: '#10bb91', roughness: .4 })
  const dark = new THREE.MeshStandardMaterial({ color: '#17282e', metalness: .4, roughness: .4 })
  function box(x: number, y: number, z: number, w: number, h: number, d: number, material: THREE.Material) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material)
    mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; group.add(mesh)
  }
  function path(points: THREE.Vector3[], material: THREE.Material, radius = .04) {
    const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal')
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 64, radius, 8, false), material)
    mesh.castShadow = true; group.add(mesh)
  }
  function navigation(labels: string[], horizontal: boolean) {
    const canvas = document.createElement('canvas'); canvas.width = horizontal ? 1600 : 400; canvas.height = horizontal ? 110 : 1200
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#f5f8fa'; ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.font = `600 ${horizontal ? 27 : 32}px Arial`
    labels.forEach((label, i) => {
      const x = horizontal ? 28 + i * 222 : 30, y = horizontal ? 67 : 90 + i * 118
      ctx.fillStyle = i === 0 ? '#08acf1' : '#3a464d'; ctx.fillText(label, x, y)
    })
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(horizontal ? 11.6 : 2.4, horizontal ? .8 : 7.5), new THREE.MeshBasicMaterial({ map: texture }))
    mesh.rotation.x = -Math.PI / 2; mesh.position.set(horizontal ? 0 : -4.65, .62, horizontal ? -3.5 : 0); group.add(mesh)
  }
  box(0, .22, 0, 12.3, .44, 8.3, dark)
  box(0, .47, 0, 12, .12, 8, white)
  if (kind === 'crm') {
    navigation(['Dashboard', 'Zeiterfassung', 'Kunden', 'Aufträge', 'Leistungen', 'Rechnungen', 'Personal', 'Finanzen', 'Business Flow'], false)
    for (let i = 0; i < 3; i++) { box(-1.7 + i * 2.6, .65, -2.8, 2.3, .22, 1.1, panel); box(-1.7 + i * 2.6, .82, -2.8, 1.5, .1, .12, blue) }
    box(1.1, .65, -.3, 8.4, .22, 3.2, white)
    for (let i = 0; i < 4; i++) box(1.1, .79, -1.4 + i * .75, 8, .015, .015, panel)
    const points = [-2.8,-1.8,-.8,.2,1.2,2.2,3.2,4.9].map((x,i) => new THREE.Vector3(x,.85,.8 - [0,.05,.18,.18,.55,.8,1.3,2.15][i]))
    path(points, blue, .055)
    const area = new THREE.Shape(); area.moveTo(-2.8, -.8)
    points.forEach(p => area.lineTo(p.x, -p.z)); area.lineTo(4.9, -.8); area.closePath()
    const fill = new THREE.Mesh(new THREE.ShapeGeometry(area), new THREE.MeshStandardMaterial({ color:'#a4e5fa', side: THREE.DoubleSide }))
    fill.rotation.x = -Math.PI / 2; fill.position.y = .8; group.add(fill)
    for (let i = 0; i < 9; i++) box(-2.7 + i * .5, .86, 2.65 - i * .065, .3, .18, .25 + i * .13, i % 3 ? blue : green)
    for (let i = 0; i < 3; i++) { box(3.4, .67, 1.8 + i * .65, 2.6, .15, .35, panel); box(3 - i * .2, .8, 1.8 + i * .65, 1.8 - i * .4, .1, .24, i % 2 ? blue : green) }
  } else {
    navigation(['HOME', 'MODELLE', 'BAUTEILE', 'ROUTING', 'LIVEWORKER', 'METRIKEN'], true)
    box(0, .59, .25, 11.2, .08, 6.4, new THREE.MeshStandardMaterial({color:'#edf8fc'}))
    for (let i = 0; i < 5; i++) {
      const material = new THREE.MeshStandardMaterial({color: ['#f2cb43','#ed8190','#0879df','#e44d40','#a4b9c8'][i],roughness:.5})
      const z = -1.5 + i * .72
      path([new THREE.Vector3(-4, .95, z),new THREE.Vector3(1.8-i*.35,.95,z),new THREE.Vector3(2.5-i*.35,.95,z+.5),new THREE.Vector3(2.5-i*.35,.95,2.7)], material, i<2 ? .17 : .065)
    }
    box(0, .76, -2.5, 3.5, .18, .45, white)
    box(0, .8, 3.1, 4.2, .18, .45, white)
    for (let i = 0; i < 6; i++) { box(-1.4+i*.55,.92,-2.5,.2,.1,.2,i===1?blue:panel); box(-1.6+i*.6,.96,3.1,.2,.1,.2,i===2?blue:panel) }
  }
  return group
}
function mount(host: HTMLElement, callbacks: BuildingSceneCallbacks, kind: 'crm' | 'realbim') {
  return mountBuildingScene(host, {
    createModel: () => createSoftwareModel(kind), shadowExtent: 10,
    frameCamera(camera, width, height) {
      const aspect = width / height, span = Math.max(12.5, 17 / aspect)
      camera.left = -span * aspect / 2; camera.right = span * aspect / 2; camera.top = span / 2; camera.bottom = -span / 2
      camera.position.set(6, 13, 12); camera.lookAt(0, .4, 0); camera.updateProjectionMatrix(); camera.updateMatrixWorld()
    },
  }, callbacks)
}
export const mountCrmScene = (host: HTMLElement, callbacks: BuildingSceneCallbacks) => mount(host, callbacks, 'crm')
export const mountRealbimScene = (host: HTMLElement, callbacks: BuildingSceneCallbacks) => mount(host, callbacks, 'realbim')
