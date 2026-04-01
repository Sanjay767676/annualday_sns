import { ArrowLeft, ShieldCheck } from "lucide-react";

type SiteHeaderProps = {
  onBack?: () => void;
  onAdmin?: () => void;
  sticky?: boolean;
};

export default function SiteHeader({ onBack, onAdmin, sticky = false }: SiteHeaderProps) {
  return (
    <header
      className={`${sticky ? "sticky top-0 z-20" : ""} border-b border-stone-200/80 bg-background/85 backdrop-blur-xl`}
    >
      <div className="page-frame flex flex-wrap items-center justify-between gap-3 py-3 sm:py-4">
        <div className="flex min-w-0 items-center gap-3">
          {onBack ? (
            <button
              onClick={onBack}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-white/85 text-slate-600 transition hover:border-stone-300 hover:text-slate-900"
              aria-label="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          ) : null}
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-stone-200 bg-white shadow-sm">
              <img
                src="/images/logo2.png"
                alt="SNS College of Technology"
                className="h-8 w-8 object-contain"
              />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[0.68rem] sm:text-[0.72rem] font-medium uppercase tracking-[0.18em] sm:tracking-[0.24em] text-slate-400">
                Annual Day 2026
              </p>
              <p className="truncate text-sm font-semibold text-slate-900">
                SNS College of Technology
              </p>
            </div>
          </div>
        </div>

        {onAdmin ? (
          <button
            onClick={onAdmin}
            className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 text-xs font-semibold tracking-[0.18em] text-slate-700 uppercase transition hover:border-stone-300 hover:bg-stone-50"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Admin
          </button>
        ) : null}
      </div>
    </header>
  );
}
