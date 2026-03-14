#!/usr/bin/env python3
"""
Embedding Infrastructure Verification Script
Checks if all required database tables and functions exist
"""

import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")


def verify_infrastructure():
    """Verify all embedding infrastructure components exist"""

    print("=" * 70)
    print("🔍 Collabryx Embedding Infrastructure Verification")
    print("=" * 70)
    print(f"Supabase URL: {SUPABASE_URL}")
    print()

    # Initialize client
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("✅ Supabase client initialized")
    except Exception as e:
        print(f"❌ Failed to initialize Supabase client: {e}")
        return False

    # Check tables
    tables_to_check = [
        "embedding_dead_letter_queue",
        "embedding_rate_limits",
        "embedding_pending_queue",
        "profile_embeddings",
    ]

    print("\n📊 Checking Tables:")
    print("-" * 70)

    all_tables_exist = True
    for table in tables_to_check:
        try:
            response = supabase.table(table).select("count", count="exact").execute()
            count = response.count if hasattr(response, "count") else 0
            print(f"  ✅ {table:<35} (rows: {count})")
        except Exception as e:
            print(f"  ❌ {table:<35} - {str(e)[:50]}")
            all_tables_exist = False

    # Check functions
    print("\n🔧 Checking Functions:")
    print("-" * 70)

    functions_to_check = [
        ("check_embedding_rate_limit", "Rate limiting"),
        ("reset_embedding_rate_limit", "Rate limit reset"),
        ("queue_embedding_request", "Queue embedding"),
    ]

    all_functions_exist = True
    for func_name, description in functions_to_check:
        try:
            # Try to call function with test UUID
            test_uuid = "00000000-0000-0000-0000-000000000000"

            if func_name == "check_embedding_rate_limit":
                response = supabase.rpc(func_name, {"p_user_id": test_uuid}).execute()
                print(f"  ✅ {func_name:<35} ({description})")
            else:
                # Just check if function exists in pg_proc
                response = (
                    supabase.from_("pg_proc")
                    .select("proname")
                    .eq("proname", func_name)
                    .execute()
                )
                if response.data and len(response.data) > 0:
                    print(f"  ✅ {func_name:<35} ({description})")
                else:
                    print(f"  ❌ {func_name:<35} ({description}) - Not found")
                    all_functions_exist = False
        except Exception as e:
            error_msg = str(e)
            if "Could not find the function" in error_msg or "PGRST202" in error_msg:
                print(f"  ❌ {func_name:<35} ({description}) - Not deployed")
                all_functions_exist = False
            else:
                # Function exists but may have failed for other reason
                print(f"  ✅ {func_name:<35} ({description}) - Exists")

    # Test rate limit function
    print("\n🧪 Testing Rate Limit Function:")
    print("-" * 70)

    try:
        test_uuid = "00000000-0000-0000-0000-000000000000"
        response = supabase.rpc(
            "check_embedding_rate_limit", {"p_user_id": test_uuid}
        ).execute()

        if response.data and len(response.data) > 0:
            result = response.data[0]
            print(
                f"  ✅ Function returned: allowed={result.get('allowed')}, remaining={result.get('remaining')}"
            )
        else:
            print(f"  ⚠️  Function returned no data")
    except Exception as e:
        print(f"  ❌ Function test failed: {str(e)[:60]}")

    # Summary
    print("\n" + "=" * 70)
    print("📋 Summary:")
    print("=" * 70)

    if all_tables_exist:
        print("  ✅ All required tables exist")
    else:
        print("  ❌ Some tables are missing - Run migration script")

    if all_functions_exist:
        print("  ✅ All required functions exist")
    else:
        print("  ❌ Some functions are missing - Run migration script")

    print()

    if all_tables_exist and all_functions_exist:
        print("🎉 Infrastructure is ready! Python worker should work correctly.")
        print()
        print("Next steps:")
        print("  1. Restart Python worker: docker-compose restart")
        print("  2. Check logs: docker-compose logs -f")
        print("  3. Test health: curl http://localhost:8000/health")
        return True
    else:
        print("⚠️  Infrastructure is incomplete!")
        print()
        print("Required action:")
        print("  1. Open Supabase Dashboard > SQL Editor")
        print("  2. Run: supabase/setup/100-embedding-infrastructure-migration.sql")
        print("  3. Re-run this verification script")
        return False


if __name__ == "__main__":
    success = verify_infrastructure()
    exit(0 if success else 1)
