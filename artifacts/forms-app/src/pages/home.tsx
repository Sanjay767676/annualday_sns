import { useLocation } from "wouter";
import { GraduationCap, BookOpen, ArrowRight, ShieldCheck, Award, MapPin, Sparkles } from "lucide-react";

export default function Home() {
  const [, setLocation] = useLocation();

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "linear-gradient(160deg, #050d1a 0%, #0c1f3d 45%, #0f1535 100%)" }}
    >
      {/* Gold top bar */}
      <div className="h-1 w-full flex-shrink-0" style={{ background: "linear-gradient(90deg, #b45309, #f59e0b, #fbbf24, #f59e0b, #b45309)" }} />

      {/* Header */}
      <header className="px-5 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-xs tracking-tight shadow-lg"
            style={{ background: "linear-gradient(135deg, #1d4ed8, #3b82f6)" }}
          >
            SNS
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">SNS College of Technology</p>
            <p className="text-white/35 text-xs">Coimbatore – 641 107</p>
          </div>
        </div>
        <button
          onClick={() => setLocation("/admin/login")}
          className="flex items-center gap-1.5 text-xs font-medium text-white/45 hover:text-white/75 transition-colors px-3 py-1.5 rounded-full border border-white/10 hover:border-white/20"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Admin
        </button>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-5 py-8 text-center">

        {/* Annual day badge */}
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-7 text-xs font-bold uppercase tracking-widest"
          style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)", color: "#fbbf24" }}
        >
          <Sparkles className="w-3 h-3" />
          Annual Day 2026
          <Sparkles className="w-3 h-3" />
        </div>

        {/* Main title */}
        <h1 className="text-white font-black leading-tight mb-2" style={{ fontSize: "clamp(2rem, 6vw, 3.75rem)" }}>
          Data Collection
        </h1>
        <h2
          className="font-black leading-tight mb-4"
          style={{
            fontSize: "clamp(1.75rem, 5vw, 3.25rem)",
            background: "linear-gradient(90deg, #f59e0b, #fbbf24, #f59e0b)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Portal
        </h2>

        <p className="text-white/35 text-sm mb-10">
          Academic Year &nbsp;·&nbsp; May 2025 – March 2026
        </p>

        {/* Cards */}
        <div className="grid sm:grid-cols-2 gap-4 w-full max-w-md">

          {/* Student */}
          <button
            onClick={() => setLocation("/student")}
            className="group relative overflow-hidden rounded-2xl p-6 text-left transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60"
            style={{ background: "linear-gradient(140deg, #1e40af 0%, #4338ca 55%, #7c3aed 100%)" }}
          >
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full" style={{ background: "radial-gradient(circle, rgba(255,255,255,0.12), transparent)" }} />
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-white/15">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-white font-extrabold text-xl mb-1.5">Student</h3>
            <p className="text-white/60 text-xs mb-5 leading-relaxed">
              First rank holders, semester rankers & remarkable achievements
            </p>
            <span className="inline-flex items-center gap-1.5 text-white/75 text-xs font-semibold group-hover:gap-2.5 transition-all">
              Fill form <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </button>

          {/* Faculty */}
          <button
            onClick={() => setLocation("/faculty")}
            className="group relative overflow-hidden rounded-2xl p-6 text-left transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60"
            style={{ background: "linear-gradient(140deg, #065f46 0%, #0d9488 50%, #0891b2 100%)" }}
          >
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full" style={{ background: "radial-gradient(circle, rgba(255,255,255,0.12), transparent)" }} />
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-white/15">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-white font-extrabold text-xl mb-1.5">Faculty</h3>
            <p className="text-white/60 text-xs mb-5 leading-relaxed">
              Papers published, books, patents granted & PhD awardees
            </p>
            <span className="inline-flex items-center gap-1.5 text-white/75 text-xs font-semibold group-hover:gap-2.5 transition-all">
              Fill form <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </button>

        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 px-5 border-t border-white/5 flex-shrink-0">
        <p className="flex items-center justify-center gap-1.5 text-white/25 text-xs text-center">
          <MapPin className="w-3 h-3 flex-shrink-0" />
          SNS College of Technology, Coimbatore – 641 107 &nbsp;·&nbsp; Annual Day 2026
        </p>
      </footer>
    </div>
  );
}
