"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { ProtectedRoute } from "@/components/protected-route";
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClipboardCheck, FileText, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

const resultLabels = {
  PASSED: { label: "Bestanden", variant: "success" as const },
  FAILED: { label: "Nicht bestanden", variant: "destructive" as const },
  WARNING: { label: "Warnung", variant: "warning" as const },
};

export default function ReportsPage() {
  const { token } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchReports();
    }
  }, [token]);

  const fetchReports = async () => {
    try {
      const response = await fetch("/api/reports", {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setReports(data);
    } catch (err) {
      console.error("Error fetching reports:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen">
        <AppHeader />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Prüfprotokolle</h1>
          <p className="text-muted-foreground">
            Übersicht aller abgeschlossenen Qualitätsprüfungen
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Protokolle werden geladen...</p>
          </div>
        ) : reports.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <ClipboardCheck className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Noch keine Protokolle</h3>
              <p className="text-muted-foreground mb-4">
                Prüfprotokolle werden nach abgeschlossenen Prüfungen erstellt
              </p>
              <Link href="/test-runs">
                <Button>Dokument prüfen</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {reports.map((report) => (
              <Card key={report.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <CardTitle className="text-lg">
                      {report.testRun.fileName}
                    </CardTitle>
                    <Badge variant={resultLabels[report.overallResult].variant}>
                      {resultLabels[report.overallResult].label}
                    </Badge>
                  </div>
                  <CardDescription>
                    {report.testRun.testPlan.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {report.summary}
                  </p>

                  {report.metadata && (
                    <div className="grid grid-cols-3 gap-2 mb-4 text-xs">
                      <div className="text-center p-2 bg-green-50 rounded">
                        <div className="font-bold text-green-600">
                          {(report.metadata as any).passedCount || 0}
                        </div>
                        <div className="text-muted-foreground">Bestanden</div>
                      </div>
                      <div className="text-center p-2 bg-red-50 rounded">
                        <div className="font-bold text-red-600">
                          {(report.metadata as any).failedCount || 0}
                        </div>
                        <div className="text-muted-foreground">Fehler</div>
                      </div>
                      <div className="text-center p-2 bg-secondary rounded">
                        <div className="font-bold">
                          {(report.metadata as any).stepCount || 0}
                        </div>
                        <div className="text-muted-foreground">Gesamt</div>
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground mb-4">
                    Erstellt: {formatDate(report.createdAt)}
                  </div>

                  <Link href={`/test-runs/${report.testRunId}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      <FileText className="h-4 w-4 mr-2" />
                      Protokoll ansehen
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      </div>
    </ProtectedRoute>
  );
}
