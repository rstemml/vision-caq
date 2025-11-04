"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { ProtectedRoute } from "@/components/protected-route";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GitBranch, Plus, Play, Settings, Loader2 } from "lucide-react";

const categoryLabels = {
  TECHNICAL_DRAWING: "Technische Zeichnung",
  LABEL: "Etikett",
  INVOICE: "Rechnung",
};

export default function WorkflowsPage() {
  const { token } = useAuth();
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchWorkflows();
    }
  }, [token]);

  const fetchWorkflows = async () => {
    try {
      const response = await fetch("/api/workflows", {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setWorkflows(data);
    } catch (err) {
      console.error("Error fetching workflows:", err);
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
            <h1 className="text-3xl font-bold mb-2">Workflows</h1>
            <p className="text-muted-foreground">
              Orchestrieren Sie Ihre Qualitätsprüfungen mit flexiblen Workflows
            </p>
          </div>
          <Link href="/workflows/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Neuer Workflow
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Workflows werden geladen...</p>
          </div>
        ) : workflows.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <GitBranch className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Noch keine Workflows</h3>
              <p className="text-muted-foreground mb-4">
                Erstellen Sie Ihren ersten Workflow, um zu beginnen
              </p>
              <Link href="/workflows/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Workflow erstellen
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {workflows.map((workflow) => (
              <Card key={workflow.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="mb-2">{workflow.name}</CardTitle>
                      <div className="flex gap-2">
                        <Badge variant={workflow.active ? "success" : "secondary"}>
                          {workflow.active ? "Aktiv" : "Inaktiv"}
                        </Badge>
                        <Badge variant="outline">v{workflow.version}</Badge>
                      </div>
                    </div>
                    <Link href={`/workflows/${workflow.id}`}>
                      <Button variant="ghost" size="icon">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                  <CardDescription className="mt-2">
                    {categoryLabels[workflow.category]}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {workflow.description && (
                    <p className="text-sm text-muted-foreground mb-4">
                      {workflow.description}
                    </p>
                  )}
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Knoten:</span>
                      <span className="font-medium">{workflow.nodes.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Verbindungen:</span>
                      <span className="font-medium">{workflow.edges.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ausführungen:</span>
                      <span className="font-medium">{workflow._count.executions}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/workflows/${workflow.id}`} className="flex-1">
                      <Button variant="outline" className="w-full" size="sm">
                        <GitBranch className="h-4 w-4 mr-2" />
                        Bearbeiten
                      </Button>
                    </Link>
                    <Link href={`/workflows/${workflow.id}/executions`} className="flex-1">
                      <Button variant="outline" className="w-full" size="sm">
                        <Play className="h-4 w-4 mr-2" />
                        Ausführungen
                      </Button>
                    </Link>
                  </div>
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
