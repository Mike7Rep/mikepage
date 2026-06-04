"use client"

import { useEffect } from "react"

const zeegEmbedId = "zeeg-embed-michaelrepolusk-30min"
const zeegScriptMarker = "michaelrepolusk-30min"

export default function ZeegEmbed() {
  useEffect(() => {
    const container = document.getElementById(zeegEmbedId)
    const existingScript = document.querySelector(`script[data-zeeg-inline-embed="${zeegScriptMarker}"]`)

    container?.replaceChildren()
    existingScript?.remove()

    const script = document.createElement("script")
    script.type = "text/javascript"
    script.src = "https://assets.zeeg.me/embed.min.js"
    script.async = true
    script.dataset.user = "michaelrepolusk"
    script.dataset.eventType = "30min"
    script.dataset.redirectParent = "true"
    script.dataset.zeegInlineEmbed = zeegScriptMarker

    document.body.appendChild(script)

    return () => {
      script.remove()
      container?.replaceChildren()
    }
  }, [])

  return (
    <div
      className="zeeg-inline-widget w-full"
      id={zeegEmbedId}
      style={{ minWidth: "320px", height: "780px" }}
    />
  )
}
