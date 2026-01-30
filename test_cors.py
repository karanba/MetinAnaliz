#!/usr/bin/env python3
"""
Test script for CORS configuration
Tests that only allowed origins can access the API
"""
import requests

API_URL = "http://localhost:8000"

def test_cors_headers():
    """Test CORS headers with different origins"""
    print("🌐 Testing CORS Configuration")
    print("=" * 60)

    # Test cases with different origins
    test_origins = [
        {
            "origin": "http://localhost:4200",
            "should_allow": True,
            "name": "Development (localhost:4200)"
        },
        {
            "origin": "https://bizimkokpit.com",
            "should_allow": True,
            "name": "Production (bizimkokpit.com)"
        },
        {
            "origin": "https://metin.bizimkokpit.com",
            "should_allow": True,
            "name": "Production subdomain (metin.bizimkokpit.com)"
        },
        {
            "origin": "https://evil-site.com",
            "should_allow": False,
            "name": "Unauthorized site (evil-site.com)"
        },
        {
            "origin": "http://localhost:3000",
            "should_allow": False,
            "name": "Different local port (localhost:3000)"
        }
    ]

    passed = 0
    failed = 0

    for test in test_origins:
        print(f"\n📝 Test: {test['name']}")
        print(f"   Origin: {test['origin']}")

        try:
            # Send OPTIONS request (preflight) with Origin header
            response = requests.options(
                f"{API_URL}/analyze",
                headers={
                    "Origin": test["origin"],
                    "Access-Control-Request-Method": "POST",
                    "Access-Control-Request-Headers": "content-type"
                },
                timeout=5
            )

            # Check CORS headers in response
            cors_origin = response.headers.get("Access-Control-Allow-Origin")
            cors_methods = response.headers.get("Access-Control-Allow-Methods")

            if test["should_allow"]:
                # This origin should be allowed
                if cors_origin == test["origin"]:
                    print(f"   ✅ PASS - Origin allowed")
                    print(f"   CORS Origin: {cors_origin}")
                    print(f"   Allowed Methods: {cors_methods}")
                    passed += 1
                else:
                    print(f"   ❌ FAIL - Origin should be allowed but got: {cors_origin}")
                    failed += 1
            else:
                # This origin should be blocked
                if cors_origin != test["origin"]:
                    print(f"   ✅ PASS - Origin correctly blocked")
                    passed += 1
                else:
                    print(f"   ❌ FAIL - Origin should be blocked but was allowed")
                    print(f"   CORS Origin: {cors_origin}")
                    failed += 1

        except requests.exceptions.ConnectionError:
            print(f"   ⚠️  ERROR - Cannot connect to {API_URL}")
            print(f"   Make sure the server is running: python main.py")
            return
        except Exception as e:
            print(f"   ⚠️  ERROR - {str(e)}")
            failed += 1

    print("\n" + "=" * 60)
    print(f"📊 Results: {passed} passed, {failed} failed")

    if failed == 0:
        print("🎉 CORS is properly configured!")
        print("\nAllowed origins:")
        print("  ✅ http://localhost:4200")
        print("  ✅ https://bizimkokpit.com")
        print("  ✅ https://metin.bizimkokpit.com")
    else:
        print(f"⚠️  {failed} tests failed. Check your CORS configuration.")


def test_actual_request():
    """Test actual POST request with CORS headers"""
    print("\n\n📮 Testing Actual POST Request with CORS")
    print("=" * 60)

    test_origin = "http://localhost:4200"
    print(f"Sending POST request from: {test_origin}")

    try:
        response = requests.post(
            f"{API_URL}/analyze",
            json={"text": "Test metni. Bu bir deneme cümlesidir.", "analysis_type": "yod"},
            headers={"Origin": test_origin},
            timeout=5
        )

        cors_origin = response.headers.get("Access-Control-Allow-Origin")

        if response.status_code == 200 and cors_origin:
            print(f"   ✅ Request successful")
            print(f"   Status: {response.status_code}")
            print(f"   CORS Origin: {cors_origin}")
            print(f"   Response includes statistics: {bool(response.json().get('statistics'))}")
        else:
            print(f"   ⚠️  Request status: {response.status_code}")
            print(f"   CORS Origin: {cors_origin}")

    except Exception as e:
        print(f"   ❌ Error: {str(e)}")


def test_disallowed_methods():
    """Test that disallowed methods are rejected"""
    print("\n\n🚫 Testing Disallowed Methods")
    print("=" * 60)

    disallowed_methods = ["PUT", "DELETE", "PATCH"]

    for method in disallowed_methods:
        print(f"\n📝 Testing {method} method")

        try:
            response = requests.options(
                f"{API_URL}/analyze",
                headers={
                    "Origin": "http://localhost:4200",
                    "Access-Control-Request-Method": method,
                },
                timeout=5
            )

            allowed_methods = response.headers.get("Access-Control-Allow-Methods", "")

            if method.upper() not in allowed_methods.upper():
                print(f"   ✅ PASS - {method} correctly not allowed")
                print(f"   Allowed methods: {allowed_methods}")
            else:
                print(f"   ⚠️  {method} is allowed but shouldn't be")

        except Exception as e:
            print(f"   ⚠️  Error: {str(e)}")


if __name__ == "__main__":
    print("\n🛡️  MetinAnaliz CORS Security Test")
    print("=" * 60)
    print(f"Testing API at: {API_URL}")
    print("Make sure your server is running: python main.py\n")

    try:
        # Check if server is running
        response = requests.get(f"{API_URL}/health", timeout=2)
        print(f"✅ Server is running (Health check: {response.json()})\n")
    except:
        print("❌ Cannot connect to server!")
        print("   Start the server with: python main.py")
        exit(1)

    # Run tests
    test_cors_headers()
    test_actual_request()
    test_disallowed_methods()

    print("\n" + "=" * 60)
    print("✅ CORS testing complete!")
    print("\nYour API will only accept requests from:")
    print("  • http://localhost:4200 (Development)")
    print("  • https://bizimkokpit.com (Production)")
    print("  • https://metin.bizimkokpit.com (Production)")
    print("\nAny other origin will be blocked! 🛡️")
    print("=" * 60 + "\n")
