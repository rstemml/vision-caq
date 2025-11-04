// API Middleware for Authentication & Multi-Tenancy
// lib/middleware.ts

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, JWTPayload } from './auth';
import { prisma } from './prisma';
import { User } from '@prisma/client';

export interface AuthenticatedRequest extends NextRequest {
  auth?: {
    user: User;
    orgId: string;
    payload: JWTPayload;
  };
}

// ============================================
// Authentication Middleware
// ============================================

export async function withAuth(
  request: NextRequest,
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Verify token
    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { organization: true },
    });

    if (!user || !user.active || !user.organization.active) {
      return NextResponse.json(
        { error: 'User or organization inactive' },
        { status: 401 }
      );
    }

    // Attach auth context to request
    const authenticatedReq = request as AuthenticatedRequest;
    authenticatedReq.auth = {
      user,
      orgId: user.orgId,
      payload,
    };

    // Call handler
    return await handler(authenticatedReq);
  } catch (error) {
    console.error('Auth middleware error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

// ============================================
// Role-Based Access Control Middleware
// ============================================

export function withRole(
  roles: string[],
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  return async (req: AuthenticatedRequest) => {
    if (!req.auth) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!roles.includes(req.auth.user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    return await handler(req);
  };
}

// ============================================
// Organization Context
// ============================================

export function getOrgId(req: AuthenticatedRequest): string {
  if (!req.auth) {
    throw new Error('Request not authenticated');
  }
  return req.auth.orgId;
}

export function getUser(req: AuthenticatedRequest): User {
  if (!req.auth) {
    throw new Error('Request not authenticated');
  }
  return req.auth.user;
}

// ============================================
// Tenant-Scoped Prisma Client
// ============================================

/**
 * Creates a Prisma client that automatically filters all queries by orgId
 */
export function createTenantPrisma(orgId: string) {
  // Create a proxy that automatically adds orgId to all queries
  return new Proxy(prisma, {
    get(target, prop) {
      const original = (target as any)[prop];

      // Only proxy model operations
      if (typeof original === 'object' && original !== null) {
        return new Proxy(original, {
          get(modelTarget, modelProp) {
            const modelMethod = (modelTarget as any)[modelProp];

            if (typeof modelMethod !== 'function') {
              return modelMethod;
            }

            // Methods that need orgId filtering
            const filterMethods = [
              'findUnique',
              'findFirst',
              'findMany',
              'create',
              'update',
              'updateMany',
              'delete',
              'deleteMany',
              'count',
            ];

            if (filterMethods.includes(modelProp as string)) {
              return function (args: any) {
                // Models that have orgId
                const modelsWithOrgId = [
                  'testPlan',
                  'testRun',
                  'workflow',
                  'user',
                  'auditLog',
                  'apiKey',
                ];

                if (modelsWithOrgId.includes(prop as string)) {
                  // Automatically add orgId to where clause
                  if (!args) args = {};
                  if (!args.where) args.where = {};

                  // For create operations, add orgId to data
                  if (modelProp === 'create' && args.data) {
                    args.data.orgId = orgId;
                  }

                  // For find operations, add orgId to where
                  if (
                    modelProp.startsWith('find') ||
                    modelProp === 'update' ||
                    modelProp === 'delete' ||
                    modelProp === 'count'
                  ) {
                    args.where.orgId = orgId;
                  }
                }

                return modelMethod.call(modelTarget, args);
              };
            }

            return modelMethod;
          },
        });
      }

      return original;
    },
  });
}

// ============================================
// Helper Functions
// ============================================

/**
 * Wrapper for authenticated API routes
 */
export function authenticatedRoute(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    return withAuth(req, handler);
  };
}

/**
 * Wrapper for role-protected API routes
 */
export function protectedRoute(
  roles: string[],
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    return withAuth(req, withRole(roles, handler));
  };
}
