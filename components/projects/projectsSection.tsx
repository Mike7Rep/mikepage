import Image from "next/image"
import projects from "./sirego-projects.json"
import { ProjectBuildingScene, type BuildingProject } from "./sirego/ProjectBuildingScene"

export default function ProjectsSection() {
  return <section id="projekte" className="px-5 py-20 sm:px-8 md:py-28"><div className="mx-auto max-w-7xl">
    <h2 className="mb-12 text-4xl font-bold sm:text-5xl">Projekte mit Sirego.</h2>
    {projects.map(project => <article key={project.id} className="grid items-center gap-8 border-t border-white/10 py-10 md:grid-cols-2">
      {project.scene ? <ProjectBuildingScene project={project.scene as BuildingProject}/> : <Image src={project.image} alt={project.title} width={900} height={700} className="w-full object-contain"/>}
      <div><h3 className="text-3xl font-bold">{project.title}</h3><p className="mt-4 max-w-xl text-base leading-7 text-white/60">{project.description}</p><a href={`https://www.sirego.ch/projekte/${project.id}`} target="_blank" rel="noreferrer" className="mt-6 inline-flex min-h-11 items-center border-b border-white/40 text-sm font-semibold">Projekt bei Sirego ansehen →</a></div>
    </article>)}
  </div></section>
}
