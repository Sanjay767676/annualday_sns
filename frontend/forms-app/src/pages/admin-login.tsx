import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLocation } from "wouter";
import { ShieldCheck, Lock, ArrowLeft, GraduationCap, Award } from "lucide-react";

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
    <div className="min-h-screen flex flex-col lg:flex-row">

      {/* Left panel – branding */}
      <div
        className="hidden lg:flex lg:w-5/12 flex-col justify-between p-10"
        style={{ background: "linear-gradient(160deg, #050d1a 0%, #0c1f3d 55%, #0f1535 100%)" }}
      >
        <div>
          <div className="flex items-center gap-3 mb-12">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-lg"
              style={{ background: "linear-gradient(135deg, #1d4ed8, #3b82f6)" }}
            >
              SNS
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">SNS College of Technology</p>
              <p className="text-white/35 text-xs">Coimbatore – 641 107</p>
            </div>
          </div>

          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 text-xs font-bold uppercase tracking-widest"
            style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)", color: "#fbbf24" }}
          >
            <Award className="w-3 h-3" />
            Annual Day 2026
          </div>

          <h2 className="text-white font-black text-4xl leading-tight mb-3">
            Administration
            <br />
            <span style={{ background: "linear-gradient(90deg, #f59e0b, #fbbf24)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              Portal
            </span>
          </h2>
          <p className="text-white/40 text-sm leading-relaxed">
            Secure access to manage faculty and student data submissions for the Annual Day 2026 data collection portal.
          </p>
        </div>

        <div className="border-t border-white/10 pt-6">
          <p className="text-white/25 text-xs">
            Data Collection · May 2025 – March 2026
          </p>
        </div>
      </div>

      {/* Right panel – login form */}
      <div className="flex-1 flex flex-col bg-slate-50">

        {/* Mobile header */}
        <div
          className="lg:hidden h-1 w-full"
          style={{ background: "linear-gradient(90deg, #b45309, #f59e0b, #fbbf24)" }}
        />
        <div className="lg:hidden px-5 py-4 bg-white border-b border-slate-200 flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-xs"
            style={{ background: "linear-gradient(135deg, #1d4ed8, #3b82f6)" }}
          >
            SNS
          </div>
          <span className="text-slate-700 font-bold text-sm">SNS College of Technology</span>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-5 py-10">
          <div className="w-full max-w-sm">

            <Button
              variant="ghost"
              size="sm"
              className="mb-8 -ml-2 text-slate-500 hover:text-slate-800 gap-1.5"
              onClick={() => setLocation("/")}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>

            <div className="mb-8">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 shadow-md"
                style={{ background: "linear-gradient(135deg, #1e40af, #3b82f6)" }}
              >
                <ShieldCheck className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 mb-1">Admin Sign In</h1>
              <p className="text-slate-500 text-sm">
                Annual Day 2026 · Data Collection Portal
              </p>
            </div>

            <Card className="shadow-lg border-slate-200">
              <CardContent className="p-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700 font-semibold">Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                              <Input
                                type="password"
                                placeholder="Enter admin password"
                                className="pl-10 h-11 border-slate-300 focus:border-blue-500"
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
                      className="w-full h-11 font-semibold text-sm"
                      style={{ background: "linear-gradient(135deg, #1e40af, #3b82f6)" }}
                    >
                      {loginMutation.isPending ? "Verifying..." : "Access Dashboard"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
}
