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

      <footer className="border-t border-stone-200/80 bg-white/50 backdrop-blur-sm mt-8">
        <div className="page-frame py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Contact Support</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-slate-600">Mrs Shobana M</span>
                  <a href="tel:8248544370" className="text-xs text-blue-600 hover:text-blue-700 font-medium">8248544370</a>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-slate-600">Mr Anand</span>
                  <a href="tel:9698411408" className="text-xs text-blue-600 hover:text-blue-700 font-medium">9698411408</a>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Information</h3>
              <p className="text-xs text-slate-600">SNS College of Technology</p>
              <p className="text-xs text-slate-600 mt-2">Annual Day Prize Distribution Committee</p>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-stone-100">
            <p className="text-xs text-slate-500 text-center">© 2024-2026 SNS College of Technology. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
