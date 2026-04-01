import { useEffect, useState, useMemo, useCallback } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import * as XLSX from "xlsx";
import {
  LogOut, Users, FileText, Activity,
  Search, Download, ChevronLeft, ChevronRight, RefreshCw,
} from "lucide-react";

import { useGetAdminStats, getGetAdminStatsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

const PAGE_SIZE = 10;
const POLL_INTERVAL = 30_000;

type PaginatedResponse = {
  data: Record<string, unknown>[];
  total: number;
  page: number;
  limit: number;
};

const FACULTY_FILTERS = [
  { key: "paper", label: "Papers Published" },
  { key: "book", label: "Book / Chapter" },
  { key: "patent", label: "Patent Granted" },
  { key: "phd", label: "PhD Awardees" },
] as const;

const STUDENT_FILTERS = [
  { key: "firstRank", label: "First Rank Holder" },
  { key: "semesterWise", label: "Semester Wise Rank" },
  { key: "achievement", label: "Remarkable Achievements" },
] as const;

const HIDDEN_COLS = new Set(["_submissionId", "_submittedAt"]);

function humanize(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

async function fetchData(
  tab: "faculty" | "student",
  type: string,
  search: string,
  page: number,
  token: string,
): Promise<PaginatedResponse> {
  const url = new URL(`/api/admin/${tab}`, window.location.origin);
  url.searchParams.set("type", type);
  url.searchParams.set("page", String(page));
  url.searchParams.set("limit", String(PAGE_SIZE));
  if (search) url.searchParams.set("search", search);

  const res = await fetch(url.toString(), {
    headers: { "x-admin-token": token },
  });
  if (!res.ok) throw new Error("Fetch failed");
  return res.json();
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

function DynamicTable({
  rows,
  isLoading,
}: {
  rows: Record<string, unknown>[];
  isLoading: boolean;
}) {
  const columns = useMemo(() => {
    if (!rows.length) return [];
    return Object.keys(rows[0]).filter((k) => !HIDDEN_COLS.has(k));
  }, [rows]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-slate-400">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
        Loading...
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="py-20 text-center text-sm text-slate-400">
        No records found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-stone-200 bg-stone-50/80">
            <th className="w-8 px-4 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">#</th>
            {columns.map((col) => (
              <th
                key={col}
                className="whitespace-nowrap px-4 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500"
              >
                {humanize(col)}
              </th>
            ))}
            <th className="whitespace-nowrap px-4 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Submitted
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-stone-100 transition-colors hover:bg-stone-50/60">
              <td className="px-4 py-4 text-xs text-slate-400">{i + 1}</td>
              {columns.map((col) => (
                <td key={col} className="max-w-xs px-4 py-4 align-top text-slate-700">
                  <span className="line-clamp-3">{String(row[col] ?? "—")}</span>
                </td>
              ))}
              <td className="whitespace-nowrap px-4 py-4 text-xs text-slate-500">
                <div>{row._submittedAt
                  ? new Date(row._submittedAt as string).toLocaleDateString()
                  : "—"}</div>
                {Boolean(row._submissionId) && (
                  <div className="mt-1 max-w-[120px] truncate font-mono text-[10px] text-slate-400" title={String(row._submissionId)}>
                    {String(row._submissionId).slice(0, 8)}…
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Pagination({
  page,
  total,
  limit,
  onPageChange,
}: {
  page: number;
  total: number;
  limit: number;
  onPageChange: (p: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return (
    <div className="flex items-center justify-between border-t border-stone-200 px-4 py-3 bg-stone-50/60">
      <span className="text-xs text-slate-500">
        {total === 0 ? "No records" : `${Math.min((page - 1) * limit + 1, total)}–${Math.min(page * limit, total)} of ${total}`}
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="h-8 rounded-full border-stone-300 px-3"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </Button>
        <span className="text-xs font-medium text-slate-700 px-1">
          {page} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="h-8 rounded-full border-stone-300 px-3"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

function DataPanel({
  tab,
  filters,
  token,
}: {
  tab: "faculty" | "student";
  filters: readonly { key: string; label: string }[];
  token: string;
}) {
  const [activeType, setActiveType] = useState(filters[0].key);
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(searchInput, 400);

  useEffect(() => { setPage(1); }, [activeType, debouncedSearch]);

  const queryKey = [tab, activeType, debouncedSearch, page];
  const { data, isLoading, isFetching } = useQuery<PaginatedResponse>({
    queryKey,
    queryFn: () => fetchData(tab, activeType, debouncedSearch, page, token),
    refetchInterval: POLL_INTERVAL,
    staleTime: 10_000,
  });

  const rows = data?.data ?? [];
  const visibleColumns = useMemo(() => {
    if (!rows.length) return [];
    return Object.keys(rows[0]).filter((k) => !HIDDEN_COLS.has(k));
  }, [rows]);

  const handleExport = useCallback(() => {
    if (!rows.length) return;
    const activeFilter = filters.find((f) => f.key === activeType);
    const sheetData = rows.map((row) => {
      const out: Record<string, string> = {};
      visibleColumns.forEach((col) => {
        out[humanize(col)] = String(row[col] ?? "");
      });
      out["Submitted"] = row._submittedAt
        ? new Date(row._submittedAt as string).toLocaleDateString()
        : "";
      return out;
    });
    const ws = XLSX.utils.json_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, activeFilter?.label ?? "Data");
    XLSX.writeFile(wb, `${tab}_${activeType}_page${page}.xlsx`);
  }, [rows, visibleColumns, tab, activeType, page, filters]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setActiveType(f.key)}
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

        <div className="flex w-full gap-2 sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="h-10 rounded-full border-stone-300 bg-white pl-9 text-sm shadow-none"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={!rows.length}
            className="h-10 rounded-full border-stone-300 bg-white px-4 text-xs font-semibold tracking-[0.14em] uppercase whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            Export Excel
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden border-stone-200/80 bg-white/92 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
        <div className="flex items-center justify-between border-b border-stone-200/80 bg-white px-4 py-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold tracking-[-0.02em] text-slate-900">
              {filters.find((f) => f.key === activeType)?.label}
            </span>
            {data && (
              <Badge variant="secondary" className="bg-stone-100 text-xs text-slate-600">
                {data.total} records
              </Badge>
            )}
          </div>
          {isFetching && !isLoading && (
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-400" />
          )}
        </div>

        <DynamicTable rows={rows} isLoading={isLoading} />

        <Pagination
          page={page}
          total={data?.total ?? 0}
          limit={PAGE_SIZE}
          onPageChange={setPage}
        />
      </Card>
    </div>
  );
}

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const t = localStorage.getItem("admin_token");
    if (!t) {
      setLocation("/admin/login");
    } else {
      setToken(t);
    }
  }, [setLocation]);

  const { data: stats, isLoading: statsLoading } = useGetAdminStats({
    request: token ? { headers: { "x-admin-token": token } } : undefined,
    query: {
      enabled: !!token,
      queryKey: getGetAdminStatsQueryKey(),
      refetchInterval: token ? POLL_INTERVAL : false,
    },
  });

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    setLocation("/");
  };

  if (!token) return null;

  return (
    <div className="app-shell flex flex-col">
      <header className="sticky top-0 z-20 border-b border-stone-200/80 bg-background/90 backdrop-blur-xl">
        <div className="page-frame flex min-h-18 items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-[10px] font-black text-white shadow-sm">
              SNS
            </div>
            <div>
              <p className="text-[0.72rem] font-medium uppercase tracking-[0.24em] text-slate-400">Admin Dashboard</p>
              <p className="text-sm font-semibold text-slate-900">SNS College of Technology</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="h-10 rounded-full border-stone-300 bg-white px-4 text-xs font-semibold uppercase tracking-[0.14em] text-slate-700"
          >
            <LogOut className="mr-1 h-3.5 w-3.5" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="page-frame flex-1 space-y-8 py-8 lg:py-10">
        <section className="hero-panel px-6 py-7 sm:px-8">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <span className="editorial-eyebrow">Review & Export</span>
              <h1 className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">
                Review submissions in a quiet, structured workspace.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                Search submissions, switch between faculty and student datasets, and export the records you need for reporting and Annual Day preparation.
              </p>
            </div>
            <div className="surface-muted p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                Live Summary
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                The dashboard refreshes automatically so recent activity and submission counts remain current while you review data.
              </p>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-stone-200/80 bg-white/92 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Faculty Submissions</p>
                <h3 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-950">
                  {statsLoading ? "..." : stats?.totalFacultySubmissions ?? 0}
                </h3>
              </div>
            </CardContent>
          </Card>

          <Card className="border-stone-200/80 bg-white/92 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Student Submissions</p>
                <h3 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-950">
                  {statsLoading ? "..." : stats?.totalStudentSubmissions ?? 0}
                </h3>
              </div>
            </CardContent>
          </Card>

          <Card className="border-stone-200/80 bg-white/92 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-700 ring-1 ring-violet-100">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Recent Activity</p>
                <p className="mt-2 text-sm font-medium text-slate-900">
                  +{statsLoading ? "..." : stats?.recentFacultySubmissions ?? 0} Faculty
                  <span className="mx-2 text-slate-300">•</span>
                  +{statsLoading ? "..." : stats?.recentStudentSubmissions ?? 0} Students
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="faculty" className="w-full">
          <TabsList className="grid w-full max-w-sm grid-cols-2 rounded-full border border-stone-200 bg-white p-1 shadow-sm">
            <TabsTrigger value="faculty" className="rounded-full text-xs font-semibold uppercase tracking-[0.14em] data-[state=active]:bg-slate-950 data-[state=active]:text-white data-[state=active]:shadow-none">
              Faculty
            </TabsTrigger>
            <TabsTrigger value="student" className="rounded-full text-xs font-semibold uppercase tracking-[0.14em] data-[state=active]:bg-slate-950 data-[state=active]:text-white data-[state=active]:shadow-none">
              Student
            </TabsTrigger>
          </TabsList>

          <TabsContent value="faculty" className="mt-6">
            <DataPanel tab="faculty" filters={FACULTY_FILTERS} token={token} />
          </TabsContent>

          <TabsContent value="student" className="mt-6">
            <DataPanel tab="student" filters={STUDENT_FILTERS} token={token} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
