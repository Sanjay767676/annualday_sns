import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLocation } from "wouter";
import { Building2, ArrowLeft, GraduationCap, Plus, Trash2 } from "lucide-react";

import { useSubmitStudentForm } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";

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
        toast({
          title: "Submission successful",
          description: "Student data has been recorded.",
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
          <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Student Information Form</h1>
          <p className="text-slate-500">Data Collection Period: May 2025 – March 2026</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

            {/* Section 1: First Rank Holders */}
            <Card className="shadow-sm">
              <CardHeader className="bg-slate-50 border-b border-slate-100 rounded-t-xl">
                <CardTitle className="text-xl font-bold text-slate-800">1. First rank holder upto Nov/Dec 2025</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {firstRankField.fields.map((field, index) => (
                  <div key={field.id} className="relative p-5 bg-white border border-slate-200 rounded-lg shadow-sm">
                    {firstRankField.fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 text-destructive hover:bg-destructive/10"
                        onClick={() => firstRankField.remove(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                      <FormField
                        control={form.control}
                        name={`firstRankHolders.${index}.studentName`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormLabel>Name of the student</FormLabel>
                            <FormControl><Input {...f} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`firstRankHolders.${index}.yearOfStudy`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormLabel>Year of study</FormLabel>
                            <FormControl><Input placeholder="e.g. II Year" {...f} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`firstRankHolders.${index}.ugPg`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormLabel>UG / PG</FormLabel>
                            <Select onValueChange={f.onChange} defaultValue={f.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {ugPgOptions.map(opt => (
                                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`firstRankHolders.${index}.department`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormLabel>Department</FormLabel>
                            <FormControl><Input {...f} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`firstRankHolders.${index}.regNumber`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormLabel>Reg number</FormLabel>
                            <FormControl><Input {...f} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`firstRankHolders.${index}.percentageSecured`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormLabel>Percentage secured (cumulative from I sem with arrear)</FormLabel>
                            <FormControl><Input placeholder="e.g. 92.5%" {...f} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => firstRankField.append({ studentName: "", yearOfStudy: "", ugPg: "UG", department: "", regNumber: "", percentageSecured: "" })}
                  className="w-full border-dashed border-2 hover:bg-slate-50 text-slate-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add More
                </Button>
              </CardContent>
            </Card>

            {/* Section 2: Semester Wise First Rank Class Wise */}
            <Card className="shadow-sm">
              <CardHeader className="bg-slate-50 border-b border-slate-100 rounded-t-xl">
                <CardTitle className="text-xl font-bold text-slate-800">2. Semester wise first rank class wise</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {semesterWiseField.fields.map((field, index) => (
                  <div key={field.id} className="relative p-5 bg-white border border-slate-200 rounded-lg shadow-sm">
                    {semesterWiseField.fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 text-destructive hover:bg-destructive/10"
                        onClick={() => semesterWiseField.remove(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                      <FormField
                        control={form.control}
                        name={`semesterWiseRankers.${index}.studentName`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormLabel>Name of the student</FormLabel>
                            <FormControl><Input {...f} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`semesterWiseRankers.${index}.department`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormLabel>Department</FormLabel>
                            <FormControl><Input {...f} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`semesterWiseRankers.${index}.yearOfStudy`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormLabel>Year of study</FormLabel>
                            <FormControl><Input placeholder="e.g. III Year" {...f} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`semesterWiseRankers.${index}.ugPg`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormLabel>UG / PG</FormLabel>
                            <Select onValueChange={f.onChange} defaultValue={f.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {ugPgOptions.map(opt => (
                                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`semesterWiseRankers.${index}.percentageSecured`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormLabel>Percentage secured</FormLabel>
                            <FormControl><Input placeholder="e.g. 88.3%" {...f} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => semesterWiseField.append({ studentName: "", department: "", yearOfStudy: "", ugPg: "UG", percentageSecured: "" })}
                  className="w-full border-dashed border-2 hover:bg-slate-50 text-slate-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add More
                </Button>
              </CardContent>
            </Card>

            {/* Section 3: Remarkable Achievements */}
            <Card className="shadow-sm">
              <CardHeader className="bg-slate-50 border-b border-slate-100 rounded-t-xl">
                <CardTitle className="text-xl font-bold text-slate-800">3. Remarkable achievement by student</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {achievementsField.fields.map((field, index) => (
                  <div key={field.id} className="relative p-5 bg-white border border-slate-200 rounded-lg shadow-sm">
                    {achievementsField.fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 text-destructive hover:bg-destructive/10"
                        onClick={() => achievementsField.remove(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                      <FormField
                        control={form.control}
                        name={`remarkableAchievements.${index}.studentName`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormLabel>Name of the student</FormLabel>
                            <FormControl><Input {...f} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`remarkableAchievements.${index}.department`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormLabel>Department</FormLabel>
                            <FormControl><Input {...f} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`remarkableAchievements.${index}.yearOfStudy`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormLabel>Year of study</FormLabel>
                            <FormControl><Input placeholder="e.g. IV Year" {...f} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`remarkableAchievements.${index}.achievementDetails`}
                        render={({ field: f }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>List of achievement in detailed</FormLabel>
                            <FormControl>
                              <Textarea className="min-h-[120px]" placeholder="Describe the achievement in detail..." {...f} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => achievementsField.append({ studentName: "", department: "", yearOfStudy: "", achievementDetails: "" })}
                  className="w-full border-dashed border-2 hover:bg-slate-50 text-slate-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add More
                </Button>
              </CardContent>
            </Card>

            <Separator className="my-8" />

            <div className="flex justify-end">
              <Button type="submit" size="lg" disabled={submitMutation.isPending} className="w-full md:w-auto min-w-[200px] text-lg font-semibold h-14">
                {submitMutation.isPending ? "Submitting..." : "Submit Student Form"}
              </Button>
            </div>
          </form>
        </Form>
      </main>
    </div>
  );
}
