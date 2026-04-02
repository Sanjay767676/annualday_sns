import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, RotateCcw, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

type TabType = "faculty" | "student";
type FacultyType = "paper" | "book" | "patent" | "phd";
type StudentType = "firstRank" | "semesterWise" | "reputedInstitution";

type PaginatedResponse = {
  data: Record<string, unknown>[];
  total: number;
  page: number;
  limit: number;
};

const PAGE_SIZE = 100;
const FACULTY_FILTERS = [
  { key: "paper", label: "Papers Published" },
  { key: "book", label: "Book / Chapter" },
  { key: "patent", label: "Patent Granted" },
  { key: "phd", label: "PhD Awardees" },
] as const;

const STUDENT_FILTERS = [
  { key: "firstRank", label: "First Rank Holder" },
  { key: "semesterWise", label: "Semester Wise Rank" },
  { key: "reputedInstitution", label: "Remarkable Achievements" },
] as const;

const HIDDEN = new Set(["_submissionId", "_submittedAt", "_deletedAt", "_rowIndex", "row_index"]);

function humanize(key: string): string {
  return key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()).trim();
}

function isUrlLike(value: string): boolean {
  return /^(https?:\/\/|www\.)\S+/i.test(value.trim());
}

function fetchDeleted(
  tab: TabType,
  type: string,
  search: string,
  page: number,
  token: string,
): Promise<PaginatedResponse> {
  const url = new URL(`/api/admin/${tab}/deleted`, window.location.origin);
  url.searchParams.set("type", type);
  url.searchParams.set("page", String(page));
  url.searchParams.set("limit", String(PAGE_SIZE));
  if (search) url.searchParams.set("search", search);

  return fetch(url.toString(), { headers: { "x-admin-token": token } }).then(async (res) => {
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || "Fetch failed");
    }
    return res.json();
  });
}

async function restoreSubmission(tab: TabType, submissionId: string, token: string) {
  const res = await fetch(`/api/admin/${tab}/${submissionId}/restore`, {
    method: "POST",
    headers: { "x-admin-token": token },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Restore failed");
  }
}

function DeletedPanel({ tab, token }: { tab: TabType; token: string }) {
  const [activeType, setActiveType] = useState<string>(tab === "faculty" ? "paper" : "firstRank");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const filters = tab === "faculty" ? FACULTY_FILTERS : STUDENT_FILTERS;

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["deleted", tab, activeType, search, page],
    queryFn: () => fetchDeleted(tab, activeType, search, page, token),
    staleTime: 10_000,
  });

  const rows = data?.data ?? [];
  const columns = useMemo(() => {
    if (!rows.length) return [];
    const keys = new Set<string>();
    rows.forEach((row) => {
      Object.keys(row).forEach((k) => {
        if (!HIDDEN.has(k)) keys.add(k);
      });
    });
    return [...keys];
  }, [rows]);

  const restore = async (submissionId: string) => {
    try {
      setRestoringId(submissionId);
      await restoreSubmission(tab, submissionId, token);
      await queryClient.invalidateQueries({ queryKey: ["deleted"] });
      await queryClient.invalidateQueries({ queryKey: [tab] });
      await queryClient.invalidateQueries({ queryKey: ["getAdminStats"] });
      toast({ title: "Restored", description: "Submission moved back to dashboard." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Restore failed";
      toast({ title: "Restore failed", description: message, variant: "destructive" });
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <Card className="overflow-hidden border-stone-200/80 bg-white/92 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
      <div className="flex flex-col gap-3 border-b border-stone-200/80 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => {
                setActiveType(f.key);
                setPage(1);
              }}
              className={`rounded-full border px-3.5 py-2 text-xs font-semibold tracking-[0.14em] uppercase transition ${
                activeType === f.key
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-stone-200 bg-white text-slate-600 hover:border-stone-300 hover:bg-stone-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search deleted..."
            className="h-10 rounded-full border-stone-300 bg-white px-4 text-sm"
          />
          {isFetching && !isLoading && <RefreshCw className="h-4 w-4 animate-spin text-slate-400" />}
        </div>
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-sm text-slate-500">Loading deleted submissions...</div>
      ) : !rows.length ? (
        <div className="py-16 text-center text-sm text-slate-500">No deleted submissions found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/80">
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">#</th>
                {columns.map((col) => (
                  <th key={col} className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {humanize(col)}
                  </th>
                ))}
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Deleted At</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => {
                const submissionId = String(row._submissionId || "");
                return (
                  <tr key={`${submissionId}-${idx}`} className="border-b border-stone-100">
                    <td className="px-4 py-3 text-xs text-slate-500">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                    {columns.map((col) => {
                      const raw = row[col];
                      const text = raw === undefined || raw === null || raw === "" ? "—" : String(raw);
                      if (isUrlLike(text)) {
                        const href = text.startsWith("www.") ? `https://${text}` : text;
                        return (
                          <td key={col} className="max-w-xs px-4 py-3 align-top text-slate-700">
                            <a href={href} target="_blank" rel="noreferrer" className="break-all text-blue-600 underline">
                              {text}
                            </a>
                          </td>
                        );
                      }
                      return (
                        <td key={col} className="max-w-xs px-4 py-3 align-top text-slate-700">
                          <span className="line-clamp-3">{text}</span>
                        </td>
                      );
                    })}
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                      {row._deletedAt ? new Date(String(row._deletedAt)).toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => restore(submissionId)}
                        disabled={!submissionId || restoringId === submissionId}
                        className="h-8 rounded-full border-emerald-200 bg-white px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-700 hover:bg-emerald-50"
                      >
                        <RotateCcw className="mr-1 h-3.5 w-3.5" />
                        {restoringId === submissionId ? "Restoring" : "Restore"}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between border-t border-stone-200 px-4 py-3 bg-stone-50/60">
        <span className="text-xs text-slate-500">
          {data?.total ? `${Math.min((page - 1) * PAGE_SIZE + 1, data.total)}–${Math.min(page * PAGE_SIZE, data.total)} of ${data.total}` : "No records"}
        </span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="h-8 rounded-full border-stone-300 px-3">
            Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE))}
            onClick={() => setPage((p) => p + 1)}
            className="h-8 rounded-full border-stone-300 px-3"
          >
            Next
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default function AdminDeletedPage() {
  const [, setLocation] = useLocation();
  const [token] = useState(() => localStorage.getItem("admin_token"));

  if (!token) {
    setLocation("/admin/login");
    return null;
  }

  return (
    <div className="app-shell flex flex-col">
      <main className="page-frame flex-1 space-y-6 py-8 lg:py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">Deleted Submissions</h1>
            <p className="mt-1 text-sm text-slate-500">Restore entries from here. Permanently removed after 30 hours.</p>
          </div>
          <Button type="button" variant="outline" onClick={() => setLocation("/admin")} className="h-10 rounded-full border-stone-300 bg-white px-4 text-xs font-semibold uppercase tracking-[0.14em]">
            <ArrowLeft className="mr-1 h-3.5 w-3.5" />
            Back to Dashboard
          </Button>
        </div>

        <Tabs defaultValue="faculty" className="w-full">
          <TabsList className="grid w-full max-w-sm grid-cols-2 rounded-full border border-stone-200 bg-white p-1 shadow-sm">
            <TabsTrigger value="faculty" className="rounded-full text-xs font-semibold uppercase tracking-[0.14em] data-[state=active]:bg-slate-950 data-[state=active]:text-white">
              Faculty
            </TabsTrigger>
            <TabsTrigger value="student" className="rounded-full text-xs font-semibold uppercase tracking-[0.14em] data-[state=active]:bg-slate-950 data-[state=active]:text-white">
              Student
            </TabsTrigger>
          </TabsList>

          <TabsContent value="faculty" className="mt-6">
            <DeletedPanel tab="faculty" token={token} />
          </TabsContent>
          <TabsContent value="student" className="mt-6">
            <DeletedPanel tab="student" token={token} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
