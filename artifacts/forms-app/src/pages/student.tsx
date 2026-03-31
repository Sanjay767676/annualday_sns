import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link, useLocation } from "wouter";
import { Building2, ArrowLeft, GraduationCap } from "lucide-react";

import { useSubmitStudentForm } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const studentFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  customField: z.string().min(1, "Please provide additional information"),
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
    }
  });

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

      <main className="flex-1 flex flex-col items-center py-12 px-4 sm:px-6">
        <div className="w-full max-w-xl space-y-8">
          <div className="space-y-2 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
              <GraduationCap className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Student Information Form</h1>
            <p className="text-slate-500">Please provide your details below.</p>
          </div>

          <Card className="shadow-lg border-slate-200">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 rounded-t-xl">
              <CardTitle>Basic Details</CardTitle>
              <CardDescription>All fields are required</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  
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
                          <Textarea placeholder="Provide any relevant additional details..." className="min-h-[120px]" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" size="lg" disabled={submitMutation.isPending} className="w-full text-base h-12">
                    {submitMutation.isPending ? "Submitting..." : "Submit Student Data"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
