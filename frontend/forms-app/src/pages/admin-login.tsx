import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLocation } from "wouter";
import { ShieldCheck, Lock, ArrowLeft, Award } from "lucide-react";

import { useAdminLogin } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const loginSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

export default function AdminLoginPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { password: "" }
  });

  const loginMutation = useAdminLogin();

  function onSubmit(data: z.infer<typeof loginSchema>) {
    loginMutation.mutate({ data }, {
      onSuccess: (res) => {
        localStorage.setItem("admin_token", res.token);
        toast({ title: "Access Granted", description: "Welcome to the Admin Dashboard" });
        setLocation("/admin");
      },
      onError: (err) => {
        toast({ title: "Authentication Failed", description: err.message || "Invalid password", variant: "destructive" });
      }
    });
  }

  return (
    <div className="app-shell">
      <div className="page-frame flex min-h-screen items-center py-10">
        <div className="grid w-full gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="hero-panel flex flex-col justify-between px-6 py-8 sm:px-8 lg:px-10">
            <div>
              <span className="editorial-eyebrow">
                <Award className="h-3.5 w-3.5" />
                Annual Day 2026
              </span>
              <h1 className="mt-6 max-w-xl text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl">
                Secure admin access for review and export.
              </h1>
              <p className="mt-5 max-w-lg text-sm leading-7 text-slate-600 sm:text-base">
                Use the administration portal to review student and faculty submissions, search records, and prepare export-ready data for the Annual Day programme.
              </p>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="surface-muted p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Access Type
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-900">
                  Restricted login
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Password-protected entry for staff handling approvals and reporting.
                </p>
              </div>
              <div className="surface-muted p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Data Window
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-900">
                  May 2025 – March 2026
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Records cover the current Annual Day academic collection cycle.
                </p>
              </div>
            </div>
          </section>

          <section className="surface-panel flex items-center px-6 py-8 sm:px-8 lg:px-10">
            <div className="mx-auto w-full max-w-md">
              <Button
                variant="ghost"
                size="sm"
                className="-ml-2 mb-8 gap-1.5 text-slate-500 hover:text-slate-900"
                onClick={() => setLocation("/")}
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Button>

              <div className="mb-8">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-sm">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h2 className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-slate-950">
                  Admin sign in
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Enter the administration password to continue to the dashboard.
                </p>
              </div>

              <Card className="border-stone-200/80 bg-white shadow-none">
                <CardContent className="p-6">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                              Password
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <Input
                                  type="password"
                                  placeholder="Enter admin password"
                                  className="h-12 rounded-2xl border-stone-300 bg-stone-50 pl-11 shadow-none focus:border-slate-400"
                                  autoComplete="current-password"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        disabled={loginMutation.isPending}
                        className="h-12 w-full rounded-full bg-slate-950 text-sm font-semibold uppercase tracking-[0.12em] text-white hover:bg-slate-800"
                      >
                        {loginMutation.isPending ? "Verifying..." : "Access Dashboard"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
