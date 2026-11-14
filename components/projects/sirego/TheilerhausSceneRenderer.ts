import {mountBuildingScene, type BuildingSceneCallbacks, type BuildingSceneOptions} from "./BuildingSceneRenderer"
import {createTheilerhausModel, frameTheilerhausCamera} from "./TheilerhausModel"

export const sceneOptions: BuildingSceneOptions = {
  createModel: createTheilerhausModel,
  frameCamera: frameTheilerhausCamera,
  shadowExtent: 16,
  lightPosition: [-8, 22, 12],
  shadowOpacity: 0.1,
}

export function mountTheilerhausScene(host: HTMLElement, callbacks: BuildingSceneCallbacks) {
  return mountBuildingScene(host, sceneOptions, callbacks)
}
