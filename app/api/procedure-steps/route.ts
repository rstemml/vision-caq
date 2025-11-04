import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { authenticatedRoute, getOrgId, can, AuthenticatedRequest } from '@/lib/middleware';

const stepSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich'),
  description: z.string().min(1, 'Beschreibung ist erforderlich'),
  checkType: z.enum([
    'PRESENCE',
    'FIELD_VALUE',
    'LEGAL_REQUIREMENT',
    'DIN_STANDARD',
    'IMAGE_QUALITY',
    'TEXT_EXTRACTION',
    'CUSTOM',
  ]),
  parameters: z.record(z.any()).default({}),
  order: z.number().default(0),
  required: z.boolean().default(true),
  procedureId: z.string(),
});

export const POST = authenticatedRoute(async (req: AuthenticatedRequest) => {
  try {
    const orgId = getOrgId(req);

    // Check if user has permission to create steps
    if (!can(req, 'testPlan', 'update')) {
      return NextResponse.json(
        { error: 'Keine Berechtigung zum Bearbeiten von Prüfplänen' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = stepSchema.parse(body);

    // Verify procedure belongs to organization
    const procedure = await prisma.procedure.findUnique({
      where: { id: validatedData.procedureId },
      include: { testPlan: true },
    });

    if (!procedure || procedure.testPlan.orgId !== orgId) {
      return NextResponse.json(
        { error: 'Prozedur nicht gefunden' },
        { status: 404 }
      );
    }

    const step = await prisma.procedureStep.create({
      data: validatedData,
    });

    return NextResponse.json(step, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validierungsfehler', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating step:', error);
    return NextResponse.json(
      { error: 'Fehler beim Erstellen des Prüfschritts' },
      { status: 500 }
    );
  }
});
