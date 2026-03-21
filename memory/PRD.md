# DREAMOVEN Inventory Management System - PRD

## Original Problem Statement
Set up DREAMOVEN Inventory Management System with:
- Pull inventory app from GitHub repo (kinfolk-store)
- Set up as fresh DREAMOVEN instance with new database
- Initialize with: 14 kitchens, 1 main store, admin user, 683 items, 47 vendors
- Full feature parity with original Kinfolk Store app

## User Personas
1. **Admin (Primary)**: Full access to all features - manage items, vendors, kitchens, purchase orders, stock, reports
2. **Store Manager**: View/manage inventory for assigned kitchen
3. **Procurement**: Create and manage purchase orders

## Core Requirements (Static)
- User authentication with JWT
- Kitchen/Store management (15 total: 1 main + 14 branches)
- Item inventory management with categories
- Vendor management
- Purchase order system with status filtering
- GRN (Goods Receipt Note) system
- Current stock tracking with editable values
- Reports and analytics
- Dashboard with analytics

## Architecture
- **Backend**: FastAPI (Python) with MongoDB
- **Frontend**: React.js with Tailwind CSS
- **Database**: MongoDB
- **Authentication**: JWT-based

## What's Been Implemented

### Phase 1 (Jan 2026) - Core Setup
- ✅ User authentication (login, JWT tokens)
- ✅ Kitchens CRUD API
- ✅ Items CRUD API with search/filter
- ✅ Vendors CRUD API
- ✅ Categories CRUD API
- ✅ Dashboard stats API
- ✅ Data seeding script (797 items, 69 vendors, 15 kitchens)

### Phase 2 (March 21, 2026) - Feature Parity with Kinfolk Store
- ✅ **Purchase Orders** with full features:
  - Status filter tabs (Pending, Partial, Received, All) with counts
  - Summary cards showing status counts
  - Vendor filter chips
  - PO detail modal with items table
  - GRN verification section in PO details
  - View, PDF, Email buttons
  - Admin can delete PO before GRN
  - Protection: Cannot delete received POs
  
- ✅ **Current Stock** with full features:
  - Summary cards (Total Items, Today's GRN Items, Below Par Stock, Stock OK)
  - Filter tabs (All, Below Par, Stock OK) with counts
  - Table columns: Item, Category, Current, Today GRN, Total, Par Stock, Status
  - Admin can edit current stock and par stock values
  - Status bar showing deficit level
  - Action buttons (Upload Opening Stock, Stock Ledger, Export to Excel, Update PAR Stock)

- ✅ **Reports** fully integrated:
  - Vendor Ledger report with PO/GRN data
  - Kitchen Ledger report
  - Daywise Reports
  - Stock in Hand Main Store
  - Consumption Analysis
  - Date filters and Excel export button

- ✅ **GRN System**:
  - GRN creation from approved POs
  - Auto stock update on GRN receipt
  - Today's GRN tracking in Current Stock
  - GRN verification photos support (UI ready)

- ✅ **Additional Features**:
  - Requisitions management
  - Issue items to kitchens
  - Daily Perishables tracking
  - Alerts for low stock
  - Auto PO generation suggestions
  - Users management

### Seeded Data
- Admin User: parveenkatyal2312@gmail.com / admin@123
- 15 Kitchens (Main Store + 14 branches)
- 69 Vendors
- 797 Items
- 14 Categories

## Kitchen List
1. Main Store (MAIN)
2. Sticky Rice PB (SRPB)
3. Kalaunji PB (KLPB)
4. Coimbatore (CMBR)
5. Aioli (AIOL)
6. DO Cafe (DOCF)
7. DO Bakery (DOBK)
8. DO GCR (DGCR)
9. DO Munirika (DMUN)
10. Dashi PB (DSPB)
11. Dashi MT (DSMT)
12. Dashi RN (DSRN)
13. Sticky Rice DFC (SRDF)
14. Sticky Rice NFC (SRNF)
15. Sticky Rice Noida (SRND)

## Prioritized Backlog
### P0 (Critical) - COMPLETE
- ✅ Authentication
- ✅ Dashboard
- ✅ Items management
- ✅ Kitchens management
- ✅ Vendors management
- ✅ Purchase Orders with status filters
- ✅ Current Stock with full columns
- ✅ Reports integration
- ✅ GRN system

### P1 (Important) - Partial
- ✅ Stock tracking per kitchen
- ✅ Low stock alerts
- 🔄 Bulk item import/export (UI buttons exist)
- 🔄 5-step GRN workflow (basic 1-step implemented)

### P2 (Nice to Have)
- User role-based access control
- PDF generation for POs
- Email sending for POs
- WhatsApp integration
- Mobile QR scanning
- Barcode scanning
- Audit logs

## API Endpoints

### Authentication
- POST /api/auth/login
- GET /api/auth/me

### Purchase Orders
- GET /api/purchase-orders
- GET /api/purchase-orders/{id}
- POST /api/purchase-orders
- PUT /api/purchase-orders/{id}/status
- DELETE /api/purchase-orders/{id}
- GET /api/purchase-orders/stats/summary

### Current Stock
- GET /api/current-stock
- GET /api/current-stock/stats
- POST /api/current-stock/update

### Reports
- GET /api/reports/vendor-ledger
- GET /api/reports/kitchen-ledger
- GET /api/reports/stock-in-hand
- GET /api/reports/consumption-analysis
- GET /api/reports/daywise

### Other
- GET/POST /api/grns
- GET/POST /api/requisitions
- GET/POST /api/issues
- GET/POST /api/daily-perishables
- GET /api/alerts
- GET /api/dashboard/stats

## Testing
- Backend: 100% pass rate (19/19 tests)
- Frontend: All UI flows verified
- Test report: /app/test_reports/iteration_2.json

## Next Tasks
1. Implement 5-step GRN workflow (Item verification, Photo capture, Weight check, Quality check, Final approval)
2. Add PDF generation for Purchase Orders
3. Add Email functionality for POs
4. Implement bulk import/export from Excel
5. Add WhatsApp sharing for POs
