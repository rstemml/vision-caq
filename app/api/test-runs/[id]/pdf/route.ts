import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticatedRoute, getOrgId, AuthenticatedRequest } from '@/lib/middleware';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export const GET = authenticatedRoute(async (
  req: AuthenticatedRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const orgId = getOrgId(req);

    // Get test run and verify it belongs to the organization
    const testRun = await prisma.testRun.findUnique({
      where: {
        id: params.id,
        orgId,
      },
    });

    if (!testRun) {
      return NextResponse.json(
        { error: 'Test Run nicht gefunden' },
        { status: 404 }
      );
    }

    // Construct file path
    const filePath = join(process.cwd(), 'uploads', testRun.filePath);

    // Check if file exists
    if (!existsSync(filePath)) {
      return NextResponse.json(
        { error: 'PDF-Datei nicht gefunden' },
        { status: 404 }
      );
    }

    // Read file
    const fileBuffer = await readFile(filePath);

    // Return PDF with proper headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${testRun.fileName}"`,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error serving PDF:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der PDF-Datei' },
      { status: 500 }
    );
  }
});
