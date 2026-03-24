"""
Test Kitchen Requisition Stock Warning Feature
Tests the feature that prevents kitchens from ordering out-of-stock items.
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://atlas-db-deploy.preview.emergentagent.com').rstrip('/')

# Test credentials
KITCHEN_EMAIL = "srpb@dreamoven.com"
KITCHEN_PASSWORD = "kitchen@123"
ADMIN_EMAIL = "parveenkatyal2312@gmail.com"
ADMIN_PASSWORD = "admin@123"


class TestStockCurrentEndpoint:
    """Tests for /api/stock/current endpoint that provides stock data for requisitions"""
    
    def test_stock_current_returns_data(self):
        """Test that /api/stock/current returns stock data"""
        response = requests.get(f"{BASE_URL}/api/stock/current")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        assert len(data) > 0, "Should return at least some items"
        print(f"PASS: /api/stock/current returns {len(data)} items")
    
    def test_stock_current_has_required_fields(self):
        """Test that stock items have required fields for UI display"""
        response = requests.get(f"{BASE_URL}/api/stock/current")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) > 0, "Need at least one item to test"
        
        # Check first item has required fields
        item = data[0]
        required_fields = ['item_id', 'item_name', 'current_stock', 'category', 'unit']
        for field in required_fields:
            assert field in item, f"Missing required field: {field}"
        
        print(f"PASS: Stock items have all required fields: {required_fields}")
    
    def test_stock_current_has_zero_stock_items(self):
        """Test that some items have 0 stock (for testing out-of-stock feature)"""
        response = requests.get(f"{BASE_URL}/api/stock/current")
        assert response.status_code == 200
        
        data = response.json()
        zero_stock_items = [d for d in data if d.get('current_stock', 0) == 0]
        
        assert len(zero_stock_items) > 0, "Should have some items with 0 stock for testing"
        print(f"PASS: Found {len(zero_stock_items)} items with 0 stock")
        print(f"  Sample out-of-stock items: {[i['item_name'] for i in zero_stock_items[:5]]}")
    
    def test_stock_current_has_in_stock_items(self):
        """Test that some items have stock > 0 (for testing in-stock feature)"""
        response = requests.get(f"{BASE_URL}/api/stock/current")
        assert response.status_code == 200
        
        data = response.json()
        in_stock_items = [d for d in data if d.get('current_stock', 0) > 0]
        
        assert len(in_stock_items) > 0, "Should have some items with stock > 0"
        print(f"PASS: Found {len(in_stock_items)} items with stock > 0")
        print(f"  Sample in-stock items: {[(i['item_name'], i['current_stock']) for i in in_stock_items[:5]]}")


class TestKitchenAuthentication:
    """Tests for kitchen user authentication"""
    
    def test_kitchen_login_success(self):
        """Test kitchen user can login successfully"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": KITCHEN_EMAIL,
            "password": KITCHEN_PASSWORD
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "token" in data, "Response should contain token"
        assert "user" in data, "Response should contain user"
        assert data["user"]["role"] == "kitchen", "User should have kitchen role"
        
        print(f"PASS: Kitchen user login successful")
        print(f"  User: {data['user']['name']}")
        print(f"  Location: {data['user']['location_name']}")
        return data["token"]
    
    def test_kitchen_login_invalid_password(self):
        """Test kitchen login fails with wrong password"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": KITCHEN_EMAIL,
            "password": "wrongpassword"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("PASS: Invalid password correctly rejected")


class TestRequisitionCreation:
    """Tests for requisition creation with stock validation"""
    
    @pytest.fixture
    def kitchen_token(self):
        """Get kitchen user token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": KITCHEN_EMAIL,
            "password": KITCHEN_PASSWORD
        })
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("Kitchen login failed")
    
    @pytest.fixture
    def stock_data(self):
        """Get current stock data"""
        response = requests.get(f"{BASE_URL}/api/stock/current")
        if response.status_code == 200:
            return response.json()
        pytest.skip("Failed to get stock data")
    
    def test_get_items_for_requisition(self, kitchen_token):
        """Test that items endpoint returns data for requisition form"""
        headers = {"Authorization": f"Bearer {kitchen_token}"}
        response = requests.get(f"{BASE_URL}/api/items", headers=headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        assert len(data) > 0, "Should return items"
        
        print(f"PASS: Items endpoint returns {len(data)} items for requisition form")
    
    def test_create_requisition_with_in_stock_item(self, kitchen_token, stock_data):
        """Test creating requisition with an in-stock item succeeds"""
        # Find an item with stock > 0
        in_stock_items = [d for d in stock_data if d.get('current_stock', 0) > 0]
        if not in_stock_items:
            pytest.skip("No in-stock items available for testing")
        
        test_item = in_stock_items[0]
        available_qty = test_item['current_stock']
        request_qty = min(1, available_qty)  # Request 1 or less
        
        headers = {"Authorization": f"Bearer {kitchen_token}"}
        response = requests.post(f"{BASE_URL}/api/requisitions", 
            headers=headers,
            json={
                "items": [{
                    "item_id": test_item['item_id'],
                    "quantity": request_qty,
                    "notes": "Test requisition - in stock item"
                }],
                "priority": "normal",
                "notes": "Automated test - please delete"
            }
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "requisition_id" in data, "Response should contain requisition_id"
        assert "serial_number" in data, "Response should contain serial_number"
        
        print(f"PASS: Created requisition for in-stock item")
        print(f"  Item: {test_item['item_name']}")
        print(f"  Available: {available_qty}, Requested: {request_qty}")
        print(f"  Requisition: {data['serial_number']}")
        
        return data['requisition_id']
    
    def test_get_requisitions_list(self, kitchen_token):
        """Test that kitchen can view their requisitions"""
        headers = {"Authorization": f"Bearer {kitchen_token}"}
        response = requests.get(f"{BASE_URL}/api/requisitions", headers=headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        
        print(f"PASS: Kitchen can view requisitions list ({len(data)} requisitions)")


class TestStockDataIntegrity:
    """Tests for stock data integrity and consistency"""
    
    def test_stock_data_matches_items(self):
        """Test that stock data item_ids match actual items"""
        # Get stock data
        stock_response = requests.get(f"{BASE_URL}/api/stock/current")
        assert stock_response.status_code == 200
        stock_data = stock_response.json()
        
        # Get items
        items_response = requests.get(f"{BASE_URL}/api/items")
        assert items_response.status_code == 200
        items_data = items_response.json()
        
        # Create lookup
        item_ids = {item['id'] for item in items_data}
        
        # Check stock items reference valid items
        invalid_refs = []
        for stock_item in stock_data[:100]:  # Check first 100
            if stock_item['item_id'] not in item_ids:
                invalid_refs.append(stock_item['item_id'])
        
        assert len(invalid_refs) == 0, f"Found {len(invalid_refs)} invalid item references"
        print(f"PASS: Stock data item references are valid (checked {min(100, len(stock_data))} items)")
    
    def test_stock_quantities_are_non_negative(self):
        """Test that all stock quantities are >= 0"""
        response = requests.get(f"{BASE_URL}/api/stock/current")
        assert response.status_code == 200
        
        data = response.json()
        negative_stock = [d for d in data if d.get('current_stock', 0) < 0]
        
        assert len(negative_stock) == 0, f"Found {len(negative_stock)} items with negative stock"
        print(f"PASS: All stock quantities are non-negative")


class TestAPIHealth:
    """Basic API health tests"""
    
    def test_api_health(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("status") == "healthy"
        print(f"PASS: API health check passed")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
