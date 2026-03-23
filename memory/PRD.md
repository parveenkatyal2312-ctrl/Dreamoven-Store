# DREAMOVEN Inventory Management System - PRD

## Original Problem Statement
Set up DREAMOVEN Inventory Management System with:
- Pull inventory app from GitHub repo (kinfolk-store)
- Set up as fresh DREAMOVEN instance with new database
- Initialize with: 14 kitchens, 1 main store, admin user, 683 items, 47 vendors
- Full feature parity with original Kinfolk Store app
- **Full Migration Completed March 21, 2026**

## User Personas & Roles
1. **Admin**: Full access to all features - manage items, vendors, kitchens, purchase orders, stock, reports, users
2. **Main Store**: Process requisitions from kitchens, manage GRNs, issue items
3. **Kitchen**: Raise requisitions to main store, create POs for daily perishables, receive goods

## Core Requirements (Static)
- User authentication with JWT
- **Role-based access control** (admin, main_store, kitchen)
- Kitchen/Store management (15 total: 1 main + 14 branches)
- Item inventory management with categories
- Vendor management
- Purchase order system with status filtering
- **5-step GRN workflow** with photo capture and GPS
- Current stock tracking with editable values
- **Requisitions flow**: Kitchen → Main Store
- Reports and analytics
- Dashboard with analytics

## Architecture
- **Backend**: FastAPI (Python) with MongoDB - **16,500+ lines** (full feature set)
- **Frontend**: React.js with Tailwind CSS - **37 page components**
- **Database**: MongoDB Atlas (M10 cluster - Mumbai region)
- **Image Storage**: Cloudflare R2 (for GRN photos)
- **Authentication**: JWT-based with role support

## Infrastructure (Production Ready)

### MongoDB Atlas
- **Cluster**: cluster0.lbaoz0.mongodb.net
- **Database**: dreamoven_db
- **Tier**: M10 Dedicated (~$57/month)
- **Region**: AWS Mumbai (ap-south-1)

### Cloudflare R2 Storage
- **Bucket**: dreamoven-storage
- **Public URL**: https://pub-cd0157ddd3e442bd9e2313f13cb121f5.r2.dev
- **Region**: Asia-Pacific (APAC)
- **Free Tier**: 10GB storage, 1M Class A ops, 10M Class B ops/month

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

### Phase 3 (March 21, 2026) - Full Codebase Migration
- ✅ **Complete Migration from Original Kinfolk Store**:
  - Migrated 16,447-line backend (server.py)
  - Migrated 37 frontend page components
  - Migrated AuthContext with role support
  - Migrated Layout with role-based sidebar

- ✅ **Role-Based Access Control**:
  - Admin: Full access to all 15+ menu items
  - Main Store: Access to inventory management features
  - Kitchen: Limited to My Requisitions, Purchase Orders, Receive Goods, Scan QR

- ✅ **Requisition Workflow** (Kitchen → Main Store):
  - Kitchen users raise requisitions to Main Store
  - Main Store receives and processes requisitions
  - Status tracking: Pending → In Progress → Completed
  - Priority tags (URGENT/NORMAL)

- ✅ **5-Step GRN Workflow**:
  - Quick Search by PO Number
  - Browse by Vendor dropdown
  - Photo capture with GPS location
  - LOT number tracking
  - Recent GRNs list

- ✅ **Test Users Created**:
  - Admin: parveenkatyal2312@gmail.com / admin@123
  - Main Store: mainstore@dreamoven.com / store@123
  - Kitchen (Sticky Rice PB): srpb@dreamoven.com / kitchen@123
  - Kitchen (Kalaunji PB): klpb@dreamoven.com / kitchen@123
  - Kitchen (Coimbatore): cmbr@dreamoven.com / kitchen@123
  - Kitchen (Aioli): aiol@dreamoven.com / kitchen@123
  - Kitchen (DO Cafe): docf@dreamoven.com / kitchen@123

### Seeded Data
- Admin User: parveenkatyal2312@gmail.com / admin@123
- 15 Locations (Main Store + 14 kitchens)
- 69 Vendors
- 1353 Items (after Excel stock upload and duplicate cleanup)
- 446 Lots (stock tracking records)
- 14 Categories

## Recent Updates (March 23, 2026)

### Stock Data Fix
- **Issue**: Categories (Bakery, Indian Grocery, Seafood, Beverage) were showing 0 stock after Excel upload
- **Root Cause**: Item name mismatches between Excel file and seeded items created duplicates, with lots pointing to wrong items
- **Fix**: Cleaned up 2 duplicate item groups, merged lots to correct original items
- **Result**: All categories now show correct stock:
  - Bakery: 575 units (17 items with stock)
  - Indian Grocery: 2863.5 units (109 items with stock)
  - Seafood: 105 units (10 items with stock)
  - Beverage: 1873.5 units (36 items with stock)

### GRN Photo Upload to Cloudflare R2
- **Updated**: GRNPage.jsx now uploads photos to Cloudflare R2 instead of storing base64 in MongoDB
- **Endpoint**: POST /api/upload/base64
- **Storage**: dreamoven-storage bucket
- **Public URL**: https://pub-cd0157ddd3e442bd9e2313f13cb121f5.r2.dev

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
- ✅ Stock data upload from Excel (completed with duplicate cleanup)
- ✅ GRN photo upload to Cloudflare R2
- 🔄 Bulk item import/export (UI buttons exist)
- 🔄 5-step GRN workflow (basic implementation with photo capture)

### P2 (Nice to Have)
- ✅ User role-based access control (Admin, Main Store, Kitchen)
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
