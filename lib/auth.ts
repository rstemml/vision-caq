// Authentication & Authorization
// lib/auth.ts

import { compare, hash } from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { prisma } from './prisma';
import { User, UserRole } from '@prisma/client';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

export interface JWTPayload {
  userId: string;
  orgId: string;
  email: string;
  role: UserRole;
}

export interface AuthContext {
  user: User;
  orgId: string;
}

// ============================================
// Password Hashing
// ============================================

export async function hashPassword(password: string): Promise<string> {
  return await hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return await compare(password, hashedPassword);
}

// ============================================
// JWT Token Management
// ============================================

export async function createToken(payload: JWTPayload): Promise<string> {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d') // Token läuft nach 7 Tagen ab
    .sign(JWT_SECRET);

  return token;
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as JWTPayload;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

// ============================================
// Authentication Functions
// ============================================

export async function login(
  email: string,
  password: string
): Promise<{ token: string; user: User } | null> {
  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
    include: { organization: true },
  });

  if (!user || !user.active || !user.organization.active) {
    return null;
  }

  // Verify password
  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    return null;
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  // Create JWT token
  const token = await createToken({
    userId: user.id,
    orgId: user.orgId,
    email: user.email,
    role: user.role,
  });

  return { token, user };
}

export async function register(data: {
  email: string;
  password: string;
  name: string;
  orgId: string;
  role?: UserRole;
}): Promise<User> {
  const passwordHash = await hashPassword(data.password);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      passwordHash,
      orgId: data.orgId,
      role: data.role || 'USER',
    },
  });

  return user;
}

// ============================================
// Authorization Functions
// ============================================

export function can(
  user: User,
  action: string,
  resource?: any
): boolean {
  // Org-Admin kann alles
  if (user.role === 'ADMIN') {
    return true;
  }

  // Manager kann Prüfpläne/Workflows erstellen
  if (user.role === 'MANAGER') {
    const managerActions = [
      'testplan.create',
      'testplan.update',
      'testplan.delete',
      'workflow.create',
      'workflow.update',
      'workflow.delete',
      'test.execute',
      'test.view',
    ];
    return managerActions.includes(action);
  }

  // User kann Prüfungen durchführen
  if (user.role === 'USER') {
    const userActions = ['test.execute', 'test.view', 'testplan.view'];
    return userActions.includes(action);
  }

  // Viewer kann nur ansehen
  if (user.role === 'VIEWER') {
    const viewerActions = ['test.view', 'testplan.view'];
    return viewerActions.includes(action);
  }

  return false;
}

export function assertCan(
  user: User,
  action: string,
  resource?: any
): void {
  if (!can(user, action, resource)) {
    throw new UnauthorizedError(`User not authorized to ${action}`);
  }
}

// ============================================
// Organization Functions
// ============================================

export async function createOrganization(data: {
  name: string;
  slug: string;
  domain?: string;
  adminEmail: string;
  adminPassword: string;
  adminName: string;
}) {
  // Check if slug is available
  const existing = await prisma.organization.findUnique({
    where: { slug: data.slug },
  });

  if (existing) {
    throw new Error('Organization slug already exists');
  }

  // Create organization with admin user
  const org = await prisma.organization.create({
    data: {
      name: data.name,
      slug: data.slug,
      domain: data.domain,
      users: {
        create: {
          email: data.adminEmail,
          name: data.adminName,
          passwordHash: await hashPassword(data.adminPassword),
          role: 'ADMIN',
        },
      },
    },
    include: {
      users: true,
    },
  });

  return org;
}

// ============================================
// Error Classes
// ============================================

export class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ForbiddenError';
  }
}
