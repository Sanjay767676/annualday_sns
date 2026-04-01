import { useMemo } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { useLocation } from "wouter";
import { Plus, Trash2, BookOpen, CheckCircle2, CalendarDays } from "lucide-react";

import {
  useSubmitFacultyForm,
  type FacultyFormData,
  type PaperPublishedJournalType,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { MonthPicker } from "@/components/ui/month-picker";
import { DateCalendarPicker } from "@/components/ui/date-calendar-picker";
import { SearchableCombobox } from "@/components/ui/searchable-combobox";
import SiteHeader from "@/components/site-header";
import { FACULTY_DEPARTMENT_OPTIONS, DESIGNATION_OPTIONS } from "@/lib/form-options";
import { INDIAN_UNIVERSITIES } from "@/lib/universities";

type FacultyFormValues = {
  papersPublished: Array<{
    prefix: string;
    facultyName: string;
    designation: string;
    department: string;
    departmentOther: string;
    titleOfPaper: string;
    journalType: string;
    monthYear: string;
  }>;
  booksChapters: Array<{
    prefix: string;
    name: string;
    designation: string;
    department: string;
    departmentOther: string;
    titleOfBook: string;
    publisherIsbn: string;
    monthYear: string;
  }>;
  patentsGranted: Array<{
    prefix: string;
    name: string;
    designation: string;
    department: string;
    departmentOther: string;
    titleOfPatent: string;
    designProduct: string;
    monthYear: string;
  }>;
  phdAwardees: Array<{
    prefix: string;
    name: string;
    designation: string;
    branch: string;
    branchOther: string;
    university: string;
    year: string;
    title: string;
  }>;
};

type FacultySectionName = keyof FacultyFormValues;
type FieldConfig = {
  name: string;
  label: string;
  type?: "select" | "month" | "combobox" | "date";
  options?: readonly string[];
};

const SECTION_COLORS = [
  {
    badge: "bg-blue-50 text-blue-700 ring-blue-100",
    dot: "bg-blue-500",
    add: "hover:border-blue-200 hover:bg-blue-50/70 hover:text-blue-800",
  },
  {
    badge: "bg-violet-50 text-violet-700 ring-violet-100",
    dot: "bg-violet-500",
    add: "hover:border-violet-200 hover:bg-violet-50/70 hover:text-violet-800",
  },
  {
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    dot: "bg-emerald-500",
    add: "hover:border-emerald-200 hover:bg-emerald-50/70 hover:text-emerald-800",
  },
  {
    badge: "bg-amber-50 text-amber-700 ring-amber-100",
    dot: "bg-amber-500",
    add: "hover:border-amber-200 hover:bg-amber-50/70 hover:text-amber-800",
  },
];

const JOURNAL_OPTIONS = ["Scopus", "SCI", "WOS", "Annexure-1"] as const;
const NAME_PREFIX_OPTIONS = ["Mr", "Mrs", "Ms", "Dr", "Prof"] as const;

function createEmptyPaper() {
  return {
    prefix: "",
    facultyName: "",
    designation: "",
    department: "",
    departmentOther: "",
    titleOfPaper: "",
    journalType: "",
    monthYear: "",
  };
}

function createEmptyBookChapter() {
  return {
    prefix: "",
    name: "",
    designation: "",
    department: "",
    departmentOther: "",
    titleOfBook: "",
    publisherIsbn: "",
    monthYear: "",
  };
}

function createEmptyPatent() {
  return {
    prefix: "",
    name: "",
    designation: "",
    department: "",
    departmentOther: "",
    titleOfPatent: "",
    designProduct: "",
    monthYear: "",
  };
}

function createEmptyPhdAwardee() {
  return {
    prefix: "",
    name: "",
    designation: "",
    branch: "",
    branchOther: "",
    university: "",
    year: "",
    title: "",
  };
}

function isFilled(value: string) {
  return value.trim().length > 0;
}

function isEntryEmpty(entry: Record<string, string>) {
  return Object.values(entry).every((value) => !isFilled(value));
}

function isEntryComplete(entry: Record<string, string>) {
  return Object.entries(entry).every(([key, value]) => {
    if (key.endsWith("Other")) {
      const baseField = key.slice(0, -5);
      return entry[baseField] === "others" ? isFilled(value) : true;
    }

    return isFilled(value);
  });
}

function resolveDepartmentValue(department: string, departmentOther: string) {
  return department === "others" ? departmentOther.trim() : department;
}

function fullName(prefix: string, name: string) {
  const cleanPrefix = prefix.trim();
  const cleanName = name.trim();
  return cleanPrefix ? `${cleanPrefix}. ${cleanName}` : cleanName;
}

export default function FacultyFormPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<FacultyFormValues>({
    defaultValues: {
      papersPublished: [createEmptyPaper()],
      booksChapters: [createEmptyBookChapter()],
      patentsGranted: [createEmptyPatent()],
      phdAwardees: [createEmptyPhdAwardee()],
    },
  });

  const submitMutation = useSubmitFacultyForm();
  const watchedPapersPublished = useWatch({ control: form.control, name: "papersPublished" }) ?? [];
  const watchedBooksChapters = useWatch({ control: form.control, name: "booksChapters" }) ?? [];
  const watchedPatentsGranted = useWatch({ control: form.control, name: "patentsGranted" }) ?? [];
  const watchedPhdAwardees = useWatch({ control: form.control, name: "phdAwardees" }) ?? [];

  const sectionStatus = useMemo(() => {
    const getStatus = (entries: Record<string, string>[]) => {
      const filledEntries = entries.filter((entry) => !isEntryEmpty(entry));
      return {
        hasCompleteEntry: filledEntries.some((entry) => isEntryComplete(entry)),
        hasPartialEntry: filledEntries.some((entry) => !isEntryComplete(entry)),
      };
    };

    const papersPublished = getStatus(watchedPapersPublished);
    const booksChapters = getStatus(watchedBooksChapters);
    const patentsGranted = getStatus(watchedPatentsGranted);
    const phdAwardees = getStatus(watchedPhdAwardees);

    return {
      papersPublished,
      booksChapters,
      patentsGranted,
      phdAwardees,
      canSubmit:
        [papersPublished, booksChapters, patentsGranted, phdAwardees].some(
          (section) => section.hasCompleteEntry,
        ) &&
        ![papersPublished, booksChapters, patentsGranted, phdAwardees].some(
          (section) => section.hasPartialEntry,
        ),
    };
  }, [watchedPapersPublished, watchedBooksChapters, watchedPatentsGranted, watchedPhdAwardees]);

  function validateSection<T extends Record<string, string>>(
    sectionName: FacultySectionName,
    entries: T[],
    labels: Record<string, string>,
  ) {
    const completedEntries: T[] = [];
    let hasPartialEntry = false;

    entries.forEach((entry, index) => {
      if (isEntryEmpty(entry)) {
        return;
      }

      const missingFields = Object.entries(labels).filter(
        ([key]) => !isFilled(entry[key] ?? ""),
      );

      if (entry.department === "others" && !isFilled(entry.departmentOther ?? "")) {
        missingFields.push(["departmentOther", "Specify Department"]);
      }

      if (entry.branch === "others" && !isFilled(entry.branchOther ?? "")) {
        missingFields.push(["branchOther", "Specify Department"]);
      }

      if (missingFields.length > 0) {
        hasPartialEntry = true;
        missingFields.forEach(([key, label]) => {
          form.setError(`${sectionName}.${index}.${key}` as never, {
            type: "manual",
            message: `${label} is required`,
          });
        });
        return;
      }

      completedEntries.push(entry);
    });

    return { completedEntries, hasPartialEntry };
  }

  function onSubmit(values: FacultyFormValues) {
    form.clearErrors();

    const papersPublished = validateSection("papersPublished", values.papersPublished, {
      prefix: "Prefix",
      facultyName: "Faculty Name",
      designation: "Designation",
      department: "Department",
      titleOfPaper: "Title of Paper",
      journalType: "Journal Type",
      monthYear: "Month & Year",
    });

    const booksChapters = validateSection("booksChapters", values.booksChapters, {
      prefix: "Prefix",
      name: "Name",
      designation: "Designation",
      department: "Department",
      titleOfBook: "Title of Book / Chapter",
      publisherIsbn: "Publisher & ISBN",
      monthYear: "Month & Year",
    });

    const patentsGranted = validateSection("patentsGranted", values.patentsGranted, {
      prefix: "Prefix",
      name: "Name",
      designation: "Designation",
      department: "Department",
      titleOfPatent: "Title of Patent",
      designProduct: "Design / Product",
      monthYear: "Month & Year",
    });

    const phdAwardees = validateSection("phdAwardees", values.phdAwardees, {
      prefix: "Prefix",
      name: "Name",
      designation: "Designation",
      branch: "Department",
      university: "University",
      year: "Date of Graduation / Viva Voce Completion",
      title: "Title of Thesis",
    });

    const hasPartialEntry = [
      papersPublished,
      booksChapters,
      patentsGranted,
      phdAwardees,
    ].some((section) => section.hasPartialEntry);

    const hasCompletedSection = [
      papersPublished,
      booksChapters,
      patentsGranted,
      phdAwardees,
    ].some((section) => section.completedEntries.length > 0);

    if (hasPartialEntry) {
      toast({
        title: "Complete or clear unfinished entries",
        description:
          "You can submit only when at least one section is fully completed and no partially filled entries remain.",
        variant: "destructive",
      });
      return;
    }

    if (!hasCompletedSection) {
      toast({
        title: "Complete at least one section",
        description:
          "Fill one full section before submitting the faculty form.",
        variant: "destructive",
      });
      return;
    }

    const payload: FacultyFormData = {
      papersPublished: papersPublished.completedEntries.map((entry) => ({
        facultyName: fullName(entry.prefix, entry.facultyName),
        designation: entry.designation,
        department: resolveDepartmentValue(entry.department, entry.departmentOther),
        titleOfPaper: entry.titleOfPaper,
        journalType: entry.journalType as PaperPublishedJournalType,
        monthYear: entry.monthYear,
      })),
      booksChapters: booksChapters.completedEntries.map((entry) => ({
        name: fullName(entry.prefix, entry.name),
        designation: entry.designation,
        department: resolveDepartmentValue(entry.department, entry.departmentOther),
        titleOfBook: entry.titleOfBook,
        publisherIsbn: entry.publisherIsbn,
        monthYear: entry.monthYear,
      })),
      patentsGranted: patentsGranted.completedEntries.map((entry) => ({
        name: fullName(entry.prefix, entry.name),
        designation: entry.designation,
        department: resolveDepartmentValue(entry.department, entry.departmentOther),
        titleOfPatent: entry.titleOfPatent,
        designProduct: entry.designProduct,
        monthYear: entry.monthYear,
      })),
      phdAwardees: phdAwardees.completedEntries.map((entry) => ({
        name: fullName(entry.prefix, entry.name),
        designation: entry.designation,
        branch: resolveDepartmentValue(entry.branch, entry.branchOther),
        university: entry.university,
        year: entry.year,
        title: entry.title,
      })),
    };

    submitMutation.mutate(
      {
        data: payload,
      },
      {
        onSuccess: () => {
          toast({ title: "Submitted successfully!", description: "Faculty data has been recorded." });
          setLocation("/");
        },
        onError: (err) => {
          toast({ title: "Submission failed", description: err.message || "An error occurred.", variant: "destructive" });
        },
      },
    );
  }

  const renderSection = (
    num: number,
    title: string,
    name: "papersPublished" | "booksChapters" | "patentsGranted" | "phdAwardees",
    fieldsConfig: FieldConfig[],
  ) => {
    const { fields, append, remove } = useFieldArray({ control: form.control, name });
    const tone = SECTION_COLORS[(num - 1) % SECTION_COLORS.length];

    return (
      <section className="surface-panel overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-stone-200/80 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ring-1 ${tone.badge}`}>
              <span className="text-sm font-semibold">{num}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${tone.dot}`} />
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Section {num}
                </span>
              </div>
              <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-slate-950">
                {title}
              </h2>
            </div>
          </div>
        </div>

        <div className="space-y-4 px-5 py-5 sm:px-6">
          {fields.map((field, index) => (
            <div key={field.id} className="surface-muted p-5">
              <div className="mb-5 flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Entry {index + 1}
                </span>
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-transparent text-slate-400 transition hover:border-rose-100 hover:bg-rose-50 hover:text-rose-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fieldsConfig.map((config) => (
                  <div key={config.name} className="contents">
                    {(() => {
                      const watchedSection =
                        name === "papersPublished"
                          ? watchedPapersPublished
                          : name === "booksChapters"
                            ? watchedBooksChapters
                            : name === "patentsGranted"
                              ? watchedPatentsGranted
                              : watchedPhdAwardees;
                      const selectedValue = (watchedSection[index] as Record<string, string> | undefined)?.[config.name];

                      return (
                        <>
                    <FormField
                      control={form.control}
                      name={`${name}.${index}.${config.name}` as any}
                      render={({ field: formField }) => (
                        <FormItem>
                          <FormLabel className="text-slate-600 text-xs font-semibold uppercase tracking-wide">
                            {config.label}
                          </FormLabel>
                          {config.type === "select" ? (
                            <Select
                              onValueChange={(value) => {
                                formField.onChange(value);
                                if ((config.name === "department" || config.name === "branch") && value !== "others") {
                                  const otherFieldName = config.name === "branch" ? "branchOther" : "departmentOther";
                                  form.setValue(`${name}.${index}.${otherFieldName}` as never, "" as never, { shouldValidate: true });
                                }
                              }}
                              value={formField.value ?? ""}
                            >
                              <FormControl>
                                <SelectTrigger className="h-10 bg-white border-slate-300">
                                  <SelectValue placeholder="Select..." />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {config.options?.map(opt => (
                                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : config.type === "month" ? (
                            <FormControl>
                              <MonthPicker
                                value={formField.value}
                                onChange={formField.onChange}
                                disabled={submitMutation.isPending}
                              />
                            </FormControl>
                          ) : config.type === "combobox" ? (
                            <FormControl>
                              <SearchableCombobox
                                options={config.options || []}
                                value={formField.value}
                                onChange={formField.onChange}
                                placeholder={`Search ${config.label.toLowerCase()}...`}
                              />
                            </FormControl>
                          ) : config.type === "date" ? (
                            <FormControl>
                              <DateCalendarPicker
                                value={formField.value}
                                onChange={formField.onChange}
                                disabled={submitMutation.isPending}
                              />
                            </FormControl>
                          ) : (
                            <FormControl>
                              <Input className="h-10 bg-white border-slate-300 focus:border-blue-400" {...formField} />
                            </FormControl>
                          )}
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                    {(config.name === "department" || config.name === "branch") &&
                      selectedValue === "others" && (
                        <FormField
                          control={form.control}
                          name={`${name}.${index}.${config.name === "branch" ? "branchOther" : "departmentOther"}` as never}
                          render={({ field: formField }) => (
                            <FormItem>
                              <FormLabel className="text-slate-600 text-xs font-semibold uppercase tracking-wide">
                                Specify Department
                              </FormLabel>
                              <FormControl>
                                <Input className="h-10 bg-white border-slate-300 focus:border-blue-400" placeholder="Enter department" {...formField} />
                              </FormControl>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />
                      )}
                        </>
                      );
                    })()}
                  </div>
                ))}
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={() => {
              const empty = fieldsConfig.reduce<Record<string, string>>((acc, c) => {
                acc[c.name] = "";
                return acc;
              }, {});
              append(empty as never);
            }}
            className={`flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-stone-300 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition ${tone.add}`}
          >
            <Plus className="w-4 h-4" />
            Add {title} Entry
          </button>
        </div>
      </section>
    );
  };

  return (
    <div className="app-shell forms-lora flex flex-col">
      <SiteHeader onBack={() => setLocation("/")} sticky />

      <main className="page-frame flex-1 py-8 lg:py-10">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <section className="hero-panel px-6 py-7 sm:px-8 sm:py-8">
              <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr] lg:items-end">
                <div>
                  <span className="editorial-eyebrow">
                    <BookOpen className="h-3.5 w-3.5" />
                    Faculty Submission
                  </span>
                  <h1 className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">
                    Faculty Form
                  </h1>
                  <p className="mt-3 text-sm text-slate-600">
                    Fill required details and submit.
                  </p>
                </div>
                <div className="surface-muted bg-gradient-to-br from-blue-50/70 via-white to-emerald-50/60 p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Note
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-sm font-medium text-slate-800">
                    <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                    During the period: May 2025 to April 2026
                  </div>
                </div>
              </div>
            </section>

            {renderSection(1, "Papers Published (Scopus, WoS, SCI, Annexure-1)", "papersPublished", [
              { name: "prefix", label: "Prefix", type: "select", options: NAME_PREFIX_OPTIONS },
              { name: "facultyName", label: "Faculty Name" },
              { name: "designation", label: "Designation", type: "select", options: DESIGNATION_OPTIONS },
              { name: "department", label: "Department", type: "select", options: FACULTY_DEPARTMENT_OPTIONS },
              { name: "titleOfPaper", label: "Title of Paper" },
              { name: "journalType", label: "Journal Type", type: "select", options: JOURNAL_OPTIONS },
              { name: "monthYear", label: "Month & Year", type: "month" },
            ])}

            {renderSection(2, "Book / Book Chapter", "booksChapters", [
              { name: "prefix", label: "Prefix", type: "select", options: NAME_PREFIX_OPTIONS },
              { name: "name", label: "Name" },
              { name: "designation", label: "Designation", type: "select", options: DESIGNATION_OPTIONS },
              { name: "department", label: "Department", type: "select", options: FACULTY_DEPARTMENT_OPTIONS },
              { name: "titleOfBook", label: "Title of Book / Chapter" },
              { name: "publisherIsbn", label: "Publisher & ISBN" },
              { name: "monthYear", label: "Month & Year", type: "month" },
            ])}

            {renderSection(3, "Patent Granted", "patentsGranted", [
              { name: "prefix", label: "Prefix", type: "select", options: NAME_PREFIX_OPTIONS },
              { name: "name", label: "Name" },
              { name: "designation", label: "Designation", type: "select", options: DESIGNATION_OPTIONS },
              { name: "department", label: "Department", type: "select", options: FACULTY_DEPARTMENT_OPTIONS },
              { name: "titleOfPatent", label: "Title of Patent" },
              { name: "designProduct", label: "Design / Product" },
              { name: "monthYear", label: "Month & Year", type: "month" },
            ])}

            {renderSection(4, "PhD Awardees", "phdAwardees", [
              { name: "prefix", label: "Prefix", type: "select", options: NAME_PREFIX_OPTIONS },
              { name: "name", label: "Name" },
              { name: "designation", label: "Designation", type: "select", options: DESIGNATION_OPTIONS },
              { name: "branch", label: "Department", type: "select", options: FACULTY_DEPARTMENT_OPTIONS },
              { name: "university", label: "University", type: "combobox", options: INDIAN_UNIVERSITIES },
              { name: "year", label: "Date of Graduation / Viva Voce Completion", type: "date" },
              { name: "title", label: "Title of Thesis" },
            ])}

            <div className="surface-panel px-6 py-6 sm:px-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Final Step
                  </p>
                  <h3 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-slate-950">
                    Submit faculty data
                  </h3>
                </div>
              </div>

              <div className="mt-6">
                <Button
                  type="submit"
                  disabled={submitMutation.isPending || !sectionStatus.canSubmit}
                  className="h-12 w-full rounded-full bg-slate-950 px-6 text-sm font-semibold tracking-[0.12em] uppercase text-white transition hover:bg-slate-800 disabled:bg-slate-300"
                >
                  {submitMutation.isPending ? (
                    <span className="flex items-center gap-2">Submitting...</span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Submit Faculty Form
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </main>

    </div>
  );
}
