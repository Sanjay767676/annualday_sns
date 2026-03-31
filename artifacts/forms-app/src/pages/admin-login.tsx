import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link, useLocation } from "wouter";
import { ShieldCheck, ArrowLeft, Lock } from "lucide-react";

import { useAdminLogin } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
        toast({
          title: "Access Granted",
          description: "Welcome to the Admin Dashboard",
        });
        setLocation("/admin");
      },
      onError: (err) => {
        toast({
          title: "Login Failed",
          description: err.message || "Invalid password",
          variant: "destructive"
        });
      }
    });
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-20">
      <header className="absolute top-0 w-full p-6">
        <Button variant="ghost" className="gap-2 text-slate-600" onClick={() => setLocation('/')}>
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-primary shadow-sm border border-primary/20">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Department Admin</h1>
            <p className="text-slate-500 mt-2">Secure access for authorized personnel only</p>
          </div>

          <Card className="shadow-xl border-slate-200">
            <CardContent className="p-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Admin Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                            <Input 
                              type="password" 
                              placeholder="Enter portal password" 
                              className="pl-10"
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" size="lg" disabled={loginMutation.isPending} className="w-full font-semibold">
                    {loginMutation.isPending ? "Authenticating..." : "Access Dashboard"}
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
