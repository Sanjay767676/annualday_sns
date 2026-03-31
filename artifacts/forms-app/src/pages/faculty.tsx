import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLocation } from "wouter";
import { Plus, Trash2, ArrowLeft, BookOpen, CheckCircle2 } from "lucide-react";

import { useSubmitFacultyForm } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const facultyFormSchema = z.object({
  papersPublished: z.array(z.object({
    facultyName: z.string().min(1, "Required"),
    designation: z.string().min(1, "Required"),
    titleOfPaper: z.string().min(1, "Required"),
    journalType: z.enum(["Scopus", "SCI", "WOS", "Annexure-1"]),
    monthYear: z.string().min(1, "Required"),
  })),
  booksChapters: z.array(z.object({
    name: z.string().min(1, "Required"),
    designation: z.string().min(1, "Required"),
    titleOfBook: z.string().min(1, "Required"),
    publisherIsbn: z.string().min(1, "Required"),
    monthYear: z.string().min(1, "Required"),
  })),
  patentsGranted: z.array(z.object({
    name: z.string().min(1, "Required"),
    designation: z.string().min(1, "Required"),
    titleOfPatent: z.string().min(1, "Required"),
    designProduct: z.string().min(1, "Required"),
    monthYear: z.string().min(1, "Required"),
  })),
  phdAwardees: z.array(z.object({
    name: z.string().min(1, "Required"),
    designation: z.string().min(1, "Required"),
    branch: z.string().min(1, "Required"),
    university: z.string().min(1, "Required"),
    year: z.string().min(1, "Required"),
    title: z.string().min(1, "Required"),
  })),
});

type FacultyFormValues = z.infer<typeof facultyFormSchema>;

const SECTION_COLORS = [
  "from-blue-700 to-blue-500",
  "from-violet-700 to-violet-500",
  "from-emerald-700 to-emerald-500",
  "from-orange-600 to-amber-500",
];

export default function FacultyFormPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<FacultyFormValues>({
    resolver: zodResolver(facultyFormSchema),
    defaultValues: {
      papersPublished: [{ facultyName: "", designation: "", titleOfPaper: "", journalType: "Scopus", monthYear: "" }],
      booksChapters: [{ name: "", designation: "", titleOfBook: "", publisherIsbn: "", monthYear: "" }],
      patentsGranted: [{ name: "", designation: "", titleOfPatent: "", designProduct: "", monthYear: "" }],
      phdAwardees: [{ name: "", designation: "", branch: "", university: "", year: "", title: "" }],
    }
  });

  const submitMutation = useSubmitFacultyForm();

  function onSubmit(data: FacultyFormValues) {
    submitMutation.mutate({ data }, {
      onSuccess: () => {
        toast({ title: "Submitted successfully!", description: "Faculty data has been recorded." });
        setLocation("/");
      },
      onError: (err) => {
        toast({ title: "Submission failed", description: err.message || "An error occurred.", variant: "destructive" });
      }
    });
  }

  const renderSection = (
    num: number,
    title: string,
    name: "papersPublished" | "booksChapters" | "patentsGranted" | "phdAwardees",
    fieldsConfig: { name: string; label: string; type?: "select"; options?: string[] }[]
  ) => {
    const { fields, append, remove } = useFieldArray({ control: form.control, name });
    const colorClass = SECTION_COLORS[(num - 1) % SECTION_COLORS.length];

    return (
      <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-white">
        {/* Section header */}
        <div className={`bg-gradient-to-r ${colorClass} px-6 py-4 flex items-center gap-3`}>
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white font-black text-sm">
            {num}
          </div>
          <h2 className="text-white font-bold text-lg">{title}</h2>
        </div>

        {/* Entries */}
        <div className="p-5 space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="relative bg-slate-50 border border-slate-200 rounded-xl p-5">
              {/* Entry number + delete */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                  Entry {index + 1}
                </span>
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fieldsConfig.map((config) => (
                  <FormField
                    key={config.name}
                    control={form.control}
                    name={`${name}.${index}.${config.name}` as any}
                    render={({ field: formField }) => (
                      <FormItem>
                        <FormLabel className="text-slate-600 text-xs font-semibold uppercase tracking-wide">
                          {config.label}
                        </FormLabel>
                        {config.type === "select" ? (
                          <Select onValueChange={formField.onChange} defaultValue={formField.value}>
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
                        ) : (
                          <FormControl>
                            <Input className="h-10 bg-white border-slate-300 focus:border-blue-400" {...formField} />
                          </FormControl>
                        )}
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={() => {
              const empty = fieldsConfig.reduce(
                (acc, c) => ({ ...acc, [c.name]: c.type === "select" ? c.options?.[0] ?? "" : "" }),
                {}
              );
              append(empty as any);
            }}
            className="w-full py-3 rounded-xl border-2 border-dashed border-slate-300 text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/30 transition-all text-sm font-semibold flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Another Entry
          </button>
        </div>
      </div>
    );
  };

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
      <div style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 50%, #2563eb 100%)" }} className="py-8 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-6 h-6 text-blue-200" />
            <span className="text-blue-200 text-sm font-semibold">Faculty Data Submission</span>
          </div>
          <h1 className="text-white font-black text-2xl sm:text-3xl mb-1">Faculty Achievements Form</h1>
          <p className="text-blue-200/80 text-sm">Data Collection Period: May 2025 – March 2026</p>
        </div>
      </div>

      {/* Form */}
      <main className="flex-1 container mx-auto px-4 sm:px-6 max-w-4xl py-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

            {renderSection(1, "Papers Published", "papersPublished", [
              { name: "facultyName", label: "Faculty Name" },
              { name: "designation", label: "Designation" },
              { name: "titleOfPaper", label: "Title of Paper" },
              { name: "journalType", label: "Journal Type", type: "select", options: ["Scopus", "SCI", "WOS", "Annexure-1"] },
              { name: "monthYear", label: "Month & Year" },
            ])}

            {renderSection(2, "Book / Book Chapter", "booksChapters", [
              { name: "name", label: "Name" },
              { name: "designation", label: "Designation" },
              { name: "titleOfBook", label: "Title of Book / Chapter" },
              { name: "publisherIsbn", label: "Publisher & ISBN" },
              { name: "monthYear", label: "Month & Year" },
            ])}

            {renderSection(3, "Patent Granted", "patentsGranted", [
              { name: "name", label: "Name" },
              { name: "designation", label: "Designation" },
              { name: "titleOfPatent", label: "Title of Patent" },
              { name: "designProduct", label: "Design / Product" },
              { name: "monthYear", label: "Month & Year" },
            ])}

            {renderSection(4, "PhD Awardees", "phdAwardees", [
              { name: "name", label: "Name" },
              { name: "designation", label: "Designation" },
              { name: "branch", label: "Branch" },
              { name: "university", label: "University" },
              { name: "year", label: "Year of Award" },
              { name: "title", label: "Title of Thesis" },
            ])}

            {/* Submit */}
            <div className="pt-4 pb-8">
              <Button
                type="submit"
                disabled={submitMutation.isPending}
                className="w-full h-13 text-base font-bold rounded-xl shadow-lg"
                style={{ background: "linear-gradient(135deg, #1e40af, #2563eb)", padding: "0.875rem 2rem" }}
              >
                {submitMutation.isPending ? (
                  <span className="flex items-center gap-2">Submitting...</span>
                ) : (
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    Submit Faculty Form
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
