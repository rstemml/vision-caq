import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const testPlanSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich'),
  description: z.string().optional(),
  category: z.enum(['TECHNICAL_DRAWING', 'LABEL', 'INVOICE']),
  active: z.boolean().default(true),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const active = searchParams.get('active');

    const testPlans = await prisma.testPlan.findMany({
      where: {
        ...(category && { category: category as any }),
        ...(active !== null && { active: active === 'true' }),
      },
      include: {
        procedures: {
          include: {
            steps: true,
          },
        },
        _count: {
          select: {
            testRuns: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(testPlans);
  } catch (error) {
    console.error('Error fetching test plans:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Prüfpläne' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = testPlanSchema.parse(body);

    const testPlan = await prisma.testPlan.create({
      data: validatedData,
      include: {
        procedures: true,
      },
    });

    return NextResponse.json(testPlan, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validierungsfehler', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating test plan:', error);
    return NextResponse.json(
      { error: 'Fehler beim Erstellen des Prüfplans' },
      { status: 500 }
    );
  }
}
