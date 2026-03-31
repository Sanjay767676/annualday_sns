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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";

const studentFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  customField: z.string().min(1, "Please provide additional information"),
  semesterToppers: z.array(z.object({
    classBranch: z.string().min(1, "Required"),
    registerNumber: z.string().min(1, "Required"),
    studentName: z.string().min(1, "Required"),
    percentage: z.string().min(1, "Required"),
  })),
  remarkableAchievements: z.array(z.object({
    studentName: z.string().min(1, "Required"),
    classBranch: z.string().min(1, "Required"),
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
      name: "",
      email: "",
      customField: "",
      semesterToppers: [{ classBranch: "", registerNumber: "", studentName: "", percentage: "" }],
      remarkableAchievements: [{ studentName: "", classBranch: "", achievementDetails: "" }],
    }
  });

  const semesterToppersField = useFieldArray({ control: form.control, name: "semesterToppers" });
  const remarkableAchievementsField = useFieldArray({ control: form.control, name: "remarkableAchievements" });

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

            {/* Basic Details */}
            <Card className="shadow-sm">
              <CardHeader className="bg-slate-50 border-b border-slate-100 rounded-t-xl">
                <CardTitle className="text-xl font-bold text-slate-800">Basic Details</CardTitle>
                <CardDescription>All fields are required</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="student@university.edu" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="customField"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Information</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Provide any relevant additional details..." className="min-h-[100px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Semester Toppers */}
            <Card className="shadow-sm">
              <CardHeader className="bg-slate-50 border-b border-slate-100 rounded-t-xl">
                <CardTitle className="text-xl font-bold text-slate-800">1. Semester Topper</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {semesterToppersField.fields.map((field, index) => (
                  <div key={field.id} className="relative p-5 bg-white border border-slate-200 rounded-lg shadow-sm">
                    {semesterToppersField.fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 text-destructive hover:bg-destructive/10"
                        onClick={() => semesterToppersField.remove(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                      <FormField
                        control={form.control}
                        name={`semesterToppers.${index}.classBranch`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormLabel>Class / Branch</FormLabel>
                            <FormControl><Input {...f} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`semesterToppers.${index}.registerNumber`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormLabel>Register Number</FormLabel>
                            <FormControl><Input {...f} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`semesterToppers.${index}.studentName`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormLabel>Student Name</FormLabel>
                            <FormControl><Input {...f} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`semesterToppers.${index}.percentage`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormLabel>Percentage / CGPA</FormLabel>
                            <FormControl><Input {...f} /></FormControl>
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
                  onClick={() => semesterToppersField.append({ classBranch: "", registerNumber: "", studentName: "", percentage: "" })}
                  className="w-full border-dashed border-2 hover:bg-slate-50 text-slate-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add More Semester Topper
                </Button>
              </CardContent>
            </Card>

            {/* Remarkable Achievements */}
            <Card className="shadow-sm">
              <CardHeader className="bg-slate-50 border-b border-slate-100 rounded-t-xl">
                <CardTitle className="text-xl font-bold text-slate-800">2. Remarkable Achievements</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {remarkableAchievementsField.fields.map((field, index) => (
                  <div key={field.id} className="relative p-5 bg-white border border-slate-200 rounded-lg shadow-sm">
                    {remarkableAchievementsField.fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 text-destructive hover:bg-destructive/10"
                        onClick={() => remarkableAchievementsField.remove(index)}
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
                            <FormLabel>Student Name</FormLabel>
                            <FormControl><Input {...f} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`remarkableAchievements.${index}.classBranch`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormLabel>Class / Branch</FormLabel>
                            <FormControl><Input {...f} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`remarkableAchievements.${index}.achievementDetails`}
                        render={({ field: f }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Achievement Details</FormLabel>
                            <FormControl>
                              <Textarea className="min-h-[100px]" {...f} />
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
                  onClick={() => remarkableAchievementsField.append({ studentName: "", classBranch: "", achievementDetails: "" })}
                  className="w-full border-dashed border-2 hover:bg-slate-50 text-slate-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add More Achievement
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
