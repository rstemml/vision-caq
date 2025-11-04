import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { authenticatedRoute, getOrgId, can, AuthenticatedRequest } from '@/lib/middleware';

const procedureUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  order: z.number().optional(),
});

export const PATCH = authenticatedRoute(async (
  req: AuthenticatedRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const orgId = getOrgId(req);

    // Check if user has permission to update procedures
    if (!can(req, 'testPlan', 'update')) {
      return NextResponse.json(
        { error: 'Keine Berechtigung zum Bearbeiten von Prüfplänen' },
        { status: 403 }
      );
    }

    // Verify procedure belongs to organization
    const procedure = await prisma.procedure.findUnique({
      where: { id: params.id },
      include: { testPlan: true },
    });

    if (!procedure || procedure.testPlan.orgId !== orgId) {
      return NextResponse.json(
        { error: 'Prozedur nicht gefunden' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const validatedData = procedureUpdateSchema.parse(body);

    const updatedProcedure = await prisma.procedure.update({
      where: { id: params.id },
      data: validatedData,
      include: {
        steps: true,
      },
    });

    return NextResponse.json(updatedProcedure);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validierungsfehler', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error updating procedure:', error);
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren der Prozedur' },
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

    // Check if user has permission to delete procedures
    if (!can(req, 'testPlan', 'update')) {
      return NextResponse.json(
        { error: 'Keine Berechtigung zum Bearbeiten von Prüfplänen' },
        { status: 403 }
      );
    }

    // Verify procedure belongs to organization
    const procedure = await prisma.procedure.findUnique({
      where: { id: params.id },
      include: { testPlan: true },
    });

    if (!procedure || procedure.testPlan.orgId !== orgId) {
      return NextResponse.json(
        { error: 'Prozedur nicht gefunden' },
        { status: 404 }
      );
    }

    await prisma.procedure.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting procedure:', error);
    return NextResponse.json(
      { error: 'Fehler beim Löschen der Prozedur' },
      { status: 500 }
    );
  }
});
