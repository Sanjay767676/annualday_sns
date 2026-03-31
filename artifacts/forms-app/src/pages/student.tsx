import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLocation } from "wouter";
import { ArrowLeft, GraduationCap, Plus, Trash2, CheckCircle2 } from "lucide-react";

import { useSubmitStudentForm } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const ugPgOptions = ["UG", "PG"] as const;

const studentFormSchema = z.object({
  firstRankHolders: z.array(z.object({
    studentName: z.string().min(1, "Required"),
    yearOfStudy: z.string().min(1, "Required"),
    ugPg: z.enum(["UG", "PG"]),
    department: z.string().min(1, "Required"),
    regNumber: z.string().min(1, "Required"),
    percentageSecured: z.string().min(1, "Required"),
  })),
  semesterWiseRankers: z.array(z.object({
    studentName: z.string().min(1, "Required"),
    department: z.string().min(1, "Required"),
    yearOfStudy: z.string().min(1, "Required"),
    ugPg: z.enum(["UG", "PG"]),
    percentageSecured: z.string().min(1, "Required"),
  })),
  remarkableAchievements: z.array(z.object({
    studentName: z.string().min(1, "Required"),
    department: z.string().min(1, "Required"),
    yearOfStudy: z.string().min(1, "Required"),
    achievementDetails: z.string().min(1, "Required"),
  })),
});

type StudentFormValues = z.infer<typeof studentFormSchema>;

const SECTION_COLORS = [
  "from-indigo-700 to-indigo-500",
  "from-purple-700 to-purple-500",
  "from-pink-700 to-pink-500",
];

export default function StudentFormPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      firstRankHolders: [{ studentName: "", yearOfStudy: "", ugPg: "UG", department: "", regNumber: "", percentageSecured: "" }],
      semesterWiseRankers: [{ studentName: "", department: "", yearOfStudy: "", ugPg: "UG", percentageSecured: "" }],
      remarkableAchievements: [{ studentName: "", department: "", yearOfStudy: "", achievementDetails: "" }],
    }
  });

  const firstRankField = useFieldArray({ control: form.control, name: "firstRankHolders" });
  const semesterWiseField = useFieldArray({ control: form.control, name: "semesterWiseRankers" });
  const achievementsField = useFieldArray({ control: form.control, name: "remarkableAchievements" });

  const submitMutation = useSubmitStudentForm();

  function onSubmit(data: StudentFormValues) {
    submitMutation.mutate({ data }, {
      onSuccess: () => {
        toast({ title: "Submitted successfully!", description: "Student data has been recorded." });
        setLocation("/");
      },
      onError: (err) => {
        toast({ title: "Submission failed", description: err.message || "An error occurred.", variant: "destructive" });
      }
    });
  }

  const SectionHeader = ({ num, title }: { num: number; title: string }) => {
    const colorClass = SECTION_COLORS[(num - 1) % SECTION_COLORS.length];
    return (
      <div className={`bg-gradient-to-r ${colorClass} px-6 py-4 flex items-center gap-3`}>
        <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white font-black text-sm">
          {num}
        </div>
        <h2 className="text-white font-bold text-lg">{title}</h2>
      </div>
    );
  };

  const EntryWrapper = ({ index, total, onRemove, children }: { index: number; total: number; onRemove: () => void; children: React.ReactNode }) => (
    <div className="relative bg-slate-50 border border-slate-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Entry {index + 1}</span>
        {total > 1 && (
          <button
            type="button"
            onClick={onRemove}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {children}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      {/* Gold accent bar */}
      <div className="h-1 flex-shrink-0" style={{ background: "linear-gradient(90deg, #b45309, #f59e0b, #fbbf24, #f59e0b, #b45309)" }} />

      {/* Sticky header */}
      <header className="sticky top-0 z-20 bg-white border-b border-slate-200 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 max-w-4xl h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLocation("/")}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-black text-[10px]"
                style={{ background: "linear-gradient(135deg, #1d4ed8, #3b82f6)" }}
              >
                SNS
              </div>
              <span className="font-bold text-slate-700 text-sm hidden sm:block">SNS College of Technology</span>
              <span className="font-bold text-slate-700 text-sm sm:hidden">SNS CoT</span>
            </div>
          </div>
          <div
            className="text-xs font-bold px-3 py-1 rounded-full"
            style={{ background: "rgba(245,158,11,0.1)", color: "#b45309", border: "1px solid rgba(245,158,11,0.25)" }}
          >
            Annual Day 2026
          </div>
        </div>
      </header>

      {/* Hero banner */}
      <div style={{ background: "linear-gradient(135deg, #312e81 0%, #4338ca 50%, #6366f1 100%)" }} className="py-8 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center gap-3 mb-2">
            <GraduationCap className="w-6 h-6 text-indigo-200" />
            <span className="text-indigo-200 text-sm font-semibold">Student Data Submission</span>
          </div>
          <h1 className="text-white font-black text-2xl sm:text-3xl mb-1">Student Information Form</h1>
          <p className="text-indigo-200/80 text-sm">Data Collection Period: May 2025 – March 2026</p>
        </div>
      </div>

      {/* Form */}
      <main className="flex-1 container mx-auto px-4 sm:px-6 max-w-4xl py-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

            {/* Section 1: First Rank Holders */}
            <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-white">
              <SectionHeader num={1} title="First Rank Holder (upto Nov/Dec 2025)" />
              <div className="p-5 space-y-4">
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
                            <FormControl><Input className="h-10 bg-white border-slate-300" {...f} /></FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )} />
                      <FormField control={form.control} name={`firstRankHolders.${index}.yearOfStudy`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormLabel className="text-slate-600 text-xs font-semibold uppercase tracking-wide">Year of Study</FormLabel>
                            <FormControl><Input className="h-10 bg-white border-slate-300" placeholder="e.g. II Year" {...f} /></FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )} />
                      <FormField control={form.control} name={`firstRankHolders.${index}.ugPg`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormLabel className="text-slate-600 text-xs font-semibold uppercase tracking-wide">UG / PG</FormLabel>
                            <Select onValueChange={f.onChange} defaultValue={f.value}>
                              <FormControl><SelectTrigger className="h-10 bg-white border-slate-300"><SelectValue /></SelectTrigger></FormControl>
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
                  onClick={() => firstRankField.append({ studentName: "", yearOfStudy: "", ugPg: "UG", department: "", regNumber: "", percentageSecured: "" })}
                  className="w-full py-3 rounded-xl border-2 border-dashed border-slate-300 text-slate-500 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/30 transition-all text-sm font-semibold flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />Add Another Entry
                </button>
              </div>
            </div>

            {/* Section 2: Semester Wise Rank */}
            <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-white">
              <SectionHeader num={2} title="Semester Wise First Rank (Class Wise)" />
              <div className="p-5 space-y-4">
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
                            <FormControl><Input className="h-10 bg-white border-slate-300" {...f} /></FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )} />
                      <FormField control={form.control} name={`semesterWiseRankers.${index}.yearOfStudy`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormLabel className="text-slate-600 text-xs font-semibold uppercase tracking-wide">Year of Study</FormLabel>
                            <FormControl><Input className="h-10 bg-white border-slate-300" placeholder="e.g. III Year" {...f} /></FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )} />
                      <FormField control={form.control} name={`semesterWiseRankers.${index}.ugPg`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormLabel className="text-slate-600 text-xs font-semibold uppercase tracking-wide">UG / PG</FormLabel>
                            <Select onValueChange={f.onChange} defaultValue={f.value}>
                              <FormControl><SelectTrigger className="h-10 bg-white border-slate-300"><SelectValue /></SelectTrigger></FormControl>
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
                  onClick={() => semesterWiseField.append({ studentName: "", department: "", yearOfStudy: "", ugPg: "UG", percentageSecured: "" })}
                  className="w-full py-3 rounded-xl border-2 border-dashed border-slate-300 text-slate-500 hover:border-purple-400 hover:text-purple-600 hover:bg-purple-50/30 transition-all text-sm font-semibold flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />Add Another Entry
                </button>
              </div>
            </div>

            {/* Section 3: Remarkable Achievements */}
            <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-white">
              <SectionHeader num={3} title="Remarkable Achievements by Student" />
              <div className="p-5 space-y-4">
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
                            <FormControl><Input className="h-10 bg-white border-slate-300" {...f} /></FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )} />
                      <FormField control={form.control} name={`remarkableAchievements.${index}.yearOfStudy`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormLabel className="text-slate-600 text-xs font-semibold uppercase tracking-wide">Year of Study</FormLabel>
                            <FormControl><Input className="h-10 bg-white border-slate-300" placeholder="e.g. IV Year" {...f} /></FormControl>
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
                  onClick={() => achievementsField.append({ studentName: "", department: "", yearOfStudy: "", achievementDetails: "" })}
                  className="w-full py-3 rounded-xl border-2 border-dashed border-slate-300 text-slate-500 hover:border-pink-400 hover:text-pink-600 hover:bg-pink-50/30 transition-all text-sm font-semibold flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />Add Another Entry
                </button>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-4 pb-8">
              <Button
                type="submit"
                disabled={submitMutation.isPending}
                className="w-full text-base font-bold rounded-xl shadow-lg"
                style={{ background: "linear-gradient(135deg, #4338ca, #6366f1)", padding: "0.875rem 2rem" }}
              >
                {submitMutation.isPending ? (
                  "Submitting..."
                ) : (
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    Submit Student Form
                  </span>
                )}
              </Button>
              <p className="text-center text-slate-400 text-xs mt-3">
                Annual Day 2026 · SNS College of Technology, Coimbatore
              </p>
            </div>

          </form>
        </Form>
      </main>

    </div>
  );
}
