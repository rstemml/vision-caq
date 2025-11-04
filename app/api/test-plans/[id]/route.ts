import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { authenticatedRoute, getOrgId, can, AuthenticatedRequest } from '@/lib/middleware';

const testPlanUpdateSchema = z.object({
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

    const testPlan = await prisma.testPlan.findUnique({
      where: {
        id: params.id,
        orgId,
      },
      include: {
        procedures: {
          include: {
            steps: {
              orderBy: {
                order: 'asc',
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    if (!testPlan) {
      return NextResponse.json(
        { error: 'Prüfplan nicht gefunden' },
        { status: 404 }
      );
    }

    return NextResponse.json(testPlan);
  } catch (error) {
    console.error('Error fetching test plan:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden des Prüfplans' },
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

    // Check if user has permission to update test plans
    if (!can(req, 'testPlan', 'update')) {
      return NextResponse.json(
        { error: 'Keine Berechtigung zum Aktualisieren von Prüfplänen' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = testPlanUpdateSchema.parse(body);

    const testPlan = await prisma.testPlan.update({
      where: {
        id: params.id,
        orgId,
      },
      data: validatedData,
      include: {
        procedures: {
          include: {
            steps: true,
          },
        },
      },
    });

    return NextResponse.json(testPlan);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validierungsfehler', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error updating test plan:', error);
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren des Prüfplans' },
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

    // Check if user has permission to delete test plans
    if (!can(req, 'testPlan', 'delete')) {
      return NextResponse.json(
        { error: 'Keine Berechtigung zum Löschen von Prüfplänen' },
        { status: 403 }
      );
    }

    await prisma.testPlan.delete({
      where: {
        id: params.id,
        orgId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting test plan:', error);
    return NextResponse.json(
      { error: 'Fehler beim Löschen des Prüfplans' },
      { status: 500 }
    );
  }
});
