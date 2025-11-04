# Workflow-Engine Dokumentation

Die Vision CAQ Workflow-Engine ermöglicht die flexible Orchestrierung von Qualitätsprüfungen.

## Konzept

Die Workflow-Engine basiert auf einer **State Machine** und ermöglicht:

- ✅ **Sequenzielle Ausführung**: Schritte werden nacheinander ausgeführt
- ✅ **Parallele Ausführung**: Mehrere Prüfungen laufen gleichzeitig
- ✅ **Bedingte Verzweigungen**: Unterschiedliche Pfade basierend auf Ergebnissen
- ✅ **Warte-Knoten**: Pause bis zu externer Eingabe
- ✅ **Status-Tracking**: Echtzeit-Überwachung der Ausführung

## Workflow-Komponenten

### 1. Workflow
Ein Template das den gesamten Prüfablauf definiert.

```typescript
{
  id: "workflow-id",
  name: "Technische Zeichnung - Vollprüfung",
  category: "TECHNICAL_DRAWING",
  active: true,
  nodes: [...],
  edges: [...]
}
```

### 2. Workflow-Knoten (Nodes)

#### Knotentypen:

| Typ | Beschreibung | Verwendung |
|-----|--------------|------------|
| `START` | Start-Knoten | Workflow-Einstiegspunkt |
| `END` | End-Knoten | Workflow-Endpunkt |
| `TEST_STEP` | Prüfschritt | Führt einen Prüfschritt aus |
| `PARALLEL_GATEWAY` | Parallel-Gateway | Startet parallele Ausführung |
| `PARALLEL_JOIN` | Parallel-Join | Wartet auf alle parallelen Pfade |
| `CONDITION` | Bedingung | Verzweigung basierend auf Ergebnis |
| `WAIT` | Warten | Wartet auf externe Eingabe |

#### Beispiel TEST_STEP Node:

```javascript
{
  name: "DIN ISO 128 Prüfung",
  nodeType: "TEST_STEP",
  config: {
    stepId: "prüfschritt-id"  // Referenz zu ProcedureStep
  }
}
```

#### Beispiel CONDITION Node:

```javascript
{
  name: "Ergebnis-Prüfung",
  nodeType: "CONDITION",
  config: {
    condition: {
      variable: "result",
      operator: "==",
      value: "PASSED"
    }
  }
}
```

### 3. Workflow-Edges (Verbindungen)

Verbinden Knoten miteinander und definieren den Ablauf.

```javascript
{
  sourceNodeId: "node-1",
  targetNodeId: "node-2",
  condition: {...},  // Optional
  label: "Bei Erfolg"
}
```

### 4. Workflow-Execution

Eine laufende Instanz eines Workflows.

```javascript
{
  workflowId: "workflow-id",
  testRunId: "testrun-id",
  status: "RUNNING",  // PENDING | RUNNING | WAITING | COMPLETED | FAILED
  variables: {...},    // Workflow-Variablen
  nodeExecutions: [...] // Status einzelner Knoten
}
```

## Workflow erstellen

### Via UI

1. Navigieren Sie zu `/workflows`
2. Klicken Sie auf "Neuer Workflow"
3. Geben Sie Name, Kategorie und Beschreibung ein
4. Fügen Sie Knoten hinzu über "Knoten hinzufügen"
5. Verbinden Sie Knoten über "Verbindung erstellen"

### Via API

```javascript
// 1. Workflow erstellen
POST /api/workflows
{
  "name": "Mein Workflow",
  "category": "TECHNICAL_DRAWING",
  "description": "Beschreibung"
}

// 2. Knoten hinzufügen
POST /api/workflows/:id/nodes
{
  "name": "Grunddaten-Prüfung",
  "nodeType": "TEST_STEP",
  "config": { "stepId": "step-id" }
}

// 3. Verbindungen erstellen
POST /api/workflows/:id/edges
{
  "sourceNodeId": "node-1",
  "targetNodeId": "node-2"
}
```

## Workflow ausführen

### Via Test Run

```javascript
POST /api/test-runs
FormData:
  - file: PDF-Datei
  - testPlanId: prüfplan-id
  - useWorkflow: true
  - workflowId: workflow-id
```

### Via API

```javascript
POST /api/workflows/:id/execute
{
  "testRunId": "testrun-id",
  "variables": {
    "customVar": "value"
  }
}
```

## Workflow-Patterns

### 1. Sequenzieller Workflow

```
START → Schritt 1 → Schritt 2 → Schritt 3 → END
```

Verwendung: Prüfungen die aufeinander aufbauen.

### 2. Paralleler Workflow

```
START → Schritt 1 → PARALLEL_GATEWAY
                    ├→ Schritt 2a →┐
                    └→ Schritt 2b →┤
                    PARALLEL_JOIN → END
```

Verwendung: Unabhängige Prüfungen parallel ausführen für maximale Geschwindigkeit.

### 3. Bedingter Workflow

```
START → Prüfung → CONDITION
                  ├→ (PASSED) → Freigabe → END
                  └→ (FAILED) → Eskalation → END
```

Verwendung: Unterschiedliche Aktionen basierend auf Ergebnissen.

### 4. Kombinierter Workflow

```
START → Grundprüfung → CONDITION
                       ├→ (PASSED) → PARALLEL_GATEWAY
                       │              ├→ DIN-Prüfung →┐
                       │              └→ Qualität →    ┤
                       │              PARALLEL_JOIN → END
                       └→ (FAILED) → WAIT → Nachprüfung → END
```

## Workflow-Engine Implementierung

### Architektur

```
WorkflowEngine (lib/workflow-engine.ts)
├─ execute()          // Startet Workflow
├─ executeNode()      // Führt einzelnen Knoten aus
├─ executeNodeLogic() // Node-Typ-spezifische Logik
└─ proceedToNext()    // Findet und führt nächste Knoten aus
```

### Ausführungslogik

1. **START**: Workflow beginnt am START-Knoten
2. **Node Execution**: Jeder Knoten wird der Reihe nach ausgeführt
3. **Status Tracking**: NodeExecution wird erstellt/aktualisiert
4. **Edge Evaluation**: Ausgehende Edges werden evaluiert
5. **Parallel Handling**: Bei Parallel-Gateway werden alle Pfade gestartet
6. **Join Handling**: Bei Parallel-Join wird auf alle Pfade gewartet
7. **Completion**: END-Knoten markiert Workflow als abgeschlossen

### Beispiel-Ausführung

```javascript
// Workflow-Execution starten
const execution = await WorkflowEngine.execute(
  workflowId,
  testRunId,
  {
    variables: { customParam: "value" },
    pdfData: buffer
  }
);

// Status überprüfen
const status = await prisma.workflowExecution.findUnique({
  where: { id: execution.id },
  include: {
    nodeExecutions: true
  }
});
```

## Beispiel-Workflows (aus Seed)

### 1. Technische Zeichnung - Parallele Vollprüfung

```
START
  ↓
Grunddaten-Prüfung
  ↓
PARALLEL_GATEWAY
  ├→ DIN ISO 128 Prüfung →┐
  └→ Bildqualität →        ┤
  PARALLEL_JOIN
    ↓
  END
```

Features:
- Sequenzielle Grunddaten-Prüfung
- Parallele DIN- und Qualitätsprüfung
- Automatische Zusammenführung

### 2. Etiketten - Sequenziell

```
START
  ↓
CE-Kennzeichnung prüfen
  ↓
Artikelnummer prüfen
  ↓
END
```

Features:
- Einfacher sequenzieller Ablauf
- Schritt für Schritt Validierung

## Best Practices

### 1. Workflow-Design

- ✅ Starten Sie mit START-Knoten
- ✅ Enden Sie mit END-Knoten
- ✅ Nutzen Sie parallele Ausführung für unabhängige Prüfungen
- ✅ Gruppieren Sie ähnliche Prüfungen
- ✅ Verwenden Sie sprechende Namen

### 2. Performance

- ✅ Parallelisieren Sie wo möglich
- ✅ Ordnen Sie Knoten logisch an
- ✅ Vermeiden Sie unnötige Wartezeiten
- ✅ Optimieren Sie Prüfschritte

### 3. Fehlerbehandlung

- ✅ Definieren Sie Error-Pfade
- ✅ Verwenden Sie CONDITION für Verzweigungen
- ✅ Implementieren Sie Retry-Logik bei Bedarf
- ✅ Loggen Sie Fehler detailliert

## Troubleshooting

### Workflow startet nicht

**Problem**: Execution bleibt bei PENDING

**Lösung**:
- Prüfen Sie ob START-Knoten existiert
- Prüfen Sie Workflow-Configuration
- Schauen Sie in die Logs

### Parallele Pfade hängen

**Problem**: PARALLEL_JOIN wartet endlos

**Lösung**:
- Prüfen Sie ob alle parallelen Pfade abgeschlossen sind
- Prüfen Sie NodeExecution Status
- Stellen Sie sicher dass alle Edges korrekt sind

### Prüfschritte schlagen fehl

**Problem**: TEST_STEP Nodes geben Fehler

**Lösung**:
- Prüfen Sie ob stepId korrekt konfiguriert ist
- Prüfen Sie ob ProcedureStep existiert
- Prüfen Sie Python Service Logs

## API-Referenz

### Workflows

```
GET    /api/workflows              # Alle Workflows
POST   /api/workflows              # Neuen Workflow erstellen
GET    /api/workflows/:id          # Workflow-Details
PATCH  /api/workflows/:id          # Workflow aktualisieren
DELETE /api/workflows/:id          # Workflow löschen
```

### Nodes

```
POST   /api/workflows/:id/nodes    # Knoten hinzufügen
PATCH  /api/workflows/:id/nodes    # Knoten aktualisieren
DELETE /api/workflows/:id/nodes?nodeId=... # Knoten löschen
```

### Edges

```
POST   /api/workflows/:id/edges    # Verbindung erstellen
DELETE /api/workflows/:id/edges?edgeId=... # Verbindung löschen
```

### Execution

```
POST   /api/workflows/:id/execute  # Workflow starten
GET    /api/workflow-executions/:id # Execution-Status abrufen
```

## Zukünftige Erweiterungen

- [ ] Visueller Drag & Drop Editor (ReactFlow Integration)
- [ ] Workflow-Templates
- [ ] Versionierung von Workflows
- [ ] Workflow-Simulation
- [ ] Erweiterte Bedingungen (JavaScript-Expressions)
- [ ] Sub-Workflows
- [ ] Loop-Knoten
- [ ] Timer-Events
- [ ] Webhook-Integration
