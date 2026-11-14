"use client"

import {useEffect, useRef, useState} from "react"
import type {BuildingSceneCallbacks} from "./BuildingSceneRenderer"

export type BuildingProject = "crm" | "realbim" | "maison" | "novartis" | "hyatt" | "snf" | "wacheNord" | "areon" | "brick" | "rocketTigerli" | "unterwasser" | "theilerhaus"
type SceneController = {dispose: () => void}

const sceneLoaders = {
  crm: () => import("./SoftwareSceneRenderer").then(module => module.mountCrmScene),
  realbim: () => import("./SoftwareSceneRenderer").then(module => module.mountRealbimScene),
  theilerhaus: () => import("./TheilerhausSceneRenderer").then(module => module.mountTheilerhausScene),
  unterwasser: () => import("./UnterwasserSceneRenderer").then(module => module.mountUnterwasserScene),
  rocketTigerli: () => import("./RocketTigerliSceneRenderer").then(module => module.mountRocketTigerliScene),
  brick: () => import("./BrickSceneRenderer").then(module => module.mountBrickScene),
  areon: () => import("./AreonSceneRenderer").then(module => module.mountAreonScene),
  maison: () => import("./MaisonSceneRenderer").then(module => module.mountMaisonScene),
  novartis: () => import("./NovartisSceneRenderer").then(module => module.mountNovartisScene),
  wacheNord: () => import("./WacheNordSceneRenderer").then(module => module.mountWacheNordScene),
  snf: () => import("./SnfSceneRenderer").then(module => module.mountSnfScene),
  hyatt: () => import("./HyattSceneRenderer").then(module => module.mountHyattScene),
} satisfies Record<BuildingProject, () => Promise<(host: HTMLElement, callbacks: BuildingSceneCallbacks) => SceneController>>

export function ProjectBuildingScene({project}: {project: BuildingProject}) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<"loading" | "ready" | "error">("loading")
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    let disposed = false
    let scene: SceneController | undefined
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      observer.disconnect()
      void sceneLoaders[project]().then(mount => {
        if (disposed) return
        scene = mount(host, {
          onReady: () => {if (!disposed) setState("ready")},
          onError: () => {if (!disposed) setState("error")},
        })
      }).catch(() => {if (!disposed) setState("error")})
    }, {rootMargin: "120px"})
    observer.observe(host)
    return () => {
      disposed = true
      observer.disconnect()
      scene?.dispose()
      host.replaceChildren()
    }
  }, [project, attempt])

  const name = {crm: "Sirego CRM", realbim: "realBIM",theilerhaus: "Theilerhaus Zug", unterwasser: "Talstation Unterwasser", rocketTigerli: "Rocket Tigerli", brick: "The Brick 80", maison: "Maison de la Santé", novartis: "Novartis WSJ 25 (Chiron)", hyatt: "Park Hyatt Zürich", snf: "SNF Wankdorf", wacheNord: "Wache Nord", areon: "AREON Chur"}[project]
  return <figure className="relative aspect-[1.2] min-w-0 sm:aspect-[1.35] lg:min-h-[32rem]" aria-label={`Gebäudeansicht ${name}`} aria-busy={state === "loading"} data-model-state={state}>
    <div ref={hostRef} className={`absolute inset-0 transition-opacity duration-200 motion-reduce:transition-none ${state === "ready" ? "opacity-100" : "opacity-0"}`} aria-hidden="true"/>
    {state === "loading" ? <div role="status" className="absolute inset-0 grid place-content-center">
      <span className="block size-9 animate-spin rounded-full border-[3px] border-slate-200 border-t-[#13b7bf] motion-reduce:animate-none" aria-hidden="true"/>
      <span className="sr-only">3D-Ansicht wird geladen</span>
    </div> : null}
    {state === "error" ? <div role="status" className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center">
      <p className="text-sm text-slate-500">Die 3D-Ansicht konnte nicht geladen werden.</p>
      <button type="button" className="min-h-11 px-4 text-sm font-semibold text-[#13b7bf] underline underline-offset-4" onClick={() => {setState("loading"); setAttempt(value => value + 1)}}>Erneut laden</button>
    </div> : null}
  </figure>
}
