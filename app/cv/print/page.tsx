// app/cv/page.tsx

import Image from "next/image"
import Link from "next/link"
import clsx from "clsx"

const colorBackground1 = " !bg-gray-800"
const colorBorder1 = " !border-gray-800"
const colorText1 = " !text-gray-800"

const colorBackground2 = "bg-blue-400"
const colorBackground3 = "bg-white"

const styleh1 = "text-5xl text-center mt-16 uppercase"
const styleh2 = "text-xl text-left uppercase font-bold tracking-tight"
const styleh3 = "text-md text-left uppercase  font-bold tracking-tight"

const styleList = "text-sm list-disc mt-5 text-left flex flex-col gap-2 items-start w-full px-4"
function Berufserfahrung
(
  {funktion, timeline, firma, beschreibung, liste}:
  { funktion: string, timeline: string, firma: string, beschreibung: string, liste: string[] }
) {


  return (
    <section className={"text-sm py-2" + colorText1}>
      <div className={"flex flex-row justify-between items-end pb-2"}>
        <h3 className={styleh3}>{funktion}</h3>
        <p className={"text-sm"}>{timeline}</p>
      </div>
      <span className={"text-sm font-light italic"}>{firma}</span>
      <p>{beschreibung}</p>
      <ul className={"py-3"}>
        {liste.map((item, idx) => (
          <li
            className={"list-disc pl-5 ml-5 text-xs"}
            key={idx}>{item}</li>
        ))}
      </ul>
    </section>
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
              sizes={"160px"}
              className={"object-cover object-top scale-170 mt-16"}
            />
          </div>
          <div className={"flex flex-col my-8 justify-center items-center"}>
            <h3 className={styleh3}>Kontakt</h3>
            <br/>
            <p className={"text-sm"}>Rychenbergstrasse 73</p>
            <p className={"text-sm"}>8400 Winterthur</p>
            <br/>
            <Link
              className={"underline"}
              href={"tel:+41767248793"}><p className={"text-sm"}>+41 76 724 87 93</p></Link>
            <Link
              className={"underline"}
              href={"mailto:michael.repolusk@sirego.ch"}><p className={"text-sm"}>michael.repolusk@sirego.ch</p>
            </Link>
            <Link
              className={"underline"}
              href={"https://www.michael-repolusk.com/"}><p className={"text-sm"}>www.michael-repolusk.com</p></Link>

            <div className={"h-0.5 my-8 w-full rounded-full" + colorBackground1}/>

            <h3 className={styleh3}>Expertise</h3>
            <ul className={styleList}>
              <li>Fähigkeit 1</li>
              <li>Fähigkeit 1</li>
              <li>Fähigkeit 1</li>
              <li>Fähigkeit asas1</li>
            </ul>

            <div className={"h-0.5 my-8 w-full rounded-full" + colorBackground1}/>

            <h3 className={styleh3}>Sprache</h3>
            <ul className={styleList}>
              <li>Deutsch (Muttersprache)</li>
              <li>Englisch (fliessend)</li>
              <li>Schweizer Deutsch</li>
            </ul>


          </div>


        </div>
        <div className={"col-span-2 ml-3"}>
          <h1 className={styleh1}>Michael Repolusk</h1>
          <p className={"text-center"}>Ingenieur | Entwickler | Visionär</p>

          <div className={"h-32"}/>

          {/* Haupteil*/}
          <div className={clsx("w-full h-full flex flex-col pr-8 text-sm", colorText1)}>
            <h2 className={styleh2}>über mich</h2>
            <p>Ich bin ein Paket aus Ingenieur, Entwickler und Visionär.
              Ich verbinde fundiertes Know-how aus der Gebäudetechnik mit den effizienten Denkweisen der
              Softwareentwicklung und erkenne gezielt Optimierungspotenziale in bestehenden Prozessen.</p>
            <p>Durch eigene Tools habe ich bereits Planungsabläufe vereinfacht, beschleunigt und wirtschaftlicher
              gemacht.
              Mit meinem Online-Kollaborationstool verfolge ich das Ziel, die Planungsbranche in ein neues,
              effizienteres Zeitalter zu führen.</p>

            <div className={"h-0.5 my-8 w-full rounded-full" + colorBackground1}/>
            {/*  Berufserfahrung */}
            <h2 className={styleh2}>Berufserfahrung </h2>
            <Berufserfahrung
              funktion={"Fachprojektleiter Lüftung"}
              timeline={"08.2025 - 11.2025"}
              firma={"integral design build AG, Schlieren (CH)"}
              beschreibung={"Ein Gesamtleister mit der Spezialisierung für den Innenausbau  im Bereich Büros und Healthcare. Mit Interresse und Neugier konnte ich Architekten und Innenarchitekten in der Haustechnik beraten."}
              liste={[
                "HKLSE Konzepte für Büros und Zahnarztpraxen",
                "Beratung mit Bauherren, Architekten und Unternehmer in allen SIA Phasen",
                "Erstellung von HKLSE Plänen mit ArchiCAD",
                "Erstellung von Offerte für Reaktivierung / Umbau von Mieterausbauten"
              ]}/>

            <Berufserfahrung
              funktion={"Projektleiter Haustechnik"}
              timeline={"10.2021 - 08.2025"}
              firma={"3-Plan AG, Winterthur (CH)"}
              beschreibung={"Ingenieurbüro mit allen 4 Gewerken und hohem Fokus auf BIM und Revit. Hier konnte ich meine Erfahrung mit Revit einbringen und neue Prozesse entwickeln - Schema und Automatisierte Ausschreibung."}
              liste={[
                "Fachprojektleitung Lüftung",
                "BIM Koordinator in unterschiedlichen Projekten",
                "Mehrfamilienhäueser, Hallen, Hochhäuser, Restaurant, Gerichtsgebäude",
                "Fachbauleitung HKLS"
              ]}/>

          </div>
        </div>
      </section>

    </div>

  )
}


export function Page2(){

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
            <h2 className={styleh2}>Ausbildung</h2>
            <br/>
            <div>
              <span className={"font-bold"}>MSc in Engineering</span>
              <p>2016 - 2019</p>
              <p>FH Oberösterreich</p>
              <p>Wels (AT)</p>
            </div>

            <div className={"h-0.5 my-8 w-full rounded-full" + colorBackground1}/>
            <h2 className={styleh2}>Weiterbildung</h2>
            <br/>
            <div>
              <span className={"font-bold"}>CAS</span>
              <p>2026 - heute</p>
              <p>OST – Ostschweizer Fachhochschule</p>
              <p>Rapperswill</p>
            </div>
            <br/>

            <div>
              <span className={"font-bold"}>CAS</span>
              <p>2026 - heute</p>
              <p>OST – Ostschweizer Fachhochschule</p>
              <p>Rapperswill</p>
            </div>

            <div className={"h-0.5 my-8 w-full rounded-full" + colorBackground1}/>
            <h2 className={styleh2}>Persönlich</h2>

            <ul className={styleList}>
              <li>ledig</li>
              <li>geb. 07.07.1985</li>
              <li></li>
            </ul>


          </div>


        </div>
        <div className={"col-span-2 ml-3"}>
          <h1 className={styleh1}>Michael Repolusk</h1>
          <p className={"text-center"}>Ingenieur | Entwickler | Visionär</p>

          <div className={"h-32"}/>

          {/* Haupteil*/}
          <div className={clsx("w-full h-full flex flex-col pr-8 text-sm", colorText1)}>
            <h2 className={styleh2}>fortsetzung Berufserfahrung </h2>

            <Berufserfahrung
              funktion={"BIM Manager"}
              timeline={"03.2020 - 04.2021"}
              firma={"Zauner Anlagentechnik GmbH, Wallern (AT)"}
              beschreibung={"Grosser Anlagenbauer in Europa mit Fokus auf Datacenter, Pharmacenter und Kraftwerke. Hier konnte ich meine selbst erlernten Revit Kenntnisse noch weiter Entwickeln. Dort habe ich Isometrien automatisiert aus Revit erstellt - so ist das Datacenter in Winterthur entstanden mit über 1000 automatisierten Plänen."}
              liste={[
                "Revit Modellierung in allen Gewerken",
                "BIM Koordination",
                "Automatisierte Isometrien aus Revit",
                "Fachbauleitung vor Ort auf der Baustelle"
              ]}/>

            <Berufserfahrung
              funktion={"Projekt Entwickler"}
              timeline={"01.08.2025 - 04.11.2025"}
              firma={"Infranorm Technologie GmbH, Wels (AT)"}
              beschreibung={"Kleines Ingenieur Büro, dass auf Energiegewinnung und Luftreinigung für Produktionsstääten spezialisiert ist. Besonders bei Autozulieferer ist ein kontrolliertes Klima für die Präzission der Bauteile wichtig. Dort konnte ich das neu gelernte Wissen aus dem Studium direkt an echten Projekten anwenden."}
              liste={[
                "Entwicklung von Hallenklimatisierungs Konzepten",
                "3D Modellierung in AutoCAD AX3000",
                "Erstellung und Präsentation der Konzepte bei Kunden",
                "Inbetriebnahmen von geplanten Anlagen",
              ]}/>

            <h2 className={styleh2}>weitere Berufserfahrung </h2>

            <ul>
              <li className={"flex flex-row justify-between"}>
                <p><span className={"font-bold"}>Full Stack Developer</span>, Sirego Gmbh, Hobby</p>
                <p>11.2024 - heute</p>
              </li>
              <li className={"flex flex-row justify-between"}>
                <p><span className={"font-bold"}>App Tester</span>, Applause App Quality, Online</p>
                <p>07.2021 - 11.2021</p>
              </li>
              <li className={"flex flex-row justify-between"}>
                <p><span className={"font-bold"}>Nachhilfefachkraft</span>, Bachl Nachhilfe GmbH, Wels</p>
                <p>09.2014 - 07.2020</p>
              </li>
              <li className={"flex flex-row justify-between"}>
                <p><span className={"font-bold"}>Labor Tutor für Studenten</span>, FH OÖ F&E, Wels</p>
                <p>07.2015 - 11.2020</p>
              </li>
              <li className={"flex flex-row justify-between"}>
                <p><span className={"font-bold"}>Bankkaufmann</span>, Volksbank Oberösterreich AG, Wels</p>
                <p>03.2011 - 09.2013</p>
              </li>
              <li className={"flex flex-row justify-between"}>
                <p><span className={"font-bold"}>Grosshandelskaufmann</span>, Paul Lange Austria, Wels</p>
                <p>04.2002 - 08.2008</p>
              </li>
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

      <Page1 />
      <Page2 />

    </section>
  )
}