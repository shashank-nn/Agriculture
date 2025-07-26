import requests
import sys
import json
from datetime import datetime

class AgricultureAPITester:
    def __init__(self, base_url="https://bbd2b96a-d064-40d0-8624-30141fba2518.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)

            print(f"Response Status: {response.status_code}")
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"Response preview: {str(response_data)[:200]}...")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"Error response: {error_data}")
                except:
                    print(f"Error response text: {response.text[:200]}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test API health check"""
        return self.run_test(
            "API Health Check",
            "GET",
            "api/",
            200
        )

    def test_weather_api(self, location="London"):
        """Test weather API endpoint"""
        return self.run_test(
            f"Weather API for {location}",
            "POST",
            "api/weather",
            200,
            data={"location": location}
        )

    def test_crop_suggestions(self, location="London"):
        """Test crop suggestions API"""
        return self.run_test(
            f"Crop Suggestions for {location}",
            "POST",
            "api/crop-suggestions",
            200,
            data={"location": location}
        )

    def test_ai_assistant(self, question="How do I protect tomatoes from pests?"):
        """Test AI assistant API"""
        return self.run_test(
            "AI Assistant Query",
            "POST",
            "api/ai-assistant",
            200,
            data={"question": question}
        )

    def test_add_crop_record(self):
        """Test adding a crop record"""
        crop_data = {
            "crop_name": "Test Tomatoes",
            "planting_date": "2025-02-01T10:00:00",
            "expected_harvest": "2025-05-01T10:00:00",
            "location": "Test Farm",
            "notes": "Test crop for API testing"
        }
        return self.run_test(
            "Add Crop Record",
            "POST",
            "api/crops",
            200,
            data=crop_data
        )

    def test_get_crop_records(self):
        """Test getting crop records"""
        return self.run_test(
            "Get Crop Records",
            "GET",
            "api/crops",
            200
        )

    def test_get_recent_queries(self):
        """Test getting recent AI queries"""
        return self.run_test(
            "Get Recent AI Queries",
            "GET",
            "api/recent-queries",
            200
        )

def main():
    print("🌱 Starting Agriculture API Tests...")
    print("=" * 50)
    
    # Setup
    tester = AgricultureAPITester()

    # Run all tests
    print("\n📋 Running Backend API Tests:")
    
    # 1. Health check
    tester.test_health_check()
    
    # 2. Weather API
    tester.test_weather_api("New York")
    
    # 3. Crop suggestions (depends on weather API)
    tester.test_crop_suggestions("New York")
    
    # 4. AI Assistant
    tester.test_ai_assistant("What are the best crops for winter?")
    
    # 5. Add crop record
    tester.test_add_crop_record()
    
    # 6. Get crop records
    tester.test_get_crop_records()
    
    # 7. Get recent queries
    tester.test_get_recent_queries()

    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 Final Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All backend API tests passed!")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())