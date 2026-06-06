# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

**ProcureX** — a Procure-to-Pay (P2P) ERP application. The repo contains two independent full-stack sub-projects:

| Sub-project | Path | Purpose |
|---|---|---|
| Main P2P app | `backend/` + `frontend/` | Vendors, catalog, requisitions, POs, inventory |
| OCR service | `vendor-integration/ocr-service/` | Invoice OCR review queue |

---

## Running the Stack

### Backend (Spring Boot, port 8082)

**Must use Java 21** — the JAR is compiled for Java 21 class file version. Using a lower JVM version causes `UnsupportedClassVersionError`.

```bash
# Build (skip tests — no test suite currently)
cd backend
mvn package -DskipTests

# Run from the backend/ directory (H2 file DB is relative: ./data/procurementdb)
/opt/homebrew/opt/openjdk@21/bin/java -jar target/p2p-backend-1.0.0.jar

# Dev-mode hot-reload
mvn spring-boot:run
```

After changes to migrations or Java source, a full `mvn package -DskipTests` and restart is required — Flyway reads from the classpath inside the JAR, not from `src/`.

### Frontend (Next.js 14, port 3000)

```bash
cd frontend
npm install
npm run dev    # dev server with hot reload
npm run build  # production build
npm start      # serve production build
```

### OCR Service (port 8081 backend, port 3000 frontend)

```bash
# Backend
cd vendor-integration/ocr-service/backend
mvn spring-boot:run

# Frontend
cd vendor-integration/ocr-service/frontend
npm install && npm run dev
```

---

## Architecture

### Multi-Tenant Data Hierarchy

```
Customer  →  Company  →  Position (access_matrix JSON)
                      →  OrgUnit (department)
                      →  Person  (employee, linked to Position + OrgUnit)
```

The `access_matrix` JSON column on `positions` drives all feature access. The frontend parses it in `AuthContext` and gates every route/action via `canAccess(module, action)`.

### Backend Layout

```
src/main/java/com/procurement/
  controller/          # REST endpoints (thin — delegate to service)
    catalog/           # CatalogImportController, IntegrationController, SettingsController
  service/
    catalog/           # CatalogImportService, FileParserService, SftpIntegrationService
  model/               # JPA entities (H2 + PostgreSQL compatible)
    enums/             # UserRole, ProductStatus, StorageTemp, etc.
  repository/          # Spring Data JPA repositories (findBy* conventions)
  security/            # JwtUtil, JwtAuthFilter, UserDetailsServiceImpl
  dto/                 # ApiResponse<T>, DashboardStatsDTO, etc.
  config/              # SecurityConfig, CorsConfig
```

**Database:** H2 file-based in dev (`./data/procurementdb`), PostgreSQL in prod (activate with `SPRING_PROFILES_ACTIVE=postgres`). Flyway manages schema — migrations are in `src/main/resources/db/migration/` and must be versioned `V9__`, `V10__`, etc.

**Security:** Stateless JWT. `JwtAuthFilter` validates the `Authorization: Bearer <token>` header. The `exceptionHandling` authenticationEntryPoint always returns HTTP 401 for unauthenticated requests.

**Known serialization issue:** `GET /api/items` and `GET /api/inventory` currently return 401/500 due to Jackson failing to serialize Hibernate lazy-load proxies (`ByteBuddyInterceptor`). Existing `/api/vendors`, `/api/requisitions`, `/api/dashboard/*` are unaffected. Fix requires `@JsonIgnoreProperties("hibernateLazyInitializer")` or eager fetching on Item.

**API response shape is inconsistent** — some controllers return raw entities, others wrap in `ApiResponse<T>` (`.data` field). The frontend `api.ts` handles this with `?? r.data` fallbacks.

### Frontend Layout

```
app/
  layout.tsx           # Root: AuthProvider → UserPreferencesProvider → AppShell
  page.tsx             # Dashboard
  admin/               # SYSTEM_ADMIN-only pages (role-gated, not accessMatrix-gated)
    approval-engine/   # Approval matrix admin UI (frontend built; backend not yet implemented)
    organisation/      # Customer/Company management
  [module]/page.tsx    # One file per module (vendors, catalog, requisitions, etc.)

components/
  AppShell.tsx         # Route guard: redirects to /login or /unauthorized
  Sidebar.tsx          # Nav groups: Operations, Integration, Organization, System
  Modal.tsx, StatusBadge.tsx, TopBar.tsx, ChatWidget.tsx

context/
  AuthContext.tsx      # Provides user, accessMatrix, canAccess(), setAuth(), logout()
  UserPreferencesContext.tsx

lib/
  api.ts               # All API calls (axios instance + JWT interceptor + token refresh)
  accessMap.ts         # Maps URL paths → accessMatrix module keys

types/index.ts         # All TypeScript interfaces (single source of truth)
```

**Proxy:** `next.config.js` rewrites `/api/*` → `localhost:8082` and `/ocr-api/*` → `localhost:8081`. Pages call `lib/api.ts` functions which use relative `/api` paths.

**Auth flow:** Login stores `accessToken`, `refreshToken`, `authUser` in `localStorage`. `api.ts` interceptors attach the token and auto-refresh on 401. When no token exists, a dev-bypass full-access user is used (see `AuthContext.tsx`).

**Access control:** `AppShell` checks `canAccess(module, 'view')` for each route using `ROUTE_MODULE_MAP` in `accessMap.ts`. Admin pages (`/admin/*`) are gated by `role === 'SYSTEM_ADMIN'` inside the page, not by accessMatrix.

### Design System

See `UI-REFINEMENT-GUIDE.md` for full reference. Key rules:

- Use semantic color names: `primary-*`, `success-*`, `warning-*`, `error-*`, `neutral-*` — **not** `blue-*`, `green-*`, `gray-*`.
- Use CSS utility classes defined in `app/globals.css`: `card`, `card-hover`, `btn-primary`, `btn-secondary`, `btn-danger`, `input-field`, `input-label`, `badge badge-success`, `table-row-hover`, `table-cell`, etc.
- Animations: `animate-fade-in`, `animate-slide-up`, `animate-pulse-soft`.

### Flyway Migration Convention

Migrations live in `backend/src/main/resources/db/migration/`. Current versions: V1–V8.

- Use H2-compatible SQL (`CURRENT_TIMESTAMP`, `DATEADD('DAY', n, date)`, `CLOB`, `AUTO_INCREMENT`).
- Guard all INSERTs with `WHERE NOT EXISTS` to make migrations idempotent.
- After writing a new migration, rebuild the JAR and restart — Flyway runs on startup.

### Approval Engine

The frontend admin page (`/admin/approval-engine`) and all TypeScript types (`ApprovalPolicy`, `ApprovalRule`, `ApprovalCondition`, `ApprovalStep`) exist in `types/index.ts`, and the API stubs exist in `lib/api.ts`. **The backend implementation does not yet exist** — all approval API calls will 404 until the backend is built.

Design intent: `ApprovalPolicy` contains ordered `ApprovalRule[]`. Each rule has `conditions[]` (field/operator/value predicates) and `steps[]` (ordered approval layers, each targeting a `positionIds[]` with `ApprovalMode`). When a document is submitted, the engine finds the first matching rule and instantiates its steps.

---

## Default Credentials

| User | Password | Role |
|---|---|---|
| `admin` | `Admin@1234` | SYSTEM_ADMIN |
| `buyer.arjun`, `buyer.pooja`, `finance.kavita`, `store.sunita`, `dept.ravi`, `dept.deepak` | `Demo@1234` | SYSTEM_ADMIN (with position-scoped access) |
| `vendor.metro`, `vendor.officezone`, `vendor.techfix` | `Demo@1234` | VENDOR_ADMIN |
| `vendor.cleanpro`, `vendor.linen`, `vendor.freshfarm` | `Demo@1234` | VENDOR_USER |

H2 Console (dev only): `http://localhost:8082/h2-console` — JDBC URL `jdbc:h2:file:./data/procurementdb`, username `sa`, blank password.
