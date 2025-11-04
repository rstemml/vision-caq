"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

const checkTypes = [
  { value: "PRESENCE", label: "Vorhandensein", description: "Prüft ob ein Element vorhanden ist" },
  { value: "FIELD_VALUE", label: "Feldwert", description: "Validiert den Wert eines Feldes" },
  { value: "LEGAL_REQUIREMENT", label: "Gesetzliche Vorgabe", description: "Prüft gesetzliche Anforderungen" },
  { value: "DIN_STANDARD", label: "DIN-Norm", description: "Prüft gegen DIN-Standards" },
  { value: "IMAGE_QUALITY", label: "Bildqualität", description: "Analysiert die Bildqualität" },
  { value: "TEXT_EXTRACTION", label: "Text-Extraktion", description: "Extrahiert und validiert Text" },
  { value: "CUSTOM", label: "Benutzerdefiniert", description: "Benutzerdefinierte Prüfung" },
];

export default function NewStepPage({
  params,
}: {
  params: { testPlanId: string; procedureId: string };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    checkType: "PRESENCE" as const,
    required: true,
    order: 0,
    parameters: {} as Record<string, any>,
  });

  const [parameterKey, setParameterKey] = useState("");
  const [parameterValue, setParameterValue] = useState("");

  const addParameter = () => {
    if (parameterKey && parameterValue) {
      setFormData({
        ...formData,
        parameters: {
          ...formData.parameters,
          [parameterKey]: parameterValue,
        },
      });
      setParameterKey("");
      setParameterValue("");
    }
  };

  const removeParameter = (key: string) => {
    const newParams = { ...formData.parameters };
    delete newParams[key];
    setFormData({ ...formData, parameters: newParams });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/procedure-steps", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          procedureId: params.procedureId,
        }),
      });

      if (!response.ok) throw new Error("Failed to create step");

      router.push(`/test-plans/${params.testPlanId}`);
      router.refresh();
    } catch (error) {
      console.error("Error creating step:", error);
      alert("Fehler beim Erstellen des Prüfschritts");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="text-2xl font-bold text-primary">
            Vision CAQ
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Link href={`/test-plans/${params.testPlanId}`}>
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zum Prüfplan
          </Button>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Neuen Prüfschritt erstellen</CardTitle>
            <CardDescription>
              Fügen Sie einen neuen Prüfschritt zur Prozedur hinzu
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="z.B. Artikelnummer vorhanden"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Beschreibung *</Label>
                <Textarea
                  id="description"
                  placeholder="Detaillierte Beschreibung was geprüft werden soll"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="checkType">Prüftyp *</Label>
                <Select
                  value={formData.checkType}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, checkType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {checkTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div>
                          <div className="font-medium">{type.label}</div>
                          <div className="text-xs text-muted-foreground">
                            {type.description}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Parameter</Label>
                <div className="space-y-2">
                  {Object.entries(formData.parameters).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center gap-2 p-2 bg-secondary/30 rounded"
                    >
                      <span className="font-medium flex-1">
                        {key}: {String(value)}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeParameter(key)}
                      >
                        Entfernen
                      </Button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Parameter-Name"
                      value={parameterKey}
                      onChange={(e) => setParameterKey(e.target.value)}
                    />
                    <Input
                      placeholder="Wert"
                      value={parameterValue}
                      onChange={(e) => setParameterValue(e.target.value)}
                    />
                    <Button type="button" onClick={addParameter} variant="outline">
                      Hinzufügen
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Zusätzliche Parameter für die Prüfung (z.B. erwarteter Wert, Regex-Pattern, etc.)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="order">Reihenfolge</Label>
                <Input
                  id="order"
                  type="number"
                  min="0"
                  value={formData.order}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      order: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="required"
                  checked={formData.required}
                  onChange={(e) =>
                    setFormData({ ...formData, required: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="required" className="font-normal">
                  Prüfschritt ist verpflichtend
                </Label>
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? "Wird erstellt..." : "Prüfschritt erstellen"}
                </Button>
                <Link href={`/test-plans/${params.testPlanId}`} className="flex-1">
                  <Button type="button" variant="outline" className="w-full">
                    Abbrechen
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
