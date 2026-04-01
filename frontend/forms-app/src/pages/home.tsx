import { useLocation } from "wouter";
import { GraduationCap, BookOpen, ArrowRight, Sparkles } from "lucide-react";
import SiteHeader from "@/components/site-header";

export default function Home() {
  const [, setLocation] = useLocation();

  return (
    <div className="app-shell flex flex-col">
      <SiteHeader onAdmin={() => setLocation("/admin/login")} />

      <main className="page-frame flex flex-1 items-center py-10 lg:py-16">
        <section className="hero-panel relative w-full overflow-hidden px-6 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-14">
          <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(30,64,175,0.13),transparent_55%),radial-gradient(circle_at_bottom_right,rgba(180,83,9,0.12),transparent_40%)] lg:block" />
          <div className="relative grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div className="max-w-2xl">
              <span className="editorial-eyebrow mb-5">
                <Sparkles className="h-3.5 w-3.5" />
                Annual Day 2026
              </span>
              <h1 className="max-w-xl text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-6xl">
                A calm, refined portal for collecting academic achievements.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
                Gather student and faculty achievements for the May 2025 to March 2026 academic cycle in a format that feels formal, modern, and easy to review.
              </p>
              <div className="mt-8 flex flex-wrap gap-3 text-sm text-slate-600">
                <div className="surface-muted px-4 py-3">Structured submission flow</div>
                <div className="surface-muted px-4 py-3">Separate student and faculty journeys</div>
                <div className="surface-muted px-4 py-3">Admin review and export</div>
              </div>
            </div>

            <div className="grid gap-4">
              <button
                onClick={() => setLocation("/student")}
                className="surface-panel group p-6 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_26px_70px_rgba(15,23,42,0.09)]"
              >
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Student Form
                  </span>
                </div>
                <h2 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                  Submit student achievements
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  First rank holders, semester-wise rankers, and remarkable achievements with a guided form experience.
                </p>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-800">
                  Open student portal
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </span>
              </button>

              <button
                onClick={() => setLocation("/faculty")}
                className="surface-panel group p-6 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_26px_70px_rgba(15,23,42,0.09)]"
              >
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Faculty Form
                  </span>
                </div>
                <h2 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                  Submit faculty achievements
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Record publications, book chapters, patents, and PhD awardees in clean reusable sections.
                </p>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-800">
                  Open faculty portal
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </span>
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
