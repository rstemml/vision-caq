import { NextRequest, NextResponse } from 'next/server';
import { WorkflowEngine } from '@/lib/workflow-engine';
import { z } from 'zod';
import { authenticatedRoute, getOrgId, AuthenticatedRequest } from '@/lib/middleware';
import { prisma } from '@/lib/prisma';

const executeSchema = z.object({
  testRunId: z.string(),
  variables: z.record(z.any()).optional(),
  pdfData: z.any().optional(),
});

export const POST = authenticatedRoute(async (
  req: AuthenticatedRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const orgId = getOrgId(req);

    // Verify workflow belongs to organization
    const workflow = await prisma.workflow.findUnique({
      where: { id: params.id, orgId },
    });

    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow nicht gefunden' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const validatedData = executeSchema.parse(body);

    // Verify testRun belongs to organization
    const testRun = await prisma.testRun.findUnique({
      where: { id: validatedData.testRunId, orgId },
    });

    if (!testRun) {
      return NextResponse.json(
        { error: 'TestRun nicht gefunden' },
        { status: 404 }
      );
    }

    // Starte Workflow-Ausführung
    const execution = await WorkflowEngine.execute(
      params.id,
      validatedData.testRunId,
      {
        variables: validatedData.variables || {},
        testRunId: validatedData.testRunId,
        pdfData: validatedData.pdfData,
      }
    );

    return NextResponse.json(execution, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validierungsfehler', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error executing workflow:', error);
    return NextResponse.json(
      { error: 'Fehler beim Ausführen des Workflows' },
      { status: 500 }
    );
  }
});
