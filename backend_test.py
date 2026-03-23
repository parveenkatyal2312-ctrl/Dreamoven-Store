import requests
import sys
import json
from datetime import datetime

class DreamOvenAPITester:
    def __init__(self, base_url="https://stock-management-app-3.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json() if response.content else {}
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                self.failed_tests.append(f"{name}: Expected {expected_status}, got {response.status_code}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append(f"{name}: {str(e)}")
            return False, {}

    def test_health(self):
        """Test health endpoint"""
        success, response = self.run_test(
            "Health Check",
            "GET",
            "/health",
            200
        )
        if success and response.get('status') == 'healthy':
            print("   ✓ Health status is healthy")
            return True
        return False

    def test_login(self, email, password):
        """Test login and get token"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "/auth/login",
            200,
            data={"email": email, "password": password}
        )
        if success and 'access_token' in response:
            self.token = response['access_token']
            print(f"   ✓ Token received for user: {response.get('user', {}).get('name', 'Unknown')}")
            return True
        return False

    def test_dashboard_stats(self):
        """Test dashboard stats endpoint"""
        success, response = self.run_test(
            "Dashboard Stats",
            "GET",
            "/dashboard/stats",
            200
        )
        if success:
            items_count = response.get('items_count', 0)
            vendors_count = response.get('vendors_count', 0)
            kitchens_count = response.get('kitchens_count', 0)
            category_stats = response.get('category_stats', [])
            
            print(f"   ✓ Items: {items_count}")
            print(f"   ✓ Vendors: {vendors_count}")
            print(f"   ✓ Kitchens: {kitchens_count}")
            print(f"   ✓ Categories: {len(category_stats)}")
            
            # Check expected counts
            expected_items = 683
            expected_vendors = 47
            expected_kitchens = 15
            expected_categories = 14
            
            if items_count != expected_items:
                print(f"   ⚠️  Expected {expected_items} items, got {items_count}")
            if vendors_count != expected_vendors:
                print(f"   ⚠️  Expected {expected_vendors} vendors, got {vendors_count}")
            if kitchens_count != expected_kitchens:
                print(f"   ⚠️  Expected {expected_kitchens} kitchens, got {kitchens_count}")
            if len(category_stats) != expected_categories:
                print(f"   ⚠️  Expected {expected_categories} categories, got {len(category_stats)}")
            
            return True
        return False

    def test_get_items(self):
        """Test get items endpoint"""
        success, response = self.run_test(
            "Get Items",
            "GET",
            "/items",
            200
        )
        if success and isinstance(response, list):
            print(f"   ✓ Retrieved {len(response)} items")
            if len(response) > 0:
                item = response[0]
                print(f"   ✓ Sample item: {item.get('name', 'Unknown')}")
            return True
        return False

    def test_get_kitchens(self):
        """Test get kitchens endpoint"""
        success, response = self.run_test(
            "Get Kitchens",
            "GET",
            "/kitchens",
            200
        )
        if success and isinstance(response, list):
            print(f"   ✓ Retrieved {len(response)} kitchens")
            main_stores = [k for k in response if k.get('is_main_store')]
            print(f"   ✓ Main stores found: {len(main_stores)}")
            if main_stores:
                print(f"   ✓ Main store: {main_stores[0].get('name', 'Unknown')}")
            return True
        return False

    def test_get_vendors(self):
        """Test get vendors endpoint"""
        success, response = self.run_test(
            "Get Vendors",
            "GET",
            "/vendors",
            200
        )
        if success and isinstance(response, list):
            print(f"   ✓ Retrieved {len(response)} vendors")
            if len(response) > 0:
                vendor = response[0]
                print(f"   ✓ Sample vendor: {vendor.get('name', 'Unknown')}")
            return True
        return False

    def test_get_categories(self):
        """Test get categories endpoint"""
        success, response = self.run_test(
            "Get Categories",
            "GET",
            "/categories",
            200
        )
        if success and isinstance(response, list):
            print(f"   ✓ Retrieved {len(response)} categories")
            if len(response) > 0:
                category = response[0]
                print(f"   ✓ Sample category: {category.get('name', 'Unknown')}")
            return True
        return False

    def test_create_item(self):
        """Test create item endpoint"""
        # First get a category to use
        success, categories = self.run_test("Get Categories for Item Creation", "GET", "/categories", 200)
        if not success or not categories:
            print("   ❌ Cannot test item creation - no categories available")
            return False
        
        category_name = categories[0]['name']
        test_item = {
            "name": f"Test Item {datetime.now().strftime('%H%M%S')}",
            "category": category_name,
            "unit": "PCS",
            "standard_price": 100.0,
            "vendor": "Test Vendor",
            "hsn_code": "1234",
            "gst_rate": 18.0
        }
        
        success, response = self.run_test(
            "Create Item",
            "POST",
            "/items",
            200,
            data=test_item
        )
        if success and response.get('id'):
            print(f"   ✓ Created item with ID: {response['id']}")
            return response['id']
        return False

    def test_get_purchase_orders(self):
        """Test get purchase orders endpoint"""
        success, response = self.run_test(
            "Get Purchase Orders",
            "GET",
            "/purchase-orders",
            200
        )
        if success and isinstance(response, list):
            print(f"   ✓ Retrieved {len(response)} purchase orders")
            return True
        return False

    def test_auth_me(self):
        """Test auth/me endpoint"""
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "/auth/me",
            200
        )
        if success and response.get('email'):
            print(f"   ✓ Current user: {response.get('name')} ({response.get('email')})")
            return True
        return False

def main():
    print("🚀 Starting DREAMOVEN Inventory Management System API Tests")
    print("=" * 60)
    
    # Setup
    tester = DreamOvenAPITester()
    admin_email = "parveenkatyal2312@gmail.com"
    admin_password = "admin@123"

    # Test health first
    if not tester.test_health():
        print("❌ Health check failed, stopping tests")
        return 1

    # Test login
    if not tester.test_login(admin_email, admin_password):
        print("❌ Login failed, stopping tests")
        return 1

    # Test authenticated endpoints
    tester.test_auth_me()
    tester.test_dashboard_stats()
    tester.test_get_items()
    tester.test_get_kitchens()
    tester.test_get_vendors()
    tester.test_get_categories()
    tester.test_get_purchase_orders()
    
    # Test item creation
    created_item_id = tester.test_create_item()

    # Print results
    print("\n" + "=" * 60)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if tester.failed_tests:
        print("\n❌ Failed Tests:")
        for failed in tester.failed_tests:
            print(f"   • {failed}")
    
    success_rate = (tester.tests_passed / tester.tests_run) * 100 if tester.tests_run > 0 else 0
    print(f"\n✅ Success Rate: {success_rate:.1f}%")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())