import {mountBuildingScene, type BuildingSceneCallbacks, type BuildingSceneOptions} from "./BuildingSceneRenderer"
import {createWacheNordModel, frameWacheNordCamera} from "./WacheNordModel"

export const sceneOptions: BuildingSceneOptions = {
  createModel: createWacheNordModel,
  frameCamera: frameWacheNordCamera,
  shadowExtent: 15,
  lightPosition: [-4, 28, 7],
  shadowOpacity: 0.1,
}

export function mountWacheNordScene(host: HTMLElement, callbacks: BuildingSceneCallbacks) {
  return mountBuildingScene(host, sceneOptions, callbacks)
}
