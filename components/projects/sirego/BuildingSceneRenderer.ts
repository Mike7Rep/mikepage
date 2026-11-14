import * as THREE from "three"
import {RoomEnvironment} from "three/addons/environments/RoomEnvironment.js"

export type BuildingSceneOptions = {
  stillFrame?: boolean
  createModel: () => THREE.Group
  frameCamera: (camera: THREE.OrthographicCamera, width: number, height: number) => void
  shadowExtent?: number
  lightPosition?: [number, number, number]
  shadowOpacity?: number
}

export type BuildingSceneCallbacks = {
  onReady: () => void
  onError: () => void
}

export function mountBuildingScene(host: HTMLElement, options: BuildingSceneOptions, {onReady, onError}: BuildingSceneCallbacks) {
  const renderer = new THREE.WebGLRenderer({alpha: true, preserveDrawingBuffer: options.stillFrame ?? false, antialias: true, stencil: false, powerPreference: "low-power"})
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.setClearColor(0x000000, 0)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFShadowMap
  renderer.domElement.className = "absolute inset-0 h-full w-full"
  renderer.domElement.setAttribute("aria-hidden", "true")
  host.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  const studio = new RoomEnvironment()
  const pmrem = new THREE.PMREMGenerator(renderer)
  const environment = pmrem.fromScene(studio, 0.04, 0.1, 100, {size: 128})
  scene.environment = environment.texture
  scene.environmentIntensity = 0.55
  studio.dispose()
  pmrem.dispose()
  scene.add(new THREE.HemisphereLight(0xe9f4ff, 0x939f9a, 2.4))
  const key = new THREE.DirectionalLight(0xfffbf5, 3.1)
  key.position.set(...(options.lightPosition ?? [-8, 16, 10]))
  key.castShadow = true
  key.shadow.mapSize.set(1024, 1024)
  const shadowExtent = options.shadowExtent ?? 10
  Object.assign(key.shadow.camera, {left: -shadowExtent, right: shadowExtent, top: shadowExtent + 2, bottom: -shadowExtent, near: 0.5, far: 45})
  key.shadow.normalBias = 0.04
  key.shadow.bias = -0.0002
  scene.add(key)
  const model = options.createModel()
  model.rotation.y = -0.15
  scene.add(model)
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(shadowExtent * 3, shadowExtent * 3), new THREE.ShadowMaterial({opacity: options.shadowOpacity ?? 0.13}))
  floor.rotation.x = -Math.PI / 2
  floor.position.y = -0.15
  floor.receiveShadow = true
  scene.add(floor)
  const camera = new THREE.OrthographicCamera(-8, 8, 8, -8, 0.1, 80)
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)")
  let playing = !options.stillFrame && !motion.matches
  let visible = false
  let disposed = false
  let failed = false
  let frame = 0
  let previous = 0
  let lastDraw = 0
  let ready = false

  function draw(now: number) {
    frame = 0
    if (disposed || failed || !visible || document.hidden) return
    if (!lastDraw || now - lastDraw >= 1000 / 30) {
      const delta = previous ? Math.min((now - previous) / 1000, 0.1) : 0
      if (playing) model.rotation.y = (model.rotation.y + delta * 0.075) % (Math.PI * 2)
      previous = now
      lastDraw = now
      try {
        renderer.render(scene, camera)
      } catch {
        failed = true
        stop()
        onError()
        return
      }
      if (!ready) {
        ready = true
        onReady()
      }
    }
    if (playing) frame = requestAnimationFrame(draw)
  }
  function stop() {
    cancelAnimationFrame(frame)
    frame = 0
    previous = 0
    lastDraw = 0
  }
  function requestDraw() {
    if (!frame && visible && !document.hidden && !disposed && !failed) frame = requestAnimationFrame(draw)
  }
  function setPlaying(next: boolean) {
    playing = next
    stop()
    requestDraw()
  }
  function resize() {
    const {width, height} = host.getBoundingClientRect()
    if (!width || !height) return
    const mobile = window.matchMedia("(max-width: 767px)").matches
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.25 : 2, Math.sqrt(1_300_000 / (width * height))))
    renderer.setSize(width, height, false)
    options.frameCamera(camera, width, height)
    lastDraw = 0
    requestDraw()
  }
  const intersection = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting
    if (visible) requestDraw()
    else stop()
  })
  intersection.observe(host)
  const sizeObserver = new ResizeObserver(resize)
  sizeObserver.observe(host)
  function visibilityChange() {stop(); requestDraw()}
  function motionChange() {setPlaying(!options.stillFrame && !motion.matches)}
  function contextLost(event: Event) {
    event.preventDefault()
    failed = true
    stop()
    onError()
  }
  document.addEventListener("visibilitychange", visibilityChange)
  motion.addEventListener("change", motionChange)
  renderer.domElement.addEventListener("webglcontextlost", contextLost)
  resize()

  return {
    dispose() {
      disposed = true
      stop()
      intersection.disconnect()
      sizeObserver.disconnect()
      document.removeEventListener("visibilitychange", visibilityChange)
      motion.removeEventListener("change", motionChange)
      renderer.domElement.removeEventListener("webglcontextlost", contextLost)
      const geometries = new Set<THREE.BufferGeometry>()
      const materials = new Set<THREE.Material>()
      scene.traverse(object => {
        if (!(object instanceof THREE.Mesh)) return
        geometries.add(object.geometry)
        for (const material of Array.isArray(object.material) ? object.material : [object.material]) materials.add(material)
        if (object instanceof THREE.InstancedMesh) object.dispose()
      })
      geometries.forEach(geometry => geometry.dispose())
      materials.forEach(material => material.dispose())
      environment.dispose()
      key.shadow.map?.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    },
  }
}
