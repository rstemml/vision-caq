import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const nodeSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich'),
  description: z.string().optional(),
  nodeType: z.enum([
    'START',
    'END',
    'TEST_STEP',
    'PARALLEL_GATEWAY',
    'PARALLEL_JOIN',
    'CONDITION',
    'WAIT',
  ]),
  config: z.record(z.any()).default({}),
  position: z
    .object({
      x: z.number(),
      y: z.number(),
    })
    .optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = nodeSchema.parse(body);

    const node = await prisma.workflowNode.create({
      data: {
        workflowId: params.id,
        ...validatedData,
      },
    });

    return NextResponse.json(node, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validierungsfehler', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating node:', error);
    return NextResponse.json(
      { error: 'Fehler beim Erstellen des Knotens' },
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
    const { nodeId, ...data } = body;

    const node = await prisma.workflowNode.update({
      where: { id: nodeId },
      data,
    });

    return NextResponse.json(node);
  } catch (error) {
    console.error('Error updating node:', error);
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren des Knotens' },
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
    const nodeId = searchParams.get('nodeId');

    if (!nodeId) {
      return NextResponse.json(
        { error: 'nodeId ist erforderlich' },
        { status: 400 }
      );
    }

    await prisma.workflowNode.delete({
      where: { id: nodeId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting node:', error);
    return NextResponse.json(
      { error: 'Fehler beim Löschen des Knotens' },
      { status: 500 }
    );
  }
}
