// app/heroSection.tsx

import Image from "next/image";

export default function HeroSection
() {

  return (
    <>
      <div className="absolute inset-0 z-0">
        <Image
          src="/image/mike.png"
          alt="Michael Repolusk"
          fill
          priority
          className="object-cover object-center opacity-60"
        />
        <div className="absolute inset-0 bg-linear-to-b from-background/90 via-background/20 to-background"/>
      </div>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 text-center md:px-12">
        <h1 className="text-[16vw] font-extrabold uppercase leading-[0.9] tracking-[-0.06em] md:text-[10vw]">
          Michael
          <br/>
          Repolusk
        </h1>

        <p className="mt-4 max-w-xl text-xs uppercase tracking-[0.3em] text-white/60 md:text-sm">
          Engineering precision meets digital development.
        </p>
      </div>
    </>
  )
}