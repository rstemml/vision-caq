import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticatedRoute, getOrgId, AuthenticatedRequest } from '@/lib/middleware';

export const GET = authenticatedRoute(async (
  req: AuthenticatedRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const orgId = getOrgId(req);

    const testRun = await prisma.testRun.findUnique({
      where: {
        id: params.id,
        orgId,
      },
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
});
