import {
  BadgeCheck,
  Blocks,
  Bot,
  Braces,
  Building2,
  CalendarRange,
  Code2,
  DraftingCompass,
  FileCode2,
  FileText,
  Gauge,
  GitBranch,
  Layers3,
  LayoutDashboard,
  ListChecks,
  Milestone,
  MousePointer2,
  Network,
  PackageCheck,
  PanelTop,
  PenTool,
  Puzzle,
  Route,
  Search,
  Settings2,
  Sparkles,
  Target,
  Users,
  Workflow,
  Wrench,
  type LucideIcon,
} from "lucide-react"

const skills: { name: string; icon: LucideIcon; tone: string }[] = [
  { name: "Product Ownership", icon: Target, tone: "primary" },
  { name: "Roadmaps", icon: Milestone, tone: "white" },
  { name: "Stakeholder Management", icon: Users, tone: "primary" },
  { name: "UX & Design", icon: PenTool, tone: "white" },
  { name: "User Research", icon: Search, tone: "white" },
  { name: "Agile Delivery", icon: Route, tone: "primary" },
  { name: "Lean Thinking", icon: Gauge, tone: "white" },
  { name: "Kanban", icon: ListChecks, tone: "white" },
  { name: "React", icon: Code2, tone: "primary" },
  { name: "Next.js", icon: PanelTop, tone: "primary" },
  { name: "TypeScript", icon: Braces, tone: "white" },
  { name: "JavaScript", icon: FileCode2, tone: "white" },
  { name: "Tailwind CSS", icon: Sparkles, tone: "primary" },
  { name: "shadcn/ui", icon: Blocks, tone: "white" },
  { name: "Base UI", icon: MousePointer2, tone: "white" },
  { name: "Framer Motion", icon: GitBranch, tone: "primary" },
  { name: "PDF Export", icon: FileText, tone: "white" },
  { name: "Puppeteer", icon: Bot, tone: "white" },
  { name: "CRM Workflows", icon: LayoutDashboard, tone: "primary" },
  { name: "Process Automation", icon: Workflow, tone: "primary" },
  { name: "Revit", icon: DraftingCompass, tone: "white" },
  { name: "BIM Coordination", icon: Layers3, tone: "primary" },
  { name: "VDC", icon: Network, tone: "white" },
  { name: "HLKSE Planung", icon: Building2, tone: "white" },
  { name: "Gebäudetechnik", icon: Wrench, tone: "primary" },
  { name: "Revit Templates", icon: PackageCheck, tone: "white" },
  { name: "Schema Workflows", icon: Settings2, tone: "white" },
  { name: "Projektleitung", icon: CalendarRange, tone: "primary" },
  { name: "Qualitätssicherung", icon: BadgeCheck, tone: "white" },
  { name: "Systems Thinking", icon: Puzzle, tone: "white" },
]

export default function Skills
() {
  return (
    <div className="mx-auto grid min-h-[72vh] max-w-7xl gap-16 overflow-hidden lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
      <div className="flex flex-col gap-8">
        <div
          className="inline-block border border-white/15 px-4 py-1 text-[10px] uppercase tracking-[0.2em] text-white/60">
          Skills
        </div>

        <h3 className="text-4xl font-bold uppercase leading-none tracking-[0] md:text-5xl">
          Produktdenken
          <br/>
          trifft Umsetzung.
        </h3>

        <p className="max-w-md leading-relaxed text-white/70">
          Product Ownership, Webentwicklung und Engineering-Erfahrung greifen hier ineinander:
          von der Idee über klare Prioritäten bis zur schnellen, brauchbaren Oberfläche.
        </p>
      </div>

      <div className="relative min-h-[28rem] overflow-hidden rounded-lg border border-white/10 bg-white/[0.025] p-4 sm:p-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(130,226,98,0.12),transparent_32%),linear-gradient(to_bottom,rgba(255,255,255,0.045),transparent)]" />
        <div className="relative flex h-full min-h-[25rem] flex-wrap content-center items-center justify-center gap-3 py-8">
          {skills.map((skill, index) => {
            const Icon = skill.icon
            const isPrimary = skill.tone === "primary"

            return (
              <div
                key={skill.name}
                className="skill-drift motion-preset-pop motion-duration-700"
                style={{
                  animationDelay: `${(index % 10) * -1.8}s`,
                  animationDuration: `${36 + (index % 7) * 4}s`,
                }}
              >
                <div className={[
                  "group flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] backdrop-blur-sm transition-all duration-500 hover:-translate-y-1 hover:scale-[1.03]",
                  isPrimary
                    ? "border-primary/35 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground"
                    : "border-white/12 bg-white/5 text-white/70 hover:border-white/30 hover:bg-white/12 hover:text-white",
                ].join(" ")}>
                  <Icon className="size-4 transition-transform duration-500 group-hover:rotate-6" aria-hidden="true" />
                  <span>{skill.name}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
