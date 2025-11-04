# Vision CAQ - Computer Aided Quality

Ein KI-gestütztes Qualitätssicherungssystem für die automatisierte Prüfung von technischen Dokumenten (PDFs).

## Features

- **Prüfplan-Management**: Erstellen und verwalten Sie Prüfpläne mit individuellen Prozeduren und Prüfschritten
- **Automatisierte PDF-Analyse**: KI-gestützte Analyse von technischen Zeichnungen, Etiketten und Rechnungen
- **Flexible Prüfkriterien**:
  - Vorhandensein von Elementen
  - Feldwert-Validierung
  - Gesetzliche Vorgaben
  - DIN-Normen
  - Bildqualität
  - Text-Extraktion
- **Prüfprotokolle**: Detaillierte Dokumentation aller Prüfergebnisse
- **Auswertungen**: Visualisierung von Trends und Erfolgsquoten

## Technologie-Stack

- **Frontend/Backend**: Next.js 14 mit TypeScript
- **Datenbank**: PostgreSQL
- **ORM**: Prisma
- **PDF-Analyse**: Python FastAPI Service
- **LLM-Integration**: OpenAI GPT-4 Vision / Anthropic Claude
- **UI**: Tailwind CSS mit shadcn/ui

## Voraussetzungen

- Node.js 18+ und npm/yarn
- Python 3.10+
- PostgreSQL 14+
- LLM API-Key (OpenAI oder Anthropic)

## Installation

### 1. Repository klonen

```bash
git clone <repository-url>
cd vision-caq
```

### 2. Next.js App einrichten

```bash
# Dependencies installieren
npm install

# Umgebungsvariablen konfigurieren
cp .env.example .env
```

Bearbeiten Sie `.env` und tragen Sie Ihre Konfiguration ein:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/vision_caq?schema=public"
PYTHON_SERVICE_URL="http://localhost:8000"
LLM_API_KEY="your-api-key-here"
LLM_MODEL="gpt-4-vision-preview"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Datenbank einrichten

```bash
# Prisma Client generieren
npx prisma generate

# Datenbank-Schema erstellen
npx prisma db push

# Optional: Prisma Studio öffnen
npx prisma studio
```

### 4. Python Service einrichten

```bash
cd python-service

# Virtual Environment erstellen
python -m venv venv
source venv/bin/activate  # Auf Windows: venv\Scripts\activate

# Dependencies installieren
pip install -r requirements.txt

# Umgebungsvariablen konfigurieren
cp .env.example .env
```

Bearbeiten Sie `python-service/.env`:

```env
LLM_API_KEY=your-api-key-here
LLM_PROVIDER=openai  # oder anthropic
LLM_MODEL=gpt-4-vision-preview
PORT=8000
HOST=0.0.0.0
```

### 5. Systemabhängigkeiten (für PDF-Verarbeitung)

#### Ubuntu/Debian

```bash
sudo apt-get update
sudo apt-get install -y poppler-utils tesseract-ocr
```

#### macOS

```bash
brew install poppler tesseract
```

#### Windows

- Installieren Sie [Poppler für Windows](http://blog.alivate.com.au/poppler-windows/)
- Installieren Sie [Tesseract OCR](https://github.com/UB-Mannheim/tesseract/wiki)

## Entwicklung

### Next.js App starten

```bash
npm run dev
```

Die Anwendung ist dann unter http://localhost:3000 erreichbar.

### Python Service starten

```bash
cd python-service
source venv/bin/activate  # Auf Windows: venv\Scripts\activate
python -m app.main
```

Der Service läuft dann unter http://localhost:8000.

API-Dokumentation: http://localhost:8000/docs

## Docker (Optional)

### Docker Compose verwenden

```bash
docker-compose up -d
```

Dies startet:
- PostgreSQL Datenbank (Port 5432)
- Python Service (Port 8000)
- Next.js App (Port 3000)

## Verwendung

### 1. Prüfplan erstellen

1. Navigieren Sie zu "Prüfpläne"
2. Klicken Sie auf "Neuer Prüfplan"
3. Geben Sie Name, Dokumenttyp und Beschreibung ein
4. Speichern Sie den Prüfplan

### 2. Prozeduren und Prüfschritte hinzufügen

1. Öffnen Sie den erstellten Prüfplan
2. Fügen Sie Prozeduren hinzu (z.B. "Grunddaten-Prüfung")
3. Fügen Sie zu jeder Prozedur Prüfschritte hinzu:
   - Name und Beschreibung
   - Prüftyp (Vorhandensein, Feldwert, DIN-Norm, etc.)
   - Parameter (z.B. erwarteter Wert, Regex-Pattern)
   - Priorität (Pflicht/Optional)

### 3. Dokument prüfen

1. Navigieren Sie zu "Dokument prüfen"
2. Wählen Sie einen Prüfplan aus
3. Laden Sie eine PDF-Datei hoch
4. Das System analysiert das Dokument automatisch
5. Sehen Sie die Ergebnisse in Echtzeit

### 4. Prüfprotokolle einsehen

1. Navigieren Sie zu "Prüfprotokolle"
2. Sehen Sie alle abgeschlossenen Prüfungen
3. Klicken Sie auf ein Protokoll für Details
4. Exportieren Sie Ergebnisse (optional)

## Projekt-Struktur

```
vision-caq/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── test-plans/        # Prüfplan-Seiten
│   ├── test-runs/         # Prüfungs-Seiten
│   ├── reports/           # Protokoll-Seiten
│   └── analytics/         # Auswertungs-Seiten
├── components/            # React Komponenten
│   └── ui/               # UI-Komponenten
├── lib/                   # Utilities
├── prisma/               # Prisma Schema
├── python-service/       # Python FastAPI Service
│   └── app/
│       ├── main.py       # FastAPI App
│       ├── pdf_processor.py
│       ├── llm_client.py
│       └── models.py
├── public/               # Statische Dateien
└── uploads/              # Hochgeladene PDFs
```

## API-Endpunkte

### Next.js API

- `GET /api/test-plans` - Alle Prüfpläne abrufen
- `POST /api/test-plans` - Prüfplan erstellen
- `GET /api/test-plans/[id]` - Prüfplan-Details
- `PATCH /api/test-plans/[id]` - Prüfplan aktualisieren
- `DELETE /api/test-plans/[id]` - Prüfplan löschen
- `POST /api/procedures` - Prozedur erstellen
- `POST /api/procedure-steps` - Prüfschritt erstellen
- `GET /api/test-runs` - Alle Prüfungen abrufen
- `POST /api/test-runs` - PDF hochladen und Prüfung starten

### Python Service API

- `POST /analyze` - PDF analysieren
- `GET /health` - Health Check

## Konfiguration

### LLM-Provider

#### OpenAI

```env
LLM_PROVIDER=openai
LLM_MODEL=gpt-4-vision-preview
LLM_API_KEY=sk-...
```

#### Anthropic Claude

```env
LLM_PROVIDER=anthropic
LLM_MODEL=claude-3-sonnet-20240229
LLM_API_KEY=sk-ant-...
```

### Prüftypen

| Typ | Beschreibung | Beispiel-Parameter |
|-----|--------------|-------------------|
| `PRESENCE` | Prüft Vorhandensein | `{"element": "Artikelnummer"}` |
| `FIELD_VALUE` | Validiert Feldwerte | `{"field": "Datum", "format": "DD.MM.YYYY"}` |
| `LEGAL_REQUIREMENT` | Gesetzliche Vorgaben | `{"regulation": "CE-Kennzeichnung"}` |
| `DIN_STANDARD` | DIN-Normen | `{"standard": "DIN EN ISO 9001"}` |
| `IMAGE_QUALITY` | Bildqualität | `{"min_dpi": 300}` |
| `TEXT_EXTRACTION` | Text-Extraktion | `{"pattern": "^[0-9]{8}$"}` |
| `CUSTOM` | Benutzerdefiniert | Beliebig |

## Troubleshooting

### PDF-Konvertierung schlägt fehl

Stellen Sie sicher, dass Poppler installiert ist:

```bash
# Test auf Linux/Mac
which pdfinfo

# Auf Windows prüfen Sie den PATH
```

### Datenbankverbindung fehlgeschlagen

Überprüfen Sie:
- PostgreSQL läuft
- DATABASE_URL ist korrekt konfiguriert
- Datenbank existiert

### Python Service startet nicht

Überprüfen Sie:
- Alle Dependencies sind installiert
- Virtual Environment ist aktiviert
- Port 8000 ist nicht belegt

## Lizenz

MIT

## Support

Bei Fragen oder Problemen erstellen Sie bitte ein Issue im Repository.
