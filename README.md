# SCM Dashboard

A full-stack **Supply Chain Management analytics platform** inspired by Oracle Fusion Data Intelligence. Provides real-time visibility across orders, inventory, suppliers, procurement, and logistics through interactive dashboards.

---

## Features

### 6 Analytics Modules
| Module | Description |
|--------|-------------|
| **Executive Dashboard** | KPI scorecards, order trend, supplier performance, inventory by category |
| **Inventory Management** | Real-time stock levels, low-stock/overstock alerts, regional breakdown |
| **Supplier Performance** | Scorecards, on-time delivery, rejection rates, spend analysis |
| **Order Management** | Order lifecycle, status filtering, sortable table, delay tracking |
| **Procurement & AP** | PO tracking, monthly spend trends, spend by category |
| **Logistics & Fulfillment** | Shipment tracking, carrier performance, freight cost analysis |

### Key Capabilities
- 10+ pre-built KPIs with target indicators and trend comparison
- Interactive charts — line, bar, area, pie/donut
- Sortable, paginated data tables with server-side sorting
- Status filtering with clickable breakdown labels
- Color-coded status system: green (on target), yellow (at risk), red (critical)
- Role-based drill-through: KPI → chart → transaction detail

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Data Fetching | TanStack Query (React Query) |
| Routing | React Router v6 |
| Backend | FastAPI (Python) |
| Database | SQLite + SQLAlchemy ORM |

---

## Getting Started

### Prerequisites
- Python 3.9+
- Node.js 18+ and npm

### Run the app

```bash
# Clone the repo
git clone https://github.com/SongyangZhou/sum-dashboard.git
cd sum-dashboard

# Start both backend and frontend
chmod +x start.sh
./start.sh
```

Then open **http://localhost:5173** in your browser.

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs (Swagger): http://localhost:8000/docs

### Manual setup

**Backend**
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python seed.py          # populate the database
uvicorn main:app --reload --port 8000
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
```

### Reset the database
```bash
cd backend
rm scm.db
source .venv/bin/activate
python seed.py
```

---

## Project Structure

```
.
├── backend/
│   ├── main.py               # FastAPI app entry point
│   ├── database.py           # SQLAlchemy engine & session
│   ├── models.py             # ORM models
│   ├── seed.py               # Mock data generator
│   ├── requirements.txt
│   └── routers/
│       ├── dashboard.py      # KPIs, charts aggregations
│       ├── inventory.py
│       ├── suppliers.py
│       ├── orders.py
│       ├── procurement.py
│       └── logistics.py
├── frontend/
│   └── src/
│       ├── api/client.ts     # Axios API calls
│       ├── components/       # Layout, KPICard, StatusBadge
│       └── pages/            # One page per module
├── start.sh                  # One-command startup script
└── prompt.md                 # Product requirements
```

---

## Mock Data

The seed script generates realistic supply chain data:

- **15 suppliers** across 8 countries and 7 categories
- **25 products** across Electronics, Industrial, Food, Chemicals, Packaging, Automotive
- **350 orders** spanning 12 months with realistic delivery patterns
- **~340 shipments** across 7 carriers
- **280 purchase orders** with full requisition → invoice → payment lifecycle
- **7 warehouses** across North America, Europe, and Asia
