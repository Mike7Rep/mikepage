import {mountBuildingScene, type BuildingSceneCallbacks, type BuildingSceneOptions} from "./BuildingSceneRenderer"
import {createMaisonModel, frameMaisonCamera} from "./MaisonModel"

export const sceneOptions: BuildingSceneOptions = {
  createModel: createMaisonModel,
  frameCamera: frameMaisonCamera,
  shadowExtent: 14,
  lightPosition: [-4, 30, 7],
  shadowOpacity: 0.1,
}

export function mountMaisonScene(host: HTMLElement, callbacks: BuildingSceneCallbacks) {
  return mountBuildingScene(host, sceneOptions, callbacks)
}
