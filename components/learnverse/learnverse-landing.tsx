"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, BrainCircuit, Compass, Github, Sparkles, Target, Trophy, Zap } from "lucide-react";
import { useState } from "react";

const worlds = [
  { name: "Web Development", short: "WEB", x: "-23%", y: "-8%" },
  { name: "AI & Machine Learning", short: "AI", x: "18%", y: "-18%" },
  { name: "Data & Analytics", short: "DATA", x: "-8%", y: "26%" },
  { name: "Cloud & DevOps", short: "CLOUD", x: "31%", y: "27%" },
];

export function LearnVerseLanding() {
  const [focus, setFocus] = useState("AI & Machine Learning");
  return (
    <main className="min-h-screen overflow-hidden bg-[#05060b] text-white">
      <style jsx global>{`
        .lv-space { background: radial-gradient(circle at 50% 20%, rgba(93,76,255,.22), transparent 34%), radial-gradient(circle at 80% 70%, rgba(0,220,255,.12), transparent 28%), #05060b; }
        .lv-grid { background-image: linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px); background-size: 56px 56px; mask-image: linear-gradient(to bottom, black, transparent 88%); }
        .lv-scene { perspective: 1100px; }
        .lv-world { transform-style: preserve-3d; animation: lv-float 9s ease-in-out infinite; }
        .lv-world:hover { animation-play-state: paused; }
        .lv-orbit { transform-style: preserve-3d; border: 1px solid rgba(255,255,255,.13); box-shadow: 0 0 70px rgba(99,102,241,.13); }
        .lv-planet { transform: translateZ(60px); box-shadow: inset -24px -18px 38px rgba(0,0,0,.42), 0 0 50px rgba(103,232,249,.22); }
        .lv-card { backdrop-filter: blur(18px); background: rgba(12,14,24,.62); border: 1px solid rgba(255,255,255,.09); }
        @keyframes lv-float { 0%,100% { transform: rotateX(4deg) rotateY(-7deg) translateY(0); } 50% { transform: rotateX(-2deg) rotateY(7deg) translateY(-12px); } }
        @keyframes lv-pulse { 0%,100% { opacity:.35; transform:scale(.98); } 50% { opacity:.8; transform:scale(1.02); } }
        .lv-pulse { animation: lv-pulse 4s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .lv-world,.lv-pulse { animation:none !important; } }
      `}</style>

      <section className="lv-space relative min-h-screen">
        <div className="lv-grid pointer-events-none absolute inset-0" />
        <div className="pointer-events-none absolute inset-0 opacity-70" style={{ backgroundImage: "radial-gradient(circle at 12% 18%, white 0 1px, transparent 1.5px), radial-gradient(circle at 72% 28%, white 0 1px, transparent 1.5px), radial-gradient(circle at 44% 74%, white 0 1px, transparent 1.5px), radial-gradient(circle at 88% 82%, white 0 1px, transparent 1.5px)", backgroundSize: "220px 190px, 310px 240px, 280px 260px, 370px 280px" }} />

        <nav className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
          <Link href="/" className="flex items-center gap-3" aria-label="LearnVerse home">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/15 bg-white/5 shadow-2xl shadow-indigo-500/20"><Sparkles className="h-5 w-5 text-cyan-300" /></span>
            <span className="text-lg font-semibold tracking-tight">LearnVerse<span className="text-cyan-300"> AI</span></span>
          </Link>
          <div className="hidden items-center gap-8 text-sm text-white/60 md:flex"><a href="#universe" className="hover:text-white">Universe</a><a href="#intelligence" className="hover:text-white">Learning Engine</a><a href="#ecosystem" className="hover:text-white">Ecosystem</a></div>
          <div className="flex items-center gap-3"><Link href="/login" className="hidden rounded-full px-4 py-2 text-sm text-white/70 hover:text-white sm:block">Log in</Link><Link href="/register" className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm font-medium text-cyan-100 hover:bg-cyan-300/15">Enter LearnVerse</Link></div>
        </nav>

        <div className="relative z-10 mx-auto grid min-h-[calc(100vh-88px)] max-w-7xl items-center gap-14 px-6 pb-16 pt-6 lg:grid-cols-[.9fr_1.1fr] lg:px-10">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-300/20 bg-indigo-300/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[.18em] text-indigo-100"><span className="h-1.5 w-1.5 rounded-full bg-cyan-300" /> Your personal learning universe</div>
            <h1 className="max-w-3xl text-5xl font-semibold leading-[.98] tracking-[-.055em] sm:text-6xl lg:text-7xl">Learn anything.<br /><span className="bg-gradient-to-r from-cyan-200 via-indigo-200 to-fuchsia-200 bg-clip-text text-transparent">From anywhere.</span></h1>
            <p className="mt-7 max-w-xl text-base leading-8 text-white/58 sm:text-lg">LearnVerse turns courses, articles, videos, documents, code and projects into one adaptive journey that understands what you know, what you&apos;re missing, and what you should do next.</p>
            <div className="mt-8 flex flex-wrap gap-3"><Link href="/register" className="group inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-cyan-100">Start your journey <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></Link><a href="#universe" className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-5 py-3 text-sm text-white/80 hover:bg-white/8">Explore the universe</a></div>
            <div className="mt-9 grid max-w-xl grid-cols-3 gap-3">
              {[[BrainCircuit, "Skill DNA", "Know what you know"],[Compass, "Next Best Action", "Know what to do next"],[Target, "Evidence", "Prove your mastery"]].map(([Icon, title, text]) => { const I = Icon as typeof BrainCircuit; return <div key={title as string} className="lv-card rounded-2xl p-4"><I className="h-4 w-4 text-cyan-300" /><p className="mt-3 text-xs font-semibold">{title as string}</p><p className="mt-1 text-[10px] leading-4 text-white/45">{text as string}</p></div>; })}
            </div>
          </div>

          <div id="universe" className="lv-scene relative mx-auto h-[540px] w-full max-w-[650px]">
            <div className="lv-world absolute inset-0">
              <div className="lv-orbit absolute left-1/2 top-1/2 h-[390px] w-[390px] -translate-x-1/2 -translate-y-1/2 rotate-[18deg] rounded-full sm:h-[470px] sm:w-[470px]" />
              <div className="lv-orbit absolute left-1/2 top-1/2 h-[280px] w-[520px] -translate-x-1/2 -translate-y-1/2 rotate-[-24deg] rounded-[50%]" />
              <div className="lv-planet lv-pulse absolute left-1/2 top-1/2 flex h-44 w-44 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[radial-gradient(circle_at_32%_25%,#b8ffff,#5266ff_45%,#14152e_78%)]"><div className="text-center"><p className="text-[10px] uppercase tracking-[.3em] text-white/60">You</p><p className="mt-2 text-2xl font-semibold">Learning Core</p><p className="mt-2 text-[10px] text-white/55">Skill DNA · 72%</p></div></div>
              {worlds.map((world) => <button key={world.name} onClick={() => setFocus(world.name)} className={`lv-card absolute w-40 rounded-2xl p-4 text-left transition hover:scale-105 ${focus === world.name ? "ring-1 ring-cyan-300/50" : ""}`} style={{ left: `calc(50% + ${world.x})`, top: `calc(50% + ${world.y})`, transform: "translate(-50%, -50%) translateZ(100px)" }}><span className="text-[9px] font-bold tracking-[.22em] text-cyan-300">{world.short}</span><p className="mt-2 text-xs font-semibold">{world.name}</p><p className="mt-1 text-[9px] text-white/40">Explore skills →</p></button>)}
              <div className="absolute left-[8%] top-[70%] rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[9px] text-white/50">Mission · Build a real project</div>
              <div className="absolute right-[4%] top-[16%] rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[9px] text-white/50">AI Mentor online</div>
            </div>
          </div>
        </div>
      </section>

      <section id="intelligence" className="border-t border-white/8 bg-[#070812] px-6 py-24 lg:px-10"><div className="mx-auto max-w-7xl"><div className="max-w-2xl"><p className="text-[10px] font-semibold uppercase tracking-[.2em] text-cyan-300">The intelligence layer</p><h2 className="mt-4 text-4xl font-semibold tracking-[-.045em] sm:text-5xl">Not an AI chatbot. A learning system.</h2><p className="mt-5 text-base leading-7 text-white/50">Every interaction creates evidence. LearnVerse uses that evidence to update your Skill DNA, diagnose prerequisite gaps, repair weaknesses and select one useful next action.</p></div><div className="mt-12 grid gap-4 md:grid-cols-4">{[[BookOpen,"Learn","Turn any source into a structured learning journey."],[BrainCircuit,"Adapt","Adjust difficulty, language, modality and pace."],[Zap,"Practice","Convert understanding into exercises, challenges and missions."],[Trophy,"Master","Build evidence through assessment and real projects."]].map(([Icon,title,text])=>{const I=Icon as typeof BookOpen;return <article key={title as string} className="lv-card rounded-3xl p-6"><I className="h-5 w-5 text-cyan-300"/><h3 className="mt-8 text-lg font-semibold">{title as string}</h3><p className="mt-2 text-sm leading-6 text-white/45">{text as string}</p></article>})}</div></div></section>

      <section id="ecosystem" className="bg-[#05060b] px-6 py-24 lg:px-10"><div className="mx-auto max-w-7xl"><div className="grid gap-12 lg:grid-cols-2 lg:items-center"><div><p className="text-[10px] font-semibold uppercase tracking-[.2em] text-fuchsia-300">One ecosystem</p><h2 className="mt-4 text-4xl font-semibold tracking-[-.045em] sm:text-5xl">EDUNEXUS becomes the ecosystem. LearnVerse becomes the brain.</h2><p className="mt-5 max-w-xl text-base leading-7 text-white/50">The existing student, teacher, resource, document, coding, multilingual and adaptive-learning capabilities are being unified behind one product identity.</p><div className="mt-7 flex flex-wrap gap-2">{["AI Teacher","Study Assistant","Code Lab","Project Mentor","Resource Intelligence","Assessments","Tamil + English + Tanglish","Skill Graph"].map(item=><span key={item} className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/65">{item}</span>)}</div></div><div className="grid grid-cols-2 gap-3">{[["LEARN","Sources → lessons → practice"],["BUILD","Projects → code → evidence"],["TEST","Assess → diagnose → repair"],["EXPLORE","Skills → worlds → next action"]].map(([title,text],i)=><button key={title} onClick={()=>setFocus(title)} className="lv-card rounded-3xl p-6 text-left hover:border-cyan-300/25"><span className="text-[9px] tracking-[.25em] text-cyan-300">0{i+1}</span><p className="mt-7 text-lg font-semibold">{title}</p><p className="mt-2 text-xs leading-5 text-white/40">{text}</p></button>)}</div></div></div></section>

      <footer className="border-t border-white/8 bg-[#04050a] px-6 py-10"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-5"><div><p className="font-semibold">LearnVerse AI</p><p className="mt-1 text-xs text-white/35">A public learning universe powered by adaptive intelligence.</p></div><div className="flex items-center gap-4 text-xs text-white/40"><span>Built from EDUNEXUS + AIESES</span><Github className="h-4 w-4" /></div></div></footer>
    </main>
  );
}
