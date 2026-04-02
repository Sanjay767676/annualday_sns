import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ArrowLeft, Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type TabType = "faculty" | "student";
type FacultyType = "paper" | "book" | "patent" | "phd";
type StudentType = "firstRank" | "semesterWise" | "reputedInstitution";
type SectionType = FacultyType | StudentType;

type PaginatedResponse = {
  data: Record<string, unknown>[];
  total: number;
};

const SECTION_OPTIONS: Record<TabType, Array<{ key: SectionType; label: string }>> = {
  faculty: [
    { key: "paper", label: "Papers Published" },
    { key: "book", label: "Book / Chapter" },
    { key: "patent", label: "Patent Granted" },
    { key: "phd", label: "PhD Awardees" },
  ],
  student: [
    { key: "firstRank", label: "First Rank Holder" },
    { key: "semesterWise", label: "Semester Wise Rank" },
    { key: "reputedInstitution", label: "Remarkable Achievements" },
  ],
};

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
  semester: "Semester",
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
  author3: "Author 3",
  author4: "Author 4",
  author5: "Author 5",
};

const PRIORITY: Record<TabType, Record<SectionType, string[]>> = {
  faculty: {
    paper: ["facultyName", "titleOfPaper", "journalName", "journalType", "publisherIsbn", "designation", "department", "monthYear", "proofLink"],
    book: ["name", "titleOfBook", "publisherIsbn", "designation", "department", "monthYear", "proofLink"],
    patent: ["name", "titleOfPatent", "designProduct", "designation", "department", "monthYear", "proofLink"],
    phd: ["name", "title", "university", "designation", "branch", "year", "proofLink"],
    firstRank: [],
    semesterWise: [],
    reputedInstitution: [],
  },
  student: {
    firstRank: ["studentName", "regNumber", "ugPg", "yearOfStudy", "department", "percentageSecured", "proofLink"],
    semesterWise: ["studentName", "regNumber", "ugPg", "yearOfStudy", "department", "sgpa", "semester", "proofLink"],
    reputedInstitution: ["studentName", "eventType", "yearOfStudy", "department", "paperType", "journalName", "isbn", "numberOfAuthors", "author1", "author2", "author3", "author4", "author5", "dateOfPublished", "designProduct", "institutionIndustry", "institutionName", "prizeWon", "proofLink"],
    paper: [],
    book: [],
    patent: [],
    phd: [],
  },
};

function labelForColumn(col: string) {
  return COLUMN_LABELS[col] ?? col.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()).trim();
}

function isUrlLike(value: string): boolean {
  return /^(https?:\/\/|www\.)\S+/i.test(value.trim());
}

async function fetchRows(tab: TabType, section: SectionType, search: string, token: string): Promise<Record<string, unknown>[]> {
  const url = new URL(`/api/admin/${tab}`, window.location.origin);
  url.searchParams.set("type", section);
  url.searchParams.set("limit", "100");
  url.searchParams.set("page", "1");
  if (search) url.searchParams.set("search", search);

  const res = await fetch(url.toString(), { headers: { "x-admin-token": token } });
  if (!res.ok) throw new Error("Failed to fetch data");
  const body = (await res.json()) as PaginatedResponse;
  return body.data ?? [];
}

export default function AdminExportPage() {
  const [, setLocation] = useLocation();
  const [token] = useState(() => localStorage.getItem("admin_token"));

  const [tab, setTab] = useState<TabType>("faculty");
  const [section, setSection] = useState<SectionType>("paper");
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);

  if (!token) {
    setLocation("/admin/login");
    return null;
  }

  const sectionOptions = SECTION_OPTIONS[tab];

  const availableColumns = useMemo(() => {
    const keys = new Set<string>();
    rows.forEach((row) => {
      Object.keys(row).forEach((k) => {
        if (!k.startsWith("_")) keys.add(k);
      });
    });
    const priority = PRIORITY[tab][section] ?? [];
    const ordered = priority.filter((k) => keys.has(k));
    const rest = [...keys].filter((k) => !priority.includes(k));
    return [...ordered, ...rest];
  }, [rows, tab, section]);

  const visibleColumns = selectedColumns.length ? selectedColumns : availableColumns;

  const load = async () => {
    try {
      setLoading(true);
      const next = await fetchRows(tab, section, search, token);
      setRows(next);
      const keys = new Set<string>();
      next.forEach((row) => {
        Object.keys(row).forEach((k) => {
          if (!k.startsWith("_")) keys.add(k);
        });
      });
      setSelectedColumns([...keys]);
    } finally {
      setLoading(false);
    }
  };

  const toggleColumn = (column: string) => {
    setSelectedColumns((prev) => (prev.includes(column) ? prev.filter((c) => c !== column) : [...prev, column]));
  };

  const exportExcel = () => {
    if (!rows.length || !visibleColumns.length) return;
    const table = rows.map((row) => {
      const obj: Record<string, string> = {};
      visibleColumns.forEach((col) => {
        obj[labelForColumn(col)] = String(row[col] ?? "");
      });
      return obj;
    });

    const ws = XLSX.utils.json_to_sheet(table);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Export");
    XLSX.writeFile(wb, `${tab}_${section}_export.xlsx`);
  };

  const exportPdf = () => {
    if (!rows.length || !visibleColumns.length) return;
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    doc.setFontSize(14);
    doc.text(`${tab.toUpperCase()} - ${section} Export`, 40, 40);

    autoTable(doc, {
      startY: 58,
      head: [visibleColumns.map((c) => labelForColumn(c))],
      body: rows.map((row) => visibleColumns.map((c) => String(row[c] ?? ""))),
      styles: { fontSize: 10, cellPadding: 6, overflow: "linebreak" },
      headStyles: { fontSize: 11, fillColor: [15, 23, 42], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [247, 248, 250] },
      margin: { left: 22, right: 22 },
    });

    doc.save(`${tab}_${section}_export.pdf`);
  };

  return (
    <div className="app-shell flex flex-col">
      <main className="page-frame flex-1 space-y-6 py-8 lg:py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">Export Center</h1>
            <p className="mt-1 text-sm text-slate-500">Choose data type, section, and columns. Preview updates live below.</p>
          </div>
          <Button type="button" variant="outline" onClick={() => setLocation("/admin")} className="h-10 rounded-full border-stone-300 bg-white px-4 text-xs font-semibold uppercase tracking-[0.14em]">
            <ArrowLeft className="mr-1 h-3.5 w-3.5" />
            Back to Dashboard
          </Button>
        </div>

        <Card className="space-y-5 border-stone-200/80 p-5">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant={tab === "faculty" ? "default" : "outline"} onClick={() => {
              setTab("faculty");
              setSection("paper");
              setRows([]);
              setSelectedColumns([]);
            }}>Faculty</Button>
            <Button type="button" variant={tab === "student" ? "default" : "outline"} onClick={() => {
              setTab("student");
              setSection("firstRank");
              setRows([]);
              setSelectedColumns([]);
            }}>Student</Button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm font-medium text-slate-700">Section</label>
            <div className="flex flex-wrap gap-2">
              {sectionOptions.map((item) => (
                <Button key={item.key} type="button" variant={section === item.key ? "default" : "outline"} onClick={() => {
                  setSection(item.key);
                  setRows([]);
                  setSelectedColumns([]);
                }}>
                  {item.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Input placeholder="Search optional..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
            <Button type="button" onClick={load} disabled={loading}>
              {loading ? "Loading..." : "Load Data"}
            </Button>
          </div>

          {availableColumns.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">Choose Columns</p>
              <div className="flex flex-wrap gap-3">
                {availableColumns.map((col) => (
                  <label key={col} className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700">
                    <input type="checkbox" checked={selectedColumns.includes(col)} onChange={() => toggleColumn(col)} />
                    {labelForColumn(col)}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="border-t border-stone-200 pt-4">
            <p className="mb-2 text-sm font-medium text-slate-700">Live Preview</p>
            {!rows.length || !visibleColumns.length ? (
              <div className="rounded-lg border border-dashed border-stone-300 bg-stone-50 p-6 text-sm text-slate-500">
                Load data and select columns to preview.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-stone-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-stone-50">
                      {visibleColumns.map((col) => (
                        <th key={col} className="whitespace-nowrap px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
                          {labelForColumn(col)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, idx) => (
                      <tr key={idx} className="border-t border-stone-100">
                        {visibleColumns.map((col) => {
                          const text = String(row[col] ?? "—");
                          if (isUrlLike(text)) {
                            const href = text.startsWith("www.") ? `https://${text}` : text;
                            return (
                              <td key={col} className="max-w-xs px-3 py-2 align-top text-slate-700">
                                <a href={href} target="_blank" rel="noreferrer" className="break-all text-blue-600 underline">
                                  {text}
                                </a>
                              </td>
                            );
                          }
                          return <td key={col} className="max-w-xs px-3 py-2 align-top text-slate-700">{text}</td>;
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-stone-200 pt-4">
            <Button type="button" onClick={exportExcel} disabled={!rows.length || !visibleColumns.length}>
              <Download className="mr-1 h-3.5 w-3.5" />
              Export Excel
            </Button>
            <Button type="button" variant="outline" onClick={exportPdf} disabled={!rows.length || !visibleColumns.length}>
              <Download className="mr-1 h-3.5 w-3.5" />
              Export PDF
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
}
