// app/skills.tsx


function Square
(
  {title, subTitle}: { title: string, subTitle: string }
) {
  return (
    <div className="group aspect-square bg-white/4 p-8 flex justify-end text-right transition-all duration-700 hover:-translate-y-1 hover:bg-white/50">
      <div className="flex flex-col justify-end transition-all duration-700 ease-out group-hover:-translate-y-8">
    <span className="mb-2 text-6xl font-bold uppercase tracking-[0] transition-colors duration-700 group-hover:text-primary/80">
      {title}
    </span>
        <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 transition-colors duration-700 group-hover:text-black">
      {subTitle}
    </span>
      </div>
    </div>
  )
}

export default function Skills
() {
  return (
    <div className="mx-auto grid max-w-7xl gap-16 lg:grid-cols-2 lg:items-center">
      <div className="flex flex-col gap-8">
        <div
          className="inline-block border border-white/15 px-4 py-1 text-[10px] uppercase tracking-[0.2em] text-white/60">
          Features
        </div>

        <h3 className="text-4xl font-bold uppercase leading-none tracking-[0] md:text-5xl">
          Optimiert für
          <br/>
          effiziente Planung.
        </h3>

        <p className="max-w-md leading-relaxed text-white/70">
          Weniger Abstimmung. Weniger Fehler. Mehr Tempo.
          Durch agile & lean Methoden aus der Softwareentwicklung.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 ">
        <Square title={"BIM"} subTitle={"Fehler reduzieren"} />
        <Square title={"Agil"} subTitle={"schneller liefern"} />
        <Square title={"Lean"} subTitle={"Kosten senken"} />
        <Square title={"Tools"} subTitle={"Zeit Sparen"} />
      </div>
    </div>

  )
}
