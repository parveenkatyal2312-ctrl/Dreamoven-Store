from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Any
import uuid
from datetime import datetime, timezone, timedelta
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

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
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

class StockEntry(BaseModel):
    item_id: str
    kitchen_id: str
    quantity: float
    unit: str

class StockResponse(BaseModel):
    id: str
    item_id: str
    item_name: str
    kitchen_id: str
    kitchen_name: str
    quantity: float
    unit: str
    last_updated: datetime

class PurchaseOrderCreate(BaseModel):
    vendor_id: str
    kitchen_id: str
    items: List[dict]  # [{item_id, quantity, unit_price}]
    notes: Optional[str] = None

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
    notes: Optional[str] = None
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

# ============ ROUTES ============

# Health Check
@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "service": "dreamoven-inventory-backend", "version": "v1.0"}

# Authentication
@api_router.post("/auth/login", response_model=TokenResponse)
async def login(data: UserLogin):
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not user or not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_token(user["id"], user["email"], user["role"])
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            name=user["name"],
            role=user["role"],
            created_at=datetime.fromisoformat(user["created_at"]) if isinstance(user["created_at"], str) else user["created_at"]
        )
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user["id"],
        email=current_user["email"],
        name=current_user["name"],
        role=current_user["role"],
        created_at=datetime.fromisoformat(current_user["created_at"]) if isinstance(current_user["created_at"], str) else current_user["created_at"]
    )

# Kitchens/Stores
@api_router.get("/kitchens", response_model=List[KitchenResponse])
async def get_kitchens():
    kitchens = await db.kitchens.find({}, {"_id": 0}).to_list(1000)
    result = []
    for k in kitchens:
        k["created_at"] = datetime.fromisoformat(k["created_at"]) if isinstance(k["created_at"], str) else k["created_at"]
        result.append(KitchenResponse(**k))
    return result

@api_router.post("/kitchens", response_model=KitchenResponse)
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
    kitchen["created_at"] = datetime.fromisoformat(kitchen["created_at"])
    return KitchenResponse(**serialize_doc(kitchen))

@api_router.put("/kitchens/{kitchen_id}", response_model=KitchenResponse)
async def update_kitchen(kitchen_id: str, data: KitchenCreate, current_user: dict = Depends(get_current_user)):
    result = await db.kitchens.find_one_and_update(
        {"id": kitchen_id},
        {"$set": {"name": data.name, "code": data.code, "address": data.address, "is_main_store": data.is_main_store}},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Kitchen not found")
    result["created_at"] = datetime.fromisoformat(result["created_at"]) if isinstance(result["created_at"], str) else result["created_at"]
    return KitchenResponse(**serialize_doc(result))

@api_router.delete("/kitchens/{kitchen_id}")
async def delete_kitchen(kitchen_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.kitchens.delete_one({"id": kitchen_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Kitchen not found")
    return {"message": "Kitchen deleted"}

# Categories
@api_router.get("/categories", response_model=List[CategoryResponse])
async def get_categories():
    categories = await db.categories.find({}, {"_id": 0}).to_list(1000)
    result = []
    for c in categories:
        c["created_at"] = datetime.fromisoformat(c["created_at"]) if isinstance(c["created_at"], str) else c["created_at"]
        result.append(CategoryResponse(**c))
    return result

@api_router.post("/categories", response_model=CategoryResponse)
async def create_category(data: CategoryCreate, current_user: dict = Depends(get_current_user)):
    category = {
        "id": str(uuid.uuid4()),
        "name": data.name,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.categories.insert_one(category)
    category["created_at"] = datetime.fromisoformat(category["created_at"])
    return CategoryResponse(**serialize_doc(category))

# Vendors
@api_router.get("/vendors", response_model=List[VendorResponse])
async def get_vendors():
    vendors = await db.vendors.find({}, {"_id": 0}).to_list(1000)
    result = []
    for v in vendors:
        v["created_at"] = datetime.fromisoformat(v["created_at"]) if isinstance(v["created_at"], str) else v["created_at"]
        result.append(VendorResponse(**v))
    return result

@api_router.post("/vendors", response_model=VendorResponse)
async def create_vendor(data: VendorCreate, current_user: dict = Depends(get_current_user)):
    vendor = {
        "id": str(uuid.uuid4()),
        **data.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.vendors.insert_one(vendor)
    vendor["created_at"] = datetime.fromisoformat(vendor["created_at"])
    return VendorResponse(**serialize_doc(vendor))

@api_router.put("/vendors/{vendor_id}", response_model=VendorResponse)
async def update_vendor(vendor_id: str, data: VendorCreate, current_user: dict = Depends(get_current_user)):
    result = await db.vendors.find_one_and_update(
        {"id": vendor_id},
        {"$set": data.model_dump()},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Vendor not found")
    result["created_at"] = datetime.fromisoformat(result["created_at"]) if isinstance(result["created_at"], str) else result["created_at"]
    return VendorResponse(**serialize_doc(result))

@api_router.delete("/vendors/{vendor_id}")
async def delete_vendor(vendor_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.vendors.delete_one({"id": vendor_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return {"message": "Vendor deleted"}

# Items
@api_router.get("/items", response_model=List[ItemResponse])
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
    result = []
    for item in items:
        item["created_at"] = datetime.fromisoformat(item["created_at"]) if isinstance(item["created_at"], str) else item["created_at"]
        result.append(ItemResponse(**item))
    return result

@api_router.get("/items/count")
async def get_items_count():
    count = await db.items.count_documents({})
    return {"count": count}

@api_router.post("/items", response_model=ItemResponse)
async def create_item(data: ItemCreate, current_user: dict = Depends(get_current_user)):
    item = {
        "id": str(uuid.uuid4()),
        **data.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.items.insert_one(item)
    item["created_at"] = datetime.fromisoformat(item["created_at"])
    return ItemResponse(**serialize_doc(item))

@api_router.put("/items/{item_id}", response_model=ItemResponse)
async def update_item(item_id: str, data: ItemCreate, current_user: dict = Depends(get_current_user)):
    result = await db.items.find_one_and_update(
        {"id": item_id},
        {"$set": data.model_dump()},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Item not found")
    result["created_at"] = datetime.fromisoformat(result["created_at"]) if isinstance(result["created_at"], str) else result["created_at"]
    return ItemResponse(**serialize_doc(result))

@api_router.delete("/items/{item_id}")
async def delete_item(item_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.items.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"message": "Item deleted"}

# Stock Management
@api_router.get("/stock", response_model=List[StockResponse])
async def get_stock(kitchen_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {}
    if kitchen_id:
        query["kitchen_id"] = kitchen_id
    
    stocks = await db.stock.find(query, {"_id": 0}).to_list(10000)
    result = []
    for s in stocks:
        s["last_updated"] = datetime.fromisoformat(s["last_updated"]) if isinstance(s["last_updated"], str) else s["last_updated"]
        result.append(StockResponse(**s))
    return result

@api_router.post("/stock", response_model=StockResponse)
async def update_stock(data: StockEntry, current_user: dict = Depends(get_current_user)):
    # Get item and kitchen names
    item = await db.items.find_one({"id": data.item_id}, {"_id": 0})
    kitchen = await db.kitchens.find_one({"id": data.kitchen_id}, {"_id": 0})
    
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if not kitchen:
        raise HTTPException(status_code=404, detail="Kitchen not found")
    
    stock_doc = {
        "id": str(uuid.uuid4()),
        "item_id": data.item_id,
        "item_name": item["name"],
        "kitchen_id": data.kitchen_id,
        "kitchen_name": kitchen["name"],
        "quantity": data.quantity,
        "unit": data.unit,
        "last_updated": datetime.now(timezone.utc).isoformat()
    }
    
    # Upsert stock entry
    await db.stock.update_one(
        {"item_id": data.item_id, "kitchen_id": data.kitchen_id},
        {"$set": stock_doc},
        upsert=True
    )
    
    stock_doc["last_updated"] = datetime.fromisoformat(stock_doc["last_updated"])
    return StockResponse(**stock_doc)

# Purchase Orders
@api_router.get("/purchase-orders", response_model=List[PurchaseOrderResponse])
async def get_purchase_orders(
    status: Optional[str] = None,
    kitchen_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if status:
        query["status"] = status
    if kitchen_id:
        query["kitchen_id"] = kitchen_id
    
    pos = await db.purchase_orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    result = []
    for po in pos:
        po["created_at"] = datetime.fromisoformat(po["created_at"]) if isinstance(po["created_at"], str) else po["created_at"]
        result.append(PurchaseOrderResponse(**po))
    return result

@api_router.post("/purchase-orders", response_model=PurchaseOrderResponse)
async def create_purchase_order(data: PurchaseOrderCreate, current_user: dict = Depends(get_current_user)):
    # Get vendor and kitchen
    vendor = await db.vendors.find_one({"id": data.vendor_id}, {"_id": 0})
    kitchen = await db.kitchens.find_one({"id": data.kitchen_id}, {"_id": 0})
    
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    if not kitchen:
        raise HTTPException(status_code=404, detail="Kitchen not found")
    
    # Calculate total
    total_amount = sum(item.get("quantity", 0) * item.get("unit_price", 0) for item in data.items)
    
    # Generate PO number
    count = await db.purchase_orders.count_documents({})
    po_number = f"PO-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{count + 1:04d}"
    
    po = {
        "id": str(uuid.uuid4()),
        "po_number": po_number,
        "vendor_id": data.vendor_id,
        "vendor_name": vendor["name"],
        "kitchen_id": data.kitchen_id,
        "kitchen_name": kitchen["name"],
        "items": data.items,
        "total_amount": total_amount,
        "status": "pending",
        "notes": data.notes,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.purchase_orders.insert_one(po)
    po["created_at"] = datetime.fromisoformat(po["created_at"])
    return PurchaseOrderResponse(**serialize_doc(po))

@api_router.put("/purchase-orders/{po_id}/status")
async def update_po_status(po_id: str, status: str = Query(...), current_user: dict = Depends(get_current_user)):
    if status not in ["pending", "approved", "received", "cancelled"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    result = await db.purchase_orders.update_one(
        {"id": po_id},
        {"$set": {"status": status}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    return {"message": f"Status updated to {status}"}

# Dashboard Stats
@api_router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    items_count = await db.items.count_documents({})
    vendors_count = await db.vendors.count_documents({})
    kitchens_count = await db.kitchens.count_documents({})
    po_count = await db.purchase_orders.count_documents({})
    pending_po = await db.purchase_orders.count_documents({"status": "pending"})
    
    # Get category distribution
    categories = await db.categories.find({}, {"_id": 0}).to_list(100)
    category_stats = []
    for cat in categories:
        count = await db.items.count_documents({"category": cat["name"]})
        category_stats.append({"name": cat["name"], "count": count})
    
    return {
        "items_count": items_count,
        "vendors_count": vendors_count,
        "kitchens_count": kitchens_count,
        "purchase_orders_count": po_count,
        "pending_orders": pending_po,
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
