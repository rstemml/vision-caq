# Vision CAQ - Schnellstart

## Schnellstart mit Docker (Empfohlen)

Die einfachste Methode, Vision CAQ zu starten:

```bash
# 1. Umgebungsvariablen setzen
cp .env.example .env
# Bearbeiten Sie .env und tragen Sie Ihren LLM API-Key ein

# 2. Docker Container starten
docker-compose up -d

# 3. Datenbank initialisieren (einmalig)
docker-compose exec nextjs npx prisma db push
docker-compose exec nextjs npm run prisma:seed

# 4. Öffnen Sie http://localhost:3000
```

Das war's! Das System läuft nun mit:
- PostgreSQL auf Port 5432
- Python Service auf Port 8000
- Next.js App auf Port 3000

## Schnellstart ohne Docker

### 1. Voraussetzungen

```bash
# Node.js 18+
node --version

# Python 3.10+
python --version

# PostgreSQL 14+
psql --version
```

### 2. Datenbank erstellen

```bash
createdb vision_caq
```

### 3. Next.js App starten

```bash
# Dependencies installieren
npm install

# Umgebungsvariablen konfigurieren
cp .env.example .env
# Bearbeiten Sie .env

# Prisma einrichten
npx prisma generate
npx prisma db push
npm run prisma:seed

# Server starten
npm run dev
```

### 4. Python Service starten

```bash
cd python-service

# Virtual Environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Dependencies
pip install -r requirements.txt

# Umgebungsvariablen
cp .env.example .env
# Bearbeiten Sie .env

# Service starten
chmod +x run.sh
./run.sh
```

### 5. Öffnen

Öffnen Sie http://localhost:3000 im Browser.

## Erste Schritte

### 1. Beispiel-Prüfpläne ansehen

Nach dem Seeding haben Sie drei vorkonfigurierte Prüfpläne:
- Technische Zeichnung - Standard
- Etiketten-Prüfung
- Rechnungs-Prüfung

Navigieren Sie zu "Prüfpläne" um diese anzusehen.

### 2. Eigenen Prüfplan erstellen

1. Klicken Sie auf "Neuer Prüfplan"
2. Geben Sie Name und Dokumenttyp ein
3. Fügen Sie Prozeduren hinzu
4. Fügen Sie Prüfschritte zu jeder Prozedur hinzu

### 3. Dokument prüfen

1. Navigieren Sie zu "Dokument prüfen"
2. Wählen Sie einen Prüfplan
3. Laden Sie eine PDF-Datei hoch
4. Warten Sie auf die Analyse
5. Sehen Sie das Prüfprotokoll ein

## Wichtige Befehle

```bash
# Entwicklung
npm run dev                 # Next.js Dev-Server
npm run prisma:studio      # Datenbank GUI

# Produktion
npm run build              # Next.js Build
npm start                  # Next.js Prod-Server

# Datenbank
npx prisma db push         # Schema in DB übertragen
npm run prisma:seed        # Beispieldaten laden
npx prisma migrate dev     # Migration erstellen

# Docker
docker-compose up -d       # Container starten
docker-compose down        # Container stoppen
docker-compose logs -f     # Logs anzeigen
```

## Troubleshooting

### Port bereits belegt

Ändern Sie die Ports in `docker-compose.yml` oder stoppen Sie andere Dienste:

```bash
# Port 3000 prüfen
lsof -i :3000

# Port 8000 prüfen
lsof -i :8000
```

### Datenbankverbindung fehlgeschlagen

Prüfen Sie:
1. PostgreSQL läuft: `pg_isready`
2. DATABASE_URL in `.env` ist korrekt
3. Datenbank existiert: `psql -l | grep vision_caq`

### Python PDF-Verarbeitung fehlschlägt

Installieren Sie Poppler und Tesseract:

```bash
# Ubuntu/Debian
sudo apt-get install poppler-utils tesseract-ocr

# macOS
brew install poppler tesseract

# Windows
# Siehe README.md
```

### LLM API Fehler

Prüfen Sie:
1. API-Key ist korrekt in `.env` eingetragen
2. LLM_PROVIDER ist richtig gesetzt (openai oder anthropic)
3. Sie haben genug API-Credits

## Nächste Schritte

- Lesen Sie die vollständige [README.md](README.md) für Details
- Erkunden Sie die API-Dokumentation: http://localhost:8000/docs
- Passen Sie die Prüfschritte an Ihre Bedürfnisse an
- Integrieren Sie das System in Ihre Workflows

## Support

Bei Problemen:
1. Prüfen Sie die Logs: `docker-compose logs -f`
2. Konsultieren Sie die README.md
3. Erstellen Sie ein Issue im Repository
