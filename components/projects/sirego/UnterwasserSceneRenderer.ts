import {mountBuildingScene, type BuildingSceneCallbacks, type BuildingSceneOptions} from "./BuildingSceneRenderer"
import {createUnterwasserModel, frameUnterwasserCamera} from "./UnterwasserModel"

export const sceneOptions: BuildingSceneOptions = {
  createModel: createUnterwasserModel,
  frameCamera: frameUnterwasserCamera,
  shadowExtent: 16,
  lightPosition: [-8, 22, 12],
  shadowOpacity: 0.1,
}

export function mountUnterwasserScene(host: HTMLElement, callbacks: BuildingSceneCallbacks) {
  return mountBuildingScene(host, sceneOptions, callbacks)
}
