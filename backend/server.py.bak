from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Any, Dict
import uuid
from datetime import datetime, timezone, timedelta, date
import jwt
import bcrypt
from bson import ObjectId

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Settings
JWT_SECRET = os.environ.get('JWT_SECRET', 'dreamoven-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Security
security = HTTPBearer()

# Create the main app
app = FastAPI(title="DREAMOVEN Inventory Management System")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============ MODELS ============

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str = "user"
    kitchen_id: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    kitchen_id: Optional[str] = None
    kitchen_name: Optional[str] = None
    created_at: datetime

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class KitchenCreate(BaseModel):
    name: str
    code: Optional[str] = None
    address: Optional[str] = None
    is_main_store: bool = False

class KitchenResponse(BaseModel):
    id: str
    name: str
    code: Optional[str] = None
    address: Optional[str] = None
    is_main_store: bool = False
    created_at: datetime

class CategoryCreate(BaseModel):
    name: str

class CategoryResponse(BaseModel):
    id: str
    name: str
    created_at: datetime

class VendorCreate(BaseModel):
    name: str
    contact: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    gst_number: Optional[str] = None
    payment_terms: Optional[str] = None
    supply_categories: List[str] = []

class VendorResponse(BaseModel):
    id: str
    name: str
    contact: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    gst_number: Optional[str] = None
    payment_terms: Optional[str] = None
    supply_categories: List[str] = []
    created_at: datetime

class ItemCreate(BaseModel):
    name: str
    category: str
    unit: str
    hsn_code: Optional[str] = None
    gst_rate: Optional[float] = 0
    vendor: Optional[str] = None
    standard_price: Optional[float] = None
    par_stock: Optional[float] = None

class ItemResponse(BaseModel):
    id: str
    name: str
    category: str
    unit: str
    hsn_code: Optional[str] = None
    gst_rate: Optional[float] = 0
    vendor: Optional[str] = None
    standard_price: Optional[float] = None
    par_stock: Optional[float] = None
    created_at: datetime

# Stock Models
class StockUpdate(BaseModel):
    item_id: str
    current_stock: float
    par_stock: Optional[float] = None

class CurrentStockResponse(BaseModel):
    id: str
    item_id: str
    item_name: str
    category: str
    unit: str
    ordered_qty: float
    current_stock: float
    par_stock: float
    deficit: float
    standard_price: Optional[float] = None

# Requisition Models
class RequisitionItemCreate(BaseModel):
    item_id: str
    quantity: float

class RequisitionCreate(BaseModel):
    kitchen_id: str
    items: List[RequisitionItemCreate]
    notes: Optional[str] = None

class RequisitionResponse(BaseModel):
    id: str
    requisition_number: str
    kitchen_id: str
    kitchen_name: str
    items: List[dict]
    status: str
    total_items: int
    notes: Optional[str] = None
    created_by: str
    created_at: datetime

# GRN Models
class GRNItemCreate(BaseModel):
    item_id: str
    ordered_qty: float
    received_qty: float
    unit_price: float

class GRNCreate(BaseModel):
    po_id: str
    items: List[GRNItemCreate]
    notes: Optional[str] = None

class GRNResponse(BaseModel):
    id: str
    grn_number: str
    po_id: str
    po_number: str
    vendor_id: str
    vendor_name: str
    items: List[dict]
    total_amount: float
    status: str
    notes: Optional[str] = None
    received_by: str
    created_at: datetime

# Issue Models
class IssueItemCreate(BaseModel):
    item_id: str
    quantity: float

class IssueCreate(BaseModel):
    kitchen_id: str
    requisition_id: Optional[str] = None
    items: List[IssueItemCreate]
    notes: Optional[str] = None

class IssueResponse(BaseModel):
    id: str
    issue_number: str
    kitchen_id: str
    kitchen_name: str
    requisition_id: Optional[str] = None
    items: List[dict]
    status: str
    total_items: int
    notes: Optional[str] = None
    issued_by: str
    created_at: datetime

# Daily Perishables
class DailyPerishableCreate(BaseModel):
    item_id: str
    quantity: float
    vendor_id: Optional[str] = None
    rate: Optional[float] = None

class DailyPerishableResponse(BaseModel):
    id: str
    date: str
    item_id: str
    item_name: str
    category: str
    quantity: float
    vendor_id: Optional[str] = None
    vendor_name: Optional[str] = None
    rate: Optional[float] = None
    total_value: Optional[float] = None
    created_at: datetime

# Purchase Order Models
class POItemCreate(BaseModel):
    item_id: str
    quantity: float
    unit_price: float

class PurchaseOrderCreate(BaseModel):
    vendor_id: str
    kitchen_id: str
    items: List[POItemCreate]
    notes: Optional[str] = None
    is_dp: bool = False  # Daily Perishables PO

class PurchaseOrderResponse(BaseModel):
    id: str
    po_number: str
    vendor_id: str
    vendor_name: str
    kitchen_id: str
    kitchen_name: str
    items: List[dict]
    total_amount: float
    status: str
    is_dp: bool = False
    notes: Optional[str] = None
    created_by: Optional[str] = None
    created_at: datetime

# Alert Model
class AlertResponse(BaseModel):
    id: str
    type: str
    message: str
    item_id: Optional[str] = None
    item_name: Optional[str] = None
    severity: str
    created_at: datetime

# ============ HELPER FUNCTIONS ============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def serialize_doc(doc: dict) -> dict:
    """Remove MongoDB _id and ensure serializable"""
    if doc and "_id" in doc:
        del doc["_id"]
    return doc

def parse_datetime(dt):
    if isinstance(dt, str):
        return datetime.fromisoformat(dt.replace('Z', '+00:00'))
    return dt

# ============ ROUTES ============

# Health Check
@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "service": "dreamoven-inventory-backend", "version": "v2.0"}

# ============ AUTHENTICATION ============

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(data: UserLogin):
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not user or not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    kitchen_name = None
    if user.get("kitchen_id"):
        kitchen = await db.kitchens.find_one({"id": user["kitchen_id"]}, {"_id": 0})
        if kitchen:
            kitchen_name = kitchen["name"]
    
    token = create_token(user["id"], user["email"], user["role"])
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            name=user["name"],
            role=user["role"],
            kitchen_id=user.get("kitchen_id"),
            kitchen_name=kitchen_name,
            created_at=parse_datetime(user["created_at"])
        )
    )

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    kitchen_name = None
    if current_user.get("kitchen_id"):
        kitchen = await db.kitchens.find_one({"id": current_user["kitchen_id"]}, {"_id": 0})
        if kitchen:
            kitchen_name = kitchen["name"]
    
    return {
        "id": current_user["id"],
        "email": current_user["email"],
        "name": current_user["name"],
        "role": current_user["role"],
        "kitchen_id": current_user.get("kitchen_id"),
        "kitchen_name": kitchen_name,
        "created_at": current_user["created_at"]
    }

# ============ USERS MANAGEMENT ============

@api_router.get("/users")
async def get_users(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(1000)
    result = []
    for user in users:
        kitchen_name = None
        if user.get("kitchen_id"):
            kitchen = await db.kitchens.find_one({"id": user["kitchen_id"]}, {"_id": 0})
            if kitchen:
                kitchen_name = kitchen["name"]
        user["kitchen_name"] = kitchen_name
        result.append(user)
    return result

@api_router.post("/users")
async def create_user(data: UserCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = {
        "id": str(uuid.uuid4()),
        "email": data.email,
        "password": hash_password(data.password),
        "name": data.name,
        "role": data.role,
        "kitchen_id": data.kitchen_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user)
    del user["password"]
    return serialize_doc(user)

@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted"}

# ============ KITCHENS ============

@api_router.get("/kitchens")
async def get_kitchens():
    kitchens = await db.kitchens.find({}, {"_id": 0}).to_list(1000)
    return kitchens

@api_router.post("/kitchens")
async def create_kitchen(data: KitchenCreate, current_user: dict = Depends(get_current_user)):
    kitchen = {
        "id": str(uuid.uuid4()),
        "name": data.name,
        "code": data.code or data.name[:3].upper(),
        "address": data.address,
        "is_main_store": data.is_main_store,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.kitchens.insert_one(kitchen)
    return serialize_doc(kitchen)

@api_router.put("/kitchens/{kitchen_id}")
async def update_kitchen(kitchen_id: str, data: KitchenCreate, current_user: dict = Depends(get_current_user)):
    result = await db.kitchens.find_one_and_update(
        {"id": kitchen_id},
        {"$set": {"name": data.name, "code": data.code, "address": data.address, "is_main_store": data.is_main_store}},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Kitchen not found")
    return serialize_doc(result)

@api_router.delete("/kitchens/{kitchen_id}")
async def delete_kitchen(kitchen_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.kitchens.delete_one({"id": kitchen_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Kitchen not found")
    return {"message": "Kitchen deleted"}

# ============ CATEGORIES ============

@api_router.get("/categories")
async def get_categories():
    categories = await db.categories.find({}, {"_id": 0}).to_list(1000)
    return categories

@api_router.post("/categories")
async def create_category(data: CategoryCreate, current_user: dict = Depends(get_current_user)):
    category = {
        "id": str(uuid.uuid4()),
        "name": data.name,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.categories.insert_one(category)
    return serialize_doc(category)

# ============ VENDORS ============

@api_router.get("/vendors")
async def get_vendors():
    vendors = await db.vendors.find({}, {"_id": 0}).to_list(1000)
    return vendors

@api_router.post("/vendors")
async def create_vendor(data: VendorCreate, current_user: dict = Depends(get_current_user)):
    vendor = {
        "id": str(uuid.uuid4()),
        **data.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.vendors.insert_one(vendor)
    return serialize_doc(vendor)

@api_router.put("/vendors/{vendor_id}")
async def update_vendor(vendor_id: str, data: VendorCreate, current_user: dict = Depends(get_current_user)):
    result = await db.vendors.find_one_and_update(
        {"id": vendor_id},
        {"$set": data.model_dump()},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return serialize_doc(result)

@api_router.delete("/vendors/{vendor_id}")
async def delete_vendor(vendor_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.vendors.delete_one({"id": vendor_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return {"message": "Vendor deleted"}

# ============ ITEMS ============

@api_router.get("/items")
async def get_items(
    category: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 1000
):
    query = {}
    if category:
        query["category"] = category
    if search:
        query["name"] = {"$regex": search, "$options": "i"}
    
    items = await db.items.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    return items

@api_router.get("/items/count")
async def get_items_count():
    count = await db.items.count_documents({})
    return {"count": count}

@api_router.post("/items")
async def create_item(data: ItemCreate, current_user: dict = Depends(get_current_user)):
    item = {
        "id": str(uuid.uuid4()),
        **data.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.items.insert_one(item)
    return serialize_doc(item)

@api_router.put("/items/{item_id}")
async def update_item(item_id: str, data: ItemCreate, current_user: dict = Depends(get_current_user)):
    result = await db.items.find_one_and_update(
        {"id": item_id},
        {"$set": data.model_dump()},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Item not found")
    return serialize_doc(result)

@api_router.delete("/items/{item_id}")
async def delete_item(item_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.items.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"message": "Item deleted"}

# ============ CURRENT STOCK ============

@api_router.get("/current-stock")
async def get_current_stock(
    kitchen_id: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    # Default to main store if no kitchen specified
    if not kitchen_id:
        main_store = await db.kitchens.find_one({"is_main_store": True}, {"_id": 0})
        kitchen_id = main_store["id"] if main_store else None
    
    # Get all items
    item_query = {}
    if category:
        item_query["category"] = category
    if search:
        item_query["name"] = {"$regex": search, "$options": "i"}
    
    items = await db.items.find(item_query, {"_id": 0}).to_list(10000)
    
    # Get stock entries for this kitchen
    stock_entries = {}
    stocks = await db.stock.find({"kitchen_id": kitchen_id}, {"_id": 0}).to_list(10000)
    for s in stocks:
        stock_entries[s["item_id"]] = s
    
    # Get pending ordered quantities from POs
    pending_orders = {}
    pos = await db.purchase_orders.find(
        {"kitchen_id": kitchen_id, "status": {"$in": ["pending", "approved"]}},
        {"_id": 0}
    ).to_list(1000)
    for po in pos:
        for item in po.get("items", []):
            item_id = item.get("item_id")
            if item_id:
                pending_orders[item_id] = pending_orders.get(item_id, 0) + item.get("quantity", 0)
    
    # Get today's GRN quantities
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    today_grns = {}
    grns = await db.grns.find(
        {
            "kitchen_id": kitchen_id,
            "created_at": {"$regex": f"^{today}"}
        },
        {"_id": 0}
    ).to_list(1000)
    for grn in grns:
        for item in grn.get("items", []):
            item_id = item.get("item_id")
            if item_id:
                today_grns[item_id] = today_grns.get(item_id, 0) + item.get("received_qty", 0)
    
    result = []
    for item in items:
        stock = stock_entries.get(item["id"], {})
        current = stock.get("current_stock", 0)
        par = stock.get("par_stock") or item.get("par_stock") or 0
        ordered = pending_orders.get(item["id"], 0)
        today_grn = today_grns.get(item["id"], 0)
        total = current + today_grn
        deficit = total - par
        
        result.append({
            "id": item["id"],
            "item_id": item["id"],
            "item_name": item["name"],
            "category": item["category"],
            "unit": item["unit"],
            "ordered_qty": ordered,
            "current_stock": current,
            "today_grn": today_grn,
            "total": total,
            "par_stock": par,
            "deficit": deficit,
            "standard_price": item.get("standard_price"),
            "status": "ok" if deficit >= 0 else "below_par"
        })
    
    return result

@api_router.get("/current-stock/stats")
async def get_stock_stats(
    kitchen_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get stock statistics for summary cards"""
    # Default to main store if no kitchen specified
    if not kitchen_id:
        main_store = await db.kitchens.find_one({"is_main_store": True}, {"_id": 0})
        kitchen_id = main_store["id"] if main_store else None
    
    # Get all items
    total_items = await db.items.count_documents({})
    
    # Get today's GRN items count
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    today_grns = await db.grns.find(
        {"kitchen_id": kitchen_id, "created_at": {"$regex": f"^{today}"}},
        {"_id": 0}
    ).to_list(1000)
    
    today_grn_items = set()
    for grn in today_grns:
        for item in grn.get("items", []):
            today_grn_items.add(item.get("item_id"))
    
    # Calculate below par and stock ok counts
    items = await db.items.find({}, {"_id": 0}).to_list(10000)
    stocks = await db.stock.find({"kitchen_id": kitchen_id}, {"_id": 0}).to_list(10000)
    stock_map = {s["item_id"]: s for s in stocks}
    
    below_par = 0
    stock_ok = 0
    
    for item in items:
        stock = stock_map.get(item["id"], {})
        current = stock.get("current_stock", 0)
        par = stock.get("par_stock") or item.get("par_stock") or 0
        
        if par > 0 and current < par:
            below_par += 1
        else:
            stock_ok += 1
    
    return {
        "total_items": total_items,
        "today_grn_items": len(today_grn_items),
        "below_par": below_par,
        "stock_ok": stock_ok
    }

@api_router.post("/current-stock/update")
async def update_stock(
    updates: List[StockUpdate],
    kitchen_id: str = Query(...),
    current_user: dict = Depends(get_current_user)
):
    for update in updates:
        # Update or create stock entry
        stock_doc = {
            "item_id": update.item_id,
            "kitchen_id": kitchen_id,
            "current_stock": update.current_stock,
            "par_stock": update.par_stock,
            "last_updated": datetime.now(timezone.utc).isoformat(),
            "updated_by": current_user["id"]
        }
        
        await db.stock.update_one(
            {"item_id": update.item_id, "kitchen_id": kitchen_id},
            {"$set": stock_doc},
            upsert=True
        )
    
    return {"message": f"Updated {len(updates)} stock entries"}

@api_router.post("/current-stock/save-sync")
async def save_and_sync_stock(
    kitchen_id: str = Query(...),
    current_user: dict = Depends(get_current_user)
):
    """Save current stock state and create sync log"""
    sync_log = {
        "id": str(uuid.uuid4()),
        "kitchen_id": kitchen_id,
        "synced_by": current_user["id"],
        "synced_at": datetime.now(timezone.utc).isoformat()
    }
    await db.sync_logs.insert_one(sync_log)
    return {"message": "Stock synced successfully", "sync_id": sync_log["id"]}

# ============ REQUISITIONS ============

@api_router.get("/requisitions")
async def get_requisitions(
    kitchen_id: Optional[str] = None,
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if kitchen_id:
        query["kitchen_id"] = kitchen_id
    if status:
        query["status"] = status
    
    requisitions = await db.requisitions.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return requisitions

@api_router.post("/requisitions")
async def create_requisition(
    data: RequisitionCreate,
    current_user: dict = Depends(get_current_user)
):
    # Get kitchen name
    kitchen = await db.kitchens.find_one({"id": data.kitchen_id}, {"_id": 0})
    if not kitchen:
        raise HTTPException(status_code=404, detail="Kitchen not found")
    
    # Build items with names
    items_with_details = []
    for item in data.items:
        item_doc = await db.items.find_one({"id": item.item_id}, {"_id": 0})
        if item_doc:
            items_with_details.append({
                "item_id": item.item_id,
                "item_name": item_doc["name"],
                "category": item_doc["category"],
                "unit": item_doc["unit"],
                "quantity": item.quantity
            })
    
    # Generate requisition number
    count = await db.requisitions.count_documents({})
    req_number = f"REQ-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{count + 1:04d}"
    
    requisition = {
        "id": str(uuid.uuid4()),
        "requisition_number": req_number,
        "kitchen_id": data.kitchen_id,
        "kitchen_name": kitchen["name"],
        "items": items_with_details,
        "total_items": len(items_with_details),
        "status": "pending",
        "notes": data.notes,
        "created_by": current_user["name"],
        "created_by_id": current_user["id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.requisitions.insert_one(requisition)
    return serialize_doc(requisition)

@api_router.put("/requisitions/{req_id}/status")
async def update_requisition_status(
    req_id: str,
    status: str = Query(...),
    current_user: dict = Depends(get_current_user)
):
    if status not in ["pending", "approved", "issued", "cancelled"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    result = await db.requisitions.update_one(
        {"id": req_id},
        {"$set": {"status": status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Requisition not found")
    return {"message": f"Status updated to {status}"}

# ============ PURCHASE ORDERS ============

@api_router.get("/purchase-orders")
async def get_purchase_orders(
    status: Optional[str] = None,
    kitchen_id: Optional[str] = None,
    vendor_id: Optional[str] = None,
    is_dp: Optional[bool] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if status:
        query["status"] = status
    if kitchen_id:
        query["kitchen_id"] = kitchen_id
    if vendor_id:
        query["vendor_id"] = vendor_id
    if is_dp is not None:
        query["is_dp"] = is_dp
    
    pos = await db.purchase_orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return pos

@api_router.post("/purchase-orders")
async def create_purchase_order(
    data: PurchaseOrderCreate,
    current_user: dict = Depends(get_current_user)
):
    # Get vendor and kitchen
    vendor = await db.vendors.find_one({"id": data.vendor_id}, {"_id": 0})
    kitchen = await db.kitchens.find_one({"id": data.kitchen_id}, {"_id": 0})
    
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    if not kitchen:
        raise HTTPException(status_code=404, detail="Kitchen not found")
    
    # Build items with details
    items_with_details = []
    total_amount = 0
    
    for item in data.items:
        item_doc = await db.items.find_one({"id": item.item_id}, {"_id": 0})
        if item_doc:
            line_total = item.quantity * item.unit_price
            total_amount += line_total
            items_with_details.append({
                "item_id": item.item_id,
                "item_name": item_doc["name"],
                "category": item_doc["category"],
                "unit": item_doc["unit"],
                "quantity": item.quantity,
                "unit_price": item.unit_price,
                "total": line_total
            })
    
    # Generate PO number
    count = await db.purchase_orders.count_documents({})
    prefix = "DP" if data.is_dp else "PO"
    po_number = f"{prefix}-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{count + 1:04d}"
    
    po = {
        "id": str(uuid.uuid4()),
        "po_number": po_number,
        "vendor_id": data.vendor_id,
        "vendor_name": vendor["name"],
        "kitchen_id": data.kitchen_id,
        "kitchen_name": kitchen["name"],
        "items": items_with_details,
        "total_amount": total_amount,
        "status": "pending",
        "is_dp": data.is_dp,
        "notes": data.notes,
        "created_by": current_user["name"],
        "created_by_id": current_user["id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.purchase_orders.insert_one(po)
    return serialize_doc(po)

@api_router.put("/purchase-orders/{po_id}/status")
async def update_po_status(
    po_id: str,
    status: str = Query(...),
    current_user: dict = Depends(get_current_user)
):
    if status not in ["pending", "partial", "approved", "received", "cancelled"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    result = await db.purchase_orders.update_one(
        {"id": po_id},
        {"$set": {"status": status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    return {"message": f"Status updated to {status}"}

@api_router.get("/purchase-orders/{po_id}")
async def get_purchase_order(
    po_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a single purchase order with details"""
    po = await db.purchase_orders.find_one({"id": po_id}, {"_id": 0})
    if not po:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    
    # Get GRN details if received
    grn = await db.grns.find_one({"po_id": po_id}, {"_id": 0})
    if grn:
        po["grn"] = grn
    
    return po

@api_router.delete("/purchase-orders/{po_id}")
async def delete_purchase_order(
    po_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a purchase order (only if not received)"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Check if PO exists and is not received
    po = await db.purchase_orders.find_one({"id": po_id}, {"_id": 0})
    if not po:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    
    if po.get("status") == "received":
        raise HTTPException(status_code=400, detail="Cannot delete a received purchase order")
    
    # Check if GRN exists for this PO
    grn = await db.grns.find_one({"po_id": po_id})
    if grn:
        raise HTTPException(status_code=400, detail="Cannot delete PO with existing GRN")
    
    result = await db.purchase_orders.delete_one({"id": po_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    
    return {"message": "Purchase order deleted successfully"}

@api_router.get("/purchase-orders/stats/summary")
async def get_po_stats_summary(
    kitchen_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get purchase order stats by status"""
    query = {}
    if kitchen_id:
        query["kitchen_id"] = kitchen_id
    
    pending = await db.purchase_orders.count_documents({**query, "status": "pending"})
    partial = await db.purchase_orders.count_documents({**query, "status": "partial"})
    received = await db.purchase_orders.count_documents({**query, "status": "received"})
    cancelled = await db.purchase_orders.count_documents({**query, "status": "cancelled"})
    total = await db.purchase_orders.count_documents(query)
    
    return {
        "pending": pending,
        "partial": partial,
        "received": received,
        "cancelled": cancelled,
        "total": total
    }

# ============ AUTO PO ============

@api_router.get("/auto-pos/suggestions")
async def get_auto_po_suggestions(
    kitchen_id: str = Query(...),
    current_user: dict = Depends(get_current_user)
):
    """Get items below par level for auto PO generation"""
    # Get current stock
    stocks = await db.stock.find({"kitchen_id": kitchen_id}, {"_id": 0}).to_list(10000)
    stock_map = {s["item_id"]: s for s in stocks}
    
    # Get all items
    items = await db.items.find({}, {"_id": 0}).to_list(10000)
    
    suggestions = []
    for item in items:
        stock = stock_map.get(item["id"], {})
        current = stock.get("current_stock", 0)
        par = stock.get("par_stock") or item.get("par_stock") or 0
        
        if par > 0 and current < par:
            deficit = par - current
            suggestions.append({
                "item_id": item["id"],
                "item_name": item["name"],
                "category": item["category"],
                "unit": item["unit"],
                "vendor": item.get("vendor"),
                "current_stock": current,
                "par_stock": par,
                "suggested_qty": deficit,
                "standard_price": item.get("standard_price")
            })
    
    # Group by vendor
    vendor_groups = {}
    for s in suggestions:
        vendor = s.get("vendor") or "Unassigned"
        if vendor not in vendor_groups:
            vendor_groups[vendor] = []
        vendor_groups[vendor].append(s)
    
    return {"suggestions": suggestions, "by_vendor": vendor_groups}

@api_router.post("/auto-pos/generate")
async def generate_auto_pos(
    kitchen_id: str = Query(...),
    vendor_items: Dict[str, List[str]] = None,  # vendor_name: [item_ids]
    current_user: dict = Depends(get_current_user)
):
    """Generate POs from auto PO suggestions"""
    created_pos = []
    
    if not vendor_items:
        return {"message": "No items provided", "pos": []}
    
    kitchen = await db.kitchens.find_one({"id": kitchen_id}, {"_id": 0})
    if not kitchen:
        raise HTTPException(status_code=404, detail="Kitchen not found")
    
    for vendor_name, item_ids in vendor_items.items():
        if not item_ids:
            continue
        
        # Find vendor
        vendor = await db.vendors.find_one({"name": {"$regex": vendor_name, "$options": "i"}}, {"_id": 0})
        if not vendor:
            continue
        
        # Build items
        po_items = []
        total_amount = 0
        
        for item_id in item_ids:
            item = await db.items.find_one({"id": item_id}, {"_id": 0})
            stock = await db.stock.find_one({"item_id": item_id, "kitchen_id": kitchen_id}, {"_id": 0})
            
            if item:
                current = stock.get("current_stock", 0) if stock else 0
                par = (stock.get("par_stock") if stock else None) or item.get("par_stock") or 0
                qty = max(0, par - current)
                price = item.get("standard_price") or 0
                line_total = qty * price
                total_amount += line_total
                
                po_items.append({
                    "item_id": item_id,
                    "item_name": item["name"],
                    "category": item["category"],
                    "unit": item["unit"],
                    "quantity": qty,
                    "unit_price": price,
                    "total": line_total
                })
        
        if po_items:
            count = await db.purchase_orders.count_documents({})
            po_number = f"AUTO-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{count + 1:04d}"
            
            po = {
                "id": str(uuid.uuid4()),
                "po_number": po_number,
                "vendor_id": vendor["id"],
                "vendor_name": vendor["name"],
                "kitchen_id": kitchen_id,
                "kitchen_name": kitchen["name"],
                "items": po_items,
                "total_amount": total_amount,
                "status": "pending",
                "is_dp": False,
                "is_auto": True,
                "created_by": current_user["name"],
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.purchase_orders.insert_one(po)
            created_pos.append(serialize_doc(po))
    
    return {"message": f"Created {len(created_pos)} purchase orders", "pos": created_pos}

# ============ GRN (Goods Receipt Note) ============

@api_router.get("/grns")
async def get_grns(
    po_id: Optional[str] = None,
    vendor_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if po_id:
        query["po_id"] = po_id
    if vendor_id:
        query["vendor_id"] = vendor_id
    
    grns = await db.grns.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return grns

@api_router.post("/grns")
async def create_grn(
    data: GRNCreate,
    current_user: dict = Depends(get_current_user)
):
    # Get PO
    po = await db.purchase_orders.find_one({"id": data.po_id}, {"_id": 0})
    if not po:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    
    # Build items with details
    items_with_details = []
    total_amount = 0
    
    for item in data.items:
        item_doc = await db.items.find_one({"id": item.item_id}, {"_id": 0})
        if item_doc:
            line_total = item.received_qty * item.unit_price
            total_amount += line_total
            items_with_details.append({
                "item_id": item.item_id,
                "item_name": item_doc["name"],
                "category": item_doc["category"],
                "unit": item_doc["unit"],
                "ordered_qty": item.ordered_qty,
                "received_qty": item.received_qty,
                "unit_price": item.unit_price,
                "total": line_total
            })
            
            # Update stock
            await db.stock.update_one(
                {"item_id": item.item_id, "kitchen_id": po["kitchen_id"]},
                {
                    "$inc": {"current_stock": item.received_qty},
                    "$set": {"last_updated": datetime.now(timezone.utc).isoformat()}
                },
                upsert=True
            )
    
    # Generate GRN number
    count = await db.grns.count_documents({})
    grn_number = f"GRN-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{count + 1:04d}"
    
    grn = {
        "id": str(uuid.uuid4()),
        "grn_number": grn_number,
        "po_id": data.po_id,
        "po_number": po["po_number"],
        "vendor_id": po["vendor_id"],
        "vendor_name": po["vendor_name"],
        "kitchen_id": po["kitchen_id"],
        "kitchen_name": po["kitchen_name"],
        "items": items_with_details,
        "total_amount": total_amount,
        "status": "received",
        "notes": data.notes,
        "received_by": current_user["name"],
        "received_by_id": current_user["id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.grns.insert_one(grn)
    
    # Update PO status
    await db.purchase_orders.update_one(
        {"id": data.po_id},
        {"$set": {"status": "received", "grn_id": grn["id"]}}
    )
    
    return serialize_doc(grn)

# ============ ISSUE (Issue items to kitchens) ============

@api_router.get("/issues")
async def get_issues(
    kitchen_id: Optional[str] = None,
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if kitchen_id:
        query["kitchen_id"] = kitchen_id
    if status:
        query["status"] = status
    
    issues = await db.issues.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return issues

@api_router.post("/issues")
async def create_issue(
    data: IssueCreate,
    current_user: dict = Depends(get_current_user)
):
    # Get main store
    main_store = await db.kitchens.find_one({"is_main_store": True}, {"_id": 0})
    if not main_store:
        raise HTTPException(status_code=404, detail="Main store not found")
    
    # Get target kitchen
    kitchen = await db.kitchens.find_one({"id": data.kitchen_id}, {"_id": 0})
    if not kitchen:
        raise HTTPException(status_code=404, detail="Kitchen not found")
    
    # Build items with details
    items_with_details = []
    
    for item in data.items:
        item_doc = await db.items.find_one({"id": item.item_id}, {"_id": 0})
        if item_doc:
            items_with_details.append({
                "item_id": item.item_id,
                "item_name": item_doc["name"],
                "category": item_doc["category"],
                "unit": item_doc["unit"],
                "quantity": item.quantity
            })
            
            # Decrease stock from main store
            await db.stock.update_one(
                {"item_id": item.item_id, "kitchen_id": main_store["id"]},
                {
                    "$inc": {"current_stock": -item.quantity},
                    "$set": {"last_updated": datetime.now(timezone.utc).isoformat()}
                }
            )
            
            # Increase stock at target kitchen
            await db.stock.update_one(
                {"item_id": item.item_id, "kitchen_id": data.kitchen_id},
                {
                    "$inc": {"current_stock": item.quantity},
                    "$set": {"last_updated": datetime.now(timezone.utc).isoformat()}
                },
                upsert=True
            )
    
    # Generate issue number
    count = await db.issues.count_documents({})
    issue_number = f"ISS-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{count + 1:04d}"
    
    issue = {
        "id": str(uuid.uuid4()),
        "issue_number": issue_number,
        "kitchen_id": data.kitchen_id,
        "kitchen_name": kitchen["name"],
        "from_kitchen_id": main_store["id"],
        "from_kitchen_name": main_store["name"],
        "requisition_id": data.requisition_id,
        "items": items_with_details,
        "total_items": len(items_with_details),
        "status": "issued",
        "notes": data.notes,
        "issued_by": current_user["name"],
        "issued_by_id": current_user["id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.issues.insert_one(issue)
    
    # Update requisition status if linked
    if data.requisition_id:
        await db.requisitions.update_one(
            {"id": data.requisition_id},
            {"$set": {"status": "issued", "issue_id": issue["id"]}}
        )
    
    return serialize_doc(issue)

# ============ DAILY PERISHABLES ============

@api_router.get("/daily-perishables")
async def get_daily_perishables(
    date: Optional[str] = None,
    kitchen_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if date:
        query["date"] = date
    else:
        query["date"] = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    if kitchen_id:
        query["kitchen_id"] = kitchen_id
    
    perishables = await db.daily_perishables.find(query, {"_id": 0}).to_list(1000)
    return perishables

@api_router.post("/daily-perishables")
async def create_daily_perishable(
    data: DailyPerishableCreate,
    kitchen_id: str = Query(...),
    current_user: dict = Depends(get_current_user)
):
    item = await db.items.find_one({"id": data.item_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    vendor = None
    if data.vendor_id:
        vendor = await db.vendors.find_one({"id": data.vendor_id}, {"_id": 0})
    
    rate = data.rate or item.get("standard_price") or 0
    total_value = data.quantity * rate
    
    perishable = {
        "id": str(uuid.uuid4()),
        "date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "kitchen_id": kitchen_id,
        "item_id": data.item_id,
        "item_name": item["name"],
        "category": item["category"],
        "unit": item["unit"],
        "quantity": data.quantity,
        "vendor_id": data.vendor_id,
        "vendor_name": vendor["name"] if vendor else None,
        "rate": rate,
        "total_value": total_value,
        "created_by": current_user["name"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.daily_perishables.insert_one(perishable)
    
    # Update stock
    await db.stock.update_one(
        {"item_id": data.item_id, "kitchen_id": kitchen_id},
        {
            "$inc": {"current_stock": data.quantity},
            "$set": {"last_updated": datetime.now(timezone.utc).isoformat()}
        },
        upsert=True
    )
    
    return serialize_doc(perishable)

# ============ ALERTS ============

@api_router.get("/alerts")
async def get_alerts(
    kitchen_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    # Default to main store
    if not kitchen_id:
        main_store = await db.kitchens.find_one({"is_main_store": True}, {"_id": 0})
        kitchen_id = main_store["id"] if main_store else None
    
    alerts = []
    
    # Get items below par level
    stocks = await db.stock.find({"kitchen_id": kitchen_id}, {"_id": 0}).to_list(10000)
    stock_map = {s["item_id"]: s for s in stocks}
    
    items = await db.items.find({}, {"_id": 0}).to_list(10000)
    
    for item in items:
        stock = stock_map.get(item["id"], {})
        current = stock.get("current_stock", 0)
        par = stock.get("par_stock") or item.get("par_stock") or 0
        
        if par > 0:
            deficit_percent = (par - current) / par * 100 if par > 0 else 0
            
            if current <= 0:
                alerts.append({
                    "id": str(uuid.uuid4()),
                    "type": "out_of_stock",
                    "message": f"{item['name']} is out of stock",
                    "item_id": item["id"],
                    "item_name": item["name"],
                    "severity": "critical",
                    "current_stock": current,
                    "par_stock": par,
                    "created_at": datetime.now(timezone.utc).isoformat()
                })
            elif deficit_percent > 50:
                alerts.append({
                    "id": str(uuid.uuid4()),
                    "type": "low_stock",
                    "message": f"{item['name']} is below 50% of par level",
                    "item_id": item["id"],
                    "item_name": item["name"],
                    "severity": "high",
                    "current_stock": current,
                    "par_stock": par,
                    "created_at": datetime.now(timezone.utc).isoformat()
                })
            elif deficit_percent > 20:
                alerts.append({
                    "id": str(uuid.uuid4()),
                    "type": "low_stock",
                    "message": f"{item['name']} is below 80% of par level",
                    "item_id": item["id"],
                    "item_name": item["name"],
                    "severity": "medium",
                    "current_stock": current,
                    "par_stock": par,
                    "created_at": datetime.now(timezone.utc).isoformat()
                })
    
    # Sort by severity
    severity_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    alerts.sort(key=lambda x: severity_order.get(x["severity"], 99))
    
    return alerts

# ============ REPORTS ============

@api_router.get("/reports/vendor-ledger")
async def get_vendor_ledger(
    vendor_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if vendor_id and vendor_id != "all":
        query["vendor_id"] = vendor_id
    
    # Date filter
    if start_date or end_date:
        query["created_at"] = {}
        if start_date:
            query["created_at"]["$gte"] = start_date
        if end_date:
            query["created_at"]["$lte"] = end_date + "T23:59:59"
    
    # Get POs
    pos = await db.purchase_orders.find(query, {"_id": 0}).to_list(10000)
    
    # Get GRNs
    grns = await db.grns.find(query, {"_id": 0}).to_list(10000)
    
    # Aggregate by vendor
    vendors_data = {}
    
    for po in pos:
        vid = po["vendor_id"]
        if vid not in vendors_data:
            vendors_data[vid] = {
                "vendor_id": vid,
                "vendor_name": po["vendor_name"],
                "po_count": 0,
                "po_value": 0,
                "grn_count": 0,
                "grn_value": 0,
                "dp_count": 0,
                "dp_value": 0
            }
        
        if po.get("is_dp"):
            vendors_data[vid]["dp_count"] += 1
            vendors_data[vid]["dp_value"] += po["total_amount"]
        else:
            vendors_data[vid]["po_count"] += 1
            vendors_data[vid]["po_value"] += po["total_amount"]
    
    for grn in grns:
        vid = grn["vendor_id"]
        if vid in vendors_data:
            vendors_data[vid]["grn_count"] += 1
            vendors_data[vid]["grn_value"] += grn["total_amount"]
    
    # Summary stats
    total_vendors = len(vendors_data)
    total_pos = sum(v["po_count"] for v in vendors_data.values())
    total_po_value = sum(v["po_value"] for v in vendors_data.values())
    total_grns = sum(v["grn_count"] for v in vendors_data.values())
    total_grn_value = sum(v["grn_value"] for v in vendors_data.values())
    total_dp = sum(v["dp_count"] for v in vendors_data.values())
    total_dp_value = sum(v["dp_value"] for v in vendors_data.values())
    
    return {
        "summary": {
            "total_vendors": total_vendors,
            "total_pos": total_pos,
            "total_po_value": total_po_value,
            "total_grns": total_grns,
            "total_grn_value": total_grn_value,
            "total_dps": total_dp,
            "total_dp_value": total_dp_value
        },
        "vendors": list(vendors_data.values())
    }

@api_router.get("/reports/kitchen-ledger")
async def get_kitchen_ledger(
    kitchen_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if kitchen_id and kitchen_id != "all":
        query["kitchen_id"] = kitchen_id
    
    # Get requisitions
    requisitions = await db.requisitions.find(query, {"_id": 0}).to_list(10000)
    
    # Get issues
    issues = await db.issues.find(query, {"_id": 0}).to_list(10000)
    
    # Aggregate by kitchen
    kitchens_data = {}
    
    for req in requisitions:
        kid = req["kitchen_id"]
        if kid not in kitchens_data:
            kitchens_data[kid] = {
                "kitchen_id": kid,
                "kitchen_name": req["kitchen_name"],
                "requisition_count": 0,
                "issue_count": 0,
                "total_items_requested": 0,
                "total_items_issued": 0
            }
        kitchens_data[kid]["requisition_count"] += 1
        kitchens_data[kid]["total_items_requested"] += req.get("total_items", 0)
    
    for issue in issues:
        kid = issue["kitchen_id"]
        if kid in kitchens_data:
            kitchens_data[kid]["issue_count"] += 1
            kitchens_data[kid]["total_items_issued"] += issue.get("total_items", 0)
    
    return {
        "kitchens": list(kitchens_data.values())
    }

@api_router.get("/reports/stock-in-hand")
async def get_stock_in_hand(
    kitchen_id: Optional[str] = None,
    category: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    # Default to main store
    if not kitchen_id:
        main_store = await db.kitchens.find_one({"is_main_store": True}, {"_id": 0})
        kitchen_id = main_store["id"] if main_store else None
    
    # Get stock
    stocks = await db.stock.find({"kitchen_id": kitchen_id}, {"_id": 0}).to_list(10000)
    stock_map = {s["item_id"]: s for s in stocks}
    
    # Get items
    item_query = {}
    if category:
        item_query["category"] = category
    items = await db.items.find(item_query, {"_id": 0}).to_list(10000)
    
    result = []
    total_value = 0
    
    for item in items:
        stock = stock_map.get(item["id"], {})
        current = stock.get("current_stock", 0)
        price = item.get("standard_price") or 0
        value = current * price
        total_value += value
        
        if current > 0:
            result.append({
                "item_id": item["id"],
                "item_name": item["name"],
                "category": item["category"],
                "unit": item["unit"],
                "current_stock": current,
                "standard_price": price,
                "stock_value": value
            })
    
    return {
        "total_value": total_value,
        "items": result
    }

@api_router.get("/reports/consumption-analysis")
async def get_consumption_analysis(
    kitchen_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    # Get issues for the period
    query = {}
    if kitchen_id:
        query["kitchen_id"] = kitchen_id
    
    issues = await db.issues.find(query, {"_id": 0}).to_list(10000)
    
    # Aggregate consumption by item
    consumption = {}
    
    for issue in issues:
        for item in issue.get("items", []):
            item_id = item["item_id"]
            if item_id not in consumption:
                consumption[item_id] = {
                    "item_id": item_id,
                    "item_name": item["item_name"],
                    "category": item["category"],
                    "unit": item["unit"],
                    "total_issued": 0,
                    "issue_count": 0
                }
            consumption[item_id]["total_issued"] += item["quantity"]
            consumption[item_id]["issue_count"] += 1
    
    # Sort by total issued
    result = sorted(consumption.values(), key=lambda x: x["total_issued"], reverse=True)
    
    return {"consumption": result}

@api_router.get("/reports/daywise")
async def get_daywise_report(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    # Get daily perishables
    query = {}
    if start_date:
        query["date"] = {"$gte": start_date}
    if end_date:
        if "date" not in query:
            query["date"] = {}
        query["date"]["$lte"] = end_date
    
    perishables = await db.daily_perishables.find(query, {"_id": 0}).to_list(10000)
    
    # Aggregate by date
    by_date = {}
    for p in perishables:
        date = p["date"]
        if date not in by_date:
            by_date[date] = {
                "date": date,
                "total_items": 0,
                "total_value": 0,
                "items": []
            }
        by_date[date]["total_items"] += 1
        by_date[date]["total_value"] += p.get("total_value", 0)
        by_date[date]["items"].append(p)
    
    return {"days": list(by_date.values())}

# ============ DASHBOARD STATS ============

@api_router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    items_count = await db.items.count_documents({})
    vendors_count = await db.vendors.count_documents({})
    kitchens_count = await db.kitchens.count_documents({})
    po_count = await db.purchase_orders.count_documents({})
    pending_po = await db.purchase_orders.count_documents({"status": "pending"})
    grn_count = await db.grns.count_documents({})
    requisition_count = await db.requisitions.count_documents({})
    pending_requisitions = await db.requisitions.count_documents({"status": "pending"})
    
    # Get category distribution
    categories = await db.categories.find({}, {"_id": 0}).to_list(100)
    category_stats = []
    for cat in categories:
        count = await db.items.count_documents({"category": cat["name"]})
        category_stats.append({"name": cat["name"], "count": count})
    
    # Get alerts count
    main_store = await db.kitchens.find_one({"is_main_store": True}, {"_id": 0})
    alerts = await get_alerts(main_store["id"] if main_store else None, current_user)
    critical_alerts = len([a for a in alerts if a["severity"] == "critical"])
    
    return {
        "items_count": items_count,
        "vendors_count": vendors_count,
        "kitchens_count": kitchens_count,
        "purchase_orders_count": po_count,
        "pending_orders": pending_po,
        "grn_count": grn_count,
        "requisition_count": requisition_count,
        "pending_requisitions": pending_requisitions,
        "critical_alerts": critical_alerts,
        "category_stats": category_stats
    }

# Include the router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
