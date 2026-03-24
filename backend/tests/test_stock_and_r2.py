"""
Backend tests for DREAMOVEN Inventory App - Stock Data and R2 Upload
Tests: Current Stock API, Category filtering, R2 upload endpoint, Dashboard stats
"""
import pytest
import requests
import os
import base64

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://atlas-db-deploy.preview.emergentagent.com')

# Test credentials
ADMIN_EMAIL = "parveenkatyal2312@gmail.com"
ADMIN_PASSWORD = "admin@123"
KITCHEN_EMAIL = "srpb@dreamoven.com"
KITCHEN_PASSWORD = "kitchen@123"


class TestHealthAndStatus:
    """Health check and status endpoints"""
    
    def test_api_health(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print(f"API Health: {data}")
    
    def test_r2_storage_status(self):
        """Test R2 storage configuration status"""
        response = requests.get(f"{BASE_URL}/api/upload/status")
        assert response.status_code == 200
        data = response.json()
        assert data["configured"] == True
        assert data["bucket"] == "dreamoven-storage"
        print(f"R2 Status: {data}")


class TestAuthentication:
    """Authentication tests"""
    
    def test_admin_login_success(self):
        """Test admin login with correct credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data["user"]["role"] == "admin"
        print(f"Admin login successful: {data['user']['name']}")
    
    def test_kitchen_login_success(self):
        """Test kitchen login with correct credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": KITCHEN_EMAIL,
            "password": KITCHEN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data["user"]["role"] == "kitchen"
        print(f"Kitchen login successful: {data['user']['name']}")
    
    def test_invalid_password_rejected(self):
        """Test that invalid password is rejected"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": "wrongpassword"
        })
        assert response.status_code == 401


class TestDashboardStats:
    """Dashboard statistics tests"""
    
    def test_dashboard_stats(self):
        """Test dashboard stats endpoint returns expected data"""
        response = requests.get(f"{BASE_URL}/api/dashboard/stats")
        assert response.status_code == 200
        data = response.json()
        
        # Verify expected fields
        assert "total_items" in data
        assert "total_lots" in data
        assert "total_locations" in data
        
        # Verify expected values (from main agent context)
        assert data["total_items"] >= 1300, f"Expected ~1353 items, got {data['total_items']}"
        assert data["total_lots"] >= 400, f"Expected ~446 lots, got {data['total_lots']}"
        assert data["total_locations"] == 15, f"Expected 15 locations, got {data['total_locations']}"
        
        print(f"Dashboard stats: items={data['total_items']}, lots={data['total_lots']}, locations={data['total_locations']}")


class TestCurrentStock:
    """Current Stock API tests - verifying stock data fix"""
    
    def test_current_stock_returns_data(self):
        """Test current stock endpoint returns data"""
        response = requests.get(f"{BASE_URL}/api/stock/current?include_perishables=true")
        assert response.status_code == 200
        data = response.json()
        assert len(data) > 0, "Expected stock data to be returned"
        print(f"Total items in stock: {len(data)}")
    
    def test_bakery_category_has_stock(self):
        """Test Bakery category has stock > 0 (was showing 0 before fix)"""
        response = requests.get(f"{BASE_URL}/api/stock/current?include_perishables=true")
        assert response.status_code == 200
        data = response.json()
        
        bakery_items = [item for item in data if item.get("category") == "Bakery"]
        bakery_stock = sum(item.get("current_stock", 0) for item in bakery_items)
        
        assert len(bakery_items) > 0, "Expected Bakery items to exist"
        assert bakery_stock > 0, f"Expected Bakery stock > 0, got {bakery_stock}"
        print(f"Bakery: {len(bakery_items)} items, total stock: {bakery_stock}")
    
    def test_indian_grocery_category_has_stock(self):
        """Test Indian Grocery category has stock > 0 (was showing 0 before fix)"""
        response = requests.get(f"{BASE_URL}/api/stock/current?include_perishables=true")
        assert response.status_code == 200
        data = response.json()
        
        indian_grocery_items = [item for item in data if item.get("category") == "Indian Grocery"]
        indian_grocery_stock = sum(item.get("current_stock", 0) for item in indian_grocery_items)
        
        assert len(indian_grocery_items) > 0, "Expected Indian Grocery items to exist"
        assert indian_grocery_stock > 0, f"Expected Indian Grocery stock > 0, got {indian_grocery_stock}"
        print(f"Indian Grocery: {len(indian_grocery_items)} items, total stock: {indian_grocery_stock}")
    
    def test_seafood_category_has_stock(self):
        """Test Seafood category has stock > 0 (was showing 0 before fix)"""
        response = requests.get(f"{BASE_URL}/api/stock/current?include_perishables=true")
        assert response.status_code == 200
        data = response.json()
        
        seafood_items = [item for item in data if item.get("category") == "Seafood"]
        seafood_stock = sum(item.get("current_stock", 0) for item in seafood_items)
        
        assert len(seafood_items) > 0, "Expected Seafood items to exist"
        assert seafood_stock > 0, f"Expected Seafood stock > 0, got {seafood_stock}"
        print(f"Seafood: {len(seafood_items)} items, total stock: {seafood_stock}")
    
    def test_beverage_category_has_stock(self):
        """Test Beverage category has stock > 0"""
        response = requests.get(f"{BASE_URL}/api/stock/current?include_perishables=true")
        assert response.status_code == 200
        data = response.json()
        
        beverage_items = [item for item in data if item.get("category") == "Beverage"]
        beverage_stock = sum(item.get("current_stock", 0) for item in beverage_items)
        
        assert len(beverage_items) > 0, "Expected Beverage items to exist"
        assert beverage_stock > 0, f"Expected Beverage stock > 0, got {beverage_stock}"
        print(f"Beverage: {len(beverage_items)} items, total stock: {beverage_stock}")
    
    def test_category_filter_works(self):
        """Test category filter on current stock endpoint"""
        response = requests.get(f"{BASE_URL}/api/stock/current?category=Bakery")
        assert response.status_code == 200
        data = response.json()
        
        # All items should be Bakery category
        for item in data:
            assert item.get("category") == "Bakery", f"Expected Bakery, got {item.get('category')}"
        print(f"Category filter test passed: {len(data)} Bakery items returned")


class TestR2Upload:
    """R2 upload endpoint tests"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Admin authentication failed")
    
    def test_r2_upload_endpoint_exists(self, admin_token):
        """Test R2 upload endpoint is accessible"""
        # Create a small test image (1x1 red pixel PNG)
        test_image_base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg=="
        
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Test the endpoint with form data
        response = requests.post(
            f"{BASE_URL}/api/upload/base64",
            headers=headers,
            data={
                "image_data": test_image_base64,
                "folder": "test-uploads"
            }
        )
        
        # Should return 200 with URL or 503 if R2 not configured
        assert response.status_code in [200, 503], f"Unexpected status: {response.status_code}"
        
        if response.status_code == 200:
            data = response.json()
            assert "url" in data
            assert "key" in data
            print(f"R2 upload successful: {data['url']}")
        else:
            print("R2 upload endpoint exists but storage not configured")


class TestGRNPage:
    """GRN page related API tests"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Admin authentication failed")
    
    def test_vendors_list(self):
        """Test vendors list endpoint"""
        response = requests.get(f"{BASE_URL}/api/vendors")
        assert response.status_code == 200
        data = response.json()
        assert len(data) > 0, "Expected vendors to exist"
        print(f"Vendors count: {len(data)}")
    
    def test_purchase_orders_list(self, admin_token):
        """Test purchase orders list endpoint (requires auth)"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/purchase-orders?limit=10", headers=headers)
        assert response.status_code == 200
        data = response.json()
        # Can be empty or have data
        print(f"Purchase orders response: {type(data)}")
    
    def test_grn_list(self):
        """Test GRN list endpoint"""
        response = requests.get(f"{BASE_URL}/api/grn")
        assert response.status_code == 200
        data = response.json()
        print(f"GRN list count: {len(data)}")


class TestCategories:
    """Categories API tests"""
    
    def test_categories_list(self):
        """Test categories list endpoint"""
        response = requests.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200
        data = response.json()
        assert len(data) > 0, "Expected categories to exist"
        
        category_names = [c.get("name") for c in data]
        print(f"Categories: {category_names}")
        
        # Verify key categories exist
        assert "Bakery" in category_names, "Bakery category should exist"
        assert "Indian Grocery" in category_names, "Indian Grocery category should exist"
        assert "Seafood" in category_names, "Seafood category should exist"
        assert "Beverage" in category_names, "Beverage category should exist"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
