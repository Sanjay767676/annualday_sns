import { useLocation } from "wouter";
import { GraduationCap, BookOpen, ArrowRight } from "lucide-react";
import SiteHeader from "@/components/site-header";

export default function Home() {
  const [, setLocation] = useLocation();

  return (
    <div className="app-shell flex flex-col">
      <SiteHeader onAdmin={() => setLocation("/admin/login")} />

      <main className="page-frame flex flex-1 items-center py-10 lg:py-16">
        <section className="surface-panel w-full px-6 py-8 sm:px-8 sm:py-10">
          <h1 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-3xl">
            Annual Day Prize Distribution Committee 
          </h1>
          <p className="mt-3 text-sm text-slate-700">
            Data Collection Portal 
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <button
              onClick={() => setLocation("/student")}
              className="surface-muted group p-5 text-left transition hover:bg-white"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <GraduationCap className="h-5 w-5 text-indigo-700" />
                  <span className="text-sm font-semibold text-slate-900">Student Form</span>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-500 transition group-hover:translate-x-0.5" />
              </div>
            </button>

            <button
              onClick={() => setLocation("/faculty")}
              className="surface-muted group p-5 text-left transition hover:bg-white"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-emerald-700" />
                  <span className="text-sm font-semibold text-slate-900">Faculty Form</span>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-500 transition group-hover:translate-x-0.5" />
              </div>
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
