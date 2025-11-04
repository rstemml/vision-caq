"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, Loader2 } from "lucide-react";
import { formatDate, formatFileSize } from "@/lib/utils";

const statusLabels = {
  PENDING: { label: "Ausstehend", variant: "secondary" as const },
  IN_PROGRESS: { label: "In Bearbeitung", variant: "warning" as const },
  COMPLETED: { label: "Abgeschlossen", variant: "success" as const },
  FAILED: { label: "Fehlgeschlagen", variant: "destructive" as const },
};

const resultLabels = {
  PASSED: { label: "Bestanden", variant: "success" as const },
  FAILED: { label: "Nicht bestanden", variant: "destructive" as const },
  WARNING: { label: "Warnung", variant: "warning" as const },
};

export default function TestRunsPage() {
  const [testPlans, setTestPlans] = useState<any[]>([]);
  const [testRuns, setTestRuns] = useState<any[]>([]);
  const [selectedTestPlan, setSelectedTestPlan] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTestPlans();
    fetchTestRuns();
  }, []);

  const fetchTestPlans = async () => {
    try {
      const response = await fetch("/api/test-plans?active=true");
      const data = await response.json();
      setTestPlans(data);
    } catch (error) {
      console.error("Error fetching test plans:", error);
    }
  };

  const fetchTestRuns = async () => {
    try {
      const response = await fetch("/api/test-runs");
      const data = await response.json();
      setTestRuns(data);
    } catch (error) {
      console.error("Error fetching test runs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file || !selectedTestPlan) {
      alert("Bitte wählen Sie eine Datei und einen Prüfplan aus");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("testPlanId", selectedTestPlan);

      const response = await fetch("/api/test-runs", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      // Reset form
      setFile(null);
      setSelectedTestPlan("");
      const fileInput = document.getElementById("file-upload") as HTMLInputElement;
      if (fileInput) fileInput.value = "";

      // Refresh test runs
      await fetchTestRuns();

      alert("Dokument erfolgreich hochgeladen! Die Analyse läuft im Hintergrund.");
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Fehler beim Hochladen der Datei");
    } finally {
      setUploading(false);
    }
  };

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
        <h1 className="text-3xl font-bold mb-8">Dokument prüfen</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>PDF hochladen</CardTitle>
                <CardDescription>
                  Laden Sie ein PDF zur Qualitätsprüfung hoch
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpload} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="test-plan">Prüfplan auswählen *</Label>
                    <Select
                      value={selectedTestPlan}
                      onValueChange={setSelectedTestPlan}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Prüfplan wählen..." />
                      </SelectTrigger>
                      <SelectContent>
                        {testPlans.map((plan) => (
                          <SelectItem key={plan.id} value={plan.id}>
                            {plan.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="file-upload">PDF-Datei *</Label>
                    <Input
                      id="file-upload"
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      disabled={uploading}
                    />
                    {file && (
                      <p className="text-sm text-muted-foreground">
                        {file.name} ({formatFileSize(file.size)})
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={!file || !selectedTestPlan || uploading}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Wird hochgeladen...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Hochladen und prüfen
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold mb-4">Prüfungen</h2>

            {loading ? (
              <div className="text-center py-12">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Lädt...</p>
              </div>
            ) : testRuns.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">
                    Noch keine Prüfungen
                  </h3>
                  <p className="text-muted-foreground">
                    Laden Sie ein Dokument hoch, um zu beginnen
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {testRuns.map((run) => (
                  <Card key={run.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{run.fileName}</CardTitle>
                          <CardDescription>
                            {run.testPlan.name}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant={statusLabels[run.status].variant}>
                            {statusLabels[run.status].label}
                          </Badge>
                          {run.testReport && (
                            <Badge variant={resultLabels[run.testReport.overallResult].variant}>
                              {resultLabels[run.testReport.overallResult].label}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                        <div>
                          <span className="text-muted-foreground">Gestartet:</span>
                          <p className="font-medium">{formatDate(run.startedAt)}</p>
                        </div>
                        {run.completedAt && (
                          <div>
                            <span className="text-muted-foreground">Abgeschlossen:</span>
                            <p className="font-medium">{formatDate(run.completedAt)}</p>
                          </div>
                        )}
                      </div>

                      {run.testReport && (
                        <div className="mb-4 p-3 bg-secondary/30 rounded-md">
                          <p className="text-sm">{run.testReport.summary}</p>
                        </div>
                      )}

                      <Link href={`/test-runs/${run.id}`}>
                        <Button variant="outline" className="w-full">
                          Details ansehen
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
