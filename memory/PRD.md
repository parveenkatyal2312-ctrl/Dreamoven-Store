# DREAMOVEN Inventory Management System - PRD

## Original Problem Statement
Set up DREAMOVEN Inventory Management System with:
- Pull inventory app from GitHub repo (kinfolk-store)
- Set up as fresh DREAMOVEN instance with new database
- Initialize with: 14 kitchens, 1 main store, admin user, 683 items, 47 vendors

## User Personas
1. **Admin (Primary)**: Full access to all features - manage items, vendors, kitchens, purchase orders
2. **Store Manager**: View/manage inventory for assigned kitchen
3. **Procurement**: Create and manage purchase orders

## Core Requirements (Static)
- User authentication with JWT
- Kitchen/Store management (15 total: 1 main + 14 branches)
- Item inventory management with categories
- Vendor management
- Purchase order system
- Dashboard with analytics

## Architecture
- **Backend**: FastAPI (Python) with MongoDB
- **Frontend**: React.js with Tailwind CSS
- **Database**: MongoDB
- **Authentication**: JWT-based

## What's Been Implemented (Jan 2026)
### Backend
- ✅ User authentication (login, JWT tokens)
- ✅ Kitchens CRUD API
- ✅ Items CRUD API with search/filter
- ✅ Vendors CRUD API
- ✅ Categories CRUD API
- ✅ Purchase Orders API
- ✅ Dashboard stats API
- ✅ Data seeding script

### Frontend
- ✅ Login page with DREAMOVEN branding
- ✅ Dashboard with stats cards and category breakdown
- ✅ Items management page (search, filter, CRUD)
- ✅ Kitchens management page
- ✅ Vendors management page
- ✅ Categories management page
- ✅ Purchase Orders page
- ✅ Responsive sidebar navigation
- ✅ Dark theme UI

### Seeded Data
- Admin User: parveenkatyal2312@gmail.com / admin@123
- 15 Kitchens (Main Store + 14 branches)
- 69 Vendors (47 original + 22 new)
- 797 Items (685 original + 112 new from Excel)
- 14 Categories

### New Vendors Added (Jan 2026)
- AKSHAY BUSINESS SOLUTION
- KIM SHIN FINE FOODS PVT.LTD.
- SHRI TIRUPATI STORE
- PINK APPLE GOURMET PVT LTD
- HINDUSTAN DRUG HOUSE
- OSWAL AGENCIES
- BAKEWELL FOODS
- SILICO
- POLYWRAP
- SATYA SALES
- And more...

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
### P0 (Critical)
- ✅ Authentication
- ✅ Dashboard
- ✅ Items management
- ✅ Kitchens management
- ✅ Vendors management

### P1 (Important)
- Stock tracking per kitchen
- Purchase order items selection
- Low stock alerts
- Bulk item import/export

### P2 (Nice to Have)
- User role management
- Reports generation
- Mobile responsive optimizations
- Barcode scanning
- Audit logs

## Next Tasks
1. Add stock tracking functionality per kitchen
2. Implement purchase order line items
3. Add low stock alerts on dashboard
4. Bulk import items from Excel
5. Add user management for multiple roles
