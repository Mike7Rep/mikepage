// app/navigation.tsx

"use client"

//UI

import {Button} from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { BookOpen, Briefcase, CalendarDays, FileText, FolderKanban, GraduationCap, Mail, Menu } from "lucide-react"

const navLinks = [
  { href: "/bildung", label: "Bildung", icon: GraduationCap },
  { href: "/berufe", label: "Beruf", icon: Briefcase },
  { href: "/#skills", label: "Skills", icon: BookOpen },
  { href: "/projekte", label: "Projekte", icon: FolderKanban },
  { href: "/cv", label: "CV", icon: FileText },
]

export default function Navigation
() {

  const styleLink = "text-sm uppercase tracking-[0.08em] text-white/60 transition-colors hover:text-white"

  const pathname = usePathname()


  if (pathname.includes("print") || pathname.startsWith("/myDashboard")) {
    return null
  }

  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-black/40 px-6 py-6 backdrop-blur-xl md:px-12">

      <div className="relative flex items-center">

        {/* LEFT */}
        <Link
          href={"/"}
          className="text-xl font-bold tracking-[0] uppercase">
          Michael Repolusk
        </Link>

        {/* CENTER */}
        <div className="absolute left-1/2 hidden -translate-x-1/2 gap-10 md:flex">
          {navLinks.map((item) => (
            <Link key={item.href} href={item.href} className={styleLink}>
              {item.label}
            </Link>
          ))}
        </div>

        {/* RIGHT */}
        <div className="ml-auto flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white/75 hover:bg-white/10 hover:text-white md:hidden" aria-label="Navigation öffnen">
                <Menu />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 border-white/10 bg-black text-white">
              <DropdownMenuGroup>
                {navLinks.map((item) => {
                  const Icon = item.icon

                  return (
                    <DropdownMenuItem key={item.href} asChild className="focus:bg-white/10 focus:text-white">
                      <Link href={item.href}>
                        <Icon />
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button asChild variant="ghost" size="icon" className="hidden text-white/70 hover:bg-white/10 hover:text-white sm:inline-flex">
            <Link href="/bookmeeting" aria-label="Meeting buchen">
              <CalendarDays />
            </Link>
          </Button>
          <Button asChild className="rounded-md px-3 uppercase tracking-[0.08em] sm:px-6">
            <Link href={"/kontakt"} aria-label="Kontakt">
              <Mail data-icon="inline-start" />
              <span className="hidden sm:inline">Kontakt</span>
            </Link>
          </Button>
        </div>

      </div>

    </nav>
  )
}
