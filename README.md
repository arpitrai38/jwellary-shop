# Aarna Jewar — Gold Jewellery Shop Management System (MERN)

> A production-oriented Gold Jewellery Shop Management System & POS for a single physical jewellery shop in India (Sarafa Bazar, Jaipur), built strictly with the **MERN** stack (MongoDB, Express.js, React with Vite, Node.js) and Material UI (MUI).
> Designed to match the visual aesthetics, screen layouts, and workflows of the reference prototype: [Aarna Jewar Reference Prototype](https://aarnademo.obtains.tech).

---

## 1. System Architecture & Features

### A. Gold Jewellery Specialization & Inventory
- **Individual Piece Tracking**: Each piece is uniquely tracked with an immutable `Item ID` (e.g. `JWL-00126`) and unique barcode (e.g. `JWL00126`).
- **Precision Gold Weights**: Explicit 3-decimal precision for Gross Weight, Stone / non-gold weight, and Net Gold Weight (`Net = Gross - Stone`).
- **BIS Hallmark (HUID)**: Native support for 6-character alphanumeric Hallmark Unique Identification codes.
- **Purity Standard**: Purity classifications: `24K (999)`, `22K (916 Standard)`, `18K (750)`, and `14K (585)`.
- **Pricing Flexibility**: Centralized pricing engine supporting both weight-based pricing (`Net Weight × Applied Rate + Making Charges + Wastage`) and fixed-price items.
- **Stock Movement History**: Immutable append-only audit trail (`InventoryMovement`) for every stock inward, sale, return, or manual adjustment.

### B. Manual Gold Rate Management
- **Purity-Specific Rates**: Daily manual updates for 24K, 22K, 18K, and 14K gold rates.
- **Audit Stamp**: Authorised user identity, timestamp, and notes recorded on every rate change.
- **Invoice Snapshot Protection**: Every invoice line snapshots the exact applied gold rate at the moment of sale. Changing the gold rate today **never retroactively modifies historical invoices**.
- **No Automatic Market APIs**: Strictly adheres to the physical shop's authorized manual entry policy.

### C. Fast POS Billing & GST Compliance
- **Keyboard & Scanner Friendly**: Instant barcode lookup via physical USB/Bluetooth handheld barcode scanner or manual search.
- **GST Compliance (HSN 7113)**: 3% GST calculation with automatic intra-state split (1.5% CGST + 1.5% SGST) or inter-state toggle (3% IGST).
- **Rounding & Minor Units**: Decimal-safe calculations using `decimal.js` with half-up rounding and standard rupee round-offs.
- **Walk-in & Saved Customers**: Seamless billing for anonymous walk-in buyers or loyalty/khata customers.
- **Multi-Mode Payments**: Support for Cash, UPI, Credit/Debit Card, and Bank Transfer with split payment recording.
- **Printable Tax Invoices**: Formatted GST tax invoice with shop header, customer snapshot, line breakdown, and browser print trigger.

### D. Smart Barcode Tagging Station
- **4-Step Guided Process**: 1. Item saved → 2. Barcode generated → 3. Print tag → 4. Scan verify.
- **Live Tag Preview**: Renders actual Code-128 SVG barcodes via `JsBarcode` formatted for jewellery tags (50mm × 25mm label size).
- **Controlled Bulk Print**: Categorized queue (40 Rings, 60 Bangles, 100 Jhumkas) to eliminate rogue barcode printing.
- **Scanner Verification**: Validates attached physical tags using scanner input before releasing pieces to the sales counter.

### E. Customer & Supplier Ledgers (Khata)
- **Customer Ledger**: Chronological transaction history tracking invoice debits, payment credits, customer advances, and closing balances.
- **Supplier Ledger**: Tracks purchase shipments, disbursements, pending payables, and karigar statements.

### F. Guided Stock Inward & Excel Import
- **5-Step Inward Process**: 1. Supplier → 2. Items → 3. Pricing mode → 4. Tags → 5. Confirm.
- **Excel Inventory Import**: Downloadable `.xlsx` template, pre-import validation, duplicate barcode prevention, and row-level diagnostics powered by `ExcelJS`.

### G. Live Real-Time Dashboard & Reports
- **100% Calculated Metrics**: Real MongoDB aggregations for Today's Sales, Bills Count, Stock Pieces, Inventory Valuation, and Low Stock alerts.
- **Business Reports**: Date-filtered Sales Register, Stock Valuation by Purity, Gross & Net Profit, and GST tax summaries with one-click Excel export.

---

## 2. Technology Stack

- **Frontend**:
  - React 19 with Vite
  - JavaScript & JSX
  - Material UI (MUI v6) + Emotion
  - React Router DOM v7
  - Axios with JWT Interceptors
  - Recharts for analytics
  - JsBarcode for Code-128 barcode generation
- **Backend**:
  - Node.js (v22+) & Express.js
  - MongoDB with Mongoose ODM
  - Decimal.js for precise financial math
  - ExcelJS for spreadsheet imports and exports
  - JWT Authentication & bcryptjs password hashing
  - Helmet security headers, CORS, rate limiting, and centralized error handling
- **Hardware Integration**:
  - Standard USB / Bluetooth HID barcode scanners (detects `Enter` key terminators)
  - Standard browser-native thermal label and invoice printing

---

## 3. Quick Start & Setup

### Prerequisites
- Node.js v18+ (tested on Node v22)
- MongoDB running locally on `mongodb://127.0.0.1:27017` or a MongoDB Atlas URI

### 1. Installation
```bash
# Clone the repository and navigate into the root directory
cd "f:\dp\jwellary shop"

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Environment Configuration
Create `server/.env` (or use the provided defaults):
```env
PORT=5001
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/aarna_jewar_db
JWT_SECRET=aarna_super_secure_jwt_secret_2026_key!
CLIENT_URL=http://localhost:5173
TIMEZONE=Asia/Kolkata
```

### 3. Seed Database with Reference Demo Data
Initializes default roles, sample categories, manual gold rates, 40 Rings, 60 Bangles, 100 Jhumkas, and store profile matching the reference prototype:
```bash
npm run seed --prefix server
```

### 4. Running the Development Servers
In two separate terminals (or using root scripts):
```bash
# Terminal 1: Backend API Server (Port 5001)
npm run dev --prefix server

# Terminal 2: React Frontend App (Vite on Port 5173 / 5174)
npm run dev --prefix client
```

Open your browser at `http://localhost:5173` or `http://localhost:5174`.

---

## 4. Default Demo Accounts

| Role | Username | Password | Permitted Operations |
| :--- | :--- | :--- | :--- |
| **Owner / Admin** | `admin` | `admin123` | Full access, settings, user management, audit logs, price rules |
| **Manager** | `manager` | `manager123` | Inventory, billing, purchases, customer khata, reports |
| **Cashier** | `cashier` | `cashier123` | POS billing, customer creation, payment collection |
| **Stock Staff** | `stock` | `stock123` | Inventory stock inward, tag printing, scan verification |

---

## 5. Automated Tests

Run the test suite verifying decimal calculations, pricing engine rules, and GST calculations:
```bash
npm test --prefix server
```
Test results:
- `Financial Decimal Utility - Weight and Money Rounding`: PASS
- `Pricing Engine - Weight-based calculation with making charges and wastage`: PASS
- `Pricing Engine - Fixed-price product calculation`: PASS
- `GST Invoice Calculation - Intra-state 3% split (1.5% CGST + 1.5% SGST)`: PASS
- `GST Invoice Calculation - Inter-state 3% IGST`: PASS

---

## 6. REST API Reference (`/api/v1`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/auth/login` | Authenticate user & return JWT token |
| `GET` | `/auth/me` | Fetch currently authenticated user |
| `GET` | `/dashboard/summary` | Real-time sales, stock, and alert metrics |
| `GET` | `/metal-rates/latest` | Current manual rates for 24K, 22K, 18K, 14K |
| `POST` | `/metal-rates/update` | Update gold rates with user audit stamp |
| `GET` | `/products` | List and search inventory items |
| `GET` | `/products/barcode/:code` | Fast barcode lookup for scanner input |
| `POST` | `/products` | Create single jewellery piece with unique ID |
| `POST` | `/products/verify/:code` | Mark printed tag as verified by scanner |
| `POST` | `/purchases/guided-inward` | 5-step stock inward from supplier |
| `POST` | `/sales/calculate-pricing` | Dynamic pricing calculation for POS cart |
| `POST` | `/sales` | Finalize POS sale, deduct stock, update ledger |
| `GET` | `/customers/:id/ledger` | Chronological customer khata statement |
| `POST` | `/customers/:id/payment` | Record customer advance or due payment |
| `GET` | `/suppliers/:id/ledger` | Chronological supplier ledger statement |
| `POST` | `/suppliers/:id/payment` | Disburse payment to supplier |
| `GET` | `/reports/sales` | Sales register report |
| `GET` | `/reports/gst` | GST summary report (HSN 7113) |
| `GET` | `/reports/export-excel` | Download Excel register via ExcelJS |
| `GET` | `/imports/template` | Download inventory `.xlsx` template |
| `POST` | `/imports/preview` | Validate spreadsheet rows before import |
| `POST` | `/imports/confirm` | Ingest validated rows into inventory |
