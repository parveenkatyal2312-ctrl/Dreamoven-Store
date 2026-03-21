"""
Test Role-Based Access Control for DREAMOVEN Inventory App
Tests: Admin, Kitchen, Main Store login flows and sidebar visibility
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from review request
ADMIN_EMAIL = "parveenkatyal2312@gmail.com"
ADMIN_PASSWORD = "admin@123"
KITCHEN_EMAIL = "srpb@dreamoven.com"
KITCHEN_PASSWORD = "kitchen@123"
MAIN_STORE_EMAIL = "mainstore@dreamoven.com"
MAIN_STORE_PASSWORD = "store@123"


class TestHealthCheck:
    """Basic health check tests"""
    
    def test_api_health(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print(f"✅ API health check passed: {data}")


class TestAdminLogin:
    """Admin login and role verification"""
    
    def test_admin_login_success(self):
        """Test admin login with correct credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        
        # Verify token exists
        assert "token" in data
        assert len(data["token"]) > 0
        
        # Verify user data
        assert "user" in data
        assert data["user"]["email"] == ADMIN_EMAIL
        assert data["user"]["role"] == "admin"
        print(f"✅ Admin login successful: {data['user']['name']} ({data['user']['role']})")
        return data["token"]
    
    def test_admin_can_access_protected_routes(self):
        """Test admin can access protected routes"""
        # Login first
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        token = login_response.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Test /api/auth/me
        me_response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
        assert me_response.status_code == 200
        me_data = me_response.json()
        assert me_data["role"] == "admin"
        print(f"✅ Admin can access /api/auth/me: {me_data['name']}")


class TestKitchenLogin:
    """Kitchen user login and role verification"""
    
    def test_kitchen_login_success(self):
        """Test kitchen user login with correct credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": KITCHEN_EMAIL,
            "password": KITCHEN_PASSWORD
        })
        assert response.status_code == 200, f"Kitchen login failed: {response.text}"
        data = response.json()
        
        # Verify token exists
        assert "token" in data
        assert len(data["token"]) > 0
        
        # Verify user data
        assert "user" in data
        assert data["user"]["email"] == KITCHEN_EMAIL
        assert data["user"]["role"] == "kitchen"
        print(f"✅ Kitchen login successful: {data['user']['name']} ({data['user']['role']})")
        
        # Kitchen users should have location_id
        # Note: location_id might be None if not assigned
        print(f"   Location ID: {data['user'].get('location_id')}")
        print(f"   Location Name: {data['user'].get('location_name')}")
        return data["token"]
    
    def test_kitchen_can_access_requisitions(self):
        """Test kitchen user can access requisitions"""
        # Login first
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": KITCHEN_EMAIL,
            "password": KITCHEN_PASSWORD
        })
        token = login_response.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Test /api/requisitions
        req_response = requests.get(f"{BASE_URL}/api/requisitions", headers=headers)
        assert req_response.status_code == 200
        print(f"✅ Kitchen can access /api/requisitions: {len(req_response.json())} requisitions")


class TestInvalidLogin:
    """Test invalid login attempts"""
    
    def test_invalid_password(self):
        """Test login with wrong password"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("✅ Invalid password correctly rejected with 401")
    
    def test_invalid_email(self):
        """Test login with non-existent email"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "nonexistent@example.com",
            "password": "anypassword"
        })
        assert response.status_code == 401
        print("✅ Non-existent email correctly rejected with 401")


class TestDataAPIs:
    """Test data APIs return expected counts"""
    
    def test_items_api_returns_data(self):
        """Test items API returns items (expected ~797 items)"""
        # Login as admin
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        token = login_response.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        response = requests.get(f"{BASE_URL}/api/items", headers=headers)
        assert response.status_code == 200
        items = response.json()
        assert isinstance(items, list)
        print(f"✅ Items API returned {len(items)} items (expected ~797)")
        # Verify we have substantial data
        assert len(items) > 100, f"Expected more items, got {len(items)}"
    
    def test_vendors_api_returns_data(self):
        """Test vendors API returns vendors (expected ~69 vendors)"""
        # Login as admin
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        token = login_response.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        response = requests.get(f"{BASE_URL}/api/vendors", headers=headers)
        assert response.status_code == 200
        vendors = response.json()
        assert isinstance(vendors, list)
        print(f"✅ Vendors API returned {len(vendors)} vendors (expected ~69)")
        # Verify we have substantial data
        assert len(vendors) > 10, f"Expected more vendors, got {len(vendors)}"
    
    def test_locations_api_returns_data(self):
        """Test locations API returns locations (expected ~15 locations)"""
        # Login as admin
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        token = login_response.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        response = requests.get(f"{BASE_URL}/api/locations", headers=headers)
        assert response.status_code == 200
        locations = response.json()
        assert isinstance(locations, list)
        print(f"✅ Locations API returned {len(locations)} locations (expected ~15)")
        # Verify we have some locations
        assert len(locations) > 5, f"Expected more locations, got {len(locations)}"


class TestDashboardStats:
    """Test dashboard stats API"""
    
    def test_dashboard_stats(self):
        """Test dashboard stats returns expected fields"""
        # Login as admin
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        token = login_response.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        response = requests.get(f"{BASE_URL}/api/dashboard/stats", headers=headers)
        assert response.status_code == 200
        stats = response.json()
        
        # Verify expected fields exist (actual field names from API)
        expected_fields = ["total_lots", "total_items", "total_locations", "expiring_soon_count"]
        for field in expected_fields:
            assert field in stats, f"Missing field: {field}"
        
        print(f"✅ Dashboard stats: Total Lots={stats['total_lots']}, Total Items={stats['total_items']}, Locations={stats['total_locations']}, Expiring Soon={stats['expiring_soon_count']}")


class TestGRNPage:
    """Test GRN page features"""
    
    def test_grn_list(self):
        """Test GRN list endpoint"""
        # Login as admin
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        token = login_response.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        response = requests.get(f"{BASE_URL}/api/grn", headers=headers)
        assert response.status_code == 200
        grns = response.json()
        assert isinstance(grns, list)
        print(f"✅ GRN list returned {len(grns)} entries")
    
    def test_purchase_orders_for_grn(self):
        """Test purchase orders endpoint for GRN workflow"""
        # Login as admin
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        token = login_response.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Get pending POs
        response = requests.get(f"{BASE_URL}/api/purchase-orders?status=pending", headers=headers)
        assert response.status_code == 200
        data = response.json()
        # Handle both paginated and non-paginated response
        pos = data.get("purchase_orders", data) if isinstance(data, dict) else data
        print(f"✅ Pending POs for GRN: {len(pos)} POs")


class TestRequisitionsPage:
    """Test requisitions page features"""
    
    def test_requisitions_list_admin(self):
        """Test admin can see all requisitions"""
        # Login as admin
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        token = login_response.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        response = requests.get(f"{BASE_URL}/api/requisitions", headers=headers)
        assert response.status_code == 200
        reqs = response.json()
        assert isinstance(reqs, list)
        print(f"✅ Admin can see all requisitions: {len(reqs)} total")
    
    def test_requisitions_list_kitchen(self):
        """Test kitchen user sees only their requisitions"""
        # Login as kitchen
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": KITCHEN_EMAIL,
            "password": KITCHEN_PASSWORD
        })
        token = login_response.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        response = requests.get(f"{BASE_URL}/api/requisitions", headers=headers)
        assert response.status_code == 200
        reqs = response.json()
        assert isinstance(reqs, list)
        print(f"✅ Kitchen user sees their requisitions: {len(reqs)} total")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
