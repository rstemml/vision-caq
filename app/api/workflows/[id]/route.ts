import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { authenticatedRoute, getOrgId, can, AuthenticatedRequest } from '@/lib/middleware';

const workflowUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  category: z.enum(['TECHNICAL_DRAWING', 'LABEL', 'INVOICE']).optional(),
  active: z.boolean().optional(),
});

export const GET = authenticatedRoute(async (
  req: AuthenticatedRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const orgId = getOrgId(req);

    const workflow = await prisma.workflow.findUnique({
      where: {
        id: params.id,
        orgId,
      },
      include: {
        nodes: {
          orderBy: {
            createdAt: 'asc',
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
      return NextResponse.json(
        { error: 'Workflow nicht gefunden' },
        { status: 404 }
      );
    }

    return NextResponse.json(workflow);
  } catch (error) {
    console.error('Error fetching workflow:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden des Workflows' },
      { status: 500 }
    );
  }
});

export const PATCH = authenticatedRoute(async (
  req: AuthenticatedRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const orgId = getOrgId(req);

    // Check if user has permission to update workflows
    if (!can(req, 'workflow', 'update')) {
      return NextResponse.json(
        { error: 'Keine Berechtigung zum Aktualisieren von Workflows' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = workflowUpdateSchema.parse(body);

    const workflow = await prisma.workflow.update({
      where: {
        id: params.id,
        orgId,
      },
      data: validatedData,
      include: {
        nodes: true,
        edges: true,
      },
    });

    return NextResponse.json(workflow);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validierungsfehler', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error updating workflow:', error);
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren des Workflows' },
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

    // Check if user has permission to delete workflows
    if (!can(req, 'workflow', 'delete')) {
      return NextResponse.json(
        { error: 'Keine Berechtigung zum Löschen von Workflows' },
        { status: 403 }
      );
    }

    await prisma.workflow.delete({
      where: {
        id: params.id,
        orgId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting workflow:', error);
    return NextResponse.json(
      { error: 'Fehler beim Löschen des Workflows' },
      { status: 500 }
    );
  }
});
