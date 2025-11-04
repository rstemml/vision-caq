"use client";

import { useState } from "react";
import { WorkflowNode, WorkflowEdge } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GitBranch, Play, Square, GitMerge, HelpCircle, Clock } from "lucide-react";

interface WorkflowBuilderProps {
  workflowId: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

const nodeTypeIcons = {
  START: Play,
  END: Square,
  TEST_STEP: GitBranch,
  PARALLEL_GATEWAY: GitBranch,
  PARALLEL_JOIN: GitMerge,
  CONDITION: HelpCircle,
  WAIT: Clock,
};

const nodeTypeColors = {
  START: "bg-green-100 border-green-300",
  END: "bg-red-100 border-red-300",
  TEST_STEP: "bg-blue-100 border-blue-300",
  PARALLEL_GATEWAY: "bg-purple-100 border-purple-300",
  PARALLEL_JOIN: "bg-purple-100 border-purple-300",
  CONDITION: "bg-yellow-100 border-yellow-300",
  WAIT: "bg-gray-100 border-gray-300",
};

export default function WorkflowBuilder({
  workflowId,
  nodes,
  edges,
}: WorkflowBuilderProps) {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  // Einfaches Layout - vertikal angeordnet
  const renderWorkflow = () => {
    if (nodes.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            Noch keine Knoten im Workflow
          </p>
          <Button>Knoten hinzufügen</Button>
        </div>
      );
    }

    // Sortiere Knoten: START zuerst, dann alle anderen, END zuletzt
    const sortedNodes = [...nodes].sort((a, b) => {
      if (a.nodeType === "START") return -1;
      if (b.nodeType === "START") return 1;
      if (a.nodeType === "END") return 1;
      if (b.nodeType === "END") return -1;
      return 0;
    });

    return (
      <div className="space-y-4">
        {sortedNodes.map((node, index) => {
          const Icon = nodeTypeIcons[node.nodeType];
          const colorClass = nodeTypeColors[node.nodeType];
          const outgoingEdges = edges.filter((e) => e.sourceNodeId === node.id);

          return (
            <div key={node.id}>
              <Card
                className={`p-4 cursor-pointer transition-all ${colorClass} ${
                  selectedNode === node.id
                    ? "ring-2 ring-primary"
                    : ""
                }`}
                onClick={() => setSelectedNode(node.id)}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5" />
                  <div className="flex-1">
                    <div className="font-medium">{node.name}</div>
                    {node.description && (
                      <div className="text-sm text-muted-foreground">
                        {node.description}
                      </div>
                    )}
                    {node.nodeType === "TEST_STEP" && node.config && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Prüfschritt: {(node.config as any).stepId || "Nicht konfiguriert"}
                      </div>
                    )}
                  </div>
                  <div className="text-xs bg-white px-2 py-1 rounded">
                    {node.nodeType.replace(/_/g, " ")}
                  </div>
                </div>
              </Card>

              {/* Verbindungen anzeigen */}
              {outgoingEdges.length > 0 && index < sortedNodes.length - 1 && (
                <div className="flex justify-center py-2">
                  <div className="flex flex-col items-center">
                    <div className="w-0.5 h-4 bg-gray-300" />
                    {outgoingEdges.map((edge) => (
                      <div
                        key={edge.id}
                        className="text-xs text-muted-foreground"
                      >
                        {edge.label || ""}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div>
      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <p className="text-sm text-blue-800">
          <strong>Info:</strong> Dies ist eine vereinfachte Workflow-Ansicht.
          Für einen vollständigen visuellen Editor können Sie externe Tools wie
          ReactFlow integrieren.
        </p>
      </div>

      {renderWorkflow()}

      {selectedNode && (
        <div className="mt-4 p-4 bg-secondary/30 rounded-md">
          <h4 className="font-medium mb-2">Ausgewählter Knoten</h4>
          <p className="text-sm text-muted-foreground">
            Knoten-ID: {selectedNode}
          </p>
          <div className="flex gap-2 mt-3">
            <Button size="sm" variant="outline">
              Bearbeiten
            </Button>
            <Button size="sm" variant="outline">
              Löschen
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
