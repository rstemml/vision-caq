"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { ProtectedRoute } from "@/components/protected-route";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, Settings, Loader2 } from "lucide-react";

const categoryLabels = {
  TECHNICAL_DRAWING: "Technische Zeichnung",
  LABEL: "Etikett",
  INVOICE: "Rechnung",
};

export default function TestPlansPage() {
  const { token } = useAuth();
  const [testPlans, setTestPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchTestPlans();
    }
  }, [token]);

  const fetchTestPlans = async () => {
    try {
      const response = await fetch("/api/test-plans", {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setTestPlans(data);
    } catch (err) {
      console.error("Error fetching test plans:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen">
        <AppHeader />

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

        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Prüfpläne werden geladen...</p>
          </div>
        ) : testPlans.length === 0 ? (
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
    </ProtectedRoute>
  );
}
