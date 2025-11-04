import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const testPlanId = searchParams.get('testPlanId');
    const status = searchParams.get('status');

    const testRuns = await prisma.testRun.findMany({
      where: {
        ...(testPlanId && { testPlanId }),
        ...(status && { status: status as any }),
      },
      include: {
        testPlan: true,
        testReport: true,
        _count: {
          select: {
            testResults: true,
          },
        },
      },
      orderBy: {
        startedAt: 'desc',
      },
    });

    return NextResponse.json(testRuns);
  } catch (error) {
    console.error('Error fetching test runs:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Prüfungen' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const testPlanId = formData.get('testPlanId') as string;

    if (!file || !testPlanId) {
      return NextResponse.json(
        { error: 'Datei und Prüfplan sind erforderlich' },
        { status: 400 }
      );
    }

    // Get test plan with procedures and steps
    const testPlan = await prisma.testPlan.findUnique({
      where: { id: testPlanId },
      include: {
        procedures: {
          include: {
            steps: {
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!testPlan) {
      return NextResponse.json(
        { error: 'Prüfplan nicht gefunden' },
        { status: 404 }
      );
    }

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = join(process.cwd(), 'uploads');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const fileName = `${Date.now()}-${file.name}`;
    const filePath = join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    // Create test run
    const testRun = await prisma.testRun.create({
      data: {
        testPlanId,
        fileName: file.name,
        filePath: fileName,
        fileSize: buffer.length,
        status: 'PENDING',
      },
      include: {
        testPlan: true,
      },
    });

    // Start analysis in background
    analyzeDocument(testRun.id, filePath, testPlan, buffer).catch((error) => {
      console.error('Error analyzing document:', error);
    });

    return NextResponse.json(testRun, { status: 201 });
  } catch (error) {
    console.error('Error creating test run:', error);
    return NextResponse.json(
      { error: 'Fehler beim Erstellen der Prüfung' },
      { status: 500 }
    );
  }
}

async function analyzeDocument(
  testRunId: string,
  filePath: string,
  testPlan: any,
  fileBuffer: Buffer
) {
  try {
    // Update status to IN_PROGRESS
    await prisma.testRun.update({
      where: { id: testRunId },
      data: { status: 'IN_PROGRESS' },
    });

    // Prepare request for Python service
    const formData = new FormData();
    const blob = new Blob([fileBuffer], { type: 'application/pdf' });
    formData.append('file', blob, 'document.pdf');

    const testRequest = {
      test_plan_id: testPlan.id,
      test_plan_name: testPlan.name,
      document_category: testPlan.category,
      procedures: testPlan.procedures.map((proc: any) => ({
        procedure_id: proc.id,
        name: proc.name,
        steps: proc.steps.map((step: any) => ({
          step_id: step.id,
          name: step.name,
          description: step.description,
          check_type: step.checkType,
          parameters: step.parameters,
          required: step.required,
        })),
      })),
    };

    formData.append('test_request', JSON.stringify(testRequest));

    // Call Python service
    const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';
    const response = await fetch(`${pythonServiceUrl}/analyze`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Python service analysis failed');
    }

    const analysisResult = await response.json();

    // Save results
    await saveTestResults(testRunId, analysisResult);

    // Update status to COMPLETED
    await prisma.testRun.update({
      where: { id: testRunId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

  } catch (error) {
    console.error('Error in analysis:', error);
    await prisma.testRun.update({
      where: { id: testRunId },
      data: { status: 'FAILED' },
    });
  }
}

async function saveTestResults(testRunId: string, analysisResult: any) {
  // Create test results
  const testResults = await Promise.all(
    analysisResult.step_results.map((stepResult: any) =>
      prisma.testResult.create({
        data: {
          testRunId,
          stepId: stepResult.step_id,
          result: stepResult.result,
          message: stepResult.message,
          details: stepResult.details,
        },
      })
    )
  );

  // Create test report
  await prisma.testReport.create({
    data: {
      testRunId,
      overallResult: analysisResult.overall_result,
      summary: analysisResult.summary,
      metadata: {
        stepCount: analysisResult.step_results.length,
        passedCount: analysisResult.step_results.filter(
          (r: any) => r.result === 'PASSED'
        ).length,
        failedCount: analysisResult.step_results.filter(
          (r: any) => r.result === 'FAILED'
        ).length,
      },
    },
  });
}
