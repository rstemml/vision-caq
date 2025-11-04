import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Play, Settings, GitBranch } from "lucide-react";
import { formatDate } from "@/lib/utils";
import WorkflowBuilder from "@/components/workflow-builder";

const categoryLabels = {
  TECHNICAL_DRAWING: "Technische Zeichnung",
  LABEL: "Etikett",
  INVOICE: "Rechnung",
};

const nodeTypeLabels = {
  START: "Start",
  END: "Ende",
  TEST_STEP: "Prüfschritt",
  PARALLEL_GATEWAY: "Parallel-Gateway",
  PARALLEL_JOIN: "Parallel-Join",
  CONDITION: "Bedingung",
  WAIT: "Warten",
};

export default async function WorkflowDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const workflow = await prisma.workflow.findUnique({
    where: { id: params.id },
    include: {
      nodes: {
        orderBy: {
          createdAt: "asc",
        },
      },
      edges: true,
      _count: {
        select: {
          executions: true,
        },
      },
    },
  });

  if (!workflow) {
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
        <Link href="/workflows">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zur Übersicht
          </Button>
        </Link>

        <div className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{workflow.name}</h1>
              <div className="flex gap-2 items-center">
                <Badge variant={workflow.active ? "success" : "secondary"}>
                  {workflow.active ? "Aktiv" : "Inaktiv"}
                </Badge>
                <Badge variant="outline">v{workflow.version}</Badge>
                <span className="text-sm text-muted-foreground">
                  {categoryLabels[workflow.category]}
                </span>
              </div>
            </div>
            <Link href={`/workflows/${workflow.id}/executions`}>
              <Button>
                <Play className="h-4 w-4 mr-2" />
                Ausführungen
              </Button>
            </Link>
          </div>

          {workflow.description && (
            <p className="text-muted-foreground mb-4">{workflow.description}</p>
          )}

          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Erstellt:</span>
              <p className="font-medium">{formatDate(workflow.createdAt)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Knoten:</span>
              <p className="font-medium">{workflow.nodes.length}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Verbindungen:</span>
              <p className="font-medium">{workflow.edges.length}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Ausführungen:</span>
              <p className="font-medium">{workflow._count.executions}</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Workflow-Struktur</CardTitle>
                <CardDescription>
                  Visueller Editor (Vereinfachte Ansicht)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WorkflowBuilder
                  workflowId={workflow.id}
                  nodes={workflow.nodes}
                  edges={workflow.edges}
                />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Knoten</CardTitle>
                  <Link href={`/workflows/${workflow.id}/nodes/new`}>
                    <Button size="sm" variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Hinzufügen
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {workflow.nodes.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Noch keine Knoten
                    </p>
                  ) : (
                    workflow.nodes.map((node) => (
                      <div
                        key={node.id}
                        className="flex items-center justify-between p-3 bg-secondary/30 rounded-md"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-sm">{node.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {nodeTypeLabels[node.nodeType]}
                          </div>
                        </div>
                        <Button size="sm" variant="ghost">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Verbindungen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {workflow.edges.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Noch keine Verbindungen
                    </p>
                  ) : (
                    workflow.edges.map((edge) => {
                      const sourceNode = workflow.nodes.find(n => n.id === edge.sourceNodeId);
                      const targetNode = workflow.nodes.find(n => n.id === edge.targetNodeId);

                      return (
                        <div
                          key={edge.id}
                          className="flex items-center gap-2 p-2 bg-secondary/30 rounded-md text-xs"
                        >
                          <span className="font-medium">{sourceNode?.name}</span>
                          <ArrowLeft className="h-3 w-3 rotate-180" />
                          <span className="font-medium">{targetNode?.name}</span>
                          {edge.label && (
                            <Badge variant="outline" className="text-xs">
                              {edge.label}
                            </Badge>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
