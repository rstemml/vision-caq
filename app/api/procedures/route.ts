import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const procedureSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich'),
  description: z.string().optional(),
  testPlanId: z.string(),
  order: z.number().default(0),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = procedureSchema.parse(body);

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
}
