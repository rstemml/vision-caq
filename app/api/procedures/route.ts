import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { authenticatedRoute, getOrgId, can, AuthenticatedRequest } from '@/lib/middleware';

const procedureSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich'),
  description: z.string().optional(),
  testPlanId: z.string(),
  order: z.number().default(0),
});

export const POST = authenticatedRoute(async (req: AuthenticatedRequest) => {
  try {
    const orgId = getOrgId(req);

    // Check if user has permission to create procedures
    if (!can(req, 'testPlan', 'update')) {
      return NextResponse.json(
        { error: 'Keine Berechtigung zum Bearbeiten von Prüfplänen' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = procedureSchema.parse(body);

    // Verify testPlan belongs to organization
    const testPlan = await prisma.testPlan.findUnique({
      where: { id: validatedData.testPlanId, orgId },
    });

    if (!testPlan) {
      return NextResponse.json(
        { error: 'Prüfplan nicht gefunden' },
        { status: 404 }
      );
    }

    const procedure = await prisma.procedure.create({
      data: validatedData,
      include: {
        steps: true,
      },
    });

    return NextResponse.json(procedure, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validierungsfehler', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating procedure:', error);
    return NextResponse.json(
      { error: 'Fehler beim Erstellen der Prozedur' },
      { status: 500 }
    );
  }
});
