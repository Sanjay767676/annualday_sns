import { useEffect, useState, useMemo, useCallback } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import * as XLSX from "xlsx";
import {
  Building2, LogOut, Users, FileText, Activity,
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
      <div className="flex items-center justify-center py-16 text-slate-400">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
        Loading...
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="py-16 text-center text-slate-400 text-sm">
        No records found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="px-4 py-3 text-left font-semibold text-slate-500 text-xs uppercase tracking-wide w-8">#</th>
            {columns.map((col) => (
              <th
                key={col}
                className="px-4 py-3 text-left font-semibold text-slate-500 text-xs uppercase tracking-wide whitespace-nowrap"
              >
                {humanize(col)}
              </th>
            ))}
            <th className="px-4 py-3 text-left font-semibold text-slate-500 text-xs uppercase tracking-wide whitespace-nowrap">
              Submitted
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors">
              <td className="px-4 py-3 text-slate-400 text-xs">{i + 1}</td>
              {columns.map((col) => (
                <td key={col} className="px-4 py-3 text-slate-700 max-w-xs">
                  <span className="line-clamp-3">{String(row[col] ?? "—")}</span>
                </td>
              ))}
              <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                <div>{row._submittedAt
                  ? new Date(row._submittedAt as string).toLocaleDateString()
                  : "—"}</div>
                {row._submissionId && (
                  <div className="text-slate-400 font-mono text-[10px] mt-0.5 truncate max-w-[120px]" title={String(row._submissionId)}>
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
    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50">
      <span className="text-xs text-slate-500">
        {total === 0 ? "No records" : `${Math.min((page - 1) * limit + 1, total)}–${Math.min(page * limit, total)} of ${total}`}
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="h-7 px-2"
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
          className="h-7 px-2"
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
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        {/* Filter pills */}
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setActiveType(f.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeType === f.key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search + Export */}
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <Input
              placeholder="Search..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={!rows.length}
            className="h-8 gap-1.5 text-xs whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-800">
              {filters.find((f) => f.key === activeType)?.label}
            </span>
            {data && (
              <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-600">
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

  const fetchOpts = token
    ? { request: { headers: { "x-admin-token": token } } }
    : { query: { enabled: false } };

  const { data: stats, isLoading: statsLoading } = useGetAdminStats({
    query: {
      enabled: !!token,
      queryKey: getGetAdminStatsQueryKey(),
      refetchInterval: POLL_INTERVAL,
    },
    ...fetchOpts,
  });

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    setLocation("/");
  };

  if (!token) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-primary text-primary-foreground border-b border-primary/20 sticky top-0 z-20 shadow-md">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 font-bold text-lg">
            <Building2 className="w-5 h-5 opacity-80" />
            <span>Portal Administration</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-white"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Faculty Submissions</p>
                <h3 className="text-2xl font-bold text-slate-900">
                  {statsLoading ? "..." : stats?.totalFacultySubmissions ?? 0}
                </h3>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Student Submissions</p>
                <h3 className="text-2xl font-bold text-slate-900">
                  {statsLoading ? "..." : stats?.totalStudentSubmissions ?? 0}
                </h3>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Recent (30 days)</p>
                <p className="text-sm font-semibold text-slate-900 mt-1">
                  +{statsLoading ? "..." : stats?.recentFacultySubmissions ?? 0} Faculty
                  <span className="mx-2 text-slate-300">|</span>
                  +{statsLoading ? "..." : stats?.recentStudentSubmissions ?? 0} Students
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="faculty" className="w-full">
          <TabsList className="grid w-full max-w-xs grid-cols-2 bg-slate-200/50 p-1">
            <TabsTrigger value="faculty" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Faculty
            </TabsTrigger>
            <TabsTrigger value="student" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
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
