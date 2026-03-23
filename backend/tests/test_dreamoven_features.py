"""
DREAMOVEN Inventory Management System - Feature Tests
Tests for: Purchase Orders, Current Stock, Reports, GRN integration
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://stock-management-app-3.preview.emergentagent.com').rstrip('/')

# Test credentials
ADMIN_EMAIL = "parveenkatyal2312@gmail.com"
ADMIN_PASSWORD = "admin@123"


class TestAuthentication:
    """Authentication tests"""
    
    def test_health_check(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print("✓ Health check passed")
    
    def test_admin_login(self):
        """Test admin login with correct credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["role"] == "admin"
        print(f"✓ Admin login successful: {data['user']['name']}")
        return data["access_token"]
    
    def test_invalid_login(self):
        """Test login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "invalid@test.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("✓ Invalid login correctly rejected")


@pytest.fixture
def auth_token():
    """Get authentication token for tests"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    if response.status_code == 200:
        return response.json()["access_token"]
    pytest.skip("Authentication failed")


@pytest.fixture
def auth_headers(auth_token):
    """Get headers with auth token"""
    return {"Authorization": f"Bearer {auth_token}"}


class TestPurchaseOrders:
    """Purchase Orders feature tests - status filters, stats, delete functionality"""
    
    def test_get_purchase_orders(self, auth_headers):
        """Test GET /purchase-orders returns list"""
        response = requests.get(f"{BASE_URL}/api/purchase-orders", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Got {len(data)} purchase orders")
    
    def test_get_purchase_orders_stats_summary(self, auth_headers):
        """Test GET /purchase-orders/stats/summary returns status counts"""
        response = requests.get(f"{BASE_URL}/api/purchase-orders/stats/summary", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        # Verify all required status counts are present
        assert "pending" in data
        assert "partial" in data
        assert "received" in data
        assert "cancelled" in data
        assert "total" in data
        
        # Verify counts are integers
        assert isinstance(data["pending"], int)
        assert isinstance(data["partial"], int)
        assert isinstance(data["received"], int)
        
        print(f"✓ PO Stats: Pending={data['pending']}, Partial={data['partial']}, Received={data['received']}, Total={data['total']}")
    
    def test_get_purchase_orders_by_status_pending(self, auth_headers):
        """Test filtering POs by pending status"""
        response = requests.get(f"{BASE_URL}/api/purchase-orders?status=pending", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        # All returned POs should have pending status
        for po in data:
            assert po["status"] == "pending"
        print(f"✓ Got {len(data)} pending POs")
    
    def test_get_purchase_orders_by_status_received(self, auth_headers):
        """Test filtering POs by received status"""
        response = requests.get(f"{BASE_URL}/api/purchase-orders?status=received", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        for po in data:
            assert po["status"] == "received"
        print(f"✓ Got {len(data)} received POs")
    
    def test_get_single_purchase_order(self, auth_headers):
        """Test GET /purchase-orders/{id} returns PO details"""
        # First get list of POs
        response = requests.get(f"{BASE_URL}/api/purchase-orders", headers=auth_headers)
        pos = response.json()
        
        if len(pos) > 0:
            po_id = pos[0]["id"]
            response = requests.get(f"{BASE_URL}/api/purchase-orders/{po_id}", headers=auth_headers)
            assert response.status_code == 200
            data = response.json()
            assert data["id"] == po_id
            assert "po_number" in data
            assert "vendor_name" in data
            assert "items" in data
            print(f"✓ Got PO details: {data['po_number']}")
        else:
            print("⚠ No POs to test single fetch")
    
    def test_delete_received_po_should_fail(self, auth_headers):
        """Test that deleting a received PO fails"""
        # Get received POs
        response = requests.get(f"{BASE_URL}/api/purchase-orders?status=received", headers=auth_headers)
        received_pos = response.json()
        
        if len(received_pos) > 0:
            po_id = received_pos[0]["id"]
            response = requests.delete(f"{BASE_URL}/api/purchase-orders/{po_id}", headers=auth_headers)
            assert response.status_code == 400
            print("✓ Delete received PO correctly rejected")
        else:
            print("⚠ No received POs to test delete rejection")


class TestCurrentStock:
    """Current Stock feature tests - stats, filters, edit functionality"""
    
    def test_get_current_stock(self, auth_headers):
        """Test GET /current-stock returns stock list with all required fields"""
        response = requests.get(f"{BASE_URL}/api/current-stock", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
        if len(data) > 0:
            item = data[0]
            # Verify all required columns are present
            assert "item_name" in item
            assert "category" in item
            assert "current_stock" in item
            assert "today_grn" in item
            assert "total" in item
            assert "par_stock" in item
            assert "status" in item
            print(f"✓ Got {len(data)} stock items with all required fields")
        else:
            print("⚠ No stock items found")
    
    def test_get_current_stock_stats(self, auth_headers):
        """Test GET /current-stock/stats returns summary stats"""
        response = requests.get(f"{BASE_URL}/api/current-stock/stats", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        # Verify all required stats are present
        assert "total_items" in data
        assert "today_grn_items" in data
        assert "below_par" in data
        assert "stock_ok" in data
        
        print(f"✓ Stock Stats: Total={data['total_items']}, Today GRN={data['today_grn_items']}, Below Par={data['below_par']}, OK={data['stock_ok']}")
    
    def test_update_stock(self, auth_headers):
        """Test POST /current-stock/update to edit stock values"""
        # First get an item
        response = requests.get(f"{BASE_URL}/api/current-stock", headers=auth_headers)
        stock_items = response.json()
        
        if len(stock_items) > 0:
            item = stock_items[0]
            original_stock = item["current_stock"]
            
            # Get kitchen ID
            kitchens_response = requests.get(f"{BASE_URL}/api/kitchens", headers=auth_headers)
            kitchens = kitchens_response.json()
            main_store = next((k for k in kitchens if k.get("is_main_store")), kitchens[0] if kitchens else None)
            
            if main_store:
                # Update stock
                update_data = [{
                    "item_id": item["item_id"],
                    "current_stock": original_stock,  # Keep same to not affect data
                    "par_stock": item["par_stock"]
                }]
                
                response = requests.post(
                    f"{BASE_URL}/api/current-stock/update?kitchen_id={main_store['id']}", 
                    json=update_data,
                    headers=auth_headers
                )
                assert response.status_code == 200
                print("✓ Stock update endpoint working")
            else:
                print("⚠ No kitchen found for stock update test")
        else:
            print("⚠ No stock items to test update")


class TestReports:
    """Reports feature tests - vendor ledger, kitchen ledger"""
    
    def test_get_vendor_ledger(self, auth_headers):
        """Test GET /reports/vendor-ledger returns PO and GRN data"""
        response = requests.get(f"{BASE_URL}/api/reports/vendor-ledger", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert "summary" in data
        assert "vendors" in data
        
        summary = data["summary"]
        assert "total_vendors" in summary
        assert "total_pos" in summary
        assert "total_po_value" in summary
        assert "total_grns" in summary
        assert "total_grn_value" in summary
        
        print(f"✓ Vendor Ledger: {summary['total_vendors']} vendors, {summary['total_pos']} POs, {summary['total_grns']} GRNs")
    
    def test_get_kitchen_ledger(self, auth_headers):
        """Test GET /reports/kitchen-ledger returns requisition and issue data"""
        response = requests.get(f"{BASE_URL}/api/reports/kitchen-ledger", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        assert "kitchens" in data
        print(f"✓ Kitchen Ledger: {len(data['kitchens'])} kitchens with data")
    
    def test_get_stock_in_hand(self, auth_headers):
        """Test GET /reports/stock-in-hand returns stock value report"""
        response = requests.get(f"{BASE_URL}/api/reports/stock-in-hand", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        assert "total_value" in data
        assert "items" in data
        print(f"✓ Stock in Hand: Total value = ₹{data['total_value']}")
    
    def test_get_consumption_analysis(self, auth_headers):
        """Test GET /reports/consumption-analysis returns consumption data"""
        response = requests.get(f"{BASE_URL}/api/reports/consumption-analysis", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        assert "consumption" in data
        print(f"✓ Consumption Analysis: {len(data['consumption'])} items")


class TestGRN:
    """GRN (Goods Receipt Note) feature tests"""
    
    def test_get_grns(self, auth_headers):
        """Test GET /grns returns list of GRNs"""
        response = requests.get(f"{BASE_URL}/api/grns", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
        if len(data) > 0:
            grn = data[0]
            assert "grn_number" in grn
            assert "po_number" in grn
            assert "vendor_name" in grn
            assert "total_amount" in grn
            print(f"✓ Got {len(data)} GRNs")
        else:
            print("⚠ No GRNs found")


class TestDashboard:
    """Dashboard stats tests"""
    
    def test_get_dashboard_stats(self, auth_headers):
        """Test GET /dashboard/stats returns all required stats"""
        response = requests.get(f"{BASE_URL}/api/dashboard/stats", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        assert "items_count" in data
        assert "vendors_count" in data
        assert "kitchens_count" in data
        assert "purchase_orders_count" in data
        assert "pending_orders" in data
        assert "grn_count" in data
        
        print(f"✓ Dashboard Stats: {data['items_count']} items, {data['vendors_count']} vendors, {data['purchase_orders_count']} POs")


class TestAlerts:
    """Alerts feature tests"""
    
    def test_get_alerts(self, auth_headers):
        """Test GET /alerts returns stock alerts"""
        response = requests.get(f"{BASE_URL}/api/alerts", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
        if len(data) > 0:
            alert = data[0]
            assert "type" in alert
            assert "message" in alert
            assert "severity" in alert
        
        print(f"✓ Got {len(data)} alerts")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
