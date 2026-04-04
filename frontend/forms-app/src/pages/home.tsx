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

      <footer className="mt-8 bg-black">
        <div
          className="page-frame flex items-start justify-between gap-2 px-3 py-4 text-white sm:gap-4 sm:px-5 sm:py-6 md:gap-8 md:px-8 md:py-8"
          style={{ fontFamily: "Lora, serif" }}
        >
          <div className="flex-shrink-0 text-left">
            <h3 className="mb-1 text-xs font-semibold leading-tight sm:mb-2 sm:text-sm md:mb-3 md:text-lg" style={{ fontFamily: "Lora, serif" }}>Contact support</h3>
            <div className="flex flex-col gap-1 text-xs leading-snug sm:gap-1.5 sm:text-xs md:gap-2 md:text-sm">
              <div className="flex items-center gap-1 sm:gap-2 md:gap-3">
                <span className="whitespace-nowrap">Mrs Shobana M</span>
                <span className="whitespace-nowrap">
                  <a href="tel:8248544370" className="hover:text-gray-300 font-medium">8248544370</a>
                </span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 md:gap-3">
                <span className="whitespace-nowrap">Mr Anand</span>
                <span className="whitespace-nowrap">
                  <a href="tel:9698411408" className="hover:text-gray-300 font-medium">9698411408</a>
                </span>
              </div>
            </div>
          </div>

          <div className="flex-shrink-0 text-left text-xs leading-snug sm:text-xs md:text-sm">
            <p className="mb-1 font-semibold sm:mb-1 md:mb-2">Developed &amp; Maintained By</p>
            <p className="mb-0.5 md:mb-1">Aptimark Solutions</p>
            <a
              href="mailto:aptimarksolution@gmail.com"
              className="inline-block hover:text-gray-300 break-words"
            >
              aptimarksolution@gmail.com
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
