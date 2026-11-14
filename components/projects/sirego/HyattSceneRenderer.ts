import {mountBuildingScene, type BuildingSceneCallbacks, type BuildingSceneOptions} from "./BuildingSceneRenderer"
import {createHyattModel, frameHyattCamera} from "./HyattModel"

export const sceneOptions: BuildingSceneOptions = {
  createModel: createHyattModel,
  frameCamera: frameHyattCamera,
  shadowExtent: 15,
  lightPosition: [-4, 30, 7],
  shadowOpacity: 0.1,
}

export function mountHyattScene(host: HTMLElement, callbacks: BuildingSceneCallbacks) {
  return mountBuildingScene(host, sceneOptions, callbacks)
}
