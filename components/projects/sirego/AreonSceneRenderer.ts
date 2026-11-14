import {mountBuildingScene, type BuildingSceneCallbacks, type BuildingSceneOptions} from "./BuildingSceneRenderer"
import {createAreonModel, frameAreonCamera} from "./AreonModel"

export const sceneOptions: BuildingSceneOptions = {
  createModel: createAreonModel,
  frameCamera: frameAreonCamera,
  shadowExtent: 18,
  lightPosition: [-4, 28, 7],
  shadowOpacity: 0.1,
}

export function mountAreonScene(host: HTMLElement, callbacks: BuildingSceneCallbacks) {
  return mountBuildingScene(host, sceneOptions, callbacks)
}
