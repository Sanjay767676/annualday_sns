import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLocation } from "wouter";
import { ShieldCheck, Lock, ArrowLeft } from "lucide-react";

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
      <div className="page-frame flex min-h-screen items-center justify-center py-10">
        <section className="surface-panel w-full max-w-md px-6 py-8 sm:px-8">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 mb-6 gap-1.5 text-slate-500 hover:text-slate-900"
            onClick={() => setLocation("/")}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>

          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-white">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-semibold text-slate-950">Admin Login</h1>
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
        </section>
      </div>
    </div>
  );
}
