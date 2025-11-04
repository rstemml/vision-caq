import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const procedureUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  order: z.number().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = procedureUpdateSchema.parse(body);

    const procedure = await prisma.procedure.update({
      where: { id: params.id },
      data: validatedData,
      include: {
        steps: true,
      },
    });

    return NextResponse.json(procedure);
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
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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
}
