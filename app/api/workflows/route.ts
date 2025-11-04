import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { authenticatedRoute, getOrgId, can, AuthenticatedRequest } from '@/lib/middleware';

const workflowSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich'),
  description: z.string().optional(),
  category: z.enum(['TECHNICAL_DRAWING', 'LABEL', 'INVOICE']),
  active: z.boolean().default(true),
});

export const GET = authenticatedRoute(async (req: AuthenticatedRequest) => {
  try {
    const orgId = getOrgId(req);
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const active = searchParams.get('active');

    const workflows = await prisma.workflow.findMany({
      where: {
        orgId,
        ...(category && { category: category as any }),
        ...(active !== null && { active: active === 'true' }),
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(workflows);
  } catch (error) {
    console.error('Error fetching workflows:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Workflows' },
      { status: 500 }
    );
  }
});

export const POST = authenticatedRoute(async (req: AuthenticatedRequest) => {
  try {
    const orgId = getOrgId(req);

    // Check if user has permission to create workflows
    if (!can(req, 'workflow', 'create')) {
      return NextResponse.json(
        { error: 'Keine Berechtigung zum Erstellen von Workflows' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = workflowSchema.parse(body);

    // Erstelle Workflow mit START und END Knoten
    const workflow = await prisma.workflow.create({
      data: {
        ...validatedData,
        orgId,
        nodes: {
          create: [
            {
              name: 'Start',
              nodeType: 'START',
              config: {},
              position: { x: 100, y: 100 },
            },
            {
              name: 'Ende',
              nodeType: 'END',
              config: {},
              position: { x: 500, y: 100 },
            },
          ],
        },
      },
      include: {
        nodes: true,
        edges: true,
      },
    });

    return NextResponse.json(workflow, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validierungsfehler', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating workflow:', error);
    return NextResponse.json(
      { error: 'Fehler beim Erstellen des Workflows' },
      { status: 500 }
    );
  }
});
