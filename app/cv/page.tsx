import Image from "next/image"
import Link from "next/link"
import clsx from "clsx"

export default function CV
() {

  const colorBackground1 = " bg-gray-800"
  const colorBorder1 = " border-gray-800"
  const colorText1 = "text-gray-800"

  const colorBackground2 = "bg-[#10ACFA]"
  const colorBackground3 = "bg-white"

  const styleh1 = "text-5xl text-center mt-16 uppercase"
  const styleh2 = "text-3xl text-left uppercase"
  const styleh3 = "text-2xl text-left uppercase"


  return (
    <section className={"w-screen h-full flex justify-center items-center mt-20"}>
      {/* PAGE 1 */}
      <div className={
        clsx("relative scale-50 sm:scale-75 h-280 w-200 aspect-200/280",
        colorBackground3)}>
        <div className={clsx(
          "absolute inset-0 h-1/5 z-0",
          colorBackground1
        )}/>
        <section
          className={"relative z-10 grid grid-cols-3 h-full w-full"}
        >
          {/* Kontakt */}
          <div className={clsx
          (
            "col-span-1 border-2 text-center ml-6 mr-3 my-16 flex flex-col items-center rounded-lg",
            colorBorder1, colorBackground2
          )
          }>
            <div className={clsx(
              "border-2 rounded-full w-40 h-60 relative overflow-hidden mt-8",
              colorBackground1,
              colorBorder1)}>
              <Image
                src="/image/mike.png"
                alt="Michael Repolusk"
                fill
                className={"object-cover object-top scale-170 mt-16"}
              />
            </div>
            <div className={"flex flex-col my-8 justify-center items-center"}>
              <h3 className={styleh3}>Kontakt</h3>
              <br/>
              <p>Rychenbergstrasse 73</p>
              <p>8400 Winterthur</p>
              <br/>
              <Link
                className={"underline"}
                href={"tel:+41767248793"}><p>+41 76 724 87 93</p></Link>
              <Link
                className={"underline"}
                href={"mailto:michael.repolusk@sirego.ch"}><p>michael.repolusk@sirego.ch</p></Link>
              <Link
                className={"underline"}
                href={"https://www.michael-repolusk.com/"}><p>www.michael-repolusk.com</p></Link>

              <div className={"h-0.5 my-8 w-full rounded-full" + colorBackground1}/>

              <h3 className={styleh3}>Expertise</h3>


            </div>


          </div>
          <div className={"col-span-2 ml-3"}>
            <h1 className={styleh1}>Michael Repolusk</h1>
            <p className={"text-center"}>Ingenieur | Entwickler | Visionär</p>

            <div className={"h-32"}/>

            {/* Haupteil*/}
            <div className={clsx("w-full h-full flex flex-col", colorText1)}>
            <h2 className={styleh2}>über mich</h2>


            </div>

          </div>

        </section>

      </div>

    </section>
  )
}