# OCR Reader – Invoice & Credit Memo Processing

A full-stack queue-based OCR processing system.

---

## Project Structure

```
ocr-reader/
├── frontend/       Next.js 14 app (port 3000)
└── backend/        Spring Boot 3 app (port 8080)
```

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 18+ |
| Java | 21 |
| Maven | 3.9+ |
| Tesseract OCR | 4.x or 5.x |

### Install Tesseract

**macOS (Homebrew):**
```bash
brew install tesseract
# Language packs (e.g. Hindi)
brew install tesseract-lang
```

**Ubuntu/Debian:**
```bash
sudo apt-get install tesseract-ocr
sudo apt-get install tesseract-ocr-hin   # Hindi example
```

After installing, update `application.properties`:
```properties
# Mac Homebrew (Intel):
ocr.tesseract.data-path=/usr/local/share/tessdata
# Mac Homebrew (Apple Silicon):
ocr.tesseract.data-path=/opt/homebrew/share/tessdata
# Linux:
ocr.tesseract.data-path=/usr/share/tesseract-ocr/4.00/tessdata
```

---

## Running the Backend

```bash
cd backend
mvn spring-boot:run
```

- API available at: http://localhost:8080/api
- H2 Console (dev): http://localhost:8080/h2-console (JDBC URL: `jdbc:h2:mem:ocrreader`)

---

## Running the Frontend

```bash
cd frontend
npm install
npm run dev
```

- App available at: http://localhost:3000
- Proxies `/api/*` → `http://localhost:8080/api/*`

---

## Screens

### Integration (/ → /integration)
Configure three areas via tabbed UI:
- **SFTP** – connect to an SFTP server to auto-pick up invoice files
- **Email (IMAP)** – monitor a mailbox for invoice PDF attachments
- **OCR Settings** – Tesseract language, confidence threshold, mandatory fields, feature toggles

### OCR Review (/ocr-review)
Queue view of all processed documents:
- Filter by status: All / Pending / Processing / Successful / Failed / Duplicate
- Search by filename, vendor, invoice number
- Upload documents manually (PDF, JPG, PNG)
- Click any row to open the **detail panel**:
  - View all extracted fields with confidence scores
  - Flag low-confidence fields (highlighted in amber)
  - **Validate & Correct** – edit fields and approve the document
  - **Reprocess** – re-run OCR on the document
  - **Audit Log** – full trail of every action taken

---

## Key API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/documents` | List documents (paginated, filterable) |
| GET | `/api/documents/:id` | Get single document |
| POST | `/api/documents/upload` | Upload document for OCR |
| POST | `/api/documents/:id/reprocess` | Reprocess a document |
| POST | `/api/documents/:id/validate` | Apply manual corrections |
| GET | `/api/documents/stats` | Queue statistics |
| GET/POST | `/api/integration/sftp` | SFTP configuration |
| POST | `/api/integration/sftp/test` | Test SFTP connection |
| GET/POST | `/api/integration/email` | Email/IMAP configuration |
| GET/POST | `/api/integration/ocr-settings` | OCR engine settings |

---

## Document Status Flow

```
RECEIVED → PROCESSING → SUCCESSFUL
                      → PENDING   (missing mandatory fields)
                      → FAILED    (OCR error)
                      → DUPLICATE (matching invoice number found)
```

Stuck documents can be **manually reprocessed** or **validated** from the OCR Review screen.
