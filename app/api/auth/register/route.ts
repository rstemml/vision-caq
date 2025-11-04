import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createOrganization } from '@/lib/auth';

const registerSchema = z.object({
  organizationName: z.string().min(1, 'Organisationsname ist erforderlich'),
  organizationSlug: z
    .string()
    .min(3, 'Slug muss mindestens 3 Zeichen lang sein')
    .regex(/^[a-z0-9-]+$/, 'Slug darf nur Kleinbuchstaben, Zahlen und Bindestriche enthalten'),
  email: z.string().email('Ungültige E-Mail-Adresse'),
  password: z.string().min(8, 'Passwort muss mindestens 8 Zeichen lang sein'),
  name: z.string().min(1, 'Name ist erforderlich'),
  domain: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    const org = await createOrganization({
      name: validatedData.organizationName,
      slug: validatedData.organizationSlug,
      domain: validatedData.domain,
      adminEmail: validatedData.email,
      adminPassword: validatedData.password,
      adminName: validatedData.name,
    });

    return NextResponse.json(
      {
        message: 'Organisation erfolgreich erstellt',
        organization: {
          id: org.id,
          name: org.name,
          slug: org.slug,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validierungsfehler', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.includes('already exists')) {
      return NextResponse.json(
        { error: 'Organisation mit diesem Slug existiert bereits' },
        { status: 409 }
      );
    }

    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Registrierung fehlgeschlagen' },
      { status: 500 }
    );
  }
}
