import { Lock } from "lucide-react";

import { Button } from "@/components/ui/button";

type SiteClosedNoticeProps = {
  onAdmin: () => void;
  title?: string;
  description?: string;
};

export default function SiteClosedNotice({
  onAdmin,
  title = "Sorry, we are no longer accepting the responses.",
  description = "The submission portal is currently closed. Only the admin panel is available right now.",
}: SiteClosedNoticeProps) {
  return (
    <section className="surface-panel w-full px-6 py-8 text-center sm:px-8 sm:py-10">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-[0_12px_32px_rgba(15,23,42,0.22)]">
        <Lock className="h-6 w-6" />
      </div>
      <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
        Responses closed
      </p>
      <h1 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-3xl">
        {title}
      </h1>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600">
        {description}
      </p>
      <div className="mt-8 flex justify-center">
        <Button
          type="button"
          onClick={onAdmin}
          className="h-11 rounded-full bg-slate-950 px-5 text-xs font-semibold uppercase tracking-[0.14em] text-white hover:bg-slate-800"
        >
          Open admin panel
        </Button>
      </div>
    </section>
  );
}