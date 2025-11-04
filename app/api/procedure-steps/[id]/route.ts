import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

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

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = stepUpdateSchema.parse(body);

    const step = await prisma.procedureStep.update({
      where: { id: params.id },
      data: validatedData,
    });

    return NextResponse.json(step);
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
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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
}
