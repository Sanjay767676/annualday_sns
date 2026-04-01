import { useEffect, useState, useMemo, useCallback } from "react";
import { useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  LogOut, Users, FileText,
  Search, Download, ChevronLeft, ChevronRight, RefreshCw, Trash2,
} from "lucide-react";

import { useGetAdminStats, getGetAdminStatsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

const PAGE_SIZE = 10;
const EXPORT_PAGE_LIMIT = 100;
const POLL_INTERVAL = 30_000;

type PaginatedResponse = {
  data: Record<string, unknown>[];
  total: number;
  page: number;
  limit: number;
};

type TabType = "faculty" | "student";
type FacultyType = "paper" | "book" | "patent" | "phd";
type StudentType = "firstRank" | "semesterWise" | "achievement" | "reputedInstitution";
type SectionType = FacultyType | StudentType;
type ExportMode = "filtered" | "all";
type ExportFormat = "excel" | "pdf";
type ExportColumn = { header: string; value: (row: Record<string, unknown>) => string };
type ExportSection = { title: string; columns: ExportColumn[] };

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

const HIDDEN_COLS = new Set(["_submissionId", "_submittedAt"]);

const FACULTY_FILTER_ORDER: FacultyType[] = ["paper", "book", "patent", "phd"];
const STUDENT_FILTER_ORDER: StudentType[] = ["firstRank", "semesterWise", "reputedInstitution"];

function asText(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

function classBranch(row: Record<string, unknown>, branchKey: "department" | "branch" = "department"): string {
  const dep = asText(row[branchKey]).trim();
  const ugPg = asText(row.ugPg).trim();
  const year = asText(row.yearOfStudy).trim();

  const left = [ugPg, year].filter(Boolean).join(" ").trim();
  if (left && dep) return `${left} - ${dep}`;
  return dep || left;
}

function prefixedName(row: Record<string, unknown>, key: "facultyName" | "name"): string {
  const name = asText(row[key]).trim();
  const prefix = asText(row.prefix).trim();

  if (!prefix) return name;
  if (!name) return prefix;

  const normalizedPrefix = prefix.endsWith(".") ? prefix : `${prefix}.`;
  const lowerName = name.toLowerCase();
  const lowerPrefix = prefix.toLowerCase();
  const lowerPrefixDot = normalizedPrefix.toLowerCase();

  if (lowerName.startsWith(lowerPrefixDot) || lowerName.startsWith(`${lowerPrefix} `)) {
    return name;
  }

  return `${normalizedPrefix} ${name}`;
}

const EXPORT_SECTION_CONFIG: Record<TabType, Record<SectionType, ExportSection>> = {
  faculty: {
    paper: {
      title: "Published Papers",
      columns: [
        { header: "Name of the Faculty", value: (r) => prefixedName(r, "facultyName") },
        { header: "Designation", value: (r) => asText(r.designation) },
        { header: "Department", value: (r) => asText(r.department) },
        { header: "Title of paper published", value: (r) => asText(r.titleOfPaper) },
        { header: "Name of the journal", value: (r) => asText(r.journalType) },
        { header: "Month & Year", value: (r) => asText(r.monthYear) },
      ],
    },
    book: {
      title: "Books / Book Chapters Published",
      columns: [
        { header: "Name of the Faculty", value: (r) => prefixedName(r, "name") },
        { header: "Designation", value: (r) => asText(r.designation) },
        { header: "Department", value: (r) => asText(r.department) },
        { header: "Title of Book / Book Chapter published", value: (r) => asText(r.titleOfBook) },
        { header: "Name of the Publisher & ISBN No", value: (r) => asText(r.publisherIsbn) },
        { header: "Month & Year", value: (r) => asText(r.monthYear) },
      ],
    },
    patent: {
      title: "Patent Granted",
      columns: [
        { header: "Name of the Faculty", value: (r) => prefixedName(r, "name") },
        { header: "Designation", value: (r) => asText(r.designation) },
        { header: "Department", value: (r) => asText(r.department) },
        { header: "Title of the Patent published", value: (r) => asText(r.titleOfPatent) },
        { header: "Design/Product", value: (r) => asText(r.designProduct) },
        { header: "Month & Year", value: (r) => asText(r.monthYear) },
      ],
    },
    phd: {
      title: "Ph.D Awardees",
      columns: [
        { header: "Name of the Faculty", value: (r) => prefixedName(r, "name") },
        { header: "Designation", value: (r) => asText(r.designation) },
        { header: "Department", value: (r) => asText(r.branch) },
        { header: "University", value: (r) => asText(r.university) },
        { header: "Year", value: (r) => asText(r.year) },
        { header: "Title", value: (r) => asText(r.title) },
      ],
    },
    firstRank: { title: "", columns: [] },
    semesterWise: { title: "", columns: [] },
    reputedInstitution: { title: "", columns: [] },
  },
  student: {
    firstRank: {
      title: "First Rank Holder Year wise (UG & PG)",
      columns: [
        { header: "Class/Branch", value: (r) => classBranch(r) },
        { header: "Reg.No", value: (r) => asText(r.regNumber) },
        { header: "Name of the student", value: (r) => asText(r.studentName) },
        { header: "Percentage secured (cumulative from I Sem without arrear)", value: (r) => asText(r.percentageSecured) },
      ],
    },
    semesterWise: {
      title: "Semester wise first (Class wise) (UG & PG)",
      columns: [
        { header: "Class/Branch", value: (r) => classBranch(r) },
        { header: "Reg.No", value: (r) => asText(r.regNumber) },
        { header: "Name of the student", value: (r) => asText(r.studentName) },
        { header: "Percentage secured", value: (r) => asText(r.sgpa) },
      ],
    },
    reputedInstitution: {
      title: "Remarkable Achievements (Reputed Institutions / Industries)",
      columns: [
        { header: "Name of the Student", value: (r) => asText(r.studentName) },
        { header: "Class/Branch", value: (r) => classBranch(r) },
        { header: "Event Type", value: (r) => asText(r.eventType) },
        { header: "Details", value: (r) => {
          if (r.eventType === "paper published") {
            return `Paper: ${asText(r.paperType)}, Date: ${asText(r.dateOfPublished)}`;
          }
          if (r.eventType === "patent published") {
            return `Type: ${asText(r.designProduct)}, Date: ${asText(r.dateOfPublished)}`;
          }
          return `Inst: ${asText(r.institutionName)}, Prize: ${asText(r.prizeWon)}`;
        }},
        { header: "Proof Link", value: (r) => asText(r.proofLink) },
      ],
    },
    paper: { title: "", columns: [] },
    book: { title: "", columns: [] },
    patent: { title: "", columns: [] },
    phd: { title: "", columns: [] },
  },
};

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
  limit = PAGE_SIZE,
): Promise<PaginatedResponse> {
  const url = new URL(`/api/admin/${tab}`, window.location.origin);
  url.searchParams.set("type", type);
  url.searchParams.set("page", String(page));
  url.searchParams.set("limit", String(limit));
  if (search) url.searchParams.set("search", search);

  const res = await fetch(url.toString(), {
    headers: { "x-admin-token": token },
  });
  if (!res.ok) throw new Error("Fetch failed");
  return res.json();
}

async function fetchAllTypeRows(
  tab: "faculty" | "student",
  type: string,
  search: string,
  token: string,
): Promise<Record<string, unknown>[]> {
  let page = 1;
  let totalPages = 1;
  const merged: Record<string, unknown>[] = [];

  while (page <= totalPages) {
    const res = await fetchData(tab, type, search, page, token, EXPORT_PAGE_LIMIT);
    merged.push(...res.data);
    totalPages = Math.max(1, Math.ceil((res.total || 0) / EXPORT_PAGE_LIMIT));
    page += 1;
  }

  return merged;
}

async function deleteSubmission(
  tab: "faculty" | "student",
  submissionId: string,
  token: string,
): Promise<void> {
  const res = await fetch(`/api/admin/${tab}/${submissionId}`, {
    method: "DELETE",
    headers: { "x-admin-token": token },
  });

  if (!res.ok) {
    let message = "Delete failed";
    try {
      const body = await res.json();
      message = body.error || message;
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }
}

function toSectionRows(tab: TabType, type: SectionType, rows: Record<string, unknown>[]) {
  const config = EXPORT_SECTION_CONFIG[tab][type];
  const header = ["S.No.", ...config.columns.map((c) => c.header)];
  const body = rows.map((row, idx) => [String(idx + 1), ...config.columns.map((c) => c.value(row))]);
  return { title: config.title, header, body };
}

function exportExcelBySections(
  filename: string,
  sections: Array<{ type: SectionType; rows: Record<string, unknown>[]; label: string }>,
  tab: TabType,
) {
  const wb = XLSX.utils.book_new();

  sections.forEach((section) => {
    if (!section.rows.length) return;
    const mapped = toSectionRows(tab, section.type, section.rows);
    const sheetRows = [mapped.header, ...mapped.body];
    const ws = XLSX.utils.aoa_to_sheet(sheetRows);
    XLSX.utils.book_append_sheet(wb, ws, section.label.slice(0, 31));
  });

  XLSX.writeFile(wb, `${filename}.xlsx`);
}

function exportPdfBySections(
  filename: string,
  reportTitle: string,
  sections: Array<{ type: SectionType; rows: Record<string, unknown>[]; label: string }>,
  tab: TabType,
) {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  doc.setFontSize(12);
  doc.text(reportTitle, 40, 30);

  let startY = 44;
  let hasAnySection = false;

  sections.forEach((section, idx) => {
    if (!section.rows.length) return;
    const mapped = toSectionRows(tab, section.type, section.rows);
    hasAnySection = true;

    if (idx > 0) {
      doc.addPage("a4", "landscape");
      startY = 40;
    }

    doc.setFontSize(11);
    doc.text(mapped.title || section.label, 40, startY);

    autoTable(doc, {
      startY: startY + 8,
      head: [mapped.header],
      body: mapped.body,
      styles: { fontSize: 8, cellPadding: 4 },
      headStyles: { fillColor: [15, 23, 42] },
    });
  });

  if (hasAnySection) {
    doc.save(`${filename}.pdf`);
  }
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
  rowOffset,
  deletingId,
  onDelete,
}: {
  rows: Record<string, unknown>[];
  isLoading: boolean;
  rowOffset: number;
  deletingId: string | null;
  onDelete: (submissionId: string) => void;
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
            <th className="whitespace-nowrap px-4 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-stone-100 transition-colors hover:bg-stone-50/60">
              <td className="px-4 py-4 text-xs text-slate-400">{rowOffset + i + 1}</td>
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
              <td className="px-4 py-4 text-right">
                {row._submissionId ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(String(row._submissionId))}
                    disabled={deletingId === String(row._submissionId)}
                    className="h-8 rounded-full border-red-200 bg-white px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="mr-1 h-3.5 w-3.5" />
                    {deletingId === String(row._submissionId) ? "Deleting" : "Delete"}
                  </Button>
                ) : (
                  <span className="text-xs text-slate-400">—</span>
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
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
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

  const handleDelete = useCallback(async (submissionId: string) => {
    const ok = window.confirm("Delete this submission from dashboard and database?");
    if (!ok) return;

    try {
      setDeletingId(submissionId);
      await deleteSubmission(tab, submissionId, token);
      await queryClient.invalidateQueries({ queryKey: [tab] });
      await queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
      toast({ title: "Deleted", description: "Submission removed successfully." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Delete failed";
      toast({ title: "Delete failed", description: message, variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  }, [queryClient, tab, token, toast]);

  const runExport = useCallback(async (
    format: ExportFormat,
    mode: ExportMode,
  ) => {
    try {
      setIsExporting(true);

      const today = new Date().toISOString().slice(0, 10);
      const sections: Array<{ type: SectionType; rows: Record<string, unknown>[]; label: string }> = [];

      if (mode === "filtered") {
        const filteredRows = await fetchAllTypeRows(tab, activeType, debouncedSearch, token);
        sections.push({
          type: activeType as SectionType,
          rows: filteredRows,
          label: filters.find((f) => f.key === activeType)?.label ?? activeType,
        });
      } else {
        const order = tab === "faculty" ? FACULTY_FILTER_ORDER : STUDENT_FILTER_ORDER;
        for (const type of order) {
          const rowsForType = await fetchAllTypeRows(tab, type, "", token);
          sections.push({
            type,
            rows: rowsForType,
            label: filters.find((f) => f.key === type)?.label ?? type,
          });
        }
      }

      if (!sections.some((s) => s.rows.length > 0)) {
        toast({ title: "No data", description: "Nothing to export for the selected option." });
        return;
      }

      const scope = mode === "filtered" ? `${tab}_${activeType}_filtered` : `${tab}_all`;
      const filename = `${scope}_${today}`;
      const reportTitle = mode === "filtered"
        ? `${tab.toUpperCase()} - ${activeType} (Filtered)`
        : `${tab.toUpperCase()} - All Data`;

      if (format === "excel") {
        exportExcelBySections(filename, sections, tab);
      } else {
        exportPdfBySections(filename, reportTitle, sections, tab);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Export failed";
      toast({ title: "Export failed", description: message, variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  }, [tab, activeType, debouncedSearch, token, filters, toast]);

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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={isExporting}
                className="h-10 rounded-full border-stone-300 bg-white px-4 text-xs font-semibold tracking-[0.14em] uppercase whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5" />
                {isExporting ? "Exporting..." : "Export"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Export as Excel</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onClick={() => runExport("excel", "filtered")}>Filtered Data</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => runExport("excel", "all")}>All Data</DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Export as PDF</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onClick={() => runExport("pdf", "filtered")}>Filtered Data</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => runExport("pdf", "all")}>All Data</DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuContent>
          </DropdownMenu>
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

        <DynamicTable
          rows={rows}
          isLoading={isLoading}
          rowOffset={(page - 1) * PAGE_SIZE}
          deletingId={deletingId}
          onDelete={handleDelete}
        />

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
            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-white ring-1 ring-stone-200">
              <img
                src="/images/logo2.png"
                alt="SNS College of Technology"
                className="h-full w-full object-cover"
              />
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
        <section>
          <h1 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">Admin Dashboard</h1>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
