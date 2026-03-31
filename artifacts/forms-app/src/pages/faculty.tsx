import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLocation } from "wouter";
import { Building2, Plus, Trash2, ArrowLeft } from "lucide-react";

import { useSubmitFacultyForm } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";

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
        toast({
          title: "Submission successful",
          description: "Faculty data has been recorded.",
        });
        setLocation("/");
      },
      onError: (err) => {
        toast({
          title: "Submission failed",
          description: err.message || "An unexpected error occurred.",
          variant: "destructive"
        });
      }
    });
  }

  const renderSection = (
    title: string,
    name: "papersPublished" | "booksChapters" | "patentsGranted" | "phdAwardees",
    fieldsConfig: { name: string, label: string, type?: "textarea" | "select", options?: string[] }[]
  ) => {
    const { fields, append, remove } = useFieldArray({ control: form.control, name });

    return (
      <Card className="shadow-sm">
        <CardHeader className="bg-slate-50 border-b border-slate-100 rounded-t-xl">
          <CardTitle className="text-xl font-bold text-slate-800">{title}</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {fields.map((field, index) => (
            <div key={field.id} className="relative p-5 bg-white border border-slate-200 rounded-lg shadow-sm">
              {fields.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 text-destructive hover:bg-destructive/10"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                {fieldsConfig.map((config) => (
                  <FormField
                    key={config.name}
                    control={form.control}
                    name={`${name}.${index}.${config.name}` as any}
                    render={({ field: formField }) => (
                      <FormItem className={config.type === "textarea" ? "md:col-span-2" : ""}>
                        <FormLabel>{config.label}</FormLabel>
                        {config.type === "select" ? (
                          <Select onValueChange={formField.onChange} defaultValue={formField.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
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
                            <Input {...formField} />
                          </FormControl>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const emptyObj = fieldsConfig.reduce((acc, curr) => ({ ...acc, [curr.name]: curr.type === "select" ? curr.options?.[0] : "" }), {});
              append(emptyObj as any);
            }}
            className="w-full border-dashed border-2 hover:bg-slate-50 text-slate-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add More {title}
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-20">
      <header className="border-b bg-white border-slate-200 sticky top-0 z-10">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="-ml-2" onClick={() => setLocation('/')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2 text-primary font-bold text-lg">
              <Building2 className="w-5 h-5" />
              <span>Academic Portal</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 max-w-4xl mt-8 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Faculty Data Submission</h1>
          <p className="text-lg text-primary font-medium">Data Collection Period: May 2025 – March 2026</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {renderSection("1. Papers Published", "papersPublished", [
              { name: "facultyName", label: "Faculty Name" },
              { name: "designation", label: "Designation" },
              { name: "titleOfPaper", label: "Title of Paper" },
              { name: "journalType", label: "Journal Type", type: "select", options: ["Scopus", "SCI", "WOS", "Annexure-1"] },
              { name: "monthYear", label: "Month & Year" },
            ])}

            {renderSection("2. Book / Book Chapter", "booksChapters", [
              { name: "name", label: "Name" },
              { name: "designation", label: "Designation" },
              { name: "titleOfBook", label: "Title of Book/Chapter" },
              { name: "publisherIsbn", label: "Publisher & ISBN" },
              { name: "monthYear", label: "Month & Year" },
            ])}

            {renderSection("3. Patent Granted", "patentsGranted", [
              { name: "name", label: "Name" },
              { name: "designation", label: "Designation" },
              { name: "titleOfPatent", label: "Title of Patent" },
              { name: "designProduct", label: "Design / Product" },
              { name: "monthYear", label: "Month & Year" },
            ])}

            {renderSection("4. PhD Awardees", "phdAwardees", [
              { name: "name", label: "Name" },
              { name: "designation", label: "Designation" },
              { name: "branch", label: "Branch" },
              { name: "university", label: "University" },
              { name: "year", label: "Year of Award" },
              { name: "title", label: "Title of Thesis" },
            ])}

            <Separator className="my-8" />

            <div className="flex justify-end">
              <Button type="submit" size="lg" disabled={submitMutation.isPending} className="w-full md:w-auto min-w-[200px] text-lg font-semibold h-14">
                {submitMutation.isPending ? "Submitting..." : "Submit Faculty Form"}
              </Button>
            </div>
          </form>
        </Form>
      </main>
    </div>
  );
}
