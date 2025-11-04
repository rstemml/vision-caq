"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ProtectedRoute } from "@/components/protected-route";
import { AppHeader } from "@/components/app-header";
import { PDFViewer } from "@/components/pdf-viewer";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle2, XCircle, AlertTriangle, FileText, Loader2 } from "lucide-react";
import { formatDate, formatFileSize } from "@/lib/utils";

const statusLabels = {
  PENDING: { label: "Ausstehend", variant: "secondary" as const },
  IN_PROGRESS: { label: "In Bearbeitung", variant: "warning" as const },
  COMPLETED: { label: "Abgeschlossen", variant: "success" as const },
  FAILED: { label: "Fehlgeschlagen", variant: "destructive" as const },
};

const resultIcons = {
  PASSED: <CheckCircle2 className="h-5 w-5 text-green-500" />,
  FAILED: <XCircle className="h-5 w-5 text-red-500" />,
  WARNING: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
  NOT_APPLICABLE: <FileText className="h-5 w-5 text-gray-500" />,
};

const resultLabels = {
  PASSED: { label: "Bestanden", variant: "success" as const },
  FAILED: { label: "Nicht bestanden", variant: "destructive" as const },
  WARNING: { label: "Warnung", variant: "warning" as const },
  NOT_APPLICABLE: { label: "Nicht zutreffend", variant: "secondary" as const },
};

export default function TestRunDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const [testRun, setTestRun] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const testRunId = params.id as string;

  useEffect(() => {
    if (token && testRunId) {
      fetchTestRun();
    }
  }, [token, testRunId]);

  const fetchTestRun = async () => {
    try {
      const response = await fetch(`/api/test-runs/${testRunId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          setError("Prüfung nicht gefunden");
        } else {
          setError("Fehler beim Laden der Prüfung");
        }
        setLoading(false);
        return;
      }

      const data = await response.json();
      setTestRun(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching test run:", err);
      setError("Fehler beim Laden der Prüfung");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen">
          <AppHeader />
          <div className="container mx-auto px-4 py-16 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Prüfung wird geladen...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !testRun) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen">
          <AppHeader />
          <div className="container mx-auto px-4 py-16 text-center">
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">{error || "Prüfung nicht gefunden"}</h2>
            <Link href="/test-runs">
              <Button className="mt-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Zurück zur Übersicht
              </Button>
            </Link>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // Group results by procedure
  const resultsByProcedure = testRun.testPlan?.procedures.map((procedure: any) => ({
    procedure,
    results: testRun.testResults.filter((result: any) =>
      procedure.steps.some((step: any) => step.id === result.stepId)
    ),
  })) || [];

  const pdfUrl = `/api/test-runs/${testRunId}/pdf`;

  return (
    <ProtectedRoute>
      <div className="min-h-screen">
        <AppHeader />

        <main className="container mx-auto px-4 py-8">
          <Link href="/test-runs">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zurück zur Übersicht
            </Button>
          </Link>

          <div className="mb-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">{testRun.fileName}</h1>
                <p className="text-muted-foreground">{testRun.testPlan?.name}</p>
              </div>
              <div className="flex gap-2">
                <Badge variant={statusLabels[testRun.status].variant}>
                  {statusLabels[testRun.status].label}
                </Badge>
                {testRun.testReport && (
                  <Badge variant={resultLabels[testRun.testReport.overallResult].variant}>
                    {resultLabels[testRun.testReport.overallResult].label}
                  </Badge>
                )}
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Prüfungsinformationen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Dateigröße:</span>
                    <p className="font-medium">{formatFileSize(testRun.fileSize)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Gestartet:</span>
                    <p className="font-medium">{formatDate(testRun.startedAt)}</p>
                  </div>
                  {testRun.completedAt && (
                    <div>
                      <span className="text-muted-foreground">Abgeschlossen:</span>
                      <p className="font-medium">{formatDate(testRun.completedAt)}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Prüfschritte:</span>
                    <p className="font-medium">{testRun.testResults?.length || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {testRun.testReport && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Zusammenfassung</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4">{testRun.testReport.summary}</p>

                {testRun.testReport.metadata && (
                  <div className="grid grid-cols-3 gap-4 p-4 bg-secondary/30 rounded-md">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {testRun.testReport.metadata.passedCount || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Bestanden</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {testRun.testReport.metadata.failedCount || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Fehlgeschlagen</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {testRun.testReport.metadata.stepCount || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Gesamt</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Side-by-side: PDF + Results */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* PDF Viewer */}
            <div>
              <h2 className="text-2xl font-bold mb-4">Dokument</h2>
              <PDFViewer fileUrl={pdfUrl} />
            </div>

            {/* Test Results */}
            <div>
              <h2 className="text-2xl font-bold mb-4">Prüfergebnisse</h2>

              {testRun.status === "IN_PROGRESS" && (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Prüfung läuft...</h3>
                    <p className="text-muted-foreground">
                      Die Analyse des Dokuments ist in Bearbeitung. Bitte warten Sie.
                    </p>
                  </CardContent>
                </Card>
              )}

              {testRun.status === "FAILED" && (
                <Card>
                  <CardContent className="py-12 text-center">
                    <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Prüfung fehlgeschlagen</h3>
                    <p className="text-muted-foreground">
                      Bei der Analyse des Dokuments ist ein Fehler aufgetreten.
                    </p>
                  </CardContent>
                </Card>
              )}

              {testRun.status === "COMPLETED" && (
                <div className="space-y-4">
                  {resultsByProcedure.map(({ procedure, results }: any) => (
                    <Card key={procedure.id}>
                      <CardHeader>
                        <CardTitle className="text-lg">{procedure.name}</CardTitle>
                        {procedure.description && (
                          <CardDescription>{procedure.description}</CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {results.map((result: any) => (
                            <div
                              key={result.id}
                              className="flex gap-3 p-3 border rounded-lg"
                            >
                              <div className="flex-shrink-0 mt-1">
                                {resultIcons[result.result]}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <span className="font-medium">{result.step.name}</span>
                                  <Badge variant={resultLabels[result.result].variant} className="text-xs">
                                    {resultLabels[result.result].label}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {result.step.description}
                                </p>
                                {result.message && (
                                  <p className="text-sm bg-secondary/30 p-2 rounded">
                                    {result.message}
                                  </p>
                                )}
                                {result.details && Object.keys(result.details).length > 0 && (
                                  <details className="mt-2 text-sm">
                                    <summary className="cursor-pointer text-primary hover:underline">
                                      Details anzeigen
                                    </summary>
                                    <pre className="mt-2 p-2 bg-secondary/30 rounded overflow-auto text-xs">
                                      {JSON.stringify(result.details, null, 2)}
                                    </pre>
                                  </details>
                                )}
                              </div>
                            </div>
                          ))}

                          {results.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              Keine Ergebnisse für diese Prozedur
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
