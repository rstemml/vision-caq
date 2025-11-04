import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { authenticatedRoute, getOrgId, can, AuthenticatedRequest } from '@/lib/middleware';

const stepUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  checkType: z
    .enum([
      'PRESENCE',
      'FIELD_VALUE',
      'LEGAL_REQUIREMENT',
      'DIN_STANDARD',
      'IMAGE_QUALITY',
      'TEXT_EXTRACTION',
      'CUSTOM',
    ])
    .optional(),
  parameters: z.record(z.any()).optional(),
  order: z.number().optional(),
  required: z.boolean().optional(),
});

export const PATCH = authenticatedRoute(async (
  req: AuthenticatedRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const orgId = getOrgId(req);

    // Check if user has permission to update steps
    if (!can(req, 'testPlan', 'update')) {
      return NextResponse.json(
        { error: 'Keine Berechtigung zum Bearbeiten von Prüfplänen' },
        { status: 403 }
      );
    }

    // Verify step belongs to organization
    const step = await prisma.procedureStep.findUnique({
      where: { id: params.id },
      include: {
        procedure: {
          include: { testPlan: true },
        },
      },
    });

    if (!step || step.procedure.testPlan.orgId !== orgId) {
      return NextResponse.json(
        { error: 'Prüfschritt nicht gefunden' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const validatedData = stepUpdateSchema.parse(body);

    const updatedStep = await prisma.procedureStep.update({
      where: { id: params.id },
      data: validatedData,
    });

    return NextResponse.json(updatedStep);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validierungsfehler', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error updating step:', error);
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren des Prüfschritts' },
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

    // Check if user has permission to delete steps
    if (!can(req, 'testPlan', 'update')) {
      return NextResponse.json(
        { error: 'Keine Berechtigung zum Bearbeiten von Prüfplänen' },
        { status: 403 }
      );
    }

    // Verify step belongs to organization
    const step = await prisma.procedureStep.findUnique({
      where: { id: params.id },
      include: {
        procedure: {
          include: { testPlan: true },
        },
      },
    });

    if (!step || step.procedure.testPlan.orgId !== orgId) {
      return NextResponse.json(
        { error: 'Prüfschritt nicht gefunden' },
        { status: 404 }
      );
    }

    await prisma.procedureStep.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting step:', error);
    return NextResponse.json(
      { error: 'Fehler beim Löschen des Prüfschritts' },
      { status: 500 }
    );
  }
});
