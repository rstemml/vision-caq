import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default async function AnalyticsPage() {
  const [testPlans, testRuns, testReports] = await Promise.all([
    prisma.testPlan.count(),
    prisma.testRun.count(),
    prisma.testReport.findMany({
      select: {
        overallResult: true,
      },
    }),
  ]);

  const passed = testReports.filter((r) => r.overallResult === "PASSED").length;
  const failed = testReports.filter((r) => r.overallResult === "FAILED").length;
  const warnings = testReports.filter((r) => r.overallResult === "WARNING").length;

  const passRate = testReports.length > 0
    ? ((passed / testReports.length) * 100).toFixed(1)
    : "0.0";

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="text-2xl font-bold text-primary">
            Vision CAQ
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Auswertungen</h1>
          <p className="text-muted-foreground">
            Übersicht über Ihre Qualitätsprüfungen
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Prüfpläne</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{testPlans}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Durchgeführte Prüfungen</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{testRuns}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Erfolgsquote</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{passRate}%</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Abgeschlossene Protokolle</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{testReports.length}</div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Ergebnisverteilung</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Bestanden</span>
                  <span className="text-sm text-muted-foreground">{passed}</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{
                      width: testReports.length > 0
                        ? `${(passed / testReports.length) * 100}%`
                        : "0%",
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Nicht bestanden</span>
                  <span className="text-sm text-muted-foreground">{failed}</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-red-500 h-2 rounded-full"
                    style={{
                      width: testReports.length > 0
                        ? `${(failed / testReports.length) * 100}%`
                        : "0%",
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Warnungen</span>
                  <span className="text-sm text-muted-foreground">{warnings}</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-yellow-500 h-2 rounded-full"
                    style={{
                      width: testReports.length > 0
                        ? `${(warnings / testReports.length) * 100}%`
                        : "0%",
                    }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {testReports.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Noch keine Daten</h3>
              <p className="text-muted-foreground">
                Führen Sie Prüfungen durch, um Auswertungen zu sehen
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
