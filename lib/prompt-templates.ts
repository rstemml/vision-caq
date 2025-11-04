// Optimierte Prompt-Templates für verschiedene Use Cases
// lib/prompt-templates.ts

export interface PromptTemplate {
  checkType: string;
  industry?: string;
  template: (context: PromptContext) => string;
}

export interface PromptContext {
  stepName: string;
  stepDescription: string;
  parameters: Record<string, any>;
  documentType: string;
  documentText?: string;
  customInstructions?: string;
}

// Basis-Prompts
export const BASE_PROMPTS: Record<string, (ctx: PromptContext) => string> = {
  PRESENCE: (ctx) => `
Analysiere das Dokument und prüfe, ob folgendes Element vorhanden ist:

Element: ${ctx.parameters.element}
${ctx.parameters.location ? `Erwartete Position: ${ctx.parameters.location}` : ''}
${ctx.parameters.pattern ? `Erwartetes Muster: ${ctx.parameters.pattern}` : ''}

Anweisungen:
- Suche sorgfältig im gesamten Dokument
- Achte auf Variationen in Schreibweise und Format
- Berücksichtige auch handschriftliche Einträge

Antworte im folgenden JSON-Format:
{
  "result": "PASSED" oder "FAILED",
  "message": "Kurze Erklärung",
  "details": {
    "found": true/false,
    "location": "Wo gefunden (falls zutreffend)",
    "confidence": 0.0-1.0
  }
}
`,

  FIELD_VALUE: (ctx) => `
Extrahiere und validiere folgendes Feld aus dem Dokument:

Feld: ${ctx.parameters.field}
${ctx.parameters.format ? `Erwartetes Format: ${ctx.parameters.format}` : ''}
${ctx.parameters.pattern ? `Regex-Pattern: ${ctx.parameters.pattern}` : ''}
${ctx.parameters.expected_value ? `Erwarteter Wert: ${ctx.parameters.expected_value}` : ''}

Validierungsregeln:
${JSON.stringify(ctx.parameters, null, 2)}

Antworte im folgenden JSON-Format:
{
  "result": "PASSED" oder "FAILED" oder "WARNING",
  "message": "Erklärung",
  "details": {
    "found_value": "extrahierter Wert",
    "is_valid": true/false,
    "validation_errors": ["Liste von Fehlern falls vorhanden"],
    "confidence": 0.0-1.0
  }
}
`,

  DIN_STANDARD: (ctx) => `
Prüfe die Konformität mit folgendem Standard:

Standard: ${ctx.parameters.standard}
Zu prüfende Aspekte: ${JSON.stringify(ctx.parameters.aspects)}

Prüfkriterien:
- Formale Anforderungen gemäß ${ctx.parameters.standard}
- Vollständigkeit der Angaben
- Korrektheit der Darstellung

Antworte im folgenden JSON-Format:
{
  "result": "PASSED" oder "FAILED" oder "WARNING",
  "message": "Zusammenfassung",
  "details": {
    "compliant_aspects": ["Liste erfüllter Anforderungen"],
    "non_compliant_aspects": ["Liste nicht erfüllter Anforderungen"],
    "recommendations": ["Verbesserungsvorschläge"],
    "confidence": 0.0-1.0
  }
}
`,

  IMAGE_QUALITY: (ctx) => `
Analysiere die Bildqualität des Dokuments:

Kriterien:
- Mindest-DPI: ${ctx.parameters.min_dpi || 300}
- Lesbarkeit: ${ctx.parameters.check_readability ? 'Ja' : 'Nein'}
- Kontrast: ${ctx.parameters.check_contrast ? 'Ja' : 'Nein'}

Bewerte:
1. Auflösung und Schärfe
2. Lesbarkeit von Text
3. Kontrast und Helligkeit
4. Vollständigkeit (keine abgeschnittenen Bereiche)

Antworte im folgenden JSON-Format:
{
  "result": "PASSED" oder "FAILED" oder "WARNING",
  "message": "Qualitätsbewertung",
  "details": {
    "estimated_dpi": Zahl,
    "readability_score": 0.0-1.0,
    "contrast_score": 0.0-1.0,
    "issues": ["Liste von Qualitätsproblemen"],
    "confidence": 0.0-1.0
  }
}
`,
};

// Branchen-spezifische Prompts
export const AUTOMOTIVE_PROMPTS: Record<string, (ctx: PromptContext) => string> = {
  PPAP_VALIDATION: (ctx) => `
Als Automotive Quality Expert, prüfe PPAP (Production Part Approval Process) Anforderungen:

${ctx.stepDescription}

PPAP Level: ${ctx.parameters.ppap_level || 'Alle'}

Kritische Prüfpunkte:
- PPAP Level Kennzeichnung
- Änderungsstand/Revision
- Zeichnungsnummer eindeutig
- Toleranzangaben vollständig
- Material-Spezifikationen
- Oberflächenangaben

Referenz-Standard: AIAG PPAP Manual 4. Edition

Antworte als Automotive Quality Engineer im JSON-Format:
{
  "result": "PASSED" oder "FAILED" oder "WARNING",
  "message": "PPAP Compliance Assessment",
  "details": {
    "ppap_level": "erkanntes Level",
    "missing_requirements": ["fehlende Anforderungen"],
    "critical_issues": ["kritische Probleme"],
    "recommendations": ["Empfehlungen"],
    "confidence": 0.0-1.0
  }
}
`,

  IATF_CONFORMITY: (ctx) => `
Prüfe Konformität mit IATF 16949:

${ctx.stepDescription}

Bewerte speziell:
- Dokumentationsanforderungen gemäß IATF 16949
- Rückverfolgbarkeit
- Kundenspezifische Anforderungen

Antworte im JSON-Format mit detaillierter IATF-Bewertung.
`,
};

export const PHARMA_PROMPTS: Record<string, (ctx: PromptContext) => string> = {
  GMP_COMPLIANCE: (ctx) => `
Als GMP (Good Manufacturing Practice) Auditor, prüfe pharmazeutische Dokumentation:

${ctx.stepDescription}

GMP-Kritische Anforderungen:
- Eindeutige Identifikation (Charge/LOT)
- Verfallsdatum lesbar und gültig
- PZN/EAN korrekt
- Lagerungsbedingungen angegeben
- Hersteller-Information vollständig

Regulatorischer Kontext: EU GMP Annex 11

Antworte als GMP Auditor im JSON-Format:
{
  "result": "PASSED" oder "FAILED" oder "WARNING",
  "message": "GMP Compliance Assessment",
  "details": {
    "critical_findings": ["Kritische GMP-Abweichungen"],
    "major_findings": ["Wichtige Findings"],
    "minor_findings": ["Kleine Abweichungen"],
    "regulatory_risk": "HIGH" | "MEDIUM" | "LOW",
    "confidence": 0.0-1.0
  }
}
`,

  SERIALIZATION_CHECK: (ctx) => `
Prüfe pharmazeutische Serialisierung gemäß EU FMD (Falsified Medicines Directive):

${ctx.stepDescription}

Prüfe:
1. DataMatrix Code vorhanden und lesbar
2. Unique Identifier (UI) Format korrekt
3. Batch Number encoded
4. Expiry Date encoded
5. Serial Number encoded

Antworte im JSON-Format mit Serialisierungs-Details.
`,
};

export const ELECTRONICS_PROMPTS: Record<string, (ctx: PromptContext) => string> = {
  CE_MARKING: (ctx) => `
Als CE-Konformitätsbewertungsstelle, prüfe CE-Kennzeichnung:

${ctx.stepDescription}

EU-Richtlinien-Anforderungen:
- CE-Logo korrekt (Proportionen, Größe mind. 5mm)
- Notified Body Nummer falls zutreffend
- Konformitätserklärung referenziert
- UKCA-Marking (falls UK-Markt)

Antworte im JSON-Format:
{
  "result": "PASSED" oder "FAILED" oder "WARNING",
  "message": "CE Marking Assessment",
  "details": {
    "ce_logo_compliant": true/false,
    "notified_body": "Nummer oder null",
    "applicable_directives": ["Liste anwendbarer Richtlinien"],
    "market_compliance": ["EU", "UK", etc.],
    "confidence": 0.0-1.0
  }
}
`,

  ROHS_COMPLIANCE: (ctx) => `
Prüfe RoHS (Restriction of Hazardous Substances) Konformität:

${ctx.stepDescription}

Prüfe Dokumentation für:
- RoHS-Konformitätserklärung
- Ausnahmen dokumentiert
- Material-Zusammensetzung
- Supplier Compliance Statements

Antworte im JSON-Format mit RoHS-Bewertung.
`,
};

// Prompt-Builder
export class PromptBuilder {
  buildPrompt(context: PromptContext): string {
    const { checkType, documentType } = context;

    // 1. Versuche branchen-spezifischen Prompt
    if (context.parameters.industry) {
      const industryPrompts = this.getIndustryPrompts(context.parameters.industry);
      const customPrompt = industryPrompts?.[checkType];
      if (customPrompt) {
        return customPrompt(context);
      }
    }

    // 2. Verwende Basis-Prompt
    const basePrompt = BASE_PROMPTS[checkType];
    if (basePrompt) {
      return basePrompt(context);
    }

    // 3. Fallback: Generic Prompt
    return this.buildGenericPrompt(context);
  }

  private getIndustryPrompts(industry: string): Record<string, (ctx: PromptContext) => string> | undefined {
    switch (industry.toUpperCase()) {
      case 'AUTOMOTIVE':
        return AUTOMOTIVE_PROMPTS;
      case 'PHARMA':
        return PHARMA_PROMPTS;
      case 'ELECTRONICS':
        return ELECTRONICS_PROMPTS;
      default:
        return undefined;
    }
  }

  private buildGenericPrompt(context: PromptContext): string {
    return `
Prüfe folgende Anforderung:

${context.stepDescription}

Parameter: ${JSON.stringify(context.parameters, null, 2)}

Analysiere das Dokument sorgfältig und antworte im JSON-Format:
{
  "result": "PASSED" oder "FAILED" oder "WARNING",
  "message": "Detaillierte Erklärung",
  "details": {
    "findings": ["Erkenntnisse"],
    "confidence": 0.0-1.0
  }
}
`;
  }

  // Fügt Kontext-Information zum Prompt hinzu
  enrichPrompt(basePrompt: string, context: PromptContext): string {
    let enrichedPrompt = basePrompt;

    // Füge Custom Instructions hinzu
    if (context.customInstructions) {
      enrichedPrompt += `\n\nZusätzliche Anweisungen:\n${context.customInstructions}`;
    }

    // Füge Dokumenten-Text hinzu (erste 500 Zeichen)
    if (context.documentText) {
      const excerpt = context.documentText.substring(0, 500);
      enrichedPrompt += `\n\nDokumenten-Auszug:\n${excerpt}...`;
    }

    return enrichedPrompt;
  }
}

export const promptBuilder = new PromptBuilder();
