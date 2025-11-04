import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // Seed Test Plan for Technical Drawings
  const technicalDrawingPlan = await prisma.testPlan.create({
    data: {
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

  console.log('Seeding finished.');
  console.log(`Created test plans: ${technicalDrawingPlan.id}, ${labelPlan.id}, ${invoicePlan.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
