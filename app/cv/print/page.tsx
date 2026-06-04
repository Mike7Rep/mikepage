// app/cv/page.tsx

import Image from "next/image"
import Link from "next/link"
import clsx from "clsx"

import { contact } from "@/lib/profile-data"

import Berufserfahrung from "./Berufserfahrung"
import WeitereBerufserfahrung from "./WeitereBerufserfahrung"

const colorBackground1 = " !bg-gray-800"
const colorBorder1 = " !border-gray-800"
const colorText1 = " !text-gray-800"

const colorBackground2 = "bg-blue-400"
const colorBackground3 = "bg-white"

const styleh1 = "text-5xl text-center mt-16 uppercase"
const styleh2 = "text-xl text-left uppercase font-bold tracking-tight"

const styleList = "text-xs list-disc mt-5 text-left flex flex-col gap-2 items-start w-full px-2"

function HeadLine() {

  return (
    <>
      <h1 className={styleh1}>Michael Repolusk</h1>
      <p className={"text-center"}>
        Product Owner | Webentwickler | Engineering & Prozessautomatisierung
      </p>
      <div className={"relative w-25 h-25 flex mx-auto z-30 "}>
        <Image
          src="/image/logo.png"
          alt="MR Logo"
          fill
          sizes={"1024px"}
          className={"object-cover object-top scale-120"}
        />
      </div>

      <div className={"h-4"}/>
    </>
  )
}


export function Page1() {

  return (
    <div
      className={clsx(
        "relative w-[210mm] h-[297mm] overflow-hidden",
        colorBackground3
      )}>
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
              loading="eager"
              src="/image/mike.png"
              alt="Michael Repolusk"
              fill
              sizes={"2731px"}
              className={"object-cover object-top scale-170 mt-16"}
            />
          </div>
          <div className={"flex flex-col my-8 justify-center items-center"}>
            <h2 className={styleh2}>Kontakt</h2>
            <br/>
            <p className={"text-sm"}>{contact.street}</p>
            <p className={"text-sm"}>{contact.city}</p>
            <br/>
            <Link className={"underline"}  href={`tel:${contact.phone.replaceAll(" ", "")}`}>
              <p className={"text-sm"}>{contact.phone}</p>
            </Link>
            <Link className={"underline"} href={`mailto:${contact.email}`}>
              <p className={"text-sm"}>{contact.email}</p>
            </Link>
            <Link className={"underline"} href={contact.website}>
              <p className={"text-sm"}>{contact.website.replace("https://", "").replace(/\/$/, "")}</p>
            </Link>

            <div className={"h-0.5 my-8 w-8/10 rounded-full" + colorBackground1}/>

            <h2 className={styleh2}>Expertise</h2>
            <ul className={styleList}>
              <li>Product Ownership</li>
              <li>React & Next.js Webentwicklung</li>
              <li>TypeScript / JavaScript</li>
              <li>UX, Prototyping & Designsysteme</li>
              <li>Agile, Lean & VDC Methoden</li>
              <li>Prozessautomatisierung</li>
              <li>BIM, Revit & Gebäudetechnik</li>
            </ul>

            <div className={"h-0.5 my-8 w-8/10 rounded-full" + colorBackground1}/>

            <h2 className={styleh2}>Sprache</h2>
            <ul className={styleList}>
              <li>Deutsch (Muttersprache)</li>
              <li>Englisch (fliessend)</li>
              <li>Schweizerdeutsch</li>
            </ul>


          </div>


        </div>
        <div className={"col-span-2 ml-3"}>
          <HeadLine />

          {/* Haupteil*/}
          <div className={clsx("w-full h-full flex flex-col pr-8 text-sm", colorText1)}>
            <h2 className={styleh2}>über mich</h2>
            <p>
              Ich verbinde <strong>Product Ownership und Webentwicklung</strong> mit einem
              starken technischen Hintergrund aus <strong>Engineering, BIM und Gebäudetechnik</strong>.
              Dadurch kann ich Anforderungen schnell verstehen, priorisieren und in schlanke
              digitale Produkte übersetzen.
            </p>
            <p>
              Mein Fokus liegt auf <strong>klaren Oberflächen, Prozessautomatisierung und
              produktnaher Umsetzung</strong>: von CRM- und Management-Tools über PDF-Workflows
              bis zu Konzept- und Planungstools, die im Alltag wirklich genutzt werden.
            </p>
            <p>
              Aus der Projektleitung kenne ich Stakeholder, Kosten, Termine und Qualität aus der
              Praxis. In der Softwareentwicklung nutze ich dieses Wissen für
              <strong> schnelle Entscheidungen, saubere Priorisierung und belastbare Weblösungen</strong>.
            </p>

            <div className={"h-0.5 my-8 w-full rounded-full" + colorBackground1}/>
            {/*  Berufserfahrung */}
            <h2 className={styleh2}>Berufserfahrung </h2>
            <Berufserfahrung
              funktion={"Full Stack Developer | Product Owner"}
              timeline={"11.2024 - heute"}
              firma={"Sirego GmbH, Winterthur / Remote (CH)"}
              beschreibung={"Entwicklung und Produktführung digitaler Werkzeuge an der Schnittstelle von KMU-Prozessen, Planung, BIM und Software. Fokus auf schnelle, verständliche Weboberflächen ohne unnötige Plattformkomplexität."}
              liste={[
                "Konzeption und Umsetzung von React- und Next.js-Anwendungen",
                "Product Ownership für CRM-, Management- und Konzept-Tools",
                "Anforderungsanalyse, Priorisierung und nutzernahe Umsetzung",
                "PDF-, Buchungs- und Prozessworkflows für einfache digitale Abläufe"
              ]}/>

            <Berufserfahrung
              funktion={"Projektleiter Haustechnik | BIM / Revit"}
              timeline={"10.2021 - 08.2025"}
              firma={"3-Plan AG, Winterthur (CH)"}
              beschreibung={"Ingenieurbüro mit allen 4 Gewerken und hohem Fokus auf BIM und Revit. Aufbau effizienter digitaler Planungsprozesse und Übersetzung komplexer Anforderungen in praktikable Workflows."}
              liste={[
                "Fachprojektleitung Lüftung in anspruchsvollen HLKSE Projekten",
                "BIM Koordination in interdisziplinären Projekten",
                "Aufbau und Optimierung von Revit-Prozessen, Schemata und Ausschreibungsworkflows",
                "Strukturierung von Anforderungen zwischen Projektteam, Planung und Ausführung",
                "Projektarbeit in Mehrfamilienhäusern, Hallen, Hochhäusern, Restaurants und öffentlichen Bauten",
                "Fachbauleitung HKLS"
              ]}/>

          </div>
        </div>
      </section>

    </div>

  )
}


export function Page2() {

  return (
    <div
      className={clsx(
        "relative w-[210mm] h-[297mm] overflow-hidden",
        colorBackground3
      )}>
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
          <div className={"text-sm flex flex-col my-8 justify-center items-center px-8"}>
            <h2 className={styleh2 + " pb-4"}>Ausbildung</h2>
            <div className={"flex flex-col gap-4"}>
              <div>
                <span className={"font-bold"}>MSc in Engineering</span>
                <p>2016 - 2019</p>
                <p>FH OÖ Wels</p>
              </div>


              <div>
                <span className={"font-bold"}>BSc in Engineering</span>
                <p>2013 - 2016</p>
                <p>FH OÖ Wels</p>
              </div>


              <div>
                <span className={"font-bold"}>Berufsreife</span>
                <p>2010 - 2013</p>
                <p>BIFI Wels</p>
              </div>


              <div>
                <span className={"font-bold"}>Elektrotechnik</span>
                <p>1999 - 2001</p>
                <p>HTL Wels</p>
              </div>


              <div>
                <span className={"font-bold"}>Sporthauptschule</span>
                <p>1995 - 1999</p>
                <p>SHS Wels</p>
              </div>


              <div>
                <span className={"font-bold"}>Volksschule</span>
                <p>1991 - 1995</p>
                <p>VS9 Wels</p>
              </div>
            </div>

            <div className={"h-0.5 my-8 w-full rounded-full" + colorBackground1}/>
            <h2 className={styleh2}>Weiterbildung</h2>
            <br/>
            <div>
              <span className={"font-bold"}>CAS - UX & Design</span>
              <p>2026 - heute</p>
              <p>OST - Rapperswill</p>
            </div>
            <br/>

            <div>
              <span className={"font-bold"}>CAS - VDC</span>
              <p>2022 - 2023</p>
              <p>FHNW - Sursee</p>
            </div>

            <div className={"h-0.5 my-8 w-full rounded-full" + colorBackground1}/>
            <h2 className={styleh2}>Persönlich</h2>

            <ul className={styleList}>
              <li>ledig</li>
              <li>geb. 07.07.1985</li>
              <li>IQ: 145</li>
            </ul>


          </div>


        </div>
        <div className={"col-span-2 ml-3"}>
          <HeadLine/>

          {/* Haupteil*/}
          <div className={clsx("w-full h-full flex flex-col pr-8 text-sm", colorText1)}>
            <h2 className={styleh2}>fortsetzung Berufserfahrung </h2>

            <Berufserfahrung
              funktion={"BIM Manager | Revit Spezialist"}
              timeline={"03.2020 - 04.2021"}
              firma={"Zauner Anlagentechnik GmbH, Wallern (AT)"}
              beschreibung={
                "Grosser Anlagenbauer mit Fokus auf Datacenter, Pharmacenter und Kraftwerke. Vertiefung der Revit-Kenntnisse im Grossprojektumfeld sowie Entwicklung automatisierter Abläufe für eine skalierbare Planerstellung."
              }
              liste={[
                "Revit Modellierung in mehreren Gewerken",
                "BIM Koordination in komplexen Anlagenbauprojekten",
                "Automatisierte Erstellung von Isometrien aus Revit",
                "Mitwirkung an Datacenter-Projekten mit über 1000 automatisiert erzeugten Plänen",
                "Fachbauleitung vor Ort auf der Baustelle"
              ]}/>

            <Berufserfahrung
              funktion={"Projektingenieur Gebäudetechnik"}
              timeline={"04.2018 - 08.2019"}
              firma={"Infranorm Technologie GmbH, Wels (AT)"}
              beschreibung={
                "Ingenieurbüro mit Spezialisierung auf Energiegewinnung und Luftreinigung für Produktionsstätten. Entwicklung technischer Konzepte und 3D-Planung in engem Austausch mit Kunden und Projektbeteiligten."
              }
              liste={[
                "Entwicklung von Hallen-Klimatisierungskonzepten",
                "3D Modellierung mit AutoCAD AX3000",
                "Erstellung und Präsentation technischer Konzepte bei Kunden",
                "Begleitung von Inbetriebnahmen geplanter Anlagen"
              ]}/>

            <div className={"h-0.5 my-4 w-full rounded-full" + colorBackground1}/>

            <h2 className={styleh2}>weitere Berufserfahrung </h2>

            <ul className={"py-4"}>
              <WeitereBerufserfahrung
                funktion={"Freiwilliger Mitarbeiter"}
                ort={" KSW, Winterthur"}
                start={"08.2022"}
                end={"08.2022"}
              />

              <WeitereBerufserfahrung
                funktion={"Software Tester"}
                ort={" Applause App Quality, Online"}
                start={"07.2021"}
                end={"11.2021"}
              />


              <WeitereBerufserfahrung
                funktion={"Nachhilfefachkraft"}
                ort={" Bachl Nachhilfe GmbH, Wels"}
                start={"09.2014"}
                end={"07.2020"}
              />

              <WeitereBerufserfahrung
                funktion={"Tutor Mathematik und Chemie"}
                ort={" FH OÖ F&E, Wels"}
                start={"07.2015"}
                end={"07.2020"}
              />

              <WeitereBerufserfahrung
                funktion={"Bankkaufmann"}
                ort={"Volksbank Oberösterreich AG, Wels"}
                start={"03.2011"}
                end={"09.2013"}
              />

              <WeitereBerufserfahrung
                funktion={"Bürokaufmann"}
                ort={"Philipp Gruppe, Wels"}
                start={"09.2008"}
                end={"09.2010"}
              />

              <WeitereBerufserfahrung
                funktion={"Lagerlogistiker"}
                ort={"Colop GmbH, Wels"}
                start={"03.2007"}
                end={"08.2008"}
              />

              <WeitereBerufserfahrung
                funktion={"Lagerlogistiker"}
                ort={"Holter GmbH, Wels"}
                start={"09.2006"}
                end={"12.2006"}
              />

              <WeitereBerufserfahrung
                funktion={"Grosshandelskaufmann"}
                ort={"Paul Lange Austria, Wels"}
                start={"04.2002"}
                end={"06.2006"}
              />
            </ul>


          </div>
        </div>

      </section>
    </div>
  )
}

export default function CV
() {

  return (
    <section className={"relative flex flex-col items-center gap-0 my-0 bg-white"}>

      <Page1/>
      <Page2/>

    </section>
  )
}
