import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = stepSchema.parse(body);

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
}
