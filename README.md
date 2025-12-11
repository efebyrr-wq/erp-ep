# ERP 2025 Stack (NestJS + React + PostgreSQL)

This workspace contains:

- `db/schema.sql` – canonical SQL script for provisioning the PostgreSQL database
- `backend/` – NestJS REST API connected to the database via TypeORM
- `frontend/` – React (Vite) multi-page ERP interface with navigation, tables, and modals

## 1. Prerequisites

- Node.js 18+ (Nest CLI & Vite rely on modern Node)
- PostgreSQL 14+ (any version supporting identity columns works)
- `psql` CLI (or another PostgreSQL client) to execute the schema script

## 2. Bootstrapping the database

1. Create an empty database (example uses `erp_2025`):

   ```bash
   createdb erp_2025
   ```

2. Apply the schema:

   ```bash
   psql postgresql://<user>:<password>@localhost:5432/erp_2025 -f /Users/efebayar/Documents/erp_2025/db/schema.sql
   ```

   Replace the connection string with credentials appropriate for your environment.

## 3. Backend (NestJS)

### Configure environment

Create `/Users/efebayar/Documents/erp_2025/backend/.env`:

```
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=erp_2025
DB_SCHEMA=public
PORT=3000
```

Adjust credentials as needed.

### Install & run

```bash
cd /Users/efebayar/Documents/erp_2025/backend
npm install           # already done once, run again if deps change
npm run start:dev     # starts API at http://localhost:3000
```

The API exposes:

- `GET /customers` – list customers with contacts and working sites
- `POST /customers` – create a customer (optionally inline contact/site)
- `GET /suppliers` – list suppliers with contacts and supplies
- `POST /suppliers` – create a supplier (optionally inline contact/supply)

Cross-origin requests and DTO validation are enabled by default.

## 4. Frontend (React + Vite)

### Configure API base URL

Create `/Users/efebayar/Documents/erp_2025/frontend/.env`:

```
VITE_API_BASE_URL=http://localhost:3000
```

### Install & run

```bash
cd /Users/efebayar/Documents/erp_2025/frontend
npm install           # already done once, run again if deps change
npm run dev           # launches Vite dev server (defaults to http://localhost:5173)
```

The React app now ships with a full ERP navigation shell (sidebar + top bar) and dedicated pages for each module:

- **Dashboard** – summary cards, placeholder charts, quick links
- **Customers / Suppliers** – data tables, modals for add/edit, relationship detail dialogs
- **Inventory / Machinery / Operations** – filters, drawers, and forms for stock and assets
- **Billing & Invoicing / Collections & Payments / Accounts** – tabbed financial records with add flows

Customers and suppliers hit the live NestJS endpoints; the remaining modules currently use local state + mock data and are ready to be wired to new backend endpoints.

> **Heads-up:** Start PostgreSQL before the NestJS server. Without a reachable database the backend logs `ECONNREFUSED` and retries indefinitely.

## 5. Suggested next steps

- Add more modules/controllers to cover the entire schema (inventory, machinery, operations, billing, etc.).
- Build reusable UI components and state management for complex workflows.
- Introduce authentication/authorization if required.
- Add automated tests (`backend/test/`, `frontend/src/__tests__/`) as functionality grows.

