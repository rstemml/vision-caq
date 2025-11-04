import { prisma } from '@/lib/prisma';
import {
  Workflow,
  WorkflowNode,
  WorkflowEdge,
  WorkflowExecution,
  WorkflowNodeExecution,
  WorkflowNodeType,
  WorkflowExecutionStatus,
  WorkflowNodeExecutionStatus,
} from '@prisma/client';

type WorkflowWithNodes = Workflow & {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
};

type ExecutionWithNodes = WorkflowExecution & {
  nodeExecutions: WorkflowNodeExecution[];
};

export interface WorkflowContext {
  variables: Record<string, any>;
  testRunId: string;
  pdfData?: any;
}

export class WorkflowEngine {
  private workflow: WorkflowWithNodes;
  private execution: ExecutionWithNodes;
  private context: WorkflowContext;

  constructor(
    workflow: WorkflowWithNodes,
    execution: ExecutionWithNodes,
    context: WorkflowContext
  ) {
    this.workflow = workflow;
    this.execution = execution;
    this.context = context;
  }

  /**
   * Startet die Workflow-Ausführung
   */
  async start(): Promise<void> {
    console.log(`[Workflow] Starting workflow: ${this.workflow.name}`);

    try {
      // Update execution status
      await this.updateExecutionStatus('RUNNING');

      // Finde START-Knoten
      const startNode = this.workflow.nodes.find(
        (n) => n.nodeType === 'START'
      );

      if (!startNode) {
        throw new Error('No START node found in workflow');
      }

      // Führe Workflow aus
      await this.executeNode(startNode);

      // Check if workflow completed
      await this.checkCompletion();
    } catch (error) {
      console.error('[Workflow] Error:', error);
      await this.updateExecutionStatus('FAILED', (error as Error).message);
    }
  }

  /**
   * Führt einen einzelnen Knoten aus
   */
  private async executeNode(node: WorkflowNode): Promise<void> {
    console.log(`[Workflow] Executing node: ${node.name} (${node.nodeType})`);

    // Erstelle oder aktualisiere NodeExecution
    let nodeExecution = this.execution.nodeExecutions.find(
      (ne) => ne.nodeId === node.id
    );

    if (!nodeExecution) {
      nodeExecution = await prisma.workflowNodeExecution.create({
        data: {
          executionId: this.execution.id,
          nodeId: node.id,
          status: 'RUNNING',
          startedAt: new Date(),
          input: this.context.variables,
        },
      });
      this.execution.nodeExecutions.push(nodeExecution);
    } else {
      await prisma.workflowNodeExecution.update({
        where: { id: nodeExecution.id },
        data: {
          status: 'RUNNING',
          startedAt: new Date(),
        },
      });
    }

    try {
      // Führe Node-Typ-spezifische Logik aus
      const output = await this.executeNodeLogic(node);

      // Markiere als abgeschlossen
      await prisma.workflowNodeExecution.update({
        where: { id: nodeExecution.id },
        data: {
          status: 'COMPLETED',
          output,
          completedAt: new Date(),
        },
      });

      // Führe nächste Knoten aus
      await this.proceedToNextNodes(node, output);
    } catch (error) {
      console.error(`[Workflow] Node execution failed:`, error);
      await prisma.workflowNodeExecution.update({
        where: { id: nodeExecution.id },
        data: {
          status: 'FAILED',
          error: (error as Error).message,
          completedAt: new Date(),
        },
      });
      throw error;
    }
  }

  /**
   * Führt die Logik des Knotens aus
   */
  private async executeNodeLogic(node: WorkflowNode): Promise<any> {
    const config = node.config as any;

    switch (node.nodeType) {
      case 'START':
        return { started: true };

      case 'END':
        return { ended: true };

      case 'TEST_STEP':
        return await this.executeTestStep(node, config);

      case 'PARALLEL_GATEWAY':
        return { parallelStarted: true };

      case 'PARALLEL_JOIN':
        return await this.executeParallelJoin(node);

      case 'CONDITION':
        return await this.evaluateCondition(node, config);

      case 'WAIT':
        return await this.executeWait(node, config);

      default:
        throw new Error(`Unknown node type: ${node.nodeType}`);
    }
  }

  /**
   * Führt einen Prüfschritt aus
   */
  private async executeTestStep(
    node: WorkflowNode,
    config: any
  ): Promise<any> {
    console.log(`[Workflow] Executing test step: ${config.stepId}`);

    // Hole Prüfschritt aus Datenbank
    const step = await prisma.procedureStep.findUnique({
      where: { id: config.stepId },
    });

    if (!step) {
      throw new Error(`Test step not found: ${config.stepId}`);
    }

    // Rufe Python Service auf
    const pythonServiceUrl =
      process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';

    // Baue Request für einzelnen Schritt
    const testRequest = {
      test_plan_id: this.context.testRunId,
      test_plan_name: node.name,
      document_category: 'TECHNICAL_DRAWING', // TODO: aus context
      procedures: [
        {
          procedure_id: 'workflow-procedure',
          name: node.name,
          steps: [
            {
              step_id: step.id,
              name: step.name,
              description: step.description,
              check_type: step.checkType,
              parameters: step.parameters,
              required: step.required,
            },
          ],
        },
      ],
    };

    // Simuliere Prüfung (in echter Implementation würde hier der Python Service aufgerufen)
    // TODO: Implementiere echten API-Call
    const result = {
      result: 'PASSED',
      message: `Prüfschritt ${step.name} erfolgreich`,
      details: {
        stepId: step.id,
        timestamp: new Date().toISOString(),
      },
    };

    // Speichere Ergebnis
    await prisma.testResult.create({
      data: {
        testRunId: this.context.testRunId,
        stepId: step.id,
        result: result.result as any,
        message: result.message,
        details: result.details,
      },
    });

    return result;
  }

  /**
   * Wartet auf alle eingehenden parallelen Pfade
   */
  private async executeParallelJoin(node: WorkflowNode): Promise<any> {
    // Finde alle eingehenden Edges
    const incomingEdges = this.workflow.edges.filter(
      (e) => e.targetNodeId === node.id
    );

    // Prüfe ob alle Source-Knoten abgeschlossen sind
    const allCompleted = await Promise.all(
      incomingEdges.map(async (edge) => {
        const sourceExecution = this.execution.nodeExecutions.find(
          (ne) => ne.nodeId === edge.sourceNodeId
        );
        return sourceExecution?.status === 'COMPLETED';
      })
    );

    if (!allCompleted.every((c) => c)) {
      // Noch nicht alle Pfade abgeschlossen - markiere als PENDING
      await prisma.workflowNodeExecution.update({
        where: {
          executionId_nodeId: {
            executionId: this.execution.id,
            nodeId: node.id,
          },
        },
        data: { status: 'PENDING' },
      });
      return { waiting: true };
    }

    return { allJoined: true };
  }

  /**
   * Evaluiert eine Bedingung
   */
  private async evaluateCondition(
    node: WorkflowNode,
    config: any
  ): Promise<any> {
    const { condition } = config;

    // Einfache Condition-Evaluierung
    // Format: { variable: "result", operator: "==", value: "PASSED" }
    const variableValue = this.context.variables[condition.variable];
    let result = false;

    switch (condition.operator) {
      case '==':
        result = variableValue === condition.value;
        break;
      case '!=':
        result = variableValue !== condition.value;
        break;
      case '>':
        result = variableValue > condition.value;
        break;
      case '<':
        result = variableValue < condition.value;
        break;
      default:
        throw new Error(`Unknown operator: ${condition.operator}`);
    }

    return { conditionMet: result };
  }

  /**
   * Wartet auf externe Eingabe
   */
  private async executeWait(node: WorkflowNode, config: any): Promise<any> {
    // Update execution status zu WAITING
    await this.updateExecutionStatus('WAITING');

    return {
      waiting: true,
      waitFor: config.waitFor,
      message: config.message,
    };
  }

  /**
   * Findet und führt nächste Knoten aus
   */
  private async proceedToNextNodes(
    currentNode: WorkflowNode,
    output: any
  ): Promise<void> {
    // Finde ausgehende Edges
    const outgoingEdges = this.workflow.edges.filter(
      (e) => e.sourceNodeId === currentNode.id
    );

    if (outgoingEdges.length === 0) {
      console.log('[Workflow] No outgoing edges, workflow may be complete');
      return;
    }

    // Parallel Gateway: Führe alle ausgehenden Pfade parallel aus
    if (currentNode.nodeType === 'PARALLEL_GATEWAY') {
      await Promise.all(
        outgoingEdges.map(async (edge) => {
          const nextNode = this.workflow.nodes.find(
            (n) => n.id === edge.targetNodeId
          );
          if (nextNode) {
            await this.executeNode(nextNode);
          }
        })
      );
      return;
    }

    // Condition: Wähle Pfad basierend auf Output
    if (currentNode.nodeType === 'CONDITION') {
      const conditionMet = output.conditionMet;
      const edge = outgoingEdges.find((e) => {
        const edgeCondition = e.condition as any;
        return edgeCondition?.value === conditionMet;
      });

      if (edge) {
        const nextNode = this.workflow.nodes.find(
          (n) => n.id === edge.targetNodeId
        );
        if (nextNode) {
          await this.executeNode(nextNode);
        }
      }
      return;
    }

    // Standard: Führe alle ausgehenden Knoten aus
    for (const edge of outgoingEdges) {
      // Prüfe Edge-Bedingung
      if (edge.condition) {
        const conditionConfig = edge.condition as any;
        const conditionMet = this.evaluateEdgeCondition(
          conditionConfig,
          output
        );
        if (!conditionMet) {
          continue;
        }
      }

      const nextNode = this.workflow.nodes.find(
        (n) => n.id === edge.targetNodeId
      );
      if (nextNode) {
        // Parallel Join: Nicht sofort ausführen
        if (nextNode.nodeType === 'PARALLEL_JOIN') {
          await this.executeNode(nextNode);
        } else {
          await this.executeNode(nextNode);
        }
      }
    }
  }

  /**
   * Evaluiert Edge-Bedingung
   */
  private evaluateEdgeCondition(condition: any, output: any): boolean {
    // Einfache Evaluierung
    return true; // TODO: Implementiere komplexere Logik
  }

  /**
   * Prüft ob Workflow abgeschlossen ist
   */
  private async checkCompletion(): Promise<void> {
    // Finde END-Knoten
    const endNodes = this.workflow.nodes.filter((n) => n.nodeType === 'END');

    // Prüfe ob mindestens ein END-Knoten erreicht wurde
    const endNodeExecutions = this.execution.nodeExecutions.filter((ne) =>
      endNodes.some((en) => en.id === ne.nodeId)
    );

    const hasCompletedEnd = endNodeExecutions.some(
      (ne) => ne.status === 'COMPLETED'
    );

    if (hasCompletedEnd) {
      await this.updateExecutionStatus('COMPLETED');
      console.log('[Workflow] Workflow completed successfully');
    }
  }

  /**
   * Aktualisiert den Execution-Status
   */
  private async updateExecutionStatus(
    status: WorkflowExecutionStatus,
    error?: string
  ): Promise<void> {
    await prisma.workflowExecution.update({
      where: { id: this.execution.id },
      data: {
        status,
        error,
        completedAt: status === 'COMPLETED' || status === 'FAILED' ? new Date() : undefined,
      },
    });
    this.execution.status = status;
  }

  /**
   * Statische Methode zum Erstellen und Starten einer Workflow-Ausführung
   */
  static async execute(
    workflowId: string,
    testRunId: string,
    context: Partial<WorkflowContext> = {}
  ): Promise<WorkflowExecution> {
    // Lade Workflow
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
      include: {
        nodes: true,
        edges: true,
      },
    });

    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    // Erstelle Execution
    const execution = await prisma.workflowExecution.create({
      data: {
        workflowId,
        testRunId,
        status: 'PENDING',
        variables: context.variables || {},
      },
      include: {
        nodeExecutions: true,
      },
    });

    // Erstelle Engine-Instanz
    const engine = new WorkflowEngine(workflow, execution, {
      variables: context.variables || {},
      testRunId,
      pdfData: context.pdfData,
    });

    // Starte Ausführung (async)
    engine.start().catch((error) => {
      console.error('[Workflow] Execution failed:', error);
    });

    return execution;
  }
}
