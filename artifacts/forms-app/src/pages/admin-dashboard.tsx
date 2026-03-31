import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { 
  Building2, LogOut, Users, FileText, Activity, ShieldAlert,
  ChevronDown
} from "lucide-react";

import { 
  useGetAdminStats, 
  useGetAllFacultySubmissions, 
  useGetAllStudentSubmissions,
  getGetAdminStatsQueryKey,
  getGetAllFacultySubmissionsQueryKey,
  getGetAllStudentSubmissionsQueryKey
} from "@workspace/api-client-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const t = localStorage.getItem("admin_token");
    if (!t) {
      setLocation("/admin/login");
    } else {
      setToken(t);
    }
  }, [setLocation]);

  const fetchOpts = token ? { request: { headers: { "x-admin-token": token } } } : { query: { enabled: false } };

  const { data: stats, isLoading: statsLoading } = useGetAdminStats({
    query: { enabled: !!token, queryKey: getGetAdminStatsQueryKey() },
    ...fetchOpts
  });

  const { data: facultyData, isLoading: facultyLoading } = useGetAllFacultySubmissions({
    query: { enabled: !!token, queryKey: getGetAllFacultySubmissionsQueryKey() },
    ...fetchOpts
  });

  const { data: studentData, isLoading: studentLoading } = useGetAllStudentSubmissions({
    query: { enabled: !!token, queryKey: getGetAllStudentSubmissionsQueryKey() },
    ...fetchOpts
  });

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    setLocation("/");
  };

  if (!token) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-primary text-primary-foreground border-b border-primary/20 sticky top-0 z-20 shadow-md">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 font-bold text-lg">
            <Building2 className="w-5 h-5 opacity-80" />
            <span>Portal Administration</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-white">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 sm:px-6 py-8 space-y-8">
        
        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Total Faculty Submissions</p>
                <h3 className="text-2xl font-bold text-slate-900">
                  {statsLoading ? "..." : stats?.totalFacultySubmissions || 0}
                </h3>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Total Student Submissions</p>
                <h3 className="text-2xl font-bold text-slate-900">
                  {statsLoading ? "..." : stats?.totalStudentSubmissions || 0}
                </h3>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Recent Activity</p>
                <p className="text-sm font-semibold text-slate-900 mt-1">
                  +{statsLoading ? "..." : stats?.recentFacultySubmissions} Faculty
                  <span className="mx-2 text-slate-300">|</span>
                  +{statsLoading ? "..." : stats?.recentStudentSubmissions} Students
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Data Sections */}
        <Tabs defaultValue="faculty" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 bg-slate-200/50 p-1">
            <TabsTrigger value="faculty" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Faculty Data</TabsTrigger>
            <TabsTrigger value="student" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Student Data</TabsTrigger>
          </TabsList>
          
          <TabsContent value="faculty" className="mt-6">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="bg-white border-b border-slate-100">
                <CardTitle>Faculty Submissions</CardTitle>
                <CardDescription>Comprehensive academic records submitted by department faculty.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {facultyLoading ? (
                  <div className="p-8 text-center text-slate-500">Loading records...</div>
                ) : facultyData?.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">No faculty submissions yet.</div>
                ) : (
                  <Accordion type="multiple" className="w-full">
                    {facultyData?.map((sub, i) => (
                      <AccordionItem value={`item-${sub.id}`} key={sub.id} className="border-b border-slate-100 last:border-0 px-6">
                        <AccordionTrigger className="hover:no-underline py-4">
                          <div className="flex flex-col sm:flex-row sm:items-center w-full text-left gap-2 sm:gap-6 pr-4">
                            <span className="font-semibold text-slate-900">Submission #{i+1}</span>
                            <Badge variant="secondary" className="w-fit text-xs bg-slate-100 text-slate-600">
                              {new Date(sub.createdAt).toLocaleDateString()}
                            </Badge>
                            <span className="text-sm text-slate-500 sm:ml-auto">
                              ID: {sub.id.slice(0,8)}...
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-6">
                          <div className="bg-slate-50 rounded-lg p-5 space-y-8 border border-slate-200/60">
                            
                            {sub.data.papersPublished?.length > 0 && (
                              <div>
                                <h4 className="font-bold text-slate-800 mb-3 border-b pb-2">Papers Published</h4>
                                <ul className="space-y-3">
                                  {sub.data.papersPublished.map((p, idx) => (
                                    <li key={idx} className="bg-white p-3 rounded border border-slate-100 shadow-sm text-sm">
                                      <div className="font-medium text-slate-900">{p.titleOfPaper}</div>
                                      <div className="text-slate-600 mt-1 grid grid-cols-2 gap-1">
                                        <span>Author: {p.facultyName} ({p.designation})</span>
                                        <span>Journal: {p.journalType}</span>
                                        <span>Date: {p.monthYear}</span>
                                      </div>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {sub.data.booksChapters?.length > 0 && (
                              <div>
                                <h4 className="font-bold text-slate-800 mb-3 border-b pb-2">Books & Chapters</h4>
                                <ul className="space-y-3">
                                  {sub.data.booksChapters.map((b, idx) => (
                                    <li key={idx} className="bg-white p-3 rounded border border-slate-100 shadow-sm text-sm">
                                      <div className="font-medium text-slate-900">{b.titleOfBook}</div>
                                      <div className="text-slate-600 mt-1 grid grid-cols-2 gap-1">
                                        <span>Author: {b.name} ({b.designation})</span>
                                        <span>Publisher/ISBN: {b.publisherIsbn}</span>
                                        <span>Date: {b.monthYear}</span>
                                      </div>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {sub.data.patentsGranted?.length > 0 && (
                              <div>
                                <h4 className="font-bold text-slate-800 mb-3 border-b pb-2">Patents Granted</h4>
                                <ul className="space-y-3">
                                  {sub.data.patentsGranted.map((p, idx) => (
                                    <li key={idx} className="bg-white p-3 rounded border border-slate-100 shadow-sm text-sm">
                                      <div className="font-medium text-slate-900">{p.titleOfPatent}</div>
                                      <div className="text-slate-600 mt-1 grid grid-cols-2 gap-1">
                                        <span>Inventor: {p.name} ({p.designation})</span>
                                        <span>Product: {p.designProduct}</span>
                                        <span>Date: {p.monthYear}</span>
                                      </div>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="student" className="mt-6">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="bg-white border-b border-slate-100">
                <CardTitle>Student Submissions</CardTitle>
                <CardDescription>General information records submitted by students.</CardDescription>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="w-[200px] font-semibold">Student Name</TableHead>
                      <TableHead className="font-semibold">Email Address</TableHead>
                      <TableHead className="font-semibold">Additional Info</TableHead>
                      <TableHead className="text-right font-semibold">Date Submitted</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentLoading ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-slate-500">Loading records...</TableCell>
                      </TableRow>
                    ) : studentData?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-slate-500">No student submissions yet.</TableCell>
                      </TableRow>
                    ) : (
                      studentData?.map((sub) => (
                        <TableRow key={sub.id} className="hover:bg-slate-50/50">
                          <TableCell className="font-medium text-slate-900">{sub.name}</TableCell>
                          <TableCell className="text-slate-600">{sub.email}</TableCell>
                          <TableCell className="text-slate-600 max-w-xs truncate" title={sub.customField}>
                            {sub.customField}
                          </TableCell>
                          <TableCell className="text-right text-slate-500">
                            {new Date(sub.createdAt).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

      </main>
    </div>
  );
}
