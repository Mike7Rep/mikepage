import {mountBuildingScene, type BuildingSceneCallbacks, type BuildingSceneOptions} from "./BuildingSceneRenderer"
import {createBrickModel, frameBrickCamera} from "./BrickModel"

export const sceneOptions: BuildingSceneOptions = {
  createModel: createBrickModel,
  frameCamera: frameBrickCamera,
  shadowExtent: 15,
  lightPosition: [-8, 22, 12],
  shadowOpacity: 0.1,
}

export function mountBrickScene(host: HTMLElement, callbacks: BuildingSceneCallbacks) {
  return mountBuildingScene(host, sceneOptions, callbacks)
}
