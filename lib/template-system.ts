// Template-System für wiederverwendbare Prüfplan-Vorlagen
// lib/template-system.ts

export interface TestPlanTemplate {
  id: string;
  name: string;
  industry: 'AUTOMOTIVE' | 'PHARMA' | 'ELECTRONICS' | 'FOOD' | 'GENERAL';
  category: DocumentCategory;
  description: string;
  procedures: ProcedureTemplate[];
}

export interface ProcedureTemplate {
  name: string;
  description: string;
  steps: StepTemplate[];
}

export interface StepTemplate {
  name: string;
  description: string;
  checkType: CheckType;
  parameters: Record<string, any>;
  required: boolean;
}

// Beispiel-Templates
export const AUTOMOTIVE_DRAWING_TEMPLATE: TestPlanTemplate = {
  id: 'automotive-drawing',
  name: 'Automotive - Technische Zeichnung',
  industry: 'AUTOMOTIVE',
  category: 'TECHNICAL_DRAWING',
  description: 'Standard-Prüfung für technische Zeichnungen in der Automobilindustrie',
  procedures: [
    {
      name: 'PPAP Anforderungen',
      description: 'Production Part Approval Process',
      steps: [
        {
          name: 'PPAP Level angegeben',
          description: 'Prüft ob PPAP Level (1-5) auf der Zeichnung vermerkt ist',
          checkType: 'PRESENCE',
          parameters: {
            element: 'PPAP Level',
            location: 'Schriftfeld',
            pattern: 'PPAP Level [1-5]',
          },
          required: true,
        },
        {
          name: 'Änderungsstand aktuell',
          description: 'Prüft ob Änderungsstand vorhanden und aktuell',
          checkType: 'FIELD_VALUE',
          parameters: {
            field: 'Änderungsstand',
            format: 'alphanumerisch',
          },
          required: true,
        },
      ],
    },
    {
      name: 'Automotive Normen',
      description: 'Branchenspezifische Normen',
      steps: [
        {
          name: 'IATF 16949 Konformität',
          description: 'Prüft Konformität mit IATF 16949',
          checkType: 'LEGAL_REQUIREMENT',
          parameters: {
            standard: 'IATF 16949',
            aspects: ['Dokumentation', 'Qualitätsanforderungen'],
          },
          required: true,
        },
      ],
    },
  ],
};

export const PHARMA_LABEL_TEMPLATE: TestPlanTemplate = {
  id: 'pharma-label',
  name: 'Pharma - Medikamenten-Etikett',
  industry: 'PHARMA',
  category: 'LABEL',
  description: 'GMP-konforme Prüfung von Pharma-Etiketten',
  procedures: [
    {
      name: 'GMP Pflichtangaben',
      description: 'Good Manufacturing Practice Anforderungen',
      steps: [
        {
          name: 'Charge/LOT Nummer',
          description: 'Prüft Vorhandensein und Format der Chargennummer',
          checkType: 'TEXT_EXTRACTION',
          parameters: {
            field: 'Charge',
            pattern: '^[A-Z0-9]{6,12}$',
            location: 'prominent',
          },
          required: true,
        },
        {
          name: 'Verfallsdatum',
          description: 'Prüft Verfallsdatum in korrektem Format',
          checkType: 'FIELD_VALUE',
          parameters: {
            field: 'Expiry Date',
            format: 'MM/YYYY',
            validation: 'future_date',
          },
          required: true,
        },
        {
          name: 'Pharmazentralnummer (PZN)',
          description: 'Validiert PZN',
          checkType: 'FIELD_VALUE',
          parameters: {
            field: 'PZN',
            pattern: '^[0-9]{7,8}$',
            checksum: true,
          },
          required: true,
        },
      ],
    },
    {
      name: 'Lesbarkeit & Qualität',
      description: 'Sicherstellung der Lesbarkeit',
      steps: [
        {
          name: 'Barcode/DataMatrix Qualität',
          description: 'Prüft Barcode-Qualität nach ISO/IEC 15415',
          checkType: 'IMAGE_QUALITY',
          parameters: {
            type: 'datamatrix',
            min_grade: 'C',
            standard: 'ISO/IEC 15415',
          },
          required: true,
        },
      ],
    },
  ],
};

export const ELECTRONICS_CE_TEMPLATE: TestPlanTemplate = {
  id: 'electronics-ce',
  name: 'Elektronik - CE-Kennzeichnung',
  industry: 'ELECTRONICS',
  category: 'LABEL',
  description: 'Prüfung von CE-Konformitätskennzeichnung',
  procedures: [
    {
      name: 'CE-Marking Anforderungen',
      description: 'EU-Richtlinien für CE-Kennzeichnung',
      steps: [
        {
          name: 'CE-Logo vorhanden',
          description: 'Prüft Vorhandensein des CE-Logos',
          checkType: 'PRESENCE',
          parameters: {
            element: 'CE-Logo',
            min_size_mm: 5,
          },
          required: true,
        },
        {
          name: 'Notified Body Number',
          description: 'Falls zutreffend, prüft 4-stellige Kennnummer',
          checkType: 'TEXT_EXTRACTION',
          parameters: {
            pattern: '^[0-9]{4}$',
            optional: true,
          },
          required: false,
        },
        {
          name: 'EU-Konformitätserklärung referenziert',
          description: 'Prüft Verweis auf Konformitätserklärung',
          checkType: 'PRESENCE',
          parameters: {
            element: 'DoC Reference',
            keywords: ['EU-Konformitätserklärung', 'Declaration of Conformity'],
          },
          required: true,
        },
      ],
    },
  ],
};

// Template-Loader
export class TemplateManager {
  private templates: Map<string, TestPlanTemplate> = new Map();

  constructor() {
    // Registriere Standard-Templates
    this.registerTemplate(AUTOMOTIVE_DRAWING_TEMPLATE);
    this.registerTemplate(PHARMA_LABEL_TEMPLATE);
    this.registerTemplate(ELECTRONICS_CE_TEMPLATE);
  }

  registerTemplate(template: TestPlanTemplate) {
    this.templates.set(template.id, template);
  }

  getTemplate(id: string): TestPlanTemplate | undefined {
    return this.templates.get(id);
  }

  getTemplatesByIndustry(industry: string): TestPlanTemplate[] {
    return Array.from(this.templates.values()).filter(
      (t) => t.industry === industry
    );
  }

  getAllTemplates(): TestPlanTemplate[] {
    return Array.from(this.templates.values());
  }

  // Konvertiert Template zu echtem Prüfplan
  async instantiateTemplate(templateId: string, customName?: string) {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    // Erstelle Prüfplan aus Template
    const testPlan = await prisma.testPlan.create({
      data: {
        name: customName || template.name,
        description: template.description,
        category: template.category,
        active: true,
        procedures: {
          create: template.procedures.map((proc, procIdx) => ({
            name: proc.name,
            description: proc.description,
            order: procIdx,
            steps: {
              create: proc.steps.map((step, stepIdx) => ({
                name: step.name,
                description: step.description,
                checkType: step.checkType,
                parameters: step.parameters,
                required: step.required,
                order: stepIdx,
              })),
            },
          })),
        },
      },
      include: {
        procedures: {
          include: {
            steps: true,
          },
        },
      },
    });

    return testPlan;
  }
}

export const templateManager = new TemplateManager();
