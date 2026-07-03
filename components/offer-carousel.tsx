"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

import { contact } from "@/lib/profile-data"

type OfferItem = {
  action: string
  description: string
  external?: boolean
  href: string
  title: string
}

const offers: OfferItem[] = [
  {
    title: "Product Owner",
    description:
      "Gemeinsam Web Produkte der neusten Generation entwickeln, mit integrierten KI Agenten und Simple UI für smarte und schnelle Erfolge.",
    href: contact.bookingPath,
    action: "30min Meeting",
  },
  {
    title: "FullStack",
    description:
      "Webseiten verbessern, optimieren, Redesign und an die Zielgruppe anpassen und ihr Leben vereinfachen. Oder eine neue Seite von 0 aufbauen und hosten.",
    href: contact.bookingPath,
    action: "30min Meeting",
  },
  {
    title: "Senior Revit Profi",
    description:
      "3D Modelle erstellen mit high performance Familien, die ich selber erstellt habe. LOI - Level of Information NEEDE wird bei mir gross geschrieben und beschleunigt die Plan und Modellerstellung.",
    href: contact.bookingPath,
    action: "30min Meeting",
  },
  {
    title: "BIM Spezialist",
    description:
      "BIM Modelle koordinieren, unterstützen und für die Baustelle und deren Monteure ready machen. Mit automatisierten Isometrien, Vorfabrikationsplänen und ein Modell, das mit Baustelle, Lager und Progress zusammenhängt. Echtes Bim halt.",
    href: contact.bookingPath,
    action: "30min Meeting",
  },
  {
    title: "realBIM",
    description:
      "Ein Online 3D Konzept Tool mit dem man sehr schnell Grundlagen importieren, Pläne erstellen und Kostenschätzung sowie Unternehemr vergleichen kann. Alles in einer Web Lösung.",
    href: "https://realbim.sirego.ch",
    action: "Jetzt testen",
    external: true,
  },
  {
    title: "CRM",
    description:
      "Ein schlankes CRM, wo man Kunden, Aufträge, Rechnungen, Offerte, Buchhaltung, Lohnbuchhaltung online erfassen kann und sofort wichtige KPI des Unternehmens sieht. Aus eigener Hand für unser Unternehmen entwickelt, nun auch für andere Nutzbar.",
    href: "https://crm.sirego.ch",
    action: "Jetzt anmelden",
    external: true,
  },
]

const cardStep = 240
const compactCardStep = 220
const transitionMs = 2160

function OfferCard({ offer }: { offer: OfferItem }) {
  return (
    <article className="flex h-[12.75rem] flex-col rounded-lg border border-white/10 bg-white/[0.035] p-5 shadow-2xl shadow-black/30 backdrop-blur-sm sm:h-56 sm:p-8">
      <h3 className="truncate text-2xl font-black uppercase leading-none tracking-[0] text-white sm:text-3xl">
        {offer.title}
      </h3>
      <p className="mt-3 line-clamp-3 text-sm leading-6 text-white/58 sm:text-lg sm:leading-7">
        {offer.description}
      </p>
      <Link
        href={offer.href}
        target={offer.external ? "_blank" : undefined}
        rel={offer.external ? "noreferrer" : undefined}
        className="mt-auto inline-flex min-h-10 items-center justify-center self-end whitespace-nowrap rounded-full bg-[#45C456] px-5 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-black transition-all hover:-translate-y-0.5 hover:bg-[#56d867] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#45C456]/50"
      >
        {offer.action}
      </Link>
    </article>
  )
}

export default function OfferCarousel() {
  const [items, setItems] = useState(offers)
  const [isExiting, setIsExiting] = useState(false)
  const [isCompact, setIsCompact] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    const compactQuery = window.matchMedia("(max-width: 639px)")

    const updateMotionPreference = () => setReducedMotion(motionQuery.matches)
    const updateCompactLayout = () => setIsCompact(compactQuery.matches)
    updateMotionPreference()
    updateCompactLayout()
    motionQuery.addEventListener("change", updateMotionPreference)
    compactQuery.addEventListener("change", updateCompactLayout)

    return () => {
      motionQuery.removeEventListener("change", updateMotionPreference)
      compactQuery.removeEventListener("change", updateCompactLayout)
    }
  }, [])

  useEffect(() => {
    if (reducedMotion) return undefined

    let exitTimeout: number | undefined
    let rotateTimeout: number | undefined

    const queueNextCycle = () => {
      exitTimeout = window.setTimeout(() => {
        setIsExiting(true)
        rotateTimeout = window.setTimeout(() => {
          setItems((currentItems) => {
            const [first, ...rest] = currentItems
            return first ? [...rest, first] : currentItems
          })
          setIsExiting(false)
          queueNextCycle()
        }, transitionMs)
      }, 3000)
    }

    queueNextCycle()

    return () => {
      window.clearTimeout(exitTimeout)
      window.clearTimeout(rotateTimeout)
    }
  }, [reducedMotion])

  if (reducedMotion) {
    return (
      <div className="grid gap-4">
        {offers.map((offer) => (
          <OfferCard key={offer.title} offer={offer} />
        ))}
      </div>
    )
  }

  const activeCardStep = isCompact ? compactCardStep : cardStep

  return (
    <div className={`relative overflow-hidden ${isCompact ? "h-[40.25rem]" : "h-[44rem]"}`} aria-live="polite">
      {items.slice(0, 4).map((offer, index) => {
        const isTopCard = index === 0
        const y = index * activeCardStep - (isExiting && !isTopCard ? activeCardStep : 0)
        const x = isExiting && isTopCard ? "-115%" : "0%"

        return (
          <div
            key={offer.title}
            className="absolute inset-x-0 top-0 transition-all ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{
              filter: isExiting && isTopCard ? "blur(12px)" : "blur(0)",
              opacity: isExiting && isTopCard ? 0 : 1,
              transform: `translate3d(${x}, ${y}px, 0) scale(${isExiting && isTopCard ? 0.94 : 1})`,
              transitionDuration: `${transitionMs}ms`,
              zIndex: 10 - index,
            }}
          >
            <OfferCard offer={offer} />
          </div>
        )
      })}
    </div>
  )
}
