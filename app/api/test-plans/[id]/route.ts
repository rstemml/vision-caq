import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const testPlanUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  category: z.enum(['TECHNICAL_DRAWING', 'LABEL', 'INVOICE']).optional(),
  active: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const testPlan = await prisma.testPlan.findUnique({
      where: { id: params.id },
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
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = testPlanUpdateSchema.parse(body);

    const testPlan = await prisma.testPlan.update({
      where: { id: params.id },
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
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.testPlan.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting test plan:', error);
    return NextResponse.json(
      { error: 'Fehler beim Löschen des Prüfplans' },
      { status: 500 }
    );
  }
}
