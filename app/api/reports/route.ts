import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticatedRoute, getOrgId, AuthenticatedRequest } from '@/lib/middleware';

export const GET = authenticatedRoute(async (req: AuthenticatedRequest) => {
  try {
    const orgId = getOrgId(req);

    const reports = await prisma.testReport.findMany({
      where: {
        testRun: {
          orgId,
        },
      },
      include: {
        testRun: {
          include: {
            testPlan: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Berichte' },
      { status: 500 }
    );
  }
});
