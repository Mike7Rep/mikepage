// app/navigation.tsx

//UI
import {Button} from "@/components/ui/button"
import Link from "next/link"

export default function Navigation
() {

  const styleLink = "text-sm uppercase tracking-[0.08em] text-white/60 transition-colors hover:text-white"

  return (
    <nav
      className="fixed inset-x-0 top-0 z-50 flex items-center justify-between border-b border-white/10 bg-black/40 px-6 py-6 backdrop-blur-xl md:px-12">
      <Link
        href={"/"}
        className="text-xl font-bold tracking-tight">
        MICHAEL REPOLUSK
      </Link>

      <div className="hidden gap-10 md:flex">
        <Link href="/bildung" className={styleLink}>
          Bildung
        </Link>
        <Link href="/beruf" className={styleLink}>
          Beruf
        </Link>
        <Link href="/skills" className={styleLink}>
          Skills
        </Link>
        <Link href="/projekte" className={styleLink}>
          Projekte
        </Link>
      </div>

      <Link href={"mailto:michael.repolusk@sirego.ch"}>
        <Button className="px-6 uppercase tracking-[0.08em]">
          Kontakt
        </Button>
      </Link>
    </nav>
  )
}