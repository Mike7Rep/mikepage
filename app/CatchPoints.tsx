// app/catchPoints.tsx

import {Button} from "@/components/ui/button"
import Link from "next/link"
import clsx from "clsx"
import { ArrowRight } from "lucide-react"


function CatchPoint
(
  {count, title, description, buttonTitle, linkTo}:
  { count: string, title: string, description: string, buttonTitle: string, linkTo: string }
) {

  const styleDiv = clsx(
    "group relative bg-white/3",
    "border border-white/10 md:border-r md:border-white/10",
    "transition-all duration-600",
    "min-h-[120px]"
  )


  return (
    <div
      className={styleDiv}>
      <div
        className="pointer-events-none absolute inset-0 bg-white/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100"/>
      <div className="flex h-full flex-col justify-between p-8 md:p-6">
        <div>
          <span className="mb-2 block text-xs tracking-[0.25em] text-white/40">{count}</span>
          <h2 className="text-4xl font-bold uppercase tracking-[0]">{title}</h2>
        </div>

        <div
          className="max-h-0 overflow-hidden transition-all duration-600 group-hover:max-h-50">
          <p className="text-lg leading-relaxed text-white/70 py-4">
            {description}
          </p>
          <Button asChild className="ml-auto px-6 uppercase tracking-[0.08em]">
          <Link
            className={"z-10"}
            href={linkTo}
            target={linkTo.startsWith("http") ? "_blank" : undefined}
            rel={linkTo.startsWith("http") ? "noreferrer" : undefined}
          >
              {buttonTitle}
              <ArrowRight data-icon="inline-end" />
          </Link>
          </Button>
        </div>
      </div>
    </div>
  )

}

export default function CatchPoints
(

) {
  return (
      <div className="relative z-20 grid grid-cols-1 md:grid-cols-3 md:items-end">
        <CatchPoint
          count={"01"}
          title={"Ingenieur"}
          description={"BIM Spezialist - in 30 Minuten eine klare Lösung für dein Projekt"}
          buttonTitle={"30min Gratis Meeting"}
          linkTo={"/bookmeeting"}
        />

        <CatchPoint
          count={"02"}
          title={"Entwickler"}
          description={" Die Effektivität und Effizienz von Spielen in den Planungsprozess"}
          buttonTitle={"30min Gratis Meeting"}
          linkTo={"/bookmeeting"}
        />

        <CatchPoint
          count={"03"}
          title={"Visionär"}
          description={"RealBIM, Automatisierung und spielerische Logik für bessere Entscheidungen im Planungsprozess."}
          buttonTitle={"Sirego realBIM"}
          linkTo={"https://www.sirego.ch"}
        />
      </div>
  )
}
