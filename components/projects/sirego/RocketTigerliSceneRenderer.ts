import {mountBuildingScene, type BuildingSceneCallbacks, type BuildingSceneOptions} from "./BuildingSceneRenderer"
import {createRocketTigerliModel, frameRocketTigerliCamera} from "./RocketTigerliModel"

export const sceneOptions: BuildingSceneOptions = {
  createModel: createRocketTigerliModel,
  frameCamera: frameRocketTigerliCamera,
  shadowExtent: 24,
  lightPosition: [-8, 30, 12],
  shadowOpacity: 0.1,
}

export function mountRocketTigerliScene(host: HTMLElement, callbacks: BuildingSceneCallbacks) {
  return mountBuildingScene(host, sceneOptions, callbacks)
}
