"use client"

import dynamic from "next/dynamic"

// The three.js / react-three-fiber canvases are client-only. Loading them via
// dynamic(ssr:false) keeps the heavy 3D libraries out of the server prerender
// (which otherwise trips Next's "Math.random() during prerender" guard) and
// defers them until the browser is ready.
const Placeholder = () => (
  <div className="relative overflow-visible bg-transparent" style={{ height: "clamp(300px, 36vw, 460px)" }} />
)

export const AreonChurCanvas = dynamic(() => import("./areonChurCanvas"), { ssr: false, loading: Placeholder })
export const TalstationCanvas = dynamic(() => import("./talstationCanvas"), { ssr: false, loading: Placeholder })
export const VantageZrhCanvas = dynamic(() => import("./vantageZrhCanvas"), { ssr: false, loading: Placeholder })
export const Brick80Canvas = dynamic(() => import("./brick80Canvas"), { ssr: false, loading: Placeholder })
export const GskMarburgCanvas = dynamic(() => import("./gskMarburgCanvas"), { ssr: false, loading: Placeholder })
export const TheilerhausCanvas = dynamic(() => import("./theilerhausCanvas"), { ssr: false, loading: Placeholder })
export const WohnparkBuchholzCanvas = dynamic(() => import("./wohnparkBuchholzCanvas"), { ssr: false, loading: Placeholder })
