import { PrismaClient } from '@prisma/client';
import { createOrganization } from '../lib/auth';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // ============================================
  // CREATE ORGANIZATIONS AND USERS
  // ============================================

  console.log('Creating organizations...');

  // Organization 1: Automotive company
  const org1 = await createOrganization({
    name: 'AutoParts GmbH',
    slug: 'autoparts-gmbh',
    domain: 'autoparts.example.com',
    adminEmail: 'admin@autoparts.example.com',
    adminPassword: 'Password123!',
    adminName: 'Max Mustermann',
  });
  console.log(`Created organization: ${org1.name} (ID: ${org1.id})`);

  // Create additional users for AutoParts
  const org1Manager = await prisma.user.create({
    data: {
      email: 'manager@autoparts.example.com',
      name: 'Anna Manager',
      passwordHash: await import('bcryptjs').then(bcrypt => bcrypt.hash('Password123!', 10)),
      role: 'MANAGER',
      orgId: org1.id,
    },
  });

  const org1User = await prisma.user.create({
    data: {
      email: 'inspector@autoparts.example.com',
      name: 'Tom Inspector',
      passwordHash: await import('bcryptjs').then(bcrypt => bcrypt.hash('Password123!', 10)),
      role: 'USER',
      orgId: org1.id,
    },
  });

  // Organization 2: Electronics company
  const org2 = await createOrganization({
    name: 'ElectroTech AG',
    slug: 'electrotech-ag',
    domain: 'electrotech.example.com',
    adminEmail: 'admin@electrotech.example.com',
    adminPassword: 'Password123!',
    adminName: 'Lisa Schmidt',
  });
  console.log(`Created organization: ${org2.name} (ID: ${org2.id})`);

  // Create additional users for ElectroTech
  const org2Manager = await prisma.user.create({
    data: {
      email: 'manager@electrotech.example.com',
      name: 'Peter Quality',
      passwordHash: await import('bcryptjs').then(bcrypt => bcrypt.hash('Password123!', 10)),
      role: 'MANAGER',
      orgId: org2.id,
    },
  });

  console.log('Organizations and users created!');
  console.log('');
  console.log('Test credentials:');
  console.log('  AutoParts GmbH:');
  console.log('    Admin: admin@autoparts.example.com / Password123!');
  console.log('    Manager: manager@autoparts.example.com / Password123!');
  console.log('    User: inspector@autoparts.example.com / Password123!');
  console.log('  ElectroTech AG:');
  console.log('    Admin: admin@electrotech.example.com / Password123!');
  console.log('    Manager: manager@electrotech.example.com / Password123!');
  console.log('');

  // ============================================
  // TEST PLANS FOR ORG 1 (AutoParts GmbH)
  // ============================================

  console.log('Creating test plans for AutoParts GmbH...');

  // Seed Test Plan for Technical Drawings
  const technicalDrawingPlan = await prisma.testPlan.create({
    data: {
      orgId: org1.id,
      name: 'Technische Zeichnung - Standard',
      description: 'Standard-Prüfplan für technische Zeichnungen nach DIN ISO 128',
      category: 'TECHNICAL_DRAWING',
      active: true,
      procedures: {
        create: [
          {
            name: 'Grunddaten-Prüfung',
            description: 'Prüfung der Pflichtangaben',
            order: 0,
            steps: {
              create: [
                {
                  name: 'Zeichnungsnummer vorhanden',
                  description: 'Prüft, ob eine eindeutige Zeichnungsnummer vorhanden ist',
                  checkType: 'PRESENCE',
                  parameters: {
                    element: 'Zeichnungsnummer',
                    location: 'Schriftfeld',
                  },
                  order: 0,
                  required: true,
                },
                {
                  name: 'Benennung vorhanden',
                  description: 'Prüft, ob eine Benennung des Bauteils vorhanden ist',
                  checkType: 'PRESENCE',
                  parameters: {
                    element: 'Benennung',
                    location: 'Schriftfeld',
                  },
                  order: 1,
                  required: true,
                },
                {
                  name: 'Maßstab angegeben',
                  description: 'Prüft, ob der Maßstab angegeben ist',
                  checkType: 'FIELD_VALUE',
                  parameters: {
                    field: 'Maßstab',
                    pattern: '^[0-9]+:[0-9]+$',
                  },
                  order: 2,
                  required: true,
                },
              ],
            },
          },
          {
            name: 'Normen-Konformität',
            description: 'Prüfung gegen DIN-Normen',
            order: 1,
            steps: {
              create: [
                {
                  name: 'DIN ISO 128 Konformität',
                  description: 'Prüft die Einhaltung der DIN ISO 128 (Technische Zeichnungen)',
                  checkType: 'DIN_STANDARD',
                  parameters: {
                    standard: 'DIN ISO 128',
                    aspects: ['Linienarten', 'Linienbreiten', 'Schriftfeld'],
                  },
                  order: 0,
                  required: true,
                },
              ],
            },
          },
          {
            name: 'Qualitätsprüfung',
            description: 'Bildqualität und Lesbarkeit',
            order: 2,
            steps: {
              create: [
                {
                  name: 'Bildqualität ausreichend',
                  description: 'Prüft, ob die Bildqualität für die Fertigung ausreichend ist',
                  checkType: 'IMAGE_QUALITY',
                  parameters: {
                    min_dpi: 300,
                    check_readability: true,
                  },
                  order: 0,
                  required: true,
                },
              ],
            },
          },
        ],
      },
    },
  });

  // Seed Test Plan for Labels
  const labelPlan = await prisma.testPlan.create({
    data: {
      orgId: org1.id,
      name: 'Etiketten-Prüfung',
      description: 'Prüfplan für Produktetiketten und Kennzeichnungen',
      category: 'LABEL',
      active: true,
      procedures: {
        create: [
          {
            name: 'Pflichtangaben',
            description: 'Prüfung gesetzlich vorgeschriebener Angaben',
            order: 0,
            steps: {
              create: [
                {
                  name: 'CE-Kennzeichnung vorhanden',
                  description: 'Prüft das Vorhandensein der CE-Kennzeichnung',
                  checkType: 'LEGAL_REQUIREMENT',
                  parameters: {
                    requirement: 'CE-Kennzeichnung',
                    mandatory: true,
                  },
                  order: 0,
                  required: true,
                },
                {
                  name: 'Artikelnummer lesbar',
                  description: 'Prüft, ob die Artikelnummer vorhanden und lesbar ist',
                  checkType: 'TEXT_EXTRACTION',
                  parameters: {
                    field: 'Artikelnummer',
                    pattern: '^[A-Z0-9-]+$',
                  },
                  order: 1,
                  required: true,
                },
                {
                  name: 'Barcode vorhanden',
                  description: 'Prüft das Vorhandensein eines Barcodes',
                  checkType: 'PRESENCE',
                  parameters: {
                    element: 'Barcode',
                    type: 'EAN-13 oder QR-Code',
                  },
                  order: 2,
                  required: false,
                },
              ],
            },
          },
        ],
      },
    },
  });

  // Seed Test Plan for Invoices
  const invoicePlan = await prisma.testPlan.create({
    data: {
      orgId: org1.id,
      name: 'Rechnungs-Prüfung',
      description: 'Prüfplan für Rechnungen gemäß UStG',
      category: 'INVOICE',
      active: true,
      procedures: {
        create: [
          {
            name: 'Pflichtangaben UStG',
            description: 'Prüfung der Pflichtangaben nach §14 UStG',
            order: 0,
            steps: {
              create: [
                {
                  name: 'Rechnungsnummer vorhanden',
                  description: 'Prüft das Vorhandensein einer fortlaufenden Rechnungsnummer',
                  checkType: 'PRESENCE',
                  parameters: {
                    element: 'Rechnungsnummer',
                    format: 'fortlaufend',
                  },
                  order: 0,
                  required: true,
                },
                {
                  name: 'Rechnungsdatum vorhanden',
                  description: 'Prüft das Vorhandensein des Rechnungsdatums',
                  checkType: 'FIELD_VALUE',
                  parameters: {
                    field: 'Rechnungsdatum',
                    format: 'Datum',
                  },
                  order: 1,
                  required: true,
                },
                {
                  name: 'Steuernummer oder USt-IdNr. vorhanden',
                  description: 'Prüft das Vorhandensein der Steuernummer oder USt-IdNr.',
                  checkType: 'LEGAL_REQUIREMENT',
                  parameters: {
                    requirement: 'Steuernummer oder USt-IdNr.',
                    regex_steuernr: '^[0-9]{2}/[0-9]{3}/[0-9]{5}$',
                    regex_ustid: '^DE[0-9]{9}$',
                  },
                  order: 2,
                  required: true,
                },
                {
                  name: 'Nettobetrag und Umsatzsteuer',
                  description: 'Prüft, ob Nettobetrag und Umsatzsteuer korrekt ausgewiesen sind',
                  checkType: 'FIELD_VALUE',
                  parameters: {
                    fields: ['Nettobetrag', 'Umsatzsteuer', 'Bruttobetrag'],
                    validate_calculation: true,
                  },
                  order: 3,
                  required: true,
                },
              ],
            },
          },
        ],
      },
    },
  });

  // ============================================
  // WORKFLOWS
  // ============================================

  console.log('Creating example workflows...');

  // Workflow für technische Zeichnungen mit paralleler Prüfung
  const technicalDrawingWorkflow = await prisma.workflow.create({
    data: {
      orgId: org1.id,
      name: 'Technische Zeichnung - Parallele Vollprüfung',
      description: 'Workflow mit paralleler Ausführung von Qualitätsprüfungen für maximale Effizienz',
      category: 'TECHNICAL_DRAWING',
      active: true,
    },
  });

  // Erstelle Workflow-Knoten
  const startNode = await prisma.workflowNode.create({
    data: {
      workflowId: technicalDrawingWorkflow.id,
      name: 'Start',
      nodeType: 'START',
      config: {},
      position: { x: 250, y: 50 },
    },
  });

  const grunddatenNode = await prisma.workflowNode.create({
    data: {
      workflowId: technicalDrawingWorkflow.id,
      name: 'Grunddaten-Prüfung',
      description: 'Prüft Pflichtangaben (Zeichnungsnummer, Maßstab, etc.)',
      nodeType: 'TEST_STEP',
      config: {
        stepId: technicalDrawingPlan.procedures[0].steps[0].id, // Zeichnungsnummer
      },
      position: { x: 250, y: 150 },
    },
  });

  const parallelGateway = await prisma.workflowNode.create({
    data: {
      workflowId: technicalDrawingWorkflow.id,
      name: 'Parallele Prüfungen',
      description: 'Startet mehrere Prüfungen parallel',
      nodeType: 'PARALLEL_GATEWAY',
      config: {},
      position: { x: 250, y: 250 },
    },
  });

  const normenNode = await prisma.workflowNode.create({
    data: {
      workflowId: technicalDrawingWorkflow.id,
      name: 'DIN ISO 128 Prüfung',
      description: 'Prüft Konformität mit DIN ISO 128',
      nodeType: 'TEST_STEP',
      config: {
        stepId: technicalDrawingPlan.procedures[1].steps[0].id, // DIN-Standard
      },
      position: { x: 100, y: 350 },
    },
  });

  const bildqualitaetNode = await prisma.workflowNode.create({
    data: {
      workflowId: technicalDrawingWorkflow.id,
      name: 'Bildqualität',
      description: 'Prüft Bildqualität und Lesbarkeit',
      nodeType: 'TEST_STEP',
      config: {
        stepId: technicalDrawingPlan.procedures[2].steps[0].id, // Bildqualität
      },
      position: { x: 400, y: 350 },
    },
  });

  const parallelJoin = await prisma.workflowNode.create({
    data: {
      workflowId: technicalDrawingWorkflow.id,
      name: 'Parallele Prüfungen zusammenführen',
      nodeType: 'PARALLEL_JOIN',
      config: {},
      position: { x: 250, y: 450 },
    },
  });

  const endNode = await prisma.workflowNode.create({
    data: {
      workflowId: technicalDrawingWorkflow.id,
      name: 'Ende',
      nodeType: 'END',
      config: {},
      position: { x: 250, y: 550 },
    },
  });

  // Erstelle Workflow-Edges (Verbindungen)
  await prisma.workflowEdge.createMany({
    data: [
      {
        workflowId: technicalDrawingWorkflow.id,
        sourceNodeId: startNode.id,
        targetNodeId: grunddatenNode.id,
      },
      {
        workflowId: technicalDrawingWorkflow.id,
        sourceNodeId: grunddatenNode.id,
        targetNodeId: parallelGateway.id,
      },
      {
        workflowId: technicalDrawingWorkflow.id,
        sourceNodeId: parallelGateway.id,
        targetNodeId: normenNode.id,
        label: 'Parallel 1',
      },
      {
        workflowId: technicalDrawingWorkflow.id,
        sourceNodeId: parallelGateway.id,
        targetNodeId: bildqualitaetNode.id,
        label: 'Parallel 2',
      },
      {
        workflowId: technicalDrawingWorkflow.id,
        sourceNodeId: normenNode.id,
        targetNodeId: parallelJoin.id,
      },
      {
        workflowId: technicalDrawingWorkflow.id,
        sourceNodeId: bildqualitaetNode.id,
        targetNodeId: parallelJoin.id,
      },
      {
        workflowId: technicalDrawingWorkflow.id,
        sourceNodeId: parallelJoin.id,
        targetNodeId: endNode.id,
      },
    ],
  });

  // Einfacher sequenzieller Workflow für Etiketten
  const labelWorkflow = await prisma.workflow.create({
    data: {
      orgId: org1.id,
      name: 'Etiketten-Prüfung - Sequenziell',
      description: 'Sequenzieller Workflow für Etiketten-Prüfung',
      category: 'LABEL',
      active: true,
    },
  });

  const labelStartNode = await prisma.workflowNode.create({
    data: {
      workflowId: labelWorkflow.id,
      name: 'Start',
      nodeType: 'START',
      config: {},
      position: { x: 250, y: 50 },
    },
  });

  const ceKennzeichnungNode = await prisma.workflowNode.create({
    data: {
      workflowId: labelWorkflow.id,
      name: 'CE-Kennzeichnung prüfen',
      nodeType: 'TEST_STEP',
      config: {
        stepId: labelPlan.procedures[0].steps[0].id, // CE-Kennzeichnung
      },
      position: { x: 250, y: 150 },
    },
  });

  const artikelnummerNode = await prisma.workflowNode.create({
    data: {
      workflowId: labelWorkflow.id,
      name: 'Artikelnummer prüfen',
      nodeType: 'TEST_STEP',
      config: {
        stepId: labelPlan.procedures[0].steps[1].id, // Artikelnummer
      },
      position: { x: 250, y: 250 },
    },
  });

  const labelEndNode = await prisma.workflowNode.create({
    data: {
      workflowId: labelWorkflow.id,
      name: 'Ende',
      nodeType: 'END',
      config: {},
      position: { x: 250, y: 350 },
    },
  });

  await prisma.workflowEdge.createMany({
    data: [
      {
        workflowId: labelWorkflow.id,
        sourceNodeId: labelStartNode.id,
        targetNodeId: ceKennzeichnungNode.id,
      },
      {
        workflowId: labelWorkflow.id,
        sourceNodeId: ceKennzeichnungNode.id,
        targetNodeId: artikelnummerNode.id,
      },
      {
        workflowId: labelWorkflow.id,
        sourceNodeId: artikelnummerNode.id,
        targetNodeId: labelEndNode.id,
      },
    ],
  });

  // ============================================
  // TEST PLANS FOR ORG 2 (ElectroTech AG)
  // ============================================

  console.log('Creating test plans for ElectroTech AG...');

  // Simple test plan for Electronics labels
  const org2LabelPlan = await prisma.testPlan.create({
    data: {
      orgId: org2.id,
      name: 'Elektronik-Etiketten Prüfung',
      description: 'Prüfplan für Elektronik-Etiketten mit CE, RoHS, WEEE',
      category: 'LABEL',
      active: true,
      procedures: {
        create: [
          {
            name: 'Elektronik-Kennzeichnungen',
            description: 'Prüfung der gesetzlichen Kennzeichnungen für Elektronikprodukte',
            order: 0,
            steps: {
              create: [
                {
                  name: 'CE-Kennzeichnung vorhanden',
                  description: 'Prüft das Vorhandensein der CE-Kennzeichnung',
                  checkType: 'LEGAL_REQUIREMENT',
                  parameters: {
                    requirement: 'CE-Kennzeichnung',
                    mandatory: true,
                  },
                  order: 0,
                  required: true,
                },
                {
                  name: 'RoHS-Konformität',
                  description: 'Prüft RoHS-Konformitätserklärung',
                  checkType: 'LEGAL_REQUIREMENT',
                  parameters: {
                    requirement: 'RoHS',
                    directive: '2011/65/EU',
                  },
                  order: 1,
                  required: true,
                },
                {
                  name: 'WEEE-Symbol vorhanden',
                  description: 'Prüft durchgestrichene Mülltonne für WEEE',
                  checkType: 'PRESENCE',
                  parameters: {
                    element: 'WEEE-Symbol',
                    description: 'Durchgestrichene Mülltonne',
                  },
                  order: 2,
                  required: true,
                },
              ],
            },
          },
        ],
      },
    },
  });

  // Simple workflow for org 2
  const org2LabelWorkflow = await prisma.workflow.create({
    data: {
      orgId: org2.id,
      name: 'Elektronik-Etiketten Workflow',
      description: 'Standard-Workflow für Elektronik-Etiketten',
      category: 'LABEL',
      active: true,
    },
  });

  const org2StartNode = await prisma.workflowNode.create({
    data: {
      workflowId: org2LabelWorkflow.id,
      name: 'Start',
      nodeType: 'START',
      config: {},
      position: { x: 250, y: 50 },
    },
  });

  const org2CeNode = await prisma.workflowNode.create({
    data: {
      workflowId: org2LabelWorkflow.id,
      name: 'CE-Kennzeichnung prüfen',
      nodeType: 'TEST_STEP',
      config: {
        stepId: org2LabelPlan.procedures[0].steps[0].id,
      },
      position: { x: 250, y: 150 },
    },
  });

  const org2EndNode = await prisma.workflowNode.create({
    data: {
      workflowId: org2LabelWorkflow.id,
      name: 'Ende',
      nodeType: 'END',
      config: {},
      position: { x: 250, y: 250 },
    },
  });

  await prisma.workflowEdge.createMany({
    data: [
      {
        workflowId: org2LabelWorkflow.id,
        sourceNodeId: org2StartNode.id,
        targetNodeId: org2CeNode.id,
      },
      {
        workflowId: org2LabelWorkflow.id,
        sourceNodeId: org2CeNode.id,
        targetNodeId: org2EndNode.id,
      },
    ],
  });

  console.log('Seeding finished.');
  console.log('');
  console.log('AutoParts GmbH:');
  console.log(`  Test plans: ${technicalDrawingPlan.id}, ${labelPlan.id}, ${invoicePlan.id}`);
  console.log(`  Workflows: ${technicalDrawingWorkflow.id}, ${labelWorkflow.id}`);
  console.log('');
  console.log('ElectroTech AG:');
  console.log(`  Test plans: ${org2LabelPlan.id}`);
  console.log(`  Workflows: ${org2LabelWorkflow.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
