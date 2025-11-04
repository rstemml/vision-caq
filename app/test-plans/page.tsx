import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, Settings } from "lucide-react";

const categoryLabels = {
  TECHNICAL_DRAWING: "Technische Zeichnung",
  LABEL: "Etikett",
  INVOICE: "Rechnung",
};

export default async function TestPlansPage() {
  const testPlans = await prisma.testPlan.findMany({
    include: {
      procedures: {
        include: {
          steps: true,
        },
      },
      _count: {
        select: {
          testRuns: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Prüfpläne</h1>
            <p className="text-muted-foreground">
              Verwalten Sie Ihre Prüfpläne und definieren Sie Qualitätsprüfungen
            </p>
          </div>
          <Link href="/test-plans/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Neuer Prüfplan
            </Button>
          </Link>
        </div>

        {testPlans.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Noch keine Prüfpläne</h3>
              <p className="text-muted-foreground mb-4">
                Erstellen Sie Ihren ersten Prüfplan, um zu beginnen
              </p>
              <Link href="/test-plans/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Prüfplan erstellen
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {testPlans.map((plan) => (
              <Card key={plan.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="mb-2">{plan.name}</CardTitle>
                      <Badge variant={plan.active ? "success" : "secondary"}>
                        {plan.active ? "Aktiv" : "Inaktiv"}
                      </Badge>
                    </div>
                    <Link href={`/test-plans/${plan.id}/edit`}>
                      <Button variant="ghost" size="icon">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                  <CardDescription className="mt-2">
                    {categoryLabels[plan.category]}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {plan.description && (
                    <p className="text-sm text-muted-foreground mb-4">
                      {plan.description}
                    </p>
                  )}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Prozeduren:</span>
                      <span className="font-medium">{plan.procedures.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Prüfschritte:</span>
                      <span className="font-medium">
                        {plan.procedures.reduce(
                          (sum, proc) => sum + proc.steps.length,
                          0
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Durchläufe:</span>
                      <span className="font-medium">{plan._count.testRuns}</span>
                    </div>
                  </div>
                  <Link href={`/test-plans/${plan.id}`}>
                    <Button variant="outline" className="w-full mt-4">
                      Details ansehen
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
