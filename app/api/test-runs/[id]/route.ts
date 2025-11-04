import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const testRun = await prisma.testRun.findUnique({
      where: { id: params.id },
      include: {
        testPlan: {
          include: {
            procedures: {
              include: {
                steps: true,
              },
            },
          },
        },
        testReport: true,
        testResults: {
          include: {
            step: true,
          },
        },
      },
    });

    if (!testRun) {
      return NextResponse.json(
        { error: 'Prüfung nicht gefunden' },
        { status: 404 }
      );
    }

    return NextResponse.json(testRun);
  } catch (error) {
    console.error('Error fetching test run:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Prüfung' },
      { status: 500 }
    );
  }
}
