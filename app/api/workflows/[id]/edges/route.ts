import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const edgeSchema = z.object({
  sourceNodeId: z.string(),
  targetNodeId: z.string(),
  condition: z.record(z.any()).optional(),
  label: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = edgeSchema.parse(body);

    const edge = await prisma.workflowEdge.create({
      data: {
        workflowId: params.id,
        ...validatedData,
      },
    });

    return NextResponse.json(edge, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validierungsfehler', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating edge:', error);
    return NextResponse.json(
      { error: 'Fehler beim Erstellen der Verbindung' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const edgeId = searchParams.get('edgeId');

    if (!edgeId) {
      return NextResponse.json(
        { error: 'edgeId ist erforderlich' },
        { status: 400 }
      );
    }

    await prisma.workflowEdge.delete({
      where: { id: edgeId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting edge:', error);
    return NextResponse.json(
      { error: 'Fehler beim Löschen der Verbindung' },
      { status: 500 }
    );
  }
}
