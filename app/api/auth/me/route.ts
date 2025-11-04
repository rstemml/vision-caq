import { NextRequest, NextResponse } from 'next/server';
import { authenticatedRoute, getUser, getOrgId } from '@/lib/middleware';
import { AuthenticatedRequest } from '@/lib/middleware';
import { prisma } from '@/lib/prisma';

export const GET = authenticatedRoute(async (req: AuthenticatedRequest) => {
  const user = getUser(req);
  const orgId = getOrgId(req);

  // Get organization details
  const organization = await prisma.organization.findUnique({
    where: { id: orgId },
    select: {
      id: true,
      name: true,
      slug: true,
      domain: true,
      settings: true,
    },
  });

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      active: user.active,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    },
    organization,
  });
});
