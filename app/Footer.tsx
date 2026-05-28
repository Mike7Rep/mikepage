// app/Footer.tsx

import Link from "next/link"

import { contact } from "@/lib/profile-data"


export default function Footer
(

) {

  const linkStyle = "text-[10px] uppercase tracking-[0.12em] text-white/30 transition hover:text-white"

  return (
    <footer className="flex flex-col items-center justify-between gap-4 border-t border-white/10 bg-black px-6 py-10 md:flex-row md:px-12">
      <div className="text-[10px] uppercase tracking-[0.12em] text-white/30">
        © 2026 MICHAEL REPOLUSK. INGENIEUR. ENTWICKLER. VISIONÄR.
      </div>

      <div className="flex flex-wrap justify-center gap-8">
        <Link href="/impressum" className={linkStyle}>
          Impressum
        </Link>
        <Link href="/datenschutz" className={linkStyle}>
          Datenschutz
        </Link>
        <a
          href={contact.linkedin}
          className={linkStyle}>
          LinkedIn
        </a>
      </div>
    </footer>
  )
}
