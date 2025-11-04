import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { authenticatedRoute, getOrgId, can, AuthenticatedRequest } from '@/lib/middleware';

const edgeSchema = z.object({
  sourceNodeId: z.string(),
  targetNodeId: z.string(),
  condition: z.record(z.any()).optional(),
  label: z.string().optional(),
});

export const POST = authenticatedRoute(async (
  req: AuthenticatedRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const orgId = getOrgId(req);

    // Check if user has permission to create edges
    if (!can(req, 'workflow', 'update')) {
      return NextResponse.json(
        { error: 'Keine Berechtigung zum Bearbeiten von Workflows' },
        { status: 403 }
      );
    }

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
    const validatedData = edgeSchema.parse(body);

    const edge = await prisma.workflowEdge.create({
      data: {
        workflowId: params.id,
        ...validatedData,
      },
    });

    return NextResponse.json(edge, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validierungsfehler', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating edge:', error);
    return NextResponse.json(
      { error: 'Fehler beim Erstellen der Verbindung' },
      { status: 500 }
    );
  }
});

export const DELETE = authenticatedRoute(async (
  req: AuthenticatedRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const orgId = getOrgId(req);

    // Check if user has permission to delete edges
    if (!can(req, 'workflow', 'update')) {
      return NextResponse.json(
        { error: 'Keine Berechtigung zum Bearbeiten von Workflows' },
        { status: 403 }
      );
    }

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

    const { searchParams } = new URL(req.url);
    const edgeId = searchParams.get('edgeId');

    if (!edgeId) {
      return NextResponse.json(
        { error: 'edgeId ist erforderlich' },
        { status: 400 }
      );
    }

    await prisma.workflowEdge.delete({
      where: { id: edgeId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting edge:', error);
    return NextResponse.json(
      { error: 'Fehler beim Löschen der Verbindung' },
      { status: 500 }
    );
  }
});
