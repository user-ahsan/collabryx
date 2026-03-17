#!/usr/bin/env python3
"""
Test Incremental Seeding
Verifies that seeders skip existing records on re-run
"""

import sys
import os
import httpx
from colorama import Fore, Style, init

# Initialize colorama
init()

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config import config


def test_profiles_incremental():
    """Test that profiles seeder skips existing profiles"""
    print(f"\n{Fore.CYAN}{'=' * 70}{Style.RESET_ALL}")
    print(f"{Fore.CYAN}TEST: PROFILES INCREMENTAL SEEDING{Style.RESET_ALL}")
    print(f"{Fore.CYAN}{'=' * 70}{Style.RESET_ALL}\n")

    from seeders.profiles_seeder import ProfilesSeeder

    with httpx.Client() as http:
        seeder = ProfilesSeeder(http)

        # First run - create 5 profiles
        print(f"\n{Fore.YELLOW}RUN 1: Creating 5 profiles...{Style.RESET_ALL}\n")
        created_1 = seeder.seed_profiles(count=5)
        count_1 = len(created_1)

        # Second run - should skip all 5
        print(
            f"\n{Fore.YELLOW}RUN 2: Creating 5 profiles (should skip all)...{Style.RESET_ALL}\n"
        )
        created_2 = seeder.seed_profiles(count=5)
        count_2 = len(created_2)

        # Verify
        print(f"\n{Fore.GREEN}{'=' * 70}{Style.RESET_ALL}")
        print(f"{Fore.GREEN}RESULTS:{Style.RESET_ALL}")
        print(f"  Run 1: Created {count_1} profiles")
        print(f"  Run 2: Created {count_2} profiles (expected: 0)")

        if count_2 == 0:
            print(f"\n{Fore.GREEN}✓ PASS: Incremental seeding works!{Style.RESET_ALL}")
            return True
        else:
            print(f"\n{Fore.RED}✗ FAIL: Duplicate profiles created!{Style.RESET_ALL}")
            return False


def test_connections_incremental():
    """Test that connections seeder skips existing connections"""
    print(f"\n{Fore.CYAN}{'=' * 70}{Style.RESET_ALL}")
    print(f"{Fore.CYAN}TEST: CONNECTIONS INCREMENTAL SEEDING{Style.RESET_ALL}")
    print(f"{Fore.CYAN}{'=' * 70}{Style.RESET_ALL}\n")

    from seeders.connections_seeder import ConnectionsSeeder

    with httpx.Client() as http:
        seeder = ConnectionsSeeder(http)

        # First run
        print(f"\n{Fore.YELLOW}RUN 1: Creating 20 connections...{Style.RESET_ALL}\n")
        stats_1 = seeder.seed(limit=20)
        created_1 = stats_1["created"]

        # Second run
        print(
            f"\n{Fore.YELLOW}RUN 2: Creating 20 connections (should skip all)...{Style.RESET_ALL}\n"
        )
        stats_2 = seeder.seed(limit=20)
        created_2 = stats_2["created"]

        # Verify
        print(f"\n{Fore.GREEN}{'=' * 70}{Style.RESET_ALL}")
        print(f"{Fore.GREEN}RESULTS:{Style.RESET_ALL}")
        print(f"  Run 1: Created {created_1} connections")
        print(f"  Run 2: Created {created_2} connections (expected: 0)")

        if created_2 == 0:
            print(f"\n{Fore.GREEN}✓ PASS: Incremental seeding works!{Style.RESET_ALL}")
            return True
        else:
            print(
                f"\n{Fore.RED}✗ FAIL: Duplicate connections created!{Style.RESET_ALL}"
            )
            return False


def test_posts_incremental():
    """Test that posts seeder skips existing posts"""
    print(f"\n{Fore.CYAN}{'=' * 70}{Style.RESET_ALL}")
    print(f"{Fore.CYAN}TEST: POSTS INCREMENTAL SEEDING{Style.RESET_ALL}")
    print(f"{Fore.CYAN}{'=' * 70}{Style.RESET_ALL}\n")

    from seeders.posts_seeder import PostsSeeder

    with httpx.Client() as http:
        seeder = PostsSeeder(http)

        # First run
        print(f"\n{Fore.YELLOW}RUN 1: Creating 10 posts...{Style.RESET_ALL}\n")
        stats_1 = seeder.seed(limit=10)
        created_1 = stats_1["posts"]

        # Second run
        print(
            f"\n{Fore.YELLOW}RUN 2: Creating 10 posts (should skip all)...{Style.RESET_ALL}\n"
        )
        stats_2 = seeder.seed(limit=10)
        created_2 = stats_2["posts"]

        # Verify
        print(f"\n{Fore.GREEN}{'=' * 70}{Style.RESET_ALL}")
        print(f"{Fore.GREEN}RESULTS:{Style.RESET_ALL}")
        print(f"  Run 1: Created {created_1} posts")
        print(f"  Run 2: Created {created_2} posts (expected: 0)")

        if created_2 == 0:
            print(f"\n{Fore.GREEN}✓ PASS: Incremental seeding works!{Style.RESET_ALL}")
            return True
        else:
            print(f"\n{Fore.RED}✗ FAIL: Duplicate posts created!{Style.RESET_ALL}")
            return False


def main():
    """Run all incremental seeding tests"""
    print(f"\n{Fore.CYAN}")
    print("=" * 70)
    print("  🧪 COLLABRYX INCREMENTAL SEEDING TEST SUITE")
    print("=" * 70)
    print(f"{Style.RESET_ALL}\n")

    if not config.validate():
        print(f"{Fore.RED}✗ Configuration validation failed{Style.RESET_ALL}")
        return 1

    results = {
        "profiles": test_profiles_incremental(),
        "connections": test_connections_incremental(),
        "posts": test_posts_incremental(),
    }

    # Summary
    print(f"\n{Fore.CYAN}{'=' * 70}{Style.RESET_ALL}")
    print(f"{Fore.CYAN}TEST SUMMARY{Style.RESET_ALL}")
    print(f"{Fore.CYAN}{'=' * 70}{Style.RESET_ALL}")

    passed = sum(1 for v in results.values() if v)
    total = len(results)

    for test_name, result in results.items():
        status = (
            f"{Fore.GREEN}✓ PASS{Style.RESET_ALL}"
            if result
            else f"{Fore.RED}✗ FAIL{Style.RESET_ALL}"
        )
        print(f"  {test_name.capitalize()}: {status}")

    print(f"\n  Total: {passed}/{total} tests passed")
    print(f"{Fore.CYAN}{'=' * 70}{Style.RESET_ALL}\n")

    return 0 if passed == total else 1


if __name__ == "__main__":
    sys.exit(main())
