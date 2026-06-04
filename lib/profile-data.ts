export type TimelineCategory =
  | "engineering"
  | "bim"
  | "software"
  | "education"
  | "project"
  | "service"

export type TimelineItem = {
  period: string
  title: string
  organization: string
  location?: string
  category: TimelineCategory
  summary: string
  highlights: string[]
  href?: string
  actionLabel?: string
}

export const careerTimeline: TimelineItem[] = [
  {
    period: "11.2024 - heute",
    title: "Full Stack Developer",
    organization: "Sirego GmbH",
    location: "Winterthur / Remote",
    category: "software",
    summary:
      "Entwicklung digitaler Werkzeuge rund um Planung, Automatisierung und realBIM-Prozesse.",
    highlights: [
      "React- und Next.js-Oberflächen",
      "Prozessnahe Tools statt schwerer Datenbanklogik",
      "Schnittstelle zwischen Engineering und Softwareentwicklung",
    ],
    href: "https://www.sirego.ch",
    actionLabel: "Sirego ansehen",
  },
  {
    period: "08.2025 - 11.2025",
    title: "Projektleiter Haustechnik",
    organization: "integral design build AG",
    location: "Schlieren, CH",
    category: "engineering",
    summary:
      "Technische Beratung und Entwicklung von HLKSE-Konzepten für Mieterausbauten, Büros und Healthcare-Projekte.",
    highlights: [
      "HKLSE-Konzepte und Offerten",
      "Beratung von Bauherrschaft, Architektur und Unternehmern",
      "Planerstellung und gewerkeübergreifende Koordination",
    ],
  },
  {
    period: "10.2021 - 08.2025",
    title: "Projektleiter Haustechnik | BIM / Revit",
    organization: "3-Plan AG",
    location: "Winterthur, CH",
    category: "bim",
    summary:
      "BIM-nahe Projektleitung mit Fokus auf Revit-Prozesse, Koordination und effiziente Planungsabläufe.",
    highlights: [
      "Fachprojektleitung Lüftung in HLKSE-Projekten",
      "BIM-Koordination in interdisziplinären Teams",
      "Optimierung von Revit-Templates, Schemata und Ausschreibungsworkflows",
    ],
  },
  {
    period: "03.2020 - 04.2021",
    title: "BIM Manager | Revit Spezialist",
    organization: "Zauner Anlagentechnik GmbH",
    location: "Wallern, AT",
    category: "bim",
    summary:
      "Revit-Modellierung und BIM-Koordination im Anlagenbau mit Schwerpunkt Datacenter und skalierbare Planerstellung.",
    highlights: [
      "Revit-Modellierung in mehreren Gewerken",
      "Automatisierte Isometrien und Planableitungen",
      "Mitwirkung an Datacenter-Projekten mit sehr hoher Planzahl",
    ],
  },
  {
    period: "04.2018 - 08.2019",
    title: "Projektingenieur Gebäudetechnik",
    organization: "Infranorm Technologie GmbH",
    location: "Wels, AT",
    category: "engineering",
    summary:
      "Technische Konzeptentwicklung und 3D-Planung für Produktionsstätten und energieeffiziente Gebäudetechnik.",
    highlights: [
      "Hallen-Klimatisierungskonzepte",
      "3D-Modellierung mit AutoCAD AX3000",
      "Präsentation technischer Konzepte und Begleitung von Inbetriebnahmen",
    ],
  },
]

export const educationTimeline: TimelineItem[] = [
  {
    period: "2026 - heute",
    title: "CAS UX & Design",
    organization: "OST",
    location: "Rapperswil, CH",
    category: "education",
    summary:
      "Vertiefung in nutzerzentrierter Gestaltung, Interaction Design und klarer Produktkommunikation.",
    highlights: ["UX-Methodik", "Designsysteme", "Prototyping und Validierung"],
  },
  {
    period: "2022 - 2023",
    title: "CAS VDC",
    organization: "FHNW",
    location: "Sursee, CH",
    category: "bim",
    summary:
      "Weiterbildung in Virtual Design and Construction mit Fokus auf BIM, Prozesse und digitale Projektabwicklung.",
    highlights: ["BIM-Prozesse", "Koordination", "Lean/VDC-Denkweise"],
  },
  {
    period: "2016 - 2019",
    title: "MSc in Engineering",
    organization: "FH OÖ",
    location: "Wels, AT",
    category: "education",
    summary:
      "Masterstudium als technische Basis für komplexe Engineering- und Prozessaufgaben.",
    highlights: ["Engineering", "Systemdenken", "technische Vertiefung"],
  },
  {
    period: "2013 - 2016",
    title: "BSc in Engineering",
    organization: "FH OÖ",
    location: "Wels, AT",
    category: "education",
    summary:
      "Bachelorstudium mit Fokus auf technische Grundlagen, Projektarbeit und analytisches Arbeiten.",
    highlights: ["Technische Grundlagen", "Projektarbeit", "Methodisches Arbeiten"],
  },
  {
    period: "2010 - 2013",
    title: "Berufsreife",
    organization: "BIFI",
    location: "Wels, AT",
    category: "education",
    summary:
      "Berufsbegleitender Bildungsweg als Sprungbrett in die technische Hochschulausbildung.",
    highlights: ["Mathematik", "Technische Vorbereitung", "Eigenständiges Lernen"],
  },
]

export const projectTimeline: TimelineItem[] = [
  {
    period: "aktuell",
    title: "Sirego CRM",
    organization: "Sirego GmbH",
    category: "software",
    summary:
      "Auftrags-, Lohn-, Zeit- und Finanzmanagement für KMU in einem schlanken Tool, damit operative Arbeit ohne Excel- und Word-Umwege läuft.",
    highlights: [
      "Aufträge, Zeiten, Lohn und Finanzen in einem Arbeitsfluss",
      "Reduzierte Medienbrüche für kleine Unternehmen",
      "Login-basierte Web-App für den produktiven Alltag",
    ],
    href: "https://crm.sirego.ch",
    actionLabel: "CRM ansehen",
  },
  {
    period: "aktuell",
    title: "Sirego Firmenpage",
    organization: "Sirego GmbH",
    category: "software",
    summary:
      "Firmenpage für Produkt- und Dienstleistungsangebote rund um Revit, BIM, Gebäudetechnik und schnelle Konzeptarbeit.",
    highlights: [
      "Klare Angebotskommunikation für Projektanfragen",
      "Meeting- und Einstiegswege für neue Kunden",
      "Positionierung von Engineering, BIM und Software Engineering",
    ],
    href: "https://www.sirego.ch",
    actionLabel: "Sirego ansehen",
  },
  {
    period: "aktuell",
    title: "realBIM Konzept Tool",
    organization: "Sirego GmbH",
    category: "project",
    summary:
      "Online-Konzept-Tool, um PDF-Pläne zu nutzen, Bauteile zu platzieren, zu verbinden, zu bemassen und den Stand als prüfbares PDF weiterzugeben.",
    highlights: [
      "PDF-Plan importieren und massstabsgetreu kalibrieren",
      "Bauteile platzieren, verbinden und bemassen",
      "Konzeptstand inklusive Bauteilliste als PDF exportieren",
    ],
    href: "https://realbim.sirego.ch",
    actionLabel: "Tool testen",
  },
]

export const contact = {
  name: "Michael Repolusk",
  street: "Rychenbergstrasse 73",
  city: "8400 Winterthur",
  email: "michael.repolusk@sirego.ch",
  phone: "+41 76 724 87 93",
  website: "https://www.michael-repolusk.com/",
  linkedin: "https://www.linkedin.com/in/michael-repolusk-6855161b3/",
  bookingPath: "/bookmeeting",
}
