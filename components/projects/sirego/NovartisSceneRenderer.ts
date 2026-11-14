import {mountBuildingScene, type BuildingSceneCallbacks, type BuildingSceneOptions} from "./BuildingSceneRenderer"
import {createNovartisModel, frameNovartisCamera} from "./NovartisModel"

export const sceneOptions: BuildingSceneOptions = {
  createModel: createNovartisModel,
  frameCamera: frameNovartisCamera,
  shadowExtent: 12,
  lightPosition: [-4, 30, 7],
  shadowOpacity: 0.1,
}

export function mountNovartisScene(host: HTMLElement, callbacks: BuildingSceneCallbacks) {
  return mountBuildingScene(host, sceneOptions, callbacks)
}
