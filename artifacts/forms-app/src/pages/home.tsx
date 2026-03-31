import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, GraduationCap, ArrowRight, ShieldCheck } from "lucide-react";

export default function Home() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="border-b bg-white border-slate-200">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary font-bold text-lg">
            <Building2 className="w-5 h-5" />
            <span>Academic Portal</span>
          </div>
          <Button variant="outline" className="gap-2" onClick={() => setLocation('/admin/login')}>
            <ShieldCheck className="w-4 h-4" />
            Admin Login
          </Button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="max-w-2xl w-full text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
              Department Data Collection
            </h1>
            <p className="text-lg text-slate-600 max-w-xl mx-auto">
              Securely submit academic records, remarkable achievements, and administrative reporting for the current academic period.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mt-12">
            <Card className="hover:shadow-lg transition-all duration-300 border-slate-200">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 text-primary">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <CardTitle className="text-2xl">Student Portal</CardTitle>
                <CardDescription className="text-slate-600">
                  Submit student academic records, general information, and specialized departmental data.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full gap-2" size="lg" onClick={() => setLocation('/student')}>
                  Access Student Form
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 border-slate-200">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 text-primary">
                  <Building2 className="w-6 h-6" />
                </div>
                <CardTitle className="text-2xl">Faculty Portal</CardTitle>
                <CardDescription className="text-slate-600">
                  Submit publications, granted patents, book chapters, and scholarly achievements.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full gap-2" size="lg" onClick={() => setLocation('/faculty')}>
                  Access Faculty Form
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
