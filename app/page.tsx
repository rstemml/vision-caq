import Link from "next/link";
import { FileText, ClipboardCheck, BarChart3, Upload, GitBranch } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-primary">Vision CAQ</h1>
          <p className="text-sm text-muted-foreground">Computer Aided Quality</p>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Qualitätssicherungssystem</h2>
            <p className="text-xl text-muted-foreground">
              Automatisierte Prüfung von technischen Dokumenten mit KI-Unterstützung
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <Link
              href="/workflows"
              className="group p-6 border rounded-lg hover:border-primary hover:shadow-lg transition-all"
            >
              <GitBranch className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Workflows</h3>
              <p className="text-muted-foreground">
                Orchestrieren Sie Prüfungen mit flexiblen Workflows (parallel, sequenziell, bedingt)
              </p>
            </Link>

            <Link
              href="/test-plans"
              className="group p-6 border rounded-lg hover:border-primary hover:shadow-lg transition-all"
            >
              <FileText className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Prüfpläne</h3>
              <p className="text-muted-foreground">
                Erstellen und verwalten Sie Prüfpläne mit individuellen Prozeduren und Prüfschritten
              </p>
            </Link>

            <Link
              href="/test-runs"
              className="group p-6 border rounded-lg hover:border-primary hover:shadow-lg transition-all"
            >
              <Upload className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Dokument prüfen</h3>
              <p className="text-muted-foreground">
                Laden Sie PDFs hoch und führen Sie automatisierte Prüfungen durch
              </p>
            </Link>

            <Link
              href="/reports"
              className="group p-6 border rounded-lg hover:border-primary hover:shadow-lg transition-all"
            >
              <ClipboardCheck className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Prüfprotokolle</h3>
              <p className="text-muted-foreground">
                Einsehen und exportieren Sie detaillierte Prüfprotokolle
              </p>
            </Link>

            <Link
              href="/analytics"
              className="group p-6 border rounded-lg hover:border-primary hover:shadow-lg transition-all"
            >
              <BarChart3 className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Auswertungen</h3>
              <p className="text-muted-foreground">
                Analysieren Sie Prüfergebnisse und identifizieren Sie Trends
              </p>
            </Link>
          </div>

          <div className="bg-secondary/50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Unterstützte Dokumenttypen:</h3>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Technische Zeichnungen</li>
              <li>Etiketten und Kennzeichnungen</li>
              <li>Rechnungen und Lieferscheine</li>
            </ul>
            <h3 className="text-lg font-semibold mt-6 mb-3">Prüfkriterien:</h3>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Vorhandensein von Pflichtfeldern</li>
              <li>Validierung von Werten und Formaten</li>
              <li>Gesetzliche Vorgaben und Normen (DIN, ISO)</li>
              <li>Bildqualität und Lesbarkeit</li>
            </ul>
          </div>
        </div>
      </main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        <div className="container mx-auto px-4">
          Vision CAQ - Powered by AI
        </div>
      </footer>
    </div>
  );
}
