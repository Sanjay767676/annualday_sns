import { useEffect, useState, useMemo, useCallback, type ReactNode } from "react";
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

const PAGE_SIZE = 100;
const EXPORT_PAGE_LIMIT = 100;
const POLL_INTERVAL = 5_000; // 5 seconds for real-time updates

type PaginatedResponse = {
  data: Record<string, unknown>[];
  total: number;
  page: number;
  limit: number;
};

type TabType = "faculty" | "student";
type FacultyType = "paper" | "book" | "patent" | "phd";
type StudentType = "firstRank" | "semesterWise" | "reputedInstitution";
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

const HIDDEN_COLS = new Set(["_submissionId", "_submittedAt", "_rowIndex", "row_index"]);

const FACULTY_FILTER_ORDER: FacultyType[] = ["paper", "book", "patent", "phd"];
const STUDENT_FILTER_ORDER: StudentType[] = ["firstRank", "semesterWise", "reputedInstitution"];

const COLUMN_LABELS: Record<string, string> = {
  facultyName: "Name",
  name: "Name",
  studentName: "Name",
  titleOfPaper: "Title of Paper",
  titleOfBook: "Title of Book / Chapter",
  titleOfPatent: "Title of Patent",
  title: "Title of Thesis",
  journalName: "Name of the Journal",
  journalType: "Journal Type",
  publisherIsbn: "Publisher & ISBN",
  phoneNumber: "Phone Number",
  proofLink: "Proof",
  designation: "Designation",
  department: "Department",
  branch: "Department",
  university: "University",
  year: "Year",
  yearOfStudy: "Year of Study",
  ugPg: "UG / PG",
  regNumber: "Reg. No",
  percentageSecured: "Percentage Secured",
  sgpa: "SGPA",
  monthYear: "Month & Year",
  designProduct: "Design / Product",
  eventType: "Event Type",
  paperType: "Paper Type",
  dateOfPublished: "Date of Published",
  institutionIndustry: "Institution / Industry",
  institutionName: "Institution Name",
  prizeWon: "Prize Won",
  isbn: "ISBN",
  numberOfAuthors: "Number of Authors",
  author1: "Author 1",
  author2: "Author 2",
  authorPosition: "Author Position",
  author3: "Author 3",
  author4: "Author 4",
  author5: "Author 5",
};

const SECTION_COLUMN_ORDER: Record<TabType, Record<SectionType, string[]>> = {
  faculty: {
    paper: [
      "facultyName",
      "titleOfPaper",
      "authorPosition",
      "journalName",
      "journalType",
      "publisherIsbn",
      "designation",
      "department",
      "phoneNumber",
      "monthYear",
      "proofLink",
    ],
    book: ["name", "titleOfBook", "publisherIsbn", "designation", "department", "phoneNumber", "monthYear", "proofLink"],
    patent: ["name", "titleOfPatent", "designProduct", "designation", "department", "phoneNumber", "monthYear", "proofLink"],
    phd: ["name", "title", "university", "designation", "branch", "phoneNumber", "year", "proofLink"],
    firstRank: [],
    semesterWise: [],
    reputedInstitution: [],
  },
  student: {
    firstRank: ["studentName", "regNumber", "ugPg", "yearOfStudy", "department", "percentageSecured", "proofLink"],
    semesterWise: ["studentName", "regNumber", "ugPg", "yearOfStudy", "department", "sgpa", "semester", "proofLink"],
    reputedInstitution: [
      "studentName",
      "eventType",
      "yearOfStudy",
      "department",
      "paperType",
      "journalName",
      "isbn",
      "numberOfAuthors",
      "author1",
      "author2",
      "author3",
      "author4",
      "author5",
      "dateOfPublished",
      "designProduct",
      "institutionIndustry",
      "institutionName",
      "prizeWon",
      "proofLink",
    ],
    paper: [],
    book: [],
    patent: [],
    phd: [],
  },
};

function labelForColumn(key: string, sectionType?: SectionType): string {
  if (key === "publisherIsbn" && sectionType === "paper") {
    return "Publisher & ISSN";
  }
  return COLUMN_LABELS[key] ?? humanize(key);
}

function isUrlLike(value: string): boolean {
  return /^(https?:\/\/|www\.)\S+/i.test(value.trim());
}

function renderCell(value: unknown): ReactNode {
  if (value === null || value === undefined || value === "") return "—";

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return "—";
    if (isUrlLike(trimmed)) {
      const href = trimmed.startsWith("www.") ? `https://${trimmed}` : trimmed;
      // Truncate URL display to max 30 chars
      const displayUrl = trimmed.length > 30 ? trimmed.substring(0, 27) + "..." : trimmed;
      return (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          title={trimmed}
          className="font-medium text-blue-600 underline decoration-blue-300 underline-offset-2 hover:text-blue-800 block truncate"
        >
          {displayUrl}
        </a>
      );
    }
    return trimmed;
  }

  return String(value);
}

function getOrderedColumns(tab: TabType, type: SectionType, rows: Record<string, unknown>[]) {
  const priority = SECTION_COLUMN_ORDER[tab][type] ?? [];
  const keys = new Set<string>();

  rows.forEach((row) => {
    Object.keys(row).forEach((key) => {
      if (!HIDDEN_COLS.has(key)) {
        keys.add(key);
      }
    });
  });

  const ordered = priority.filter((key) => keys.has(key));
  const remaining = [...keys].filter((key) => !priority.includes(key)).sort((a, b) => labelForColumn(a).localeCompare(labelForColumn(b)));

  return [...ordered, ...remaining];
}

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
          if (r.eventType === "Paper Published") {
            const authors = [r.author1, r.author2, r.author3, r.author4, r.author5]
              .filter(Boolean)
              .join(", ");
            return `Journal: ${asText(r.journalName)}, ISBN: ${asText(r.isbn)}, Type: ${asText(r.paperType)}, Date: ${asText(r.dateOfPublished)}, Authors: ${authors}`;
          }
          if (r.eventType === "Patent Published") {
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
  rowIndex?: number,
  type?: string,
): Promise<void> {
  let url = `/api/admin/${tab}/${submissionId}`;
  if (rowIndex !== undefined && type !== undefined) {
    url += `?rowIndex=${rowIndex}&type=${type}`;
  }

  const res = await fetch(url, {
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
  tab,
  type,
  rows,
  isLoading,
  rowOffset,
  deletingId,
  onDelete,
  token,
  onUpdated,
}: {
  tab: TabType;
  type: SectionType;
  rows: Record<string, unknown>[];
  isLoading: boolean;
  rowOffset: number;
  deletingId: string | null;
  onDelete: (submissionId: string, rowIndex?: number) => void;
  token: string;
  onUpdated?: () => void;
}) {
  const columns = useMemo(() => {
    if (!rows.length) return [];
    return getOrderedColumns(tab, type, rows);
  }, [rows, tab, type]);

  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  // editingKey format: "submissionId:rowIndex:fieldName"
  const parseEditingKey = (key: string | null) => {
    if (!key) return null;
    const [submissionId, rowIndexStr, fieldName] = key.split(":");
    const rowIndex = Number.parseInt(rowIndexStr, 10);
    if (!Number.isInteger(rowIndex) || rowIndex < 0 || !fieldName) return null;
    return { submissionId, rowIndex, fieldName };
  };

  const isNullOrEmpty = (value: unknown): boolean => {
    return value === null || value === undefined || value === "";
  };

  const handleCellClick = (row: Record<string, unknown>, col: string) => {
    const cellValue = row[col];
    const submissionId = String(row._submissionId || "");
    const rowIndex = Number.isInteger(row._rowIndex)
      ? Number(row._rowIndex)
      : rows.indexOf(row);

    // Only allow editing if value is null/empty
    if (isNullOrEmpty(cellValue) && submissionId) {
      setEditingKey(`${submissionId}:${rowIndex}:${col}`);
      setEditValue("");
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseEditingKey(editingKey);
    if (!parsed || !editValue.trim()) return;

    try {
      setIsUpdating(true);
      const endpoint = tab === "faculty" ? "faculty" : "student";
      
      const response = await fetch(`/api/admin/${endpoint}/${parsed.submissionId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": token,
        },
        body: JSON.stringify({
          section: type,
          fieldName: parsed.fieldName,
          fieldValue: editValue.trim(),
          rowIndex: parsed.rowIndex,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Update failed");
      }

      toast({
        title: "Updated",
        description: "Field updated successfully",
      });

      setEditingKey(null);
      setEditValue("");
      onUpdated?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Update failed";
      toast({
        title: "Update failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    setEditingKey(null);
    setEditValue("");
  };

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
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-stone-200 bg-stone-50/80">
            <th className="w-6 px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">#</th>
            {columns.map((col) => (
              <th
                key={col}
                className="whitespace-nowrap px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500"
              >
                {labelForColumn(col, type)}
              </th>
            ))}
            <th className="whitespace-nowrap px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              Submitted
            </th>
            <th className="whitespace-nowrap px-2 py-2 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const isEditingThisRow = editingKey?.startsWith(String(row._submissionId));
            return (
              <tr key={i} className="border-b border-stone-100 transition-colors hover:bg-stone-50/60">
                <td className="px-2 py-1.5 text-[10px] text-slate-400 text-center">{rowOffset + i + 1}</td>
                {columns.map((col) => {
                  const cellValue = row[col];
                  const isCellEmpty = isNullOrEmpty(cellValue);
                  const currentRowIndex = Number.isInteger(row._rowIndex)
                    ? Number(row._rowIndex)
                    : i;
                  const isThisEditing = editingKey === `${row._submissionId}:${currentRowIndex}:${col}`;
                  
                  return (
                    <td key={col} className="px-2 py-1.5 align-middle text-slate-700 max-w-[120px]">
                      {isThisEditing ? (
                        <form onSubmit={handleSaveEdit} className="flex gap-1">
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            placeholder="Enter..."
                            autoFocus
                            className="flex-1 rounded border border-stone-300 px-1.5 py-0.5 text-xs focus:border-blue-500 focus:outline-none"
                          />
                          <div className="flex gap-0.5">
                            <button
                              type="submit"
                              disabled={isUpdating || !editValue.trim()}
                              className="rounded bg-blue-600 text-white px-1.5 py-0.5 text-xs font-medium hover:bg-blue-700 disabled:bg-gray-400"
                            >
                              ✓
                            </button>
                            <button
                              type="button"
                              onClick={handleCancel}
                              disabled={isUpdating}
                              className="rounded bg-gray-300 text-gray-700 px-1.5 py-0.5 text-xs font-medium hover:bg-gray-400"
                            >
                              ✕
                            </button>
                          </div>
                        </form>
                      ) : (
                        <span
                          onClick={() => handleCellClick(row, col)}
                          className={`truncate block text-xs ${
                            isCellEmpty && row._submissionId
                              ? "cursor-pointer text-blue-500 hover:text-blue-700 font-medium"
                              : ""
                          }`}
                          title={typeof cellValue === "string" ? cellValue : String(cellValue)}
                        >
                          {renderCell(cellValue)}
                        </span>
                      )}
                    </td>
                  );
                })}
                <td className="whitespace-nowrap px-2 py-1.5 text-[10px] text-slate-500">
                  <div>{row._submittedAt
                    ? new Date(row._submittedAt as string).toLocaleDateString("en-IN", { year: "2-digit", month: "2-digit", day: "2-digit" })
                    : "—"}</div>
                  {Boolean(row._submissionId) && (
                    <div className="truncate font-mono text-[9px] text-slate-400" title={String(row._submissionId)}>
                      {String(row._submissionId).slice(0, 6)}
                    </div>
                  )}
                </td>
                <td className="px-2 py-1.5 text-right">
                  {row._submissionId ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(String(row._submissionId), Number.isInteger(row._rowIndex) ? Number(row._rowIndex) : undefined)}
                      disabled={deletingId === String(row._submissionId) || isEditingThisRow}
                      className="h-6 rounded-full border-red-200 bg-white px-2 text-[9px] font-semibold uppercase tracking-[0.10em] text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </td>
              </tr>
            );
          })}
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
  onOpenDeleted,
  onOpenExport,
}: {
  tab: "faculty" | "student";
  filters: readonly { key: string; label: string }[];
  token: string;
  onOpenDeleted: () => void;
  onOpenExport: () => void;
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

  const handleDelete = useCallback(async (submissionId: string, rowIndex?: number) => {
    const ok = window.confirm("Delete this entry?");
    if (!ok) return;

    try {
      setDeletingId(submissionId);
      await deleteSubmission(tab, submissionId, token, rowIndex, activeType);
      // Invalidate and force immediate refetch
      await queryClient.invalidateQueries({ queryKey: [tab, activeType, debouncedSearch, page] });
      await queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
      await queryClient.refetchQueries({ queryKey: [tab, activeType, debouncedSearch, page] });
      toast({ title: "Deleted", description: "Entry removed successfully." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Delete failed";
      toast({ title: "Delete failed", description: message, variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  }, [queryClient, tab, token, toast, activeType, debouncedSearch, page]);

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
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenDeleted}
            className="h-10 rounded-full border-stone-300 bg-white px-4 text-xs font-semibold tracking-[0.14em] uppercase whitespace-nowrap"
          >
            Deleted Submissions
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenExport}
            className="h-10 rounded-full border-stone-300 bg-white px-4 text-xs font-semibold tracking-[0.14em] uppercase whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            Export Center
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

        <DynamicTable
          tab={tab}
          type={activeType as SectionType}
          rows={rows}
          isLoading={isLoading}
          rowOffset={(page - 1) * PAGE_SIZE}
          deletingId={deletingId}
          onDelete={handleDelete}
          token={token}
          onUpdated={() => {
            queryClient.invalidateQueries({ queryKey });
          }}
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
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Faculty Entries</p>
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
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Student Entries</p>
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
            <DataPanel
              tab="faculty"
              filters={FACULTY_FILTERS}
              token={token}
              onOpenDeleted={() => setLocation("/admin/deleted")}
              onOpenExport={() => setLocation("/admin/export")}
            />
          </TabsContent>

          <TabsContent value="student" className="mt-6">
            <DataPanel
              tab="student"
              filters={STUDENT_FILTERS}
              token={token}
              onOpenDeleted={() => setLocation("/admin/deleted")}
              onOpenExport={() => setLocation("/admin/export")}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
