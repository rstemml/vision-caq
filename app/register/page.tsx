"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    organizationName: "",
    slug: "",
    domain: "",
    adminName: "",
    adminEmail: "",
    adminPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Auto-generate slug from organization name
    if (name === "organizationName") {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      setFormData((prev) => ({ ...prev, slug }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate passwords match
    if (formData.adminPassword !== formData.confirmPassword) {
      setError("Passwörter stimmen nicht überein");
      return;
    }

    // Validate password strength
    if (formData.adminPassword.length < 8) {
      setError("Passwort muss mindestens 8 Zeichen lang sein");
      return;
    }

    setLoading(true);

    try {
      await register({
        name: formData.organizationName,
        slug: formData.slug,
        domain: formData.domain || undefined,
        adminEmail: formData.adminEmail,
        adminPassword: formData.adminPassword,
        adminName: formData.adminName,
      });
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Registrierung fehlgeschlagen");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">Vision CAQ</h1>
          <p className="text-muted-foreground">Neue Organisation registrieren</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Organisation registrieren</CardTitle>
            <CardDescription>
              Erstellen Sie eine neue Organisation und Ihren Admin-Account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <h3 className="font-semibold text-sm">Organisations-Informationen</h3>

                <div className="space-y-2">
                  <Label htmlFor="organizationName">Organisations-Name *</Label>
                  <Input
                    id="organizationName"
                    name="organizationName"
                    type="text"
                    placeholder="z.B. Mustermann GmbH"
                    value={formData.organizationName}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">
                    URL-Slug *
                    <span className="text-xs text-muted-foreground ml-2">
                      (wird automatisch generiert)
                    </span>
                  </Label>
                  <Input
                    id="slug"
                    name="slug"
                    type="text"
                    placeholder="mustermann-gmbh"
                    value={formData.slug}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    pattern="[a-z0-9-]+"
                  />
                  <p className="text-xs text-muted-foreground">
                    Nur Kleinbuchstaben, Zahlen und Bindestriche
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="domain">
                    Domain (optional)
                  </Label>
                  <Input
                    id="domain"
                    name="domain"
                    type="text"
                    placeholder="mustermann.de"
                    value={formData.domain}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold text-sm">Administrator-Account</h3>

                <div className="space-y-2">
                  <Label htmlFor="adminName">Ihr Name *</Label>
                  <Input
                    id="adminName"
                    name="adminName"
                    type="text"
                    placeholder="Max Mustermann"
                    value={formData.adminName}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adminEmail">Ihre E-Mail *</Label>
                  <Input
                    id="adminEmail"
                    name="adminEmail"
                    type="email"
                    placeholder="max@mustermann.de"
                    value={formData.adminEmail}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    autoComplete="email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adminPassword">Passwort *</Label>
                  <Input
                    id="adminPassword"
                    name="adminPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.adminPassword}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    autoComplete="new-password"
                    minLength={8}
                  />
                  <p className="text-xs text-muted-foreground">
                    Mindestens 8 Zeichen
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Passwort bestätigen *</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Registrieren...
                  </>
                ) : (
                  "Organisation erstellen"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <p className="text-muted-foreground">
                Bereits registriert?{" "}
                <Link href="/login" className="text-primary hover:underline font-medium">
                  Jetzt anmelden
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
