import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticatedRoute, getOrgId, AuthenticatedRequest } from '@/lib/middleware';

export const GET = authenticatedRoute(async (req: AuthenticatedRequest) => {
  try {
    const orgId = getOrgId(req);

    const [testPlansCount, testRunsCount, testReports] = await Promise.all([
      prisma.testPlan.count({ where: { orgId } }),
      prisma.testRun.count({ where: { orgId } }),
      prisma.testReport.findMany({
        where: {
          testRun: {
            orgId,
          },
        },
        select: {
          overallResult: true,
        },
      }),
    ]);

    const passed = testReports.filter((r) => r.overallResult === 'PASSED').length;
    const failed = testReports.filter((r) => r.overallResult === 'FAILED').length;
    const warnings = testReports.filter((r) => r.overallResult === 'WARNING').length;

    const passRate = testReports.length > 0
      ? ((passed / testReports.length) * 100).toFixed(1)
      : '0.0';

    return NextResponse.json({
      testPlansCount,
      testRunsCount,
      testReportsCount: testReports.length,
      passRate,
      passed,
      failed,
      warnings,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Analysen' },
      { status: 500 }
    );
  }
});
