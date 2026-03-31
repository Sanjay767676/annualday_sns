import { useLocation } from "wouter";
import { GraduationCap, BookOpen, ShieldCheck, ArrowRight } from "lucide-react";

export default function Home() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)" }}>

      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white font-bold text-base tracking-wide">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          Academic Portal
        </div>
        <button
          onClick={() => setLocation('/admin/login')}
          className="flex items-center gap-1.5 text-xs font-medium text-white/60 hover:text-white transition-colors px-3 py-1.5 rounded-full border border-white/10 hover:border-white/30"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Admin
        </button>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-12">
        <div className="text-center mb-14">
          <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-3">May 2025 – March 2026</p>
          <h1 className="text-4xl md:text-5xl font-black text-white leading-tight">
            Department Data
            <br />
            <span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(90deg, #60a5fa, #a78bfa)" }}>
              Collection
            </span>
          </h1>
        </div>

        {/* Cards */}
        <div className="grid sm:grid-cols-2 gap-5 w-full max-w-lg">

          {/* Student Card */}
          <button
            onClick={() => setLocation('/student')}
            className="group relative overflow-hidden rounded-2xl p-6 text-left transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl focus:outline-none"
            style={{ background: "linear-gradient(135deg, #2563eb, #7c3aed)" }}
          >
            <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-20" style={{ background: "radial-gradient(circle, white, transparent)" }} />
            <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center mb-5">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-white font-bold text-xl mb-1">Student</h2>
            <p className="text-white/60 text-sm mb-5">Rank holders & achievements</p>
            <div className="flex items-center gap-1 text-white/80 text-xs font-semibold group-hover:gap-2 transition-all">
              Fill form <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </button>

          {/* Faculty Card */}
          <button
            onClick={() => setLocation('/faculty')}
            className="group relative overflow-hidden rounded-2xl p-6 text-left transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl focus:outline-none"
            style={{ background: "linear-gradient(135deg, #059669, #0891b2)" }}
          >
            <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-20" style={{ background: "radial-gradient(circle, white, transparent)" }} />
            <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center mb-5">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-white font-bold text-xl mb-1">Faculty</h2>
            <p className="text-white/60 text-sm mb-5">Publications, patents & PhD</p>
            <div className="flex items-center gap-1 text-white/80 text-xs font-semibold group-hover:gap-2 transition-all">
              Fill form <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </button>

        </div>
      </main>

      {/* Footer */}
      <footer className="text-center pb-6 text-white/20 text-xs">
        Academic Data Portal &copy; {new Date().getFullYear()}
      </footer>

    </div>
  );
}
