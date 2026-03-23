// app/(print)/cv/page.tsx

import {Page1, Page2} from "./print/page"
import {Button} from "@/components/ui/button"
import Link from "next/link"

export default function Viewer() {

  return (
    <section className={"relative flex flex-col items-center justify-center gap-12 my-32"}>

      <Link
        className={"absolute -top-10 z-20"}
        href={"api/cv-pdf"}>
        <Button>
          PDF Download
        </Button>
      </Link>

      <Page1/>
      <Page2/>
    </section>
  )
}