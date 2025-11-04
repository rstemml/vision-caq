import { NextRequest, NextResponse } from 'next/server';
import { WorkflowEngine } from '@/lib/workflow-engine';
import { z } from 'zod';

const executeSchema = z.object({
  testRunId: z.string(),
  variables: z.record(z.any()).optional(),
  pdfData: z.any().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = executeSchema.parse(body);

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
}
