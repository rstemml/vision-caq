import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const execution = await prisma.workflowExecution.findUnique({
      where: { id: params.id },
      include: {
        workflow: {
          include: {
            nodes: true,
            edges: true,
          },
        },
        nodeExecutions: {
          include: {
            node: true,
          },
          orderBy: {
            startedAt: 'asc',
          },
        },
        testRun: true,
      },
    });

    if (!execution) {
      return NextResponse.json(
        { error: 'Workflow-Ausführung nicht gefunden' },
        { status: 404 }
      );
    }

    return NextResponse.json(execution);
  } catch (error) {
    console.error('Error fetching workflow execution:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Workflow-Ausführung' },
      { status: 500 }
    );
  }
}
