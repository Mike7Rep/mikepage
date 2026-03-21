// //
//
//
// export default function Berufe
// (
//
// ) {
//
//   return (
//
//
//     <>
//     <!DOCTYPE html>
//
//   <html class="dark" lang="de"><head>
//     <meta charset="utf-8"/>
//     <meta content="width=device-width, initial-scale=1.0" name="viewport"/>
//     <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@200;400;700;800&amp;family=Inter:wght@300;400;600&amp;display=swap" rel="stylesheet"/>
//     <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
//     <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
//     <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
//   <script id="tailwind-config">
//     tailwind.config = {
//     darkMode: "class",
//     theme: {
//     extend: {
//     colors: {
//     "inverse-on-surface": "#303030",
//     "on-tertiary-container": "#000000",
//     "on-primary": "#1a1c1c",
//     "secondary-container": "#454747",
//     "on-tertiary-fixed-variant": "#e3e2e2",
//     "primary": "#ffffff",
//     "surface-dim": "#131313",
//     "inverse-surface": "#e2e2e2",
//     "secondary": "#c6c6c6",
//     "on-surface": "#e2e2e2",
//     "secondary-fixed": "#c6c6c6",
//     "error-container": "#93000a",
//     "surface-tint": "#c6c6c7",
//     "surface": "#131313",
//     "on-secondary-fixed": "#1a1c1c",
//     "surface-container": "#1f1f1f",
//     "primary-fixed-dim": "#454747",
//     "tertiary-fixed": "#5e5e5f",
//     "on-primary-fixed-variant": "#e2e2e2",
//     "inverse-primary": "#5d5f5f",
//     "on-secondary-fixed-variant": "#3a3c3c",
//     "surface-container-lowest": "#0e0e0e",
//     "on-secondary": "#1a1c1c",
//     "tertiary-container": "#909191",
//     "on-primary-container": "#000000",
//     "outline-variant": "#474747",
//     "on-error-container": "#ffdad6",
//     "primary-fixed": "#5d5f5f",
//     "tertiary": "#e3e2e2",
//     "on-tertiary-fixed": "#ffffff",
//     "on-tertiary": "#1a1c1c",
//     "surface-container-high": "#2a2a2a",
//     "on-background": "#e2e2e2",
//     "surface-container-low": "#1b1b1b",
//     "on-primary-fixed": "#ffffff",
//     "primary-container": "#d4d4d4",
//     "error": "#ffb4ab",
//     "on-secondary-container": "#e2e2e2",
//     "on-surface-variant": "#c6c6c6",
//     "surface-bright": "#393939",
//     "surface-container-highest": "#353535",
//     "on-error": "#690005",
//     "surface-variant": "#353535",
//     "background": "#131313",
//     "tertiary-fixed-dim": "#464747",
//     "secondary-fixed-dim": "#ababab",
//     "outline": "#919191"
//   },
//     fontFamily: {
//     "headline": ["Manrope"],
//     "body": ["Inter"],
//     "label": ["Inter"]
//   },
//     borderRadius: {"DEFAULT": "0px", "lg": "0px", "xl": "0px", "full": "9999px"},
//   },
//   },
//   }
//   </script>
//   <style>
//     .material-symbols-outlined {
//     font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24;
//   }
//     body {
//     background-color: #131313;
//     color: #e2e2e2;
//   }
//   </style>
// </head>
//   < class="font-body selection:bg-primary selection:text-on-primary">
//   <!-- TopNavBar -->
//   <nav class="fixed top-0 w-full z-50 bg-[#131313]/80 backdrop-blur-md transition-all duration-500 flex justify-between items-center px-8 md:px-16 h-24 w-full">
//     <div class="font-manrope text-2xl font-black tracking-tighter text-white">MICHAEL REPOLUSK</div>
//     <div class="hidden md:flex gap-12">
//       <a class="font-manrope uppercase tracking-[0.15em] font-medium text-xs text-[#d4d4d4]/40 hover:text-white hover:bg-white/5 transition-all duration-300 px-2 py-1" href="#">Home</a>
//       <a class="font-manrope uppercase tracking-[0.15em] font-black text-xs text-white scale-105 px-2 py-1" href="#">Beruf</a>
//       <a class="font-manrope uppercase tracking-[0.15em] font-medium text-xs text-[#d4d4d4]/40 hover:text-white hover:bg-white/5 transition-all duration-300 px-2 py-1" href="#">Projects</a>
//       <a class="font-manrope uppercase tracking-[0.15em] font-medium text-xs text-[#d4d4d4]/40 hover:text-white hover:bg-white/5 transition-all duration-300 px-2 py-1" href="#">Contact</a>
//     </div>
//     <button class="bg-primary text-on-primary px-8 py-3 font-manrope font-bold text-xs uppercase tracking-widest active:scale-95 transition-transform duration-150">Hire Me</button>
//   </nav>
//   <!-- Main Content: Beruf Section -->
//   <main class="pt-48 pb-24 px-8 md:px-16 max-w-7xl mx-auto">
//     <!-- Section Header -->
//     <header class="mb-32">
//       <h1 class="font-headline text-6xl md:text-9xl font-extrabold tracking-tighter text-white mb-6 uppercase">Beruf</h1>
//       <p class="font-body text-lg text-on-surface-variant max-w-2xl leading-relaxed opacity-80">
//         A strategic trajectory in engineering, BIM innovation, and digital transformation. Building the future of architectural engineering through precision and technological integration.
//       </p>
//     </header>
//     <!-- Timeline Section -->
//     <section class="relative">
//       <!-- Vertical Line -->
//       <div class="absolute left-0 md:left-1/2 top-0 bottom-0 w-[1px] bg-outline-variant/30 transform md:-translate-x-1/2"></div>
//       <!-- Station 1: Current -->
//       <div class="relative flex flex-col md:flex-row items-start md:items-center justify-between mb-40 w-full group">
//         <div class="hidden md:block w-5/12 text-right pr-16 order-1">
//           <span class="font-headline text-primary opacity-20 text-8xl font-black">01</span>
//         </div>
//         <!-- Timeline Marker -->
//         <div class="absolute left-[-4px] md:left-1/2 top-0 md:top-auto w-2 h-2 bg-primary transform md:-translate-x-1/2 z-10"></div>
//         <div class="w-full md:w-5/12 md:pl-16 order-2 mt-8 md:mt-0">
//           <div class="bg-surface-container-low p-8 md:p-12 hover:bg-surface-container transition-colors duration-500">
//             <div class="flex items-center gap-4 mb-4">
//               <span class="bg-white/10 text-primary font-label text-[10px] tracking-[0.2em] uppercase px-3 py-1">Current</span>
//               <span class="text-outline text-xs font-label tracking-widest">2022 — PRES.</span>
//             </div>
//             <h3 class="font-headline text-2xl md:text-3xl font-bold text-white mb-2 leading-tight">Head of BIM &amp; Digitalization</h3>
//             <p class="font-label text-sm text-primary mb-8 tracking-widest opacity-60">LEADING ENGINEERING FIRM</p>
//             <ul class="space-y-4 mb-10">
//               <li class="flex gap-4 items-start">
//                 <span class="material-symbols-outlined text-sm mt-1" data-icon="terminal">terminal</span>
//                 <span class="text-on-surface-variant text-sm leading-relaxed">Defining and implementing the corporate BIM strategy across large-scale infrastructure projects.</span>
//               </li>
//               <li class="flex gap-4 items-start">
//                 <span class="material-symbols-outlined text-sm mt-1" data-icon="groups">groups</span>
//                 <span class="text-on-surface-variant text-sm leading-relaxed">Leading cross-functional digital teams to streamline engineering workflows and automation.</span>
//               </li>
//             </ul>
//             <div class="border-t border-outline-variant/20 pt-6">
//               <div class="flex justify-between items-end">
//                 <span class="font-label text-[10px] tracking-[0.2em] uppercase text-outline">Dauer</span>
//                 <span class="font-headline text-3xl font-light text-white">2+ Years</span>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//       <!-- Station 2: BIM Coordinator -->
//       <div class="relative flex flex-col md:flex-row items-start md:items-center justify-between mb-40 w-full group">
//         <div class="w-full md:w-5/12 md:pr-16 order-2 md:order-1 mt-8 md:mt-0">
//           <div class="bg-surface-container-low p-8 md:p-12 hover:bg-surface-container transition-colors duration-500 text-left md:text-right">
//             <div class="flex items-center justify-start md:justify-end gap-4 mb-4">
//               <span class="text-outline text-xs font-label tracking-widest">2019 — 2022</span>
//             </div>
//             <h3 class="font-headline text-2xl md:text-3xl font-bold text-white mb-2 leading-tight">BIM Coordinator / Project Manager</h3>
//             <p class="font-label text-sm text-primary mb-8 tracking-widest opacity-60">STRATEGIC INFRASTRUCTURE UNIT</p>
//             <ul class="space-y-4 mb-10 text-left md:text-right">
//               <li class="flex md:flex-row-reverse gap-4 items-start">
//                 <span class="material-symbols-outlined text-sm mt-1" data-icon="layers">layers</span>
//                 <span class="text-on-surface-variant text-sm leading-relaxed">Coordination of multi-disciplinary 3D models and clash detection management for complex MEP systems.</span>
//               </li>
//               <li class="flex md:flex-row-reverse gap-4 items-start">
//                 <span class="material-symbols-outlined text-sm mt-1" data-icon="account_tree">account_tree</span>
//                 <span class="text-on-surface-variant text-sm leading-relaxed">Direct project management oversight for digital delivery phases, ensuring compliance with ISO 19650 standards.</span>
//               </li>
//             </ul>
//             <div class="border-t border-outline-variant/20 pt-6">
//               <div class="flex justify-between md:flex-row-reverse items-end">
//                 <span class="font-label text-[10px] tracking-[0.2em] uppercase text-outline">Dauer</span>
//                 <span class="font-headline text-3xl font-light text-white">3 Years</span>
//               </div>
//             </div>
//           </div>
//         </div>
//         <!-- Timeline Marker -->
//         <div class="absolute left-[-4px] md:left-1/2 top-0 md:top-auto w-2 h-2 bg-outline-variant transform md:-translate-x-1/2 z-10 group-hover:bg-primary transition-colors duration-300"></div>
//         <div class="hidden md:block w-5/12 text-left pl-16 order-2">
//           <span class="font-headline text-primary opacity-10 text-8xl font-black">02</span>
//         </div>
//       </div>
//       <!-- Station 3: MEP Engineer -->
//       <div class="relative flex flex-col md:flex-row items-start md:items-center justify-between mb-40 w-full group">
//         <div class="hidden md:block w-5/12 text-right pr-16 order-1">
//           <span class="font-headline text-primary opacity-5 text-8xl font-black">03</span>
//         </div>
//         <!-- Timeline Marker -->
//         <div class="absolute left-[-4px] md:left-1/2 top-0 md:top-auto w-2 h-2 bg-outline-variant transform md:-translate-x-1/2 z-10 group-hover:bg-primary transition-colors duration-300"></div>
//         <div class="w-full md:w-5/12 md:pl-16 order-2 mt-8 md:mt-0">
//           <div class="bg-surface-container-low p-8 md:p-12 hover:bg-surface-container transition-colors duration-500">
//             <div class="flex items-center gap-4 mb-4">
//               <span class="text-outline text-xs font-label tracking-widest">2016 — 2019</span>
//             </div>
//             <h3 class="font-headline text-2xl md:text-3xl font-bold text-white mb-2 leading-tight">MEP Engineer / Planner</h3>
//             <p class="font-label text-sm text-primary mb-8 tracking-widest opacity-60">TECHNICAL DESIGN SERVICES</p>
//             <ul class="space-y-4 mb-10">
//               <li class="flex gap-4 items-start">
//                 <span class="material-symbols-outlined text-sm mt-1" data-icon="architecture">architecture</span>
//                 <span class="text-on-surface-variant text-sm leading-relaxed">Detailed planning of mechanical, electrical, and plumbing systems for commercial developments.</span>
//               </li>
//               <li class="flex gap-4 items-start">
//                 <span class="material-symbols-outlined text-sm mt-1" data-icon="straighten">straighten</span>
//                 <span class="text-on-surface-variant text-sm leading-relaxed">Calculation and sizing of technical building equipment in accordance with regional regulations.</span>
//               </li>
//             </ul>
//             <div class="border-t border-outline-variant/20 pt-6">
//               <div class="flex justify-between items-end">
//                 <span class="font-label text-[10px] tracking-[0.2em] uppercase text-outline">Dauer</span>
//                 <span class="font-headline text-3xl font-light text-white">3 Years</span>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//       <!-- Station 4: Technical Drawer -->
//       <div class="relative flex flex-col md:flex-row items-start md:items-center justify-between w-full group">
//         <div class="w-full md:w-5/12 md:pr-16 order-2 md:order-1 mt-8 md:mt-0">
//           <div class="bg-surface-container-low p-8 md:p-12 hover:bg-surface-container transition-colors duration-500 text-left md:text-right">
//             <div class="flex items-center justify-start md:justify-end gap-4 mb-4">
//               <span class="text-outline text-xs font-label tracking-widest">2014 — 2016</span>
//             </div>
//             <h3 class="font-headline text-2xl md:text-3xl font-bold text-white mb-2 leading-tight">Technical Drawer</h3>
//             <p class="font-label text-sm text-primary mb-8 tracking-widest opacity-60">ENGINEERING STUDIO</p>
//             <ul class="space-y-4 mb-10 text-left md:text-right">
//               <li class="flex md:flex-row-reverse gap-4 items-start">
//                 <span class="material-symbols-outlined text-sm mt-1" data-icon="draw">draw</span>
//                 <span class="text-on-surface-variant text-sm leading-relaxed">Creating technical drawings and schematics for structural and technical building systems.</span>
//               </li>
//               <li class="flex md:flex-row-reverse gap-4 items-start">
//                 <span class="material-symbols-outlined text-sm mt-1" data-icon="description">description</span>
//                 <span class="text-on-surface-variant text-sm leading-relaxed">Assisting in document management and technical specification archiving.</span>
//               </li>
//             </ul>
//             <div class="border-t border-outline-variant/20 pt-6">
//               <div class="flex justify-between md:flex-row-reverse items-end">
//                 <span class="font-label text-[10px] tracking-[0.2em] uppercase text-outline">Dauer</span>
//                 <span class="font-headline text-3xl font-light text-white">2 Years</span>
//               </div>
//             </div>
//           </div>
//         </div>
//         <!-- Timeline Marker -->
//         <div class="absolute left-[-4px] md:left-1/2 top-0 md:top-auto w-2 h-2 bg-outline-variant transform md:-translate-x-1/2 z-10 group-hover:bg-primary transition-colors duration-300"></div>
//         <div class="hidden md:block w-5/12 text-left pl-16 order-2">
//           <span class="font-headline text-primary opacity-[0.02] text-8xl font-black">04</span>
//         </div>
//       </div>
//     </section>
//     <!-- CTA Section -->
//     <section class="mt-48 text-center bg-surface-container p-16">
//       <h2 class="font-headline text-4xl md:text-5xl font-extrabold text-white mb-8 tracking-tight">INTERESTED IN COLLABORATION?</h2>
//       <p class="font-body text-on-surface-variant mb-12 max-w-xl mx-auto opacity-70">Download my full curriculum vitae for a detailed breakdown of my technical proficiencies and project history.</p>
//       <div class="flex flex-col md:flex-row gap-6 justify-center">
//         <button class="bg-primary text-on-primary px-10 py-4 font-manrope font-bold text-xs uppercase tracking-[0.2em]">Download CV</button>
//         <button class="border border-outline-variant/30 text-white px-10 py-4 font-manrope font-bold text-xs uppercase tracking-[0.2em] hover:bg-white/5 transition-colors">Portfolio PDF</button>
//       </div>
//     </section>
//   </main>
//   <!-- Footer -->
//   <footer class="w-full py-16 px-8 md:px-16 bg-[#0e0e0e] border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 w-full">
//     <div class="font-inter text-[10px] tracking-[0.2em] uppercase opacity-60 text-white">© 2024 MICHAEL REPOLUSK. ALL RIGHTS RESERVED.</div>
//     <div class="flex gap-12">
//       <a class="font-inter text-[10px] tracking-[0.2em] uppercase opacity-40 text-[#d4d4d4] hover:opacity-100 hover:text-white transition-opacity duration-300" href="#">LinkedIn</a>
//       <a class="font-inter text-[10px] tracking-[0.2em] uppercase opacity-40 text-[#d4d4d4] hover:opacity-100 hover:text-white transition-opacity duration-300" href="#">GitHub</a>
//       <a class="font-inter text-[10px] tracking-[0.2em] uppercase opacity-40 text-[#d4d4d4] hover:opacity-100 hover:text-white transition-opacity duration-300" href="#">Email</a>
//       <a class="font-inter text-[10px] tracking-[0.2em] uppercase opacity-40 text-[#d4d4d4] hover:opacity-100 hover:text-white transition-opacity duration-300" href="#">Privacy</a>
//     </div>
//   </footer>
//   </>
//   )
// }