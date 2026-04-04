import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLocation } from "wouter";
import { ShieldCheck, Lock, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

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
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="app-shell relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(125,211,252,0.35),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(167,243,208,0.28),_transparent_28%),linear-gradient(180deg,_#f8fbff_0%,_#edf6ff_52%,_#f7fbff_100%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-10 top-16 h-72 w-72 rounded-full bg-cyan-300/25 blur-3xl" />
        <div className="absolute right-0 top-40 h-80 w-80 rounded-full bg-sky-300/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 h-80 w-80 rounded-full bg-emerald-300/20 blur-3xl" />
      </div>
      <div className="page-frame flex min-h-screen items-center justify-center py-10">
        <section className="w-full max-w-md rounded-[2rem] border border-white/40 bg-white/55 px-6 py-8 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur-2xl sm:px-8">
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
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950/90 text-white shadow-[0_10px_30px_rgba(15,23,42,0.2)] ring-1 ring-white/20 backdrop-blur-xl">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-semibold text-slate-950">Admin Login</h1>
          </div>

          <Card className="border-white/40 bg-white/55 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-2xl">
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
                          <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="Enter admin password"
                              className="h-12 rounded-2xl border-white/60 bg-white/70 pl-11 pr-11 shadow-[0_12px_30px_rgba(15,23,42,0.06)] focus:border-slate-400 focus:bg-white/85 transition-all backdrop-blur-xl"
                              autoComplete="current-password"
                              {...field}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 transition-colors"
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    disabled={loginMutation.isPending}
                    className="h-12 w-full rounded-full bg-slate-950/95 text-sm font-semibold uppercase tracking-[0.12em] text-white shadow-[0_14px_36px_rgba(15,23,42,0.22)] hover:bg-slate-800"
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
