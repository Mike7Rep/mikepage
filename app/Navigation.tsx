// app/navigation.tsx

//UI
import {Button} from "@/components/ui/button"
import Link from "next/link"

export default function Navigation
() {

  const styleLink = "text-sm uppercase tracking-[0.08em] text-white/60 transition-colors hover:text-white"

  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-black/40 px-6 py-6 backdrop-blur-xl md:px-12">

      <div className="relative flex items-center">

        {/* LEFT */}
        <Link
          href={"/"}
          className="text-xl font-bold tracking-tight uppercase">
          Michael Repolusk
        </Link>

        {/* CENTER */}
        <div className="absolute left-1/2 hidden -translate-x-1/2 gap-10 md:flex">
          <Link href="/bildung" className={styleLink}>Bildung</Link>
          <Link href="/beruf" className={styleLink}>Beruf</Link>
          <Link href="/app/cv" className={styleLink}>Skills</Link>
          <Link href="/projekte" className={styleLink}>Projekte</Link>
        </div>

        {/* RIGHT */}
        <div className="ml-auto">
          <Link href={"mailto:michael.repolusk@sirego.ch"}>
            <Button className="px-6 uppercase tracking-[0.08em] rounded-md">
              Kontakt
            </Button>
          </Link>
        </div>

      </div>

    </nav>
  )
}