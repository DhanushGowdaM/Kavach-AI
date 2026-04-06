#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Kavach - DPDPA Compliance Platform
Tests all endpoints with proper authentication and data validation
"""

import requests
import sys
import json
from datetime import datetime

class KavachAPITester:
    def __init__(self, base_url="https://breach-sentinel-8.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.session = requests.Session()
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def log(self, message, level="INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test with detailed logging"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        self.log(f"🔍 Testing {name} - {method} {endpoint}")
        
        try:
            if method == 'GET':
                response = self.session.get(url, headers=test_headers)
            elif method == 'POST':
                response = self.session.post(url, json=data, headers=test_headers)
            elif method == 'PATCH':
                response = self.session.patch(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = self.session.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            
            if success:
                self.tests_passed += 1
                self.log(f"✅ PASSED - Status: {response.status_code}", "SUCCESS")
                try:
                    return True, response.json() if response.content else {}
                except:
                    return True, {}
            else:
                self.log(f"❌ FAILED - Expected {expected_status}, got {response.status_code}", "ERROR")
                self.log(f"   Response: {response.text[:200]}", "ERROR")
                self.failed_tests.append({
                    "test": name,
                    "endpoint": endpoint,
                    "expected": expected_status,
                    "actual": response.status_code,
                    "response": response.text[:200]
                })
                return False, {}

        except Exception as e:
            self.log(f"❌ FAILED - Exception: {str(e)}", "ERROR")
            self.failed_tests.append({
                "test": name,
                "endpoint": endpoint,
                "error": str(e)
            })
            return False, {}

    def test_auth_login_valid(self):
        """Test login with valid credentials"""
        success, response = self.run_test(
            "Valid Login",
            "POST",
            "auth/login",
            200,
            data={"email": "admin@bharatiyabank.example.com", "password": "Kavach@2024"}
        )
        if success and 'token' in response:
            self.token = response['token']
            self.log(f"🔑 Token obtained: {self.token[:20]}...", "SUCCESS")
            return True
        return False

    def test_auth_login_invalid(self):
        """Test login with wrong password"""
        success, response = self.run_test(
            "Invalid Login",
            "POST", 
            "auth/login",
            401,
            data={"email": "admin@bharatiyabank.example.com", "password": "WrongPassword"}
        )
        return success

    def test_auth_me(self):
        """Test GET /api/auth/me after login"""
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        if success and 'user' in response:
            user = response['user']
            self.log(f"   User: {user.get('email')} ({user.get('role')})", "INFO")
        return success

    def test_dashboard_stats(self):
        """Test dashboard statistics endpoint"""
        success, response = self.run_test(
            "Dashboard Stats",
            "GET",
            "dashboard/stats",
            200
        )
        if success:
            stats = response
            self.log(f"   Assets: {stats.get('assets_scanned')}, Flags: {stats.get('open_risk_flags')}", "INFO")
        return success

    def test_compliance_score(self):
        """Test compliance score endpoint"""
        success, response = self.run_test(
            "Compliance Score",
            "GET",
            "dashboard/compliance-score",
            200
        )
        if success:
            score = response.get('overall_score', 0)
            self.log(f"   Compliance Score: {score}/100", "INFO")
        return success

    def test_data_sources(self):
        """Test data sources listing"""
        success, response = self.run_test(
            "Data Sources List",
            "GET",
            "sources",
            200
        )
        if success:
            sources = response
            self.log(f"   Found {len(sources)} data sources", "INFO")
            connected_count = sum(1 for s in sources if s.get('connection_status') == 'CONNECTED')
            self.log(f"   Connected sources: {connected_count}", "INFO")
        return success

    def test_assets_list(self):
        """Test assets listing"""
        success, response = self.run_test(
            "Assets List",
            "GET",
            "assets",
            200
        )
        if success:
            assets = response
            self.log(f"   Found {len(assets)} assets", "INFO")
            risk_tiers = {}
            for asset in assets:
                tier = asset.get('risk_tier', 'UNKNOWN')
                risk_tiers[tier] = risk_tiers.get(tier, 0) + 1
            self.log(f"   Risk distribution: {risk_tiers}", "INFO")
        return success

    def test_asset_detail(self):
        """Test asset detail endpoint"""
        # First get assets to find an asset ID
        success, assets = self.run_test("Get Assets for Detail Test", "GET", "assets", 200)
        if not success or not assets:
            return False
            
        asset_id = assets[0]['id']
        success, response = self.run_test(
            "Asset Detail",
            "GET",
            f"assets/{asset_id}",
            200
        )
        if success:
            asset = response
            self.log(f"   Asset: {asset.get('asset_name')} ({asset.get('risk_tier')})", "INFO")
        return success

    def test_asset_columns(self):
        """Test asset columns endpoint"""
        # First get assets to find an asset ID
        success, assets = self.run_test("Get Assets for Columns Test", "GET", "assets", 200)
        if not success or not assets:
            return False
            
        asset_id = assets[0]['id']
        success, response = self.run_test(
            "Asset Columns",
            "GET",
            f"assets/{asset_id}/columns",
            200
        )
        if success:
            columns = response
            self.log(f"   Found {len(columns)} columns", "INFO")
        return success

    def test_consent_dashboard(self):
        """Test consent manager dashboard"""
        success, response = self.run_test(
            "Consent Dashboard",
            "GET",
            "consent/dashboard",
            200
        )
        if success:
            stats = response.get('stats', {})
            purposes = response.get('purposes', [])
            self.log(f"   Total consents: {stats.get('total', 0)}, Purposes: {len(purposes)}", "INFO")
        return success

    def test_rights_requests(self):
        """Test rights requests listing"""
        success, response = self.run_test(
            "Rights Requests",
            "GET",
            "rights/requests",
            200
        )
        if success:
            requests_list = response
            self.log(f"   Found {len(requests_list)} rights requests", "INFO")
            status_counts = {}
            for req in requests_list:
                status = req.get('status', 'UNKNOWN')
                status_counts[status] = status_counts.get(status, 0) + 1
            self.log(f"   Status distribution: {status_counts}", "INFO")
        return success

    def test_breach_events(self):
        """Test breach events listing"""
        success, response = self.run_test(
            "Breach Events",
            "GET",
            "breach/events",
            200
        )
        if success:
            events = response
            self.log(f"   Found {len(events)} breach events", "INFO")
            severity_counts = {}
            for event in events:
                severity = event.get('severity', 'UNKNOWN')
                severity_counts[severity] = severity_counts.get(severity, 0) + 1
            self.log(f"   Severity distribution: {severity_counts}", "INFO")
        return success

    def test_breach_anomalies(self):
        """Test breach anomalies listing"""
        success, response = self.run_test(
            "Breach Anomalies",
            "GET",
            "breach/anomalies",
            200
        )
        if success:
            anomalies = response
            self.log(f"   Found {len(anomalies)} anomalies", "INFO")
        return success

    def test_risk_flags(self):
        """Test risk flags listing"""
        success, response = self.run_test(
            "Risk Flags",
            "GET",
            "risk/flags",
            200
        )
        if success:
            flags = response
            self.log(f"   Found {len(flags)} risk flags", "INFO")
            severity_counts = {}
            for flag in flags:
                severity = flag.get('severity', 'UNKNOWN')
                severity_counts[severity] = severity_counts.get(severity, 0) + 1
            self.log(f"   Severity distribution: {severity_counts}", "INFO")
        return success

    def test_vendors(self):
        """Test vendors listing"""
        success, response = self.run_test(
            "Vendors List",
            "GET",
            "vendors",
            200
        )
        if success:
            vendors = response
            self.log(f"   Found {len(vendors)} vendors", "INFO")
            risk_counts = {}
            for vendor in vendors:
                risk = vendor.get('risk_tier', 'UNKNOWN')
                risk_counts[risk] = risk_counts.get(risk, 0) + 1
            self.log(f"   Risk distribution: {risk_counts}", "INFO")
        return success

    def test_compliance_score_detailed(self):
        """Test detailed compliance score endpoint"""
        success, response = self.run_test(
            "Detailed Compliance Score",
            "GET",
            "compliance/score",
            200
        )
        if success:
            score_data = response
            overall = score_data.get('overall_score', 0)
            modules = {
                'Data Discovery': score_data.get('data_discovery_score', 0),
                'Consent': score_data.get('consent_score', 0),
                'Rights': score_data.get('rights_score', 0),
                'Breach Readiness': score_data.get('breach_readiness_score', 0),
                'Vendor': score_data.get('vendor_score', 0),
                'Children Protection': score_data.get('children_protection_score', 0)
            }
            self.log(f"   Overall: {overall}/100", "INFO")
            self.log(f"   Module scores: {modules}", "INFO")
        return success

    def test_logout(self):
        """Test logout functionality"""
        success, response = self.run_test(
            "Logout",
            "POST",
            "auth/logout",
            200
        )
        if success:
            self.token = None
            self.log("🔓 Logged out successfully", "SUCCESS")
        return success

    def run_all_tests(self):
        """Run all backend API tests"""
        self.log("🚀 Starting Kavach Backend API Tests", "INFO")
        self.log(f"🌐 Testing against: {self.base_url}", "INFO")
        
        # Authentication tests
        self.log("\n📋 AUTHENTICATION TESTS", "INFO")
        if not self.test_auth_login_valid():
            self.log("❌ Login failed - stopping tests", "ERROR")
            return False
            
        self.test_auth_login_invalid()
        self.test_auth_me()
        
        # Dashboard tests
        self.log("\n📊 DASHBOARD TESTS", "INFO")
        self.test_dashboard_stats()
        self.test_compliance_score()
        
        # Data management tests
        self.log("\n💾 DATA MANAGEMENT TESTS", "INFO")
        self.test_data_sources()
        self.test_assets_list()
        self.test_asset_detail()
        self.test_asset_columns()
        
        # Compliance tests
        self.log("\n⚖️ COMPLIANCE TESTS", "INFO")
        self.test_consent_dashboard()
        self.test_rights_requests()
        self.test_risk_flags()
        self.test_compliance_score_detailed()
        
        # Security tests
        self.log("\n🛡️ SECURITY TESTS", "INFO")
        self.test_breach_events()
        self.test_breach_anomalies()
        self.test_vendors()
        
        # Cleanup
        self.log("\n🧹 CLEANUP", "INFO")
        self.test_logout()
        
        return True

    def print_summary(self):
        """Print test summary"""
        self.log("\n" + "="*60, "INFO")
        self.log("📊 TEST SUMMARY", "INFO")
        self.log("="*60, "INFO")
        self.log(f"Total Tests: {self.tests_run}", "INFO")
        self.log(f"Passed: {self.tests_passed}", "SUCCESS")
        self.log(f"Failed: {len(self.failed_tests)}", "ERROR" if self.failed_tests else "INFO")
        self.log(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%", "INFO")
        
        if self.failed_tests:
            self.log("\n❌ FAILED TESTS:", "ERROR")
            for i, test in enumerate(self.failed_tests, 1):
                self.log(f"{i}. {test['test']} - {test.get('endpoint', 'N/A')}", "ERROR")
                if 'error' in test:
                    self.log(f"   Error: {test['error']}", "ERROR")
                else:
                    self.log(f"   Expected: {test['expected']}, Got: {test['actual']}", "ERROR")
        
        return len(self.failed_tests) == 0

def main():
    """Main test execution"""
    tester = KavachAPITester()
    
    try:
        success = tester.run_all_tests()
        all_passed = tester.print_summary()
        
        if all_passed:
            tester.log("🎉 All tests passed!", "SUCCESS")
            return 0
        else:
            tester.log("💥 Some tests failed!", "ERROR")
            return 1
            
    except KeyboardInterrupt:
        tester.log("\n⚠️ Tests interrupted by user", "ERROR")
        return 1
    except Exception as e:
        tester.log(f"\n💥 Unexpected error: {str(e)}", "ERROR")
        return 1

if __name__ == "__main__":
    sys.exit(main())