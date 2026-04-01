import { useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useLocation } from "wouter";
import { GraduationCap, Plus, Trash2, CheckCircle2 } from "lucide-react";

import {
  useSubmitStudentForm,
  type StudentFormData,
  type FirstRankHolderUgPg,
  type SemesterWiseRankerUgPg,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import SiteHeader from "@/components/site-header";
import {
  DEPARTMENT_OPTIONS,
  YEAR_OF_STUDY_OPTIONS,
} from "@/lib/form-options";

const ugPgOptions = ["UG", "PG"] as const;

type StudentFormValues = {
  firstRankHolders: Array<{
    studentName: string;
    yearOfStudy: string;
    ugPg: string;
    department: string;
    regNumber: string;
    percentageSecured: string;
  }>;
  semesterWiseRankers: Array<{
    studentName: string;
    department: string;
    yearOfStudy: string;
    ugPg: string;
    percentageSecured: string;
  }>;
  remarkableAchievements: Array<{
    studentName: string;
    department: string;
    yearOfStudy: string;
    achievementDetails: string;
  }>;
};

const SECTION_COLORS = [
  {
    badge: "bg-indigo-50 text-indigo-700 ring-indigo-100",
    dot: "bg-indigo-500",
    add: "hover:border-indigo-200 hover:bg-indigo-50/70 hover:text-indigo-800",
  },
  {
    badge: "bg-purple-50 text-purple-700 ring-purple-100",
    dot: "bg-purple-500",
    add: "hover:border-purple-200 hover:bg-purple-50/70 hover:text-purple-800",
  },
  {
    badge: "bg-pink-50 text-pink-700 ring-pink-100",
    dot: "bg-pink-500",
    add: "hover:border-pink-200 hover:bg-pink-50/70 hover:text-pink-800",
  },
];

function createEmptyFirstRankHolder() {
  return {
    studentName: "",
    yearOfStudy: "",
    ugPg: "",
    department: "",
    regNumber: "",
    percentageSecured: "",
  };
}

function createEmptySemesterWiseRanker() {
  return {
    studentName: "",
    department: "",
    yearOfStudy: "",
    ugPg: "",
    percentageSecured: "",
  };
}

function createEmptyAchievement() {
  return {
    studentName: "",
    department: "",
    yearOfStudy: "",
    achievementDetails: "",
  };
}

function isFilled(value: string) {
  return value.trim().length > 0;
}

function isEntryEmpty(entry: Record<string, string>) {
  return Object.values(entry).every((value) => !isFilled(value));
}

function isEntryComplete(entry: Record<string, string>) {
  return Object.values(entry).every((value) => isFilled(value));
}

export default function StudentFormPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<StudentFormValues>({
    defaultValues: {
      firstRankHolders: [createEmptyFirstRankHolder()],
      semesterWiseRankers: [createEmptySemesterWiseRanker()],
      remarkableAchievements: [createEmptyAchievement()],
    },
  });

  const firstRankField = useFieldArray({ control: form.control, name: "firstRankHolders" });
  const semesterWiseField = useFieldArray({ control: form.control, name: "semesterWiseRankers" });
  const achievementsField = useFieldArray({ control: form.control, name: "remarkableAchievements" });

  const submitMutation = useSubmitStudentForm();
  const watchedValues = form.watch();

  const sectionStatus = useMemo(() => {
    const getStatus = (entries: Record<string, string>[]) => {
      const filledEntries = entries.filter((entry) => !isEntryEmpty(entry));
      return {
        hasCompleteEntry: filledEntries.some((entry) => isEntryComplete(entry)),
        hasPartialEntry: filledEntries.some((entry) => !isEntryComplete(entry)),
      };
    };

    const firstRankHolders = getStatus(watchedValues.firstRankHolders);
    const semesterWiseRankers = getStatus(watchedValues.semesterWiseRankers);
    const remarkableAchievements = getStatus(watchedValues.remarkableAchievements);

    return {
      canSubmit:
        [firstRankHolders, semesterWiseRankers, remarkableAchievements].some(
          (section) => section.hasCompleteEntry,
        ) &&
        ![firstRankHolders, semesterWiseRankers, remarkableAchievements].some(
          (section) => section.hasPartialEntry,
        ),
    };
  }, [watchedValues]);

  function validateSection<T extends Record<string, string>>(
    sectionName: keyof StudentFormValues,
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

  function onSubmit(values: StudentFormValues) {
    form.clearErrors();

    const firstRankHolders = validateSection("firstRankHolders", values.firstRankHolders, {
      studentName: "Student Name",
      department: "Department",
      yearOfStudy: "Year of Study",
      ugPg: "UG / PG",
      regNumber: "Reg Number",
      percentageSecured: "Percentage Secured",
    });

    const semesterWiseRankers = validateSection("semesterWiseRankers", values.semesterWiseRankers, {
      studentName: "Student Name",
      department: "Department",
      yearOfStudy: "Year of Study",
      ugPg: "UG / PG",
      percentageSecured: "Percentage Secured",
    });

    const remarkableAchievements = validateSection("remarkableAchievements", values.remarkableAchievements, {
      studentName: "Student Name",
      department: "Department",
      yearOfStudy: "Year of Study",
      achievementDetails: "Achievement Details",
    });

    const hasPartialEntry = [
      firstRankHolders,
      semesterWiseRankers,
      remarkableAchievements,
    ].some((section) => section.hasPartialEntry);

    const hasCompletedSection = [
      firstRankHolders,
      semesterWiseRankers,
      remarkableAchievements,
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
          "Fill one full section before submitting the student form.",
        variant: "destructive",
      });
      return;
    }

    const payload: StudentFormData = {
      firstRankHolders: firstRankHolders.completedEntries.map((entry) => ({
        ...entry,
        ugPg: entry.ugPg as FirstRankHolderUgPg,
      })),
      semesterWiseRankers: semesterWiseRankers.completedEntries.map((entry) => ({
        ...entry,
        ugPg: entry.ugPg as SemesterWiseRankerUgPg,
      })),
      remarkableAchievements: remarkableAchievements.completedEntries,
    };

    submitMutation.mutate(
      {
        data: payload,
      },
      {
        onSuccess: () => {
          toast({ title: "Submitted successfully!", description: "Student data has been recorded." });
          setLocation("/");
        },
        onError: (err) => {
          toast({ title: "Submission failed", description: err.message || "An error occurred.", variant: "destructive" });
        },
      },
    );
  }

  const SectionHeader = ({ num, title }: { num: number; title: string }) => {
    const tone = SECTION_COLORS[(num - 1) % SECTION_COLORS.length];
    return (
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
            <p className="mt-1 text-sm text-slate-500">
              Fill complete entries only. Unused sections can remain empty.
            </p>
          </div>
        </div>
      </div>
    );
  };

  const EntryWrapper = ({ index, total, onRemove, children }: { index: number; total: number; onRemove: () => void; children: React.ReactNode }) => (
    <div className="surface-muted p-5">
      <div className="mb-5 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Entry {index + 1}</span>
        {total > 1 && (
          <button
            type="button"
            onClick={onRemove}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-transparent text-slate-400 transition hover:border-rose-100 hover:bg-rose-50 hover:text-rose-600"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {children}
    </div>
  );

  return (
    <div className="app-shell flex flex-col">
      <SiteHeader onBack={() => setLocation("/")} sticky />

      <main className="page-frame flex-1 py-8 lg:py-10">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <section className="hero-panel px-6 py-7 sm:px-8 sm:py-8">
              <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr] lg:items-end">
                <div>
                  <span className="editorial-eyebrow">
                    <GraduationCap className="h-3.5 w-3.5" />
                    Student Submission
                  </span>
                  <h1 className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">
                    Student achievements, arranged in a clean academic format.
                  </h1>
                  <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                    Capture first ranks, semester-wise results, and notable achievements in a layout designed to feel formal, polished, and easy to complete.
                  </p>
                </div>
                <div className="surface-muted p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Submission Rule
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Complete one full section to enable submission. Any section you begin must be filled completely.
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-sm font-medium text-slate-800">
                    <span className={`h-2.5 w-2.5 rounded-full ${sectionStatus.canSubmit ? "bg-emerald-500" : "bg-amber-500"}`} />
                    {sectionStatus.canSubmit ? "Ready to submit" : "Complete one section to continue"}
                  </div>
                </div>
              </div>
            </section>

            <section className="surface-panel overflow-hidden">
              <SectionHeader num={1} title="First Rank Holder (upto Nov/Dec 2025)" />
              <div className="space-y-4 px-5 py-5 sm:px-6">
                {firstRankField.fields.map((field, index) => (
                  <EntryWrapper key={field.id} index={index} total={firstRankField.fields.length} onRemove={() => firstRankField.remove(index)}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField control={form.control} name={`firstRankHolders.${index}.studentName`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormLabel className="text-slate-600 text-xs font-semibold uppercase tracking-wide">Student Name</FormLabel>
                            <FormControl><Input className="h-10 bg-white border-slate-300 focus:border-indigo-400" {...f} /></FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )} />
                      <FormField control={form.control} name={`firstRankHolders.${index}.department`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormLabel className="text-slate-600 text-xs font-semibold uppercase tracking-wide">Department</FormLabel>
                            <Select onValueChange={f.onChange} value={f.value || undefined}>
                              <FormControl><SelectTrigger className="h-10 bg-white border-slate-300"><SelectValue placeholder="Select department" /></SelectTrigger></FormControl>
                              <SelectContent>{DEPARTMENT_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                            </Select>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )} />
                      <FormField control={form.control} name={`firstRankHolders.${index}.yearOfStudy`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormLabel className="text-slate-600 text-xs font-semibold uppercase tracking-wide">Year of Study</FormLabel>
                            <Select onValueChange={f.onChange} value={f.value || undefined}>
                              <FormControl><SelectTrigger className="h-10 bg-white border-slate-300"><SelectValue placeholder="Select year" /></SelectTrigger></FormControl>
                              <SelectContent>{YEAR_OF_STUDY_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                            </Select>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )} />
                      <FormField control={form.control} name={`firstRankHolders.${index}.ugPg`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormLabel className="text-slate-600 text-xs font-semibold uppercase tracking-wide">UG / PG</FormLabel>
                            <Select onValueChange={f.onChange} value={f.value || undefined}>
                              <FormControl><SelectTrigger className="h-10 bg-white border-slate-300"><SelectValue placeholder="Select course" /></SelectTrigger></FormControl>
                              <SelectContent>{ugPgOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                            </Select>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )} />
                      <FormField control={form.control} name={`firstRankHolders.${index}.regNumber`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormLabel className="text-slate-600 text-xs font-semibold uppercase tracking-wide">Reg Number</FormLabel>
                            <FormControl><Input className="h-10 bg-white border-slate-300" {...f} /></FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )} />
                      <FormField control={form.control} name={`firstRankHolders.${index}.percentageSecured`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormLabel className="text-slate-600 text-xs font-semibold uppercase tracking-wide">Percentage (cumulative from I sem)</FormLabel>
                            <FormControl><Input className="h-10 bg-white border-slate-300" placeholder="e.g. 92.5%" {...f} /></FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )} />
                    </div>
                  </EntryWrapper>
                ))}
                <button type="button"
                  onClick={() => firstRankField.append(createEmptyFirstRankHolder())}
                  className={`flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-stone-300 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition ${SECTION_COLORS[0].add}`}
                >
                  <Plus className="w-4 h-4" />Add Another Entry
                </button>
              </div>
            </section>

            <section className="surface-panel overflow-hidden">
              <SectionHeader num={2} title="Semester Wise First Rank (Class Wise)" />
              <div className="space-y-4 px-5 py-5 sm:px-6">
                {semesterWiseField.fields.map((field, index) => (
                  <EntryWrapper key={field.id} index={index} total={semesterWiseField.fields.length} onRemove={() => semesterWiseField.remove(index)}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField control={form.control} name={`semesterWiseRankers.${index}.studentName`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormLabel className="text-slate-600 text-xs font-semibold uppercase tracking-wide">Student Name</FormLabel>
                            <FormControl><Input className="h-10 bg-white border-slate-300" {...f} /></FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )} />
                      <FormField control={form.control} name={`semesterWiseRankers.${index}.department`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormLabel className="text-slate-600 text-xs font-semibold uppercase tracking-wide">Department</FormLabel>
                            <Select onValueChange={f.onChange} value={f.value || undefined}>
                              <FormControl><SelectTrigger className="h-10 bg-white border-slate-300"><SelectValue placeholder="Select department" /></SelectTrigger></FormControl>
                              <SelectContent>{DEPARTMENT_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                            </Select>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )} />
                      <FormField control={form.control} name={`semesterWiseRankers.${index}.yearOfStudy`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormLabel className="text-slate-600 text-xs font-semibold uppercase tracking-wide">Year of Study</FormLabel>
                            <Select onValueChange={f.onChange} value={f.value || undefined}>
                              <FormControl><SelectTrigger className="h-10 bg-white border-slate-300"><SelectValue placeholder="Select year" /></SelectTrigger></FormControl>
                              <SelectContent>{YEAR_OF_STUDY_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                            </Select>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )} />
                      <FormField control={form.control} name={`semesterWiseRankers.${index}.ugPg`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormLabel className="text-slate-600 text-xs font-semibold uppercase tracking-wide">UG / PG</FormLabel>
                            <Select onValueChange={f.onChange} value={f.value || undefined}>
                              <FormControl><SelectTrigger className="h-10 bg-white border-slate-300"><SelectValue placeholder="Select course" /></SelectTrigger></FormControl>
                              <SelectContent>{ugPgOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                            </Select>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )} />
                      <FormField control={form.control} name={`semesterWiseRankers.${index}.percentageSecured`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormLabel className="text-slate-600 text-xs font-semibold uppercase tracking-wide">Percentage Secured</FormLabel>
                            <FormControl><Input className="h-10 bg-white border-slate-300" placeholder="e.g. 88.3%" {...f} /></FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )} />
                    </div>
                  </EntryWrapper>
                ))}
                <button type="button"
                  onClick={() => semesterWiseField.append(createEmptySemesterWiseRanker())}
                  className={`flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-stone-300 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition ${SECTION_COLORS[1].add}`}
                >
                  <Plus className="w-4 h-4" />Add Another Entry
                </button>
              </div>
            </section>

            <section className="surface-panel overflow-hidden">
              <SectionHeader num={3} title="Remarkable Achievements by Student" />
              <div className="space-y-4 px-5 py-5 sm:px-6">
                {achievementsField.fields.map((field, index) => (
                  <EntryWrapper key={field.id} index={index} total={achievementsField.fields.length} onRemove={() => achievementsField.remove(index)}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField control={form.control} name={`remarkableAchievements.${index}.studentName`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormLabel className="text-slate-600 text-xs font-semibold uppercase tracking-wide">Student Name</FormLabel>
                            <FormControl><Input className="h-10 bg-white border-slate-300" {...f} /></FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )} />
                      <FormField control={form.control} name={`remarkableAchievements.${index}.department`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormLabel className="text-slate-600 text-xs font-semibold uppercase tracking-wide">Department</FormLabel>
                            <Select onValueChange={f.onChange} value={f.value || undefined}>
                              <FormControl><SelectTrigger className="h-10 bg-white border-slate-300"><SelectValue placeholder="Select department" /></SelectTrigger></FormControl>
                              <SelectContent>{DEPARTMENT_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                            </Select>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )} />
                      <FormField control={form.control} name={`remarkableAchievements.${index}.yearOfStudy`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormLabel className="text-slate-600 text-xs font-semibold uppercase tracking-wide">Year of Study</FormLabel>
                            <Select onValueChange={f.onChange} value={f.value || undefined}>
                              <FormControl><SelectTrigger className="h-10 bg-white border-slate-300"><SelectValue placeholder="Select year" /></SelectTrigger></FormControl>
                              <SelectContent>{YEAR_OF_STUDY_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                            </Select>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )} />
                      <FormField control={form.control} name={`remarkableAchievements.${index}.achievementDetails`}
                        render={({ field: f }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel className="text-slate-600 text-xs font-semibold uppercase tracking-wide">Achievement Details</FormLabel>
                            <FormControl>
                              <Textarea className="min-h-[100px] bg-white border-slate-300 focus:border-pink-400" placeholder="Describe the achievement in detail..." {...f} />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )} />
                    </div>
                  </EntryWrapper>
                ))}
                <button type="button"
                  onClick={() => achievementsField.append(createEmptyAchievement())}
                  className={`flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-stone-300 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition ${SECTION_COLORS[2].add}`}
                >
                  <Plus className="w-4 h-4" />Add Another Entry
                </button>
              </div>
            </section>

            <div className="surface-panel px-6 py-6 sm:px-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Final Step
                  </p>
                  <h3 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-slate-950">
                    Submit student data
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Review all started entries before continuing.
                  </p>
                </div>
                <div className="text-sm text-slate-500">
                  SNS College of Technology
                </div>
              </div>

              <div className="mt-6">
                <Button
                  type="submit"
                  disabled={submitMutation.isPending || !sectionStatus.canSubmit}
                  className="h-12 w-full rounded-full bg-slate-950 px-6 text-sm font-semibold tracking-[0.12em] uppercase text-white transition hover:bg-slate-800 disabled:bg-slate-300"
                >
                  {submitMutation.isPending ? (
                    "Submitting..."
                  ) : (
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Submit Student Form
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
