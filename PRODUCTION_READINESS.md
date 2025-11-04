# Production Readiness Checklist für Kunden-Use-Cases

## ✅ Bereits implementiert

- [x] Flexible Prüfpläne mit Custom CheckTypes
- [x] Workflow-Engine (parallel, sequenziell, bedingt)
- [x] LLM-Integration (OpenAI/Anthropic)
- [x] PDF-Verarbeitung mit Bildextraktion
- [x] PostgreSQL Persistierung
- [x] REST API
- [x] Template-System (neu)
- [x] Branchen-spezifische Prompts (neu)

## 🔧 Kritische Erweiterungen für Production

### 1. Multi-Tenancy (Mandantenfähigkeit)

**Warum wichtig**: Mehrere Kunden auf einer Instanz

**Implementation**:
```typescript
// Erweitere Prisma Schema
model Organization {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique
  settings  Json?

  users     User[]
  testPlans TestPlan[]
  workflows Workflow[]
}

model User {
  id    String @id @default(cuid())
  email String @unique
  role  UserRole
  orgId String

  organization Organization @relation(fields: [orgId], references: [id])
}

// Row-Level Security (RLS)
// Jede Query filtert automatisch nach orgId
```

**Benefit**: Saubere Datentrennung pro Kunde

### 2. Custom Validation Scripts

**Warum wichtig**: Komplexe kundenspezifische Logik

**Implementation**:
```typescript
// Neue CheckType: CUSTOM_SCRIPT
model ProcedureStep {
  // ...
  customScript?: String  // JavaScript Code
}

// Executor in Python Service
class CustomScriptExecutor:
    def execute(self, script: str, context: dict) -> dict:
        # Sandbox-Umgebung (z.B. mit py_mini_racer)
        sandbox = create_sandbox()
        sandbox.set_globals({
            'document_text': context['text'],
            'document_images': context['images'],
            'parameters': context['parameters']
        })

        result = sandbox.eval(script)
        return result

# Beispiel Custom Script:
"""
function validateArticleNumber(text, params) {
    // Kunde-spezifische Regex
    const pattern = /ART-[0-9]{6}-[A-Z]{2}/;
    const match = text.match(pattern);

    if (!match) {
        return {
            result: 'FAILED',
            message: 'Artikelnummer nicht gefunden'
        };
    }

    // Kunde-spezifische Checksumme
    const checksum = calculateCustomChecksum(match[0]);
    if (!checksum.valid) {
        return {
            result: 'FAILED',
            message: 'Artikelnummer Checksumme ungültig'
        };
    }

    return {
        result: 'PASSED',
        message: 'Artikelnummer valide',
        details: { article_number: match[0] }
    };
}
"""
```

**Benefit**: Unbegrenzte Flexibilität für Spezialfälle

### 3. Document Type Erweiterung

**Warum wichtig**: Nicht nur PDFs

**Implementation**:
```typescript
// Unterstütze mehr Formate
enum DocumentType {
  PDF
  IMAGE       // JPG, PNG
  EXCEL       // XLSX für Tabellen
  WORD        // DOCX
  DXF_DWG     // CAD-Zeichnungen
  GERBER      // PCB-Files
}

// Python Service erweitern
class UniversalDocumentProcessor:
    def process(self, file: bytes, file_type: str):
        if file_type == 'PDF':
            return self.process_pdf(file)
        elif file_type == 'IMAGE':
            return self.process_image(file)
        elif file_type == 'DXF':
            return self.process_cad(file)
        # etc.
```

**Benefit**: Deckt mehr Use Cases ab

### 4. Training Data Management

**Warum wichtig**: LLM-Ergebnisse verbessern

**Implementation**:
```typescript
// Neue Tabellen
model TrainingExample {
  id          String @id @default(cuid())
  orgId       String
  documentId  String
  stepId      String

  // Human-verified Result
  expectedResult   String  // PASSED/FAILED
  expectedMessage  String
  expectedDetails  Json

  // Für Fine-Tuning
  usedForTraining  Boolean @default(false)
  qualityScore     Int     // 1-5
}

// Feedback Loop
POST /api/training/feedback
{
  "testResultId": "...",
  "correctedResult": "PASSED",
  "notes": "LLM hat CE-Logo übersehen"
}

// Später: Fine-Tuning Pipeline
async function createFineTuningDataset(orgId: string) {
  const examples = await prisma.trainingExample.findMany({
    where: { orgId, qualityScore: { gte: 4 } }
  });

  // Format für OpenAI Fine-Tuning
  const dataset = examples.map(ex => ({
    messages: [
      { role: "user", content: buildPrompt(ex) },
      { role: "assistant", content: JSON.stringify(ex.expectedResult) }
    ]
  }));

  // Upload to OpenAI
  const job = await openai.fineTuning.jobs.create({
    training_file: uploadDataset(dataset),
    model: "gpt-4o"
  });
}
```

**Benefit**: Kontinuierliche Verbesserung pro Kunde

### 5. Konfigurierbares Reporting

**Warum wichtig**: Jeder Kunde will andere Reports

**Implementation**:
```typescript
// Report Templates
model ReportTemplate {
  id       String @id
  orgId    String
  name     String
  format   String  // PDF, XLSX, JSON

  // Template Definition (Handlebars/Mustache)
  template String

  // Welche Daten
  includeFields Json
  // [
  //   "testRun.fileName",
  //   "testRun.startedAt",
  //   "testResults[].stepName",
  //   "testResults[].result"
  // ]
}

// Report Generator
class ReportGenerator {
  async generateReport(
    testRunId: string,
    templateId: string
  ): Promise<Buffer> {
    const template = await loadTemplate(templateId);
    const data = await gatherData(testRunId, template.includeFields);

    if (template.format === 'PDF') {
      return this.generatePDF(template.template, data);
    } else if (template.format === 'XLSX') {
      return this.generateExcel(data);
    }
    // etc.
  }
}

// API
GET /api/reports/:testRunId?template=custom-automotive
```

**Benefit**: White-Label Reports pro Kunde

### 6. Webhook/Integration System

**Warum wichtig**: Integration in Kunden-Systeme

**Implementation**:
```typescript
// Webhook Configuration
model WebhookEndpoint {
  id        String @id
  orgId     String
  url       String
  secret    String  // für HMAC
  events    String[] // ["test.completed", "test.failed"]
  active    Boolean
}

// Event Dispatcher
class WebhookDispatcher {
  async dispatch(event: string, data: any, orgId: string) {
    const webhooks = await prisma.webhookEndpoint.findMany({
      where: {
        orgId,
        active: true,
        events: { has: event }
      }
    });

    for (const webhook of webhooks) {
      const signature = hmac_sha256(webhook.secret, JSON.stringify(data));

      await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': event
        },
        body: JSON.stringify(data)
      });
    }
  }
}

// Trigger Webhooks
// Nach TestRun Completion
await webhookDispatcher.dispatch('test.completed', {
  testRunId: run.id,
  result: report.overallResult,
  fileName: run.fileName,
  timestamp: new Date()
}, orgId);
```

**Benefit**: Automatische Integration in ERP/PLM/QMS Systeme

### 7. Audit Trail & Compliance

**Warum wichtig**: Regulierte Branchen (Pharma, Automotive)

**Implementation**:
```typescript
// Audit Log
model AuditLog {
  id        String   @id @default(cuid())
  orgId     String
  userId    String
  action    String   // "test_plan.created", "test.executed"
  entityType String  // "TestPlan", "TestRun"
  entityId  String
  changes   Json?    // Old vs New values
  timestamp DateTime @default(now())
  ipAddress String?
  userAgent String?
}

// Automatic Logging via Prisma Middleware
prisma.$use(async (params, next) => {
  const result = await next(params);

  // Log änderungen
  if (['create', 'update', 'delete'].includes(params.action)) {
    await logAudit({
      action: `${params.model}.${params.action}`,
      entityType: params.model,
      entityId: result.id,
      changes: params.args
    });
  }

  return result;
});

// Compliance Features
// - PDF/A Archivierung
// - Elektronische Signatur
// - Tamper-proof Checksums
```

**Benefit**: GMP, IATF 16949, ISO 9001 Compliance

### 8. Performance & Scaling

**Warum wichtig**: Viele Dokumente, schnelle Verarbeitung

**Implementation**:
```typescript
// 1. Job Queue (Bull/BullMQ)
import Queue from 'bull';

const testQueue = new Queue('document-tests', {
  redis: process.env.REDIS_URL
});

// Enqueue Test
testQueue.add('analyze', {
  testRunId: run.id,
  workflowId: workflow.id
}, {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000
  }
});

// Worker
testQueue.process('analyze', async (job) => {
  await WorkflowEngine.execute(
    job.data.workflowId,
    job.data.testRunId
  );
});

// 2. Caching (Redis)
const cacheKey = `test-plan:${id}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

const testPlan = await prisma.testPlan.findUnique(...);
await redis.setex(cacheKey, 3600, JSON.stringify(testPlan));

// 3. Batch Processing
async function processBatch(files: File[]) {
  const chunks = chunkArray(files, 10); // 10 parallel

  for (const chunk of chunks) {
    await Promise.all(
      chunk.map(file => processFile(file))
    );
  }
}

// 4. CDN für Ergebnisse
// Upload Reports/PDFs zu S3/CloudFlare
```

**Benefit**: Skaliert auf tausende Dokumente/Tag

### 9. UI/UX Verbesserungen

**Warum wichtig**: Kundenzufriedenheit

**Features**:
- [ ] Drag & Drop Workflow Editor (ReactFlow)
- [ ] PDF Viewer mit Annotations
- [ ] Bulk Upload & Processing
- [ ] Dashboard mit Echtzeit-Statistiken
- [ ] Mobile-Responsive Design
- [ ] Dark Mode
- [ ] Keyboard Shortcuts
- [ ] Internationalisierung (i18n)

### 10. Security Hardening

**Warum wichtig**: Kundendaten schützen

**Checklist**:
- [ ] Rate Limiting
- [ ] API Authentication (JWT)
- [ ] Role-Based Access Control (RBAC)
- [ ] Encryption at Rest (Database Encryption)
- [ ] Encryption in Transit (TLS 1.3)
- [ ] Input Sanitization
- [ ] SQL Injection Prevention (Prisma macht das)
- [ ] CORS Configuration
- [ ] Security Headers
- [ ] Regular Security Audits
- [ ] Penetration Testing

## 🎯 Kunden-spezifische Use Cases

### Automotive Supplier

**Anforderungen**:
- PPAP Level 3 Prüfung
- IATF 16949 Konformität
- VDA Standards
- Kundenspezifische Freigaben (BMW, VW, etc.)

**Custom Features**:
```typescript
// Custom Workflow für BMW Freigabe
const bmwWorkflow = {
  nodes: [
    { type: 'TEST_STEP', config: {
      checkType: 'PPAP_VALIDATION',
      industry: 'AUTOMOTIVE',
      customer: 'BMW',
      ppap_level: 3
    }},
    { type: 'CONDITION', config: {
      condition: { variable: 'ppap_result', operator: '==', value: 'PASSED' }
    }},
    { type: 'TEST_STEP', config: {
      checkType: 'CUSTOMER_SPECIFIC',
      validation_script: bmwValidationScript
    }}
  ]
};
```

### Pharma Manufacturer

**Anforderungen**:
- GMP Compliance
- EU FMD Serialisierung
- Audit Trail (FDA 21 CFR Part 11)
- Elektronische Signatur

**Custom Features**:
```typescript
// GMP-Audit-Trail mit E-Signature
const gmpTestRun = {
  testRunId: '...',
  auditTrail: {
    performedBy: { userId, signature: eSignature },
    reviewedBy: { userId, signature: eSignature },
    approvedBy: { userId, signature: eSignature },
    timestamp: new Date(),
    reason: 'Batch Release'
  }
};
```

### Electronics Manufacturer

**Anforderungen**:
- CE-Marking Validation
- RoHS/REACH Compliance
- UL/CSA Certifications
- PCB Gerber File Analysis

**Custom Features**:
```typescript
// Multi-Document Validation
const electronicsWorkflow = {
  documents: [
    { type: 'PDF', purpose: 'CE_DECLARATION' },
    { type: 'PDF', purpose: 'ROHS_CERTIFICATE' },
    { type: 'GERBER', purpose: 'PCB_DESIGN' }
  ],
  crossValidation: {
    check_consistency: true,
    // Prüfe ob PCB-Design zu RoHS passt
    rules: ['pcb_materials_match_rohs_declaration']
  }
};
```

## 📊 ROI Calculation

**Für Kunden**:
- ⏱️ Zeitersparnis: 80-90% (von 15min manuell → 2min automatisch)
- 🎯 Fehlerreduktion: 95% weniger Oversight-Fehler
- 💰 Kostenersparnis: €50k-200k/Jahr (je nach Volumen)
- 📈 Durchsatz: 10x mehr Dokumente pro Tag

**Pricing Model**:
- **Starter**: €299/Monat (100 Prüfungen/Monat)
- **Professional**: €999/Monat (500 Prüfungen/Monat)
- **Enterprise**: Custom (unbegrenzt)

## 🚀 Go-to-Market Strategie

1. **Pilot mit 2-3 Beta-Kunden** (Automotive, Pharma, Electronics)
2. **Iteration basierend auf Feedback**
3. **Template-Library aufbauen** (10-20 Branchen-Templates)
4. **Self-Service Portal** für Test Plan Creation
5. **Partner-Netzwerk** (QMS-Anbieter, Berater)

## 📝 Implementierungs-Roadmap

### Phase 1: MVP Enhancement (4-6 Wochen)
- [ ] Multi-Tenancy
- [ ] Template System (done)
- [ ] Branchen-Prompts (done)
- [ ] Basic Reporting

### Phase 2: Enterprise Features (8-12 Wochen)
- [ ] Custom Scripts
- [ ] Audit Trail
- [ ] Webhooks
- [ ] Advanced Workflows

### Phase 3: Scale & Polish (12-16 Wochen)
- [ ] Performance Optimization
- [ ] UI/UX Overhaul
- [ ] Training Data Pipeline
- [ ] White-Labeling

## 🔍 Competitor Analysis

**Bestehende Tools**:
- Klassische QMS (SAP QM, Siemens Teamcenter): Teuer, komplex, kein AI
- OCR-Tools (ABBYY, Tesseract): Nur Extraktion, keine Validierung
- Custom In-House: Hohe Entwicklungskosten

**Vision CAQ USP**:
- ✅ AI-native (nicht nur OCR)
- ✅ Workflow-basiert (flexibel)
- ✅ Self-Service (kein Consulting nötig)
- ✅ Modern Stack (schnell, cloud-ready)
- ✅ Open for Extension (Custom Scripts)

## 💡 Tipps für Kunden-Gespräche

1. **Demo vorbereiten**:
   - Echtes Kunden-Dokument nutzen
   - Live-Prüfung zeigen (< 2 Minuten)
   - Workflow visualisieren

2. **Pain Points adressieren**:
   - "Wie lange brauchen Sie aktuell für Prüfung?"
   - "Wie oft werden Fehler übersehen?"
   - "Wieviel kostet Sie ein Recall?"

3. **Quick Wins zeigen**:
   - Template für deren Branche
   - Sofort einsatzbereit
   - Kein Training nötig

4. **ROI rechnen**:
   - Zeitersparnis × Stundensatz
   - Fehlerreduktion × Kosten/Fehler
   - Compliance-Risiko Reduzierung

5. **Trial anbieten**:
   - 30 Tage kostenlos
   - 50 Prüfungen inklusive
   - Persönliches Onboarding
