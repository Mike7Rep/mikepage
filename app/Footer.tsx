// app/Footer.tsx


export default function Footer
(

) {

  const linkStyle = "text-[10px] uppercase tracking-[0.12em] text-white/30 transition hover:text-white"

  return (
    <footer className="flex flex-col items-center justify-between gap-4 border-t border-white/10 bg-black px-6 py-10 md:flex-row md:px-12">
      <div className="text-[10px] uppercase tracking-[0.12em] text-white/30">
        © 2026 MICHAEL REPOLUSK. INGENIEUR. ENTWICKLER. VISIONÄR.
      </div>

      <div className="flex gap-8">
        <a href="#" className="text-[10px] uppercase tracking-[0.12em] text-white/30 transition hover:text-white">
          Impressum
        </a>
        <a
          href="https://www.linkedin.com/in/michael-repolusk-6855161b3/"
          className={linkStyle}>
          LinkedIn
        </a>
      </div>
    </footer>
  )
}