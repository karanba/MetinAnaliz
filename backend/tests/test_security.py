#!/usr/bin/env python3
"""
Test script for security features
Run this to verify input sanitization is working correctly
"""
import requests
import json

API_URL = "http://localhost:8000"

def test_malicious_inputs():
    """Test that malicious inputs are blocked"""
    print("🔒 Testing Input Validation & Sanitization")
    print("=" * 60)

    test_cases = [
        {
            "name": "XSS Script Tag",
            "input": "<script>alert('XSS')</script>",
            "should_fail": True
        },
        {
            "name": "JavaScript Protocol",
            "input": "javascript:alert('XSS')",
            "should_fail": True
        },
        {
            "name": "Onclick Event",
            "input": "<div onclick='alert(1)'>Click me</div>",
            "should_fail": True
        },
        {
            "name": "Iframe Injection",
            "input": "<iframe src='evil.com'></iframe>",
            "should_fail": True
        },
        {
            "name": "Null Byte Injection",
            "input": "Normal text\x00malicious",
            "should_fail": True
        },
        {
            "name": "Empty Text",
            "input": "",
            "should_fail": True
        },
        {
            "name": "Only Whitespace",
            "input": "   ",
            "should_fail": True
        },
        {
            "name": "Excessive Character Repetition",
            "input": "a" * 2000,
            "should_fail": True
        },
        {
            "name": "Valid Turkish Text",
            "input": "Merhaba dünya. Bu bir test metnidir. Türkçe karakterler: ıöüşçğ.",
            "should_fail": False
        },
        {
            "name": "Valid Long Text",
            "input": "Bu çok uzun bir metin örneğidir. " * 100,
            "should_fail": False
        }
    ]

    passed = 0
    failed = 0

    for test in test_cases:
        print(f"\n📝 Test: {test['name']}")
        print(f"   Input: {test['input'][:50]}{'...' if len(test['input']) > 50 else ''}")

        try:
            response = requests.post(
                f"{API_URL}/analyze",
                json={"text": test["input"], "analysis_type": "yod"},
                timeout=5
            )

            if test["should_fail"]:
                # This test should have failed
                if response.status_code == 422:
                    print(f"   ✅ PASS - Correctly blocked (422)")
                    print(f"   Message: {response.json().get('detail', 'No detail')}")
                    passed += 1
                else:
                    print(f"   ❌ FAIL - Should have been blocked but got {response.status_code}")
                    failed += 1
            else:
                # This test should succeed
                if response.status_code == 200:
                    print(f"   ✅ PASS - Correctly accepted (200)")
                    passed += 1
                else:
                    print(f"   ❌ FAIL - Should have succeeded but got {response.status_code}")
                    print(f"   Error: {response.json().get('detail', 'No detail')}")
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
        print("🎉 All security tests passed! Your API is protected.")
    else:
        print(f"⚠️  {failed} tests failed. Please review the implementation.")


def test_rate_limiting():
    """Test rate limiting (if enabled)"""
    print("\n\n⚡ Testing Rate Limiting")
    print("=" * 60)
    print("Sending 10 rapid requests...")

    success_count = 0
    rate_limited_count = 0

    for i in range(10):
        try:
            response = requests.post(
                f"{API_URL}/analyze",
                json={"text": f"Test {i}", "analysis_type": "yod"},
                timeout=5
            )

            if response.status_code == 200 or response.status_code == 422:
                success_count += 1
            elif response.status_code == 429:
                rate_limited_count += 1
                print(f"   Request {i+1}: Rate limited (429)")

        except Exception as e:
            print(f"   Request {i+1}: Error - {str(e)}")

    print(f"\n📊 Results:")
    print(f"   ✅ Successful: {success_count}")
    print(f"   ⏰ Rate Limited: {rate_limited_count}")

    if rate_limited_count > 0:
        print("   Rate limiting is working!")
    else:
        print("   Rate limiting may not be enabled yet.")


def test_large_request():
    """Test request size limits"""
    print("\n\n📏 Testing Request Size Limits")
    print("=" * 60)

    # Try to send a very large request
    large_text = "A" * 2000000  # 2MB of text

    print(f"Sending {len(large_text):,} bytes of data...")

    try:
        response = requests.post(
            f"{API_URL}/analyze",
            json={"text": large_text, "analysis_type": "yod"},
            timeout=10
        )

        if response.status_code == 413 or response.status_code == 422:
            print(f"   ✅ PASS - Large request blocked ({response.status_code})")
            print(f"   Message: {response.json().get('detail', 'No detail')}")
        else:
            print(f"   ⚠️  Request was not blocked (got {response.status_code})")

    except Exception as e:
        print(f"   ✅ Request blocked: {str(e)}")


if __name__ == "__main__":
    print("\n🛡️  MetinAnaliz Security Test Suite")
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
    test_malicious_inputs()
    test_large_request()

    print("\n" + "=" * 60)
    print("✅ Security testing complete!")
    print("\nNext steps:")
    print("1. If all tests passed, your security is working!")
    print("2. Review SECURITY.md for additional security measures")
    print("3. Configure CORS and rate limiting in production")
    print("=" * 60 + "\n")
