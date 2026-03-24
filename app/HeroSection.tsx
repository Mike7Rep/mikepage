// app/heroSection.tsx

import Image from "next/image";

export default function HeroSection
() {

  return (
    <>
      <div className="absolute inset-0 z-0 mx-auto mt-20">
        <Image
          loading="eager"
          src="/image/mike.png"
          alt="Michael Repolusk"
          fill
          priority
          sizes={"2731px"}
          className="object-cover object-[center_10%] opacity-30"
        />
        <div className="absolute inset-0 bg-linear-to-b from-background/90 via-background/20 to-background"/>
      </div>
      <div className="z-10 flex flex-col items-center justify-center text-center">
        <div className={"flex flex-col items-center justify-center"}>
          <h1 className="text-6xl md:text-8xl font-extrabold uppercase tracking-tight leading-tighter">
            Michael Repolusk</h1>

        <p className="mb-16 md:mb-4 max-w-xl text-xs uppercase tracking-[0.3em] text-white/60 md:text-sm">
          Fast paced development meets engineering
        </p>
        </div>
      </div>

      <div className="z-0  flex-1"/>

    </>
  )
}