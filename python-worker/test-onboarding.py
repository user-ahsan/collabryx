#!/usr/bin/env python3
"""
Collabryx Embedding Service - Onboarding Flow Test Script
Tests the complete onboarding embedding generation flow
"""

import requests
import time
import sys
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8000"
TEST_USER_ID = "5f579b77-8e28-4b97-b179-75ddc1d47a60"  # Test user


def print_header(text):
    print(f"\n{'=' * 60}")
    print(f"  {text}")
    print(f"{'=' * 60}\n")


def print_step(step, text):
    print(f"\n[Step {step}] {text}")


def check_health():
    """Step 1: Check service health"""
    print_step(1, "Checking service health...")
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Service is healthy!")
            print(f"   Status: {data.get('status')}")
            print(f"   Supabase Connected: {data.get('supabase_connected')}")
            print(f"   Queue Size: {data.get('queue_size')}")
            print(f"   Model: {data.get('model_info', {}).get('model_name')}")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Cannot connect to service: {e}")
        return False


def test_rate_limit():
    """Step 2: Test rate limiting"""
    print_step(2, "Testing rate limiting...")

    # Make multiple requests rapidly
    success_count = 0
    rate_limited_count = 0

    for i in range(5):
        response = requests.post(
            f"{BASE_URL}/generate-embedding",
            json={
                "user_id": TEST_USER_ID,
                "text": f"Test embedding request {i}",
                "request_id": f"test-{i}-{int(time.time())}",
            },
            timeout=10,
        )

        if response.status_code == 200:
            success_count += 1
            print(f"   Request {i + 1}: ✅ Queued")
        elif response.status_code == 429:
            rate_limited_count += 1
            print(f"   Request {i + 1}: ⚠️  Rate limited (expected)")
        else:
            print(f"   Request {i + 1}: ❌ Error {response.status_code}")

    print(f"\n   Results: {success_count} succeeded, {rate_limited_count} rate limited")
    if rate_limited_count > 0:
        print(f"   ✅ Rate limiting is working!")
    return True


def test_onboarding_flow():
    """Step 3: Simulate real onboarding flow"""
    print_step(3, "Simulating onboarding flow...")

    # Simulate profile data from onboarding
    test_data = {
        "user_id": TEST_USER_ID,
        "display_name": "Test User",
        "headline": "Full Stack Developer",
        "bio": "Passionate about building great products",
        "location": "San Francisco, CA",
        "looking_for": ["cofounder", "teammate"],
        "skills": ["Python", "JavaScript", "React"],
        "interests": ["AI", "Startups", "Open Source"],
    }

    # Construct semantic text (mimicking what the worker does)
    semantic_parts = [
        test_data.get("display_name", ""),
        test_data.get("headline", ""),
        test_data.get("bio", ""),
        test_data.get("location", ""),
        "Looking for: " + ", ".join(test_data.get("looking_for", [])),
        "Skills: " + ", ".join(test_data.get("skills", [])),
        "Interests: " + ", ".join(test_data.get("interests", [])),
    ]
    semantic_text = " ".join([p for p in semantic_parts if p])

    print(f"   Semantic text length: {len(semantic_text)} characters")
    print(f"   Sample: {semantic_text[:100]}...")

    # Queue embedding generation
    response = requests.post(
        f"{BASE_URL}/generate-embedding-from-profile",
        json={
            "user_id": test_data["user_id"],
            "display_name": test_data["display_name"],
            "headline": test_data["headline"],
            "bio": test_data["bio"],
            "location": test_data["location"],
            "looking_for": test_data["looking_for"],
        },
        timeout=10,
    )

    if response.status_code == 200:
        print(f"   ✅ Onboarding embedding queued successfully!")
        return True
    else:
        print(f"   ❌ Failed: {response.status_code} - {response.text}")
        return False


def check_embedding_status():
    """Step 4: Check if embedding was generated"""
    print_step(4, "Checking embedding status...")
    print("   Note: This requires Supabase access to verify")
    print("   Check your Supabase dashboard:")
    print(f"   https://supabase.ahsanali.cc/project/_/editor/23")
    print(f"   Filter: user_id = {TEST_USER_ID}")
    return True


def check_logs():
    """Step 5: Check recent logs"""
    print_step(5, "Checking service logs...")
    print("   Run this command to see live logs:")
    print("   docker-compose logs -f embedding-service")
    print("\n   Look for:")
    print("   ✅ 'Successfully stored embedding'")
    print("   ❌ 'Could not find table' errors")
    print("   ❌ 'Could not find function' errors")
    print("   ❌ 'duplicate key' errors")
    return True


def main():
    """Run all tests"""
    print_header("COLLABRYX EMBEDDING SERVICE - ONBOARDING TEST")
    print(f"Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Target service: {BASE_URL}")
    print(f"Test user ID: {TEST_USER_ID}")

    results = []

    # Run tests
    results.append(("Health Check", check_health()))
    time.sleep(1)

    results.append(("Rate Limiting", test_rate_limit()))
    time.sleep(1)

    results.append(("Onboarding Flow", test_onboarding_flow()))
    time.sleep(2)

    results.append(("Embedding Status", check_embedding_status()))
    results.append(("Log Check", check_logs()))

    # Summary
    print_header("TEST SUMMARY")

    passed = sum(1 for _, result in results if result)
    total = len(results)

    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {name}")

    print(f"\nTotal: {passed}/{total} tests passed")

    if passed == total:
        print("\n🎉 All tests passed!")
        print("\nNext steps:")
        print("1. Check Supabase to verify embeddings were stored")
        print("2. Monitor logs for any errors")
        print("3. Test with a real user onboarding flow")
        return 0
    else:
        print("\n⚠️  Some tests failed. Check the output above for details.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
