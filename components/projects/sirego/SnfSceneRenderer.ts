import {mountBuildingScene, type BuildingSceneCallbacks, type BuildingSceneOptions} from "./BuildingSceneRenderer"
import {createSnfModel, frameSnfCamera} from "./SnfModel"

export const sceneOptions: BuildingSceneOptions = {
  createModel: createSnfModel,
  frameCamera: frameSnfCamera,
  shadowExtent: 15,
  lightPosition: [-4, 28, 7],
  shadowOpacity: 0.1,
}

export function mountSnfScene(host: HTMLElement, callbacks: BuildingSceneCallbacks) {
  return mountBuildingScene(host, sceneOptions, callbacks)
}
