import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Settings, CheckCircle2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

const categoryLabels = {
  TECHNICAL_DRAWING: "Technische Zeichnung",
  LABEL: "Etikett",
  INVOICE: "Rechnung",
};

const checkTypeLabels = {
  PRESENCE: "Vorhandensein",
  FIELD_VALUE: "Feldwert",
  LEGAL_REQUIREMENT: "Gesetzliche Vorgabe",
  DIN_STANDARD: "DIN-Norm",
  IMAGE_QUALITY: "Bildqualität",
  TEXT_EXTRACTION: "Text-Extraktion",
  CUSTOM: "Benutzerdefiniert",
};

export default async function TestPlanDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const testPlan = await prisma.testPlan.findUnique({
    where: { id: params.id },
    include: {
      procedures: {
        include: {
          steps: {
            orderBy: {
              order: "asc",
            },
          },
        },
        orderBy: {
          order: "asc",
        },
      },
      _count: {
        select: {
          testRuns: true,
        },
      },
    },
  });

  if (!testPlan) {
    notFound();
  }

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
        <Link href="/test-plans">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zur Übersicht
          </Button>
        </Link>

        <div className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{testPlan.name}</h1>
              <div className="flex gap-2 items-center">
                <Badge variant={testPlan.active ? "success" : "secondary"}>
                  {testPlan.active ? "Aktiv" : "Inaktiv"}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {categoryLabels[testPlan.category]}
                </span>
              </div>
            </div>
            <Link href={`/test-plans/${testPlan.id}/edit`}>
              <Button>
                <Settings className="h-4 w-4 mr-2" />
                Bearbeiten
              </Button>
            </Link>
          </div>

          {testPlan.description && (
            <p className="text-muted-foreground mb-4">{testPlan.description}</p>
          )}

          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Erstellt:</span>
              <p className="font-medium">{formatDate(testPlan.createdAt)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Prozeduren:</span>
              <p className="font-medium">{testPlan.procedures.length}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Durchläufe:</span>
              <p className="font-medium">{testPlan._count.testRuns}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Prozeduren</h2>
          <Link href={`/test-plans/${testPlan.id}/procedures/new`}>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Prozedur hinzufügen
            </Button>
          </Link>
        </div>

        {testPlan.procedures.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Noch keine Prozeduren</h3>
              <p className="text-muted-foreground mb-4">
                Fügen Sie Prozeduren mit Prüfschritten hinzu
              </p>
              <Link href={`/test-plans/${testPlan.id}/procedures/new`}>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Prozedur hinzufügen
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {testPlan.procedures.map((procedure, idx) => (
              <Card key={procedure.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>
                        {idx + 1}. {procedure.name}
                      </CardTitle>
                      {procedure.description && (
                        <CardDescription className="mt-2">
                          {procedure.description}
                        </CardDescription>
                      )}
                    </div>
                    <Link href={`/test-plans/${testPlan.id}/procedures/${procedure.id}/edit`}>
                      <Button variant="ghost" size="sm">
                        <Settings className="h-4 w-4 mr-2" />
                        Bearbeiten
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  {procedure.steps.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Noch keine Prüfschritte definiert
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {procedure.steps.map((step, stepIdx) => (
                        <div
                          key={step.id}
                          className="flex items-start gap-3 p-3 bg-secondary/30 rounded-md"
                        >
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                            {stepIdx + 1}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{step.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {checkTypeLabels[step.checkType]}
                              </Badge>
                              {step.required && (
                                <Badge variant="destructive" className="text-xs">
                                  Pflicht
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {step.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <Link href={`/test-plans/${testPlan.id}/procedures/${procedure.id}/steps/new`}>
                    <Button variant="outline" size="sm" className="mt-4">
                      <Plus className="h-4 w-4 mr-2" />
                      Prüfschritt hinzufügen
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
