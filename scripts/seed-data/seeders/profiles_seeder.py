"""
Profiles Seeder
Creates auth users and their associated profile data using Supabase REST API
Supports incremental seeding - skips existing users/profiles
"""

import time
import random
import httpx
from datetime import datetime
from typing import List, Dict, Any, Optional, Set
from colorama import Fore, Style

from config import config
from data_generators.profiles import generate_profiles


class ProfilesSeeder:
    """Seeder for user profiles and related data using REST API with incremental seeding"""

    def __init__(self, http_client: httpx.Client):
        self.http = http_client
        self.created_user_ids = []
        self.existing_emails: Set[str] = set()
        self.existing_profile_ids: Set[str] = set()
        self.incomplete_profile_ids: Set[str] = set()
        self.stats = {
            "created": 0,
            "skipped_email_exists": 0,
            "skipped_profile_exists": 0,
            "skipped_other": 0,
            "failed": 0,
        }

    def fetch_existing_emails(self) -> Set[str]:
        """Fetch all existing profile emails to avoid duplicates"""
        try:
            response = self.http.get(
                f"{config.SUPABASE_REST_URL}/profiles?select=email",
                headers=config.API_HEADERS,
            )
            response.raise_for_status()
            profiles = response.json() or []
            self.existing_emails = {p["email"] for p in profiles}
            print(
                f"{Fore.YELLOW}  → Found {len(self.existing_emails)} existing emails{Style.RESET_ALL}"
            )
            return self.existing_emails
        except Exception as e:
            print(f"{Fore.RED}✗ Failed to fetch existing emails: {e}{Style.RESET_ALL}")
            return set()

    def fetch_existing_profile_ids(self) -> Set[str]:
        """Fetch all existing profile IDs + onboarding status to detect incomplete profiles"""
        try:
            response = self.http.get(
                f"{config.SUPABASE_REST_URL}/profiles?select=id,onboarding_completed",
                headers=config.API_HEADERS,
            )
            response.raise_for_status()
            profiles = response.json() or []
            self.existing_profile_ids = {p["id"] for p in profiles}
            # Track incomplete profiles separately — these need updating, not skipping
            self.incomplete_profile_ids = {
                p["id"] for p in profiles if not p.get("onboarding_completed")
            }
            print(
                f"{Fore.YELLOW}  → Found {len(self.existing_profile_ids)} profiles"
                f" ({len(self.incomplete_profile_ids)} incomplete){Style.RESET_ALL}"
            )
            return self.existing_profile_ids
        except Exception as e:
            print(
                f"{Fore.RED}✗ Failed to fetch existing profile IDs: {e}{Style.RESET_ALL}"
            )
            return set()

    def email_exists(self, email: str) -> bool:
        """Check if email already exists in database"""
        if not self.existing_emails:
            self.fetch_existing_emails()
        return email in self.existing_emails

    def create_auth_user(
        self, email: str, password: str, full_name: str = None
    ) -> Optional[str]:
        """Create a Supabase auth user via REST API with duplicate checking

        Args:
            email: User email
            password: User password (uses SEED_USER_PASSWORD from ENV)
            full_name: Optional full name for metadata

        Returns:
            User ID if created, None if failed or exists
        """
        try:
            # Check if email already exists
            if self.email_exists(email):
                print(
                    f"{Fore.YELLOW}  ⚠️  Email exists, skipping: {email}{Style.RESET_ALL}"
                )
                self.stats["skipped_email_exists"] += 1
                return None

            user_data = {
                "email": email,
                "password": password,
                "email_confirm": True,
            }

            if full_name:
                user_data["user_metadata"] = {"full_name": full_name}

            # For self-hosted Supabase with Kong gateway
            auth_admin_url = config.SUPABASE_URL.rstrip("/") + "/auth/v1/admin/users"
            response = self.http.post(
                auth_admin_url,
                json=user_data,
                headers={
                    "apikey": config.SUPABASE_SERVICE_ROLE_KEY,
                    "Authorization": f"Bearer {config.SUPABASE_SERVICE_ROLE_KEY}",
                    "Content-Type": "application/json",
                },
            )

            if response.status_code == 400:
                # Email might already be registered
                error_text = response.text.lower()
                if "email" in error_text and "already" in error_text:
                    print(
                        f"{Fore.YELLOW}  ⚠️  Email already registered: {email}{Style.RESET_ALL}"
                    )
                    self.stats["skipped_email_exists"] += 1
                    self.existing_emails.add(email)
                    return None

            if response.status_code != 200:
                print(
                    f"{Fore.RED}✗ Auth API Error {response.status_code}: {response.text[:200]}{Style.RESET_ALL}"
                )
                self.stats["failed"] += 1
                return None

            user = response.json()
            user_id = user.get("id")

            if user_id:
                # Add to existing emails cache
                self.existing_emails.add(email)

            return user_id

        except httpx.HTTPStatusError as e:
            if e.response.status_code == 400:
                error_text = e.response.text.lower()
                if "email" in error_text and "already" in error_text:
                    print(
                        f"{Fore.YELLOW}  ⚠️  Email already registered: {email}{Style.RESET_ALL}"
                    )
                    self.stats["skipped_email_exists"] += 1
                    self.existing_emails.add(email)
                    return None
            print(
                f"{Fore.RED}✗ Failed to create auth user {email}: HTTP {e.response.status_code} - {e.response.text[:200]}{Style.RESET_ALL}"
            )
            self.stats["failed"] += 1
            return None
        except Exception as e:
            print(
                f"{Fore.RED}✗ Failed to create auth user {email}: {type(e).__name__}: {e}{Style.RESET_ALL}"
            )
            self.stats["failed"] += 1
            return None

    def create_profile(self, user_id: str, profile_data: Dict[str, Any]) -> bool:
        """Create or update profile record via REST API.

        If the profile already exists (created by DB trigger) but is incomplete
        (onboarding_completed=false), PATCH it with full data. Otherwise skip.
        """
        try:
            profile = {
                "id": user_id,
                "email": profile_data["email"],
                "display_name": profile_data["display_name"],
                "full_name": profile_data["full_name"],
                "headline": profile_data["headline"],
                "avatar_url": profile_data.get("avatar_url"),
                "banner_url": profile_data.get("banner_url"),
                "bio": profile_data["bio"],
                "location": profile_data["location"],
                "website_url": profile_data.get("website_url"),
                "collaboration_readiness": profile_data["collaboration_readiness"],
                "is_verified": profile_data["is_verified"],
                "verification_type": profile_data.get("verification_type"),
                "university": profile_data.get("university"),
                "profile_completion": profile_data["profile_completion"],
                "looking_for": profile_data["looking_for"],
                "onboarding_completed": profile_data["onboarding_completed"],
                # SOCIAL URL FIELDS - Added to fix incomplete profile seeding
                # ------------------------------------------------------------------
                # WHY: The profiles table schema includes four social link columns
                # (github_url, linkedin_url, twitter_url, portfolio_url) that were
                # defined in the database schema and in the TypeScript types but were
                # never populated by any seeder. The original ProfilesSeeder only
                # wrote the 16 core fields from the generate_complete_profile dict
                # and silently ignored the rest. This meant that even after seeding
                # 500+ profiles, these columns remained NULL for every single row.
                #
                # Impact: Downstream features that depend on social links (the profile
                # header component, user card grids, connection suggestion panels, and
                # the onboarding flow) could not be properly tested because there was
                # never any social data to render. UI states like "partial social links"
                # or "no social links" were impossible to validate without manually
                # editing database rows.
                #
                # Fix: The data generator (profiles.py) now produces random social URLs
                # with realistic fill rates per platform. The seeder must extract these
                # from the generated profile dict and include them in the REST API
                # POST/PATCH payload so they actually reach the database. Without this
                # change, the data in the generator would be generated and immediately
                # discarded — computed but never persisted.
                "github_url": profile_data.get("github_url"),
                "linkedin_url": profile_data.get("linkedin_url"),
                "twitter_url": profile_data.get("twitter_url"),
                "portfolio_url": profile_data.get("portfolio_url"),
            }

            # Check if profile exists but is incomplete — update it
            if user_id in self.incomplete_profile_ids:
                patch_headers = dict(config.API_HEADERS)
                patch_headers["Prefer"] = "return=minimal"
                resp = self.http.patch(
                    f"{config.SUPABASE_REST_URL}/profiles?id=eq.{user_id}",
                    json={k: v for k, v in profile.items() if k != "id"},
                    headers=patch_headers,
                )
                if resp.status_code in [200, 204]:
                    print(
                        f"{Fore.GREEN}✓ Updated incomplete profile for {profile_data['display_name']}{Style.RESET_ALL}"
                    )
                    self.existing_profile_ids.add(user_id)
                    self.incomplete_profile_ids.discard(user_id)
                    self.stats["created"] += 1
                    return True
                else:
                    print(
                        f"{Fore.RED}✗ PATCH failed ({resp.status_code}) for {profile_data['display_name']}: {resp.text[:200]}{Style.RESET_ALL}"
                    )
                    self.stats["failed"] += 1
                    return False

            # Already complete profile — skip
            if user_id in self.existing_profile_ids:
                print(
                    f"{Fore.YELLOW}  ⚠️  Complete profile exists, skipping: {profile_data['display_name']}{Style.RESET_ALL}"
                )
                self.stats["skipped_profile_exists"] += 1
                return False

            # New profile — try insert, fallback to patch on conflict
            patch_headers = dict(config.API_HEADERS)
            patch_headers["Prefer"] = "return=minimal"
            # Use upsert via on_conflict if supported, then patch
            upsert_headers = dict(config.API_HEADERS)
            upsert_headers["Prefer"] = "resolution=merge-duplicates"
            response = self.http.post(
                f"{config.SUPABASE_REST_URL}/profiles",
                json=profile,
                headers=upsert_headers,
            )

            if response.status_code in [200, 201]:
                print(
                    f"{Fore.GREEN}✓ Created profile for {profile_data['display_name']}{Style.RESET_ALL}"
                )
                self.existing_profile_ids.add(user_id)
                self.stats["created"] += 1
                return True
            elif response.status_code == 409:
                # Fallback: update the existing (incomplete) profile
                resp = self.http.patch(
                    f"{config.SUPABASE_REST_URL}/profiles?id=eq.{user_id}",
                    json={k: v for k, v in profile.items() if k != "id"},
                    headers=patch_headers,
                )
                if resp.status_code in [200, 204]:
                    print(
                        f"{Fore.GREEN}✓ Updated profile for {profile_data['display_name']}{Style.RESET_ALL}"
                    )
                    self.existing_profile_ids.add(user_id)
                    self.stats["created"] += 1
                    return True
                else:
                    print(
                        f"{Fore.RED}✗ PATCH fallback failed ({resp.status_code}) for {profile_data['display_name']}{Style.RESET_ALL}"
                    )
                    self.stats["failed"] += 1
                    return False
            elif response.status_code == 400:
                print(
                    f"{Fore.RED}✗ Bad request for {profile_data['display_name']}: {response.text[:200]}{Style.RESET_ALL}"
                )
                self.stats["failed"] += 1
                return False
            else:
                response.raise_for_status()
                return True

        except Exception as e:
            print(
                f"{Fore.RED}✗ Failed to create/update profile: {type(e).__name__}: {e}{Style.RESET_ALL}"
            )
            self.stats["failed"] += 1
            return False

    def create_skills(self, user_id: str, skills: List[Dict[str, Any]]) -> bool:
        """Create user skills via REST API (skip if exists)"""
        try:
            skills_data = [
                {
                    "user_id": user_id,
                    "skill_name": skill["skill_name"],
                    "proficiency": skill["proficiency"],
                    "is_primary": skill["is_primary"],
                }
                for skill in skills
            ]

            response = self.http.post(
                f"{config.SUPABASE_REST_URL}/user_skills",
                json=skills_data,
                headers=config.API_HEADERS,
            )

            # 201 Created or 409 Conflict (already exists) are both OK
            if response.status_code in [201, 409]:
                return True

            response.raise_for_status()
            return True

        except Exception as e:
            print(f"{Fore.YELLOW}⚠ Skills skipped for {user_id}: {e}{Style.RESET_ALL}")
            return False

    def create_interests(self, user_id: str, interests: List[str]) -> bool:
        """Create user interests via REST API (skip if exists)"""
        try:
            interests_data = [
                {"user_id": user_id, "interest": interest} for interest in interests
            ]

            response = self.http.post(
                f"{config.SUPABASE_REST_URL}/user_interests",
                json=interests_data,
                headers=config.API_HEADERS,
            )

            if response.status_code in [201, 409]:
                return True

            response.raise_for_status()
            return True

        except Exception as e:
            print(f"{Fore.YELLOW}⚠ Interests skipped for {user_id}{Style.RESET_ALL}")
            return False

    def create_experiences(
        self, user_id: str, experiences: List[Dict[str, Any]]
    ) -> bool:
        """Create user experiences via REST API (skip if exists)"""
        try:
            experiences_data = [
                {
                    "user_id": user_id,
                    "title": exp["title"],
                    "company": exp["company"],
                    "description": exp["description"],
                    "start_date": exp["start_date"],
                    "end_date": exp.get("end_date"),
                    "is_current": exp["is_current"],
                    "order_index": exp["order_index"],
                }
                for exp in experiences
            ]

            response = self.http.post(
                f"{config.SUPABASE_REST_URL}/user_experiences",
                json=experiences_data,
                headers=config.API_HEADERS,
            )

            if response.status_code in [201, 409]:
                return True

            response.raise_for_status()
            return True

        except Exception as e:
            print(f"{Fore.YELLOW}⚠ Experiences skipped for {user_id}{Style.RESET_ALL}")
            return False

    def create_projects(self, user_id: str, projects: List[Dict[str, Any]]) -> bool:
        """Create user projects via REST API (skip if exists)"""
        try:
            projects_data = [
                {
                    "user_id": user_id,
                    "title": proj["title"],
                    "description": proj["description"],
                    "url": proj["url"],
                    "tech_stack": proj["tech_stack"],
                    "is_public": proj["is_public"],
                    "order_index": proj["order_index"],
                }
                for proj in projects
            ]

            response = self.http.post(
                f"{config.SUPABASE_REST_URL}/user_projects",
                json=projects_data,
                headers=config.API_HEADERS,
            )

            if response.status_code in [201, 409]:
                return True

            response.raise_for_status()
            return True

        except Exception as e:
            print(f"{Fore.YELLOW}⚠ Projects skipped for {user_id}{Style.RESET_ALL}")
            return False

    def seed_profile(
        self, profile_data: Dict[str, Any], password: str = None
    ) -> Optional[str]:
        """Seed a complete profile. Creates auth user if needed, updates incomplete profiles."""
        if password is None:
            password = config.SEED_USER_PASSWORD

        email = profile_data["email"]

        # Check if this email has an existing INCOMPLETE profile that needs updating
        if email in self.existing_emails:
            # Find the existing user_id for this email
            existing = self.http.get(
                f"{config.SUPABASE_REST_URL}/profiles?select=id,onboarding_completed&email=eq.{email}",
                headers=config.API_HEADERS,
            )
            existing_data = (existing.json() or [])
            if existing_data:
                existing_id = existing_data[0]["id"]
                is_complete = existing_data[0].get("onboarding_completed", False)

                if not is_complete:
                    # Incomplete profile — update it with full data, no new auth user needed
                    print(f"{Fore.CYAN}  → Updating incomplete profile: {email}{Style.RESET_ALL}")
                    profile_ok = self.create_profile(existing_id, profile_data)
                    if profile_ok:
                        self.create_skills(existing_id, profile_data["skills"])
                        self.create_interests(existing_id, profile_data["interests"])
                        self.create_experiences(existing_id, profile_data["experiences"])
                        self.create_projects(existing_id, profile_data["projects"])
                        self.created_user_ids.append(existing_id)
                        return existing_id
                    return None
                else:
                    # Already complete — skip
                    print(
                        f"{Fore.YELLOW}  ⚠️  Complete profile exists, skipping: {email}{Style.RESET_ALL}"
                    )
                    self.stats["skipped_email_exists"] += 1
                    return None

            # Email in our cache but profile not found (deleted?) — skip
            self.stats["skipped_email_exists"] += 1
            return None

        # Brand new user — create auth user first
        user_id = self.create_auth_user(
            email=email,
            password=password,
            full_name=profile_data["full_name"],
        )

        if not user_id:
            return None

        # Create/update profile
        profile_ok = self.create_profile(user_id, profile_data)
        if not profile_ok:
            return None

        self.create_skills(user_id, profile_data["skills"])
        self.create_interests(user_id, profile_data["interests"])
        self.create_experiences(user_id, profile_data["experiences"])
        self.create_projects(user_id, profile_data["projects"])

        self.created_user_ids.append(user_id)
        return user_id

    def seed_profiles(self, count: int = None, batch_size: int = None) -> List[str]:
        """Seed multiple profiles with incremental seeding (skip existing)

        Args:
            count: Number of profiles to seed (default from config)
            batch_size: Batch size for rate limiting (default from config)

        Returns:
            List of created user IDs
        """
        # Reset statistics
        self.stats = {
            "created": 0,
            "skipped_email_exists": 0,
            "skipped_profile_exists": 0,
            "skipped_other": 0,
            "failed": 0,
        }

        if count is None:
            count = int(config.LIMIT_PROFILES) if config.LIMIT_PROFILES != "-1" else 100

        if batch_size is None:
            batch_size = config.BATCH_SIZE

        # Fetch existing emails and profiles for duplicate checking
        print(
            f"\n{Fore.YELLOW}⏳ Fetching existing profiles for duplicate checking...{Style.RESET_ALL}"
        )
        self.fetch_existing_emails()
        self.fetch_existing_profile_ids()

        # Show current database status
        existing_profiles = len(self.existing_profile_ids)

        print(f"\n{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}")
        print(f"{Fore.CYAN}CURRENT DATABASE STATUS{Style.RESET_ALL}")
        print(f"{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}")
        print(
            f"  👤 Existing Profiles: {Fore.GREEN}{existing_profiles:,}{Style.RESET_ALL}"
        )
        print(f"{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}")
        print(
            f"\n{Fore.YELLOW}➕ Attempting to add {count:,} new profiles...{Style.RESET_ALL}\n"
        )

        print(f"{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}")
        print(
            f"{Fore.CYAN}SEEDING {count} PROFILES (Incremental Mode){Style.RESET_ALL}"
        )
        print(f"{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}\n")

        # Generate profile data with existing emails to avoid duplicates
        profiles = generate_profiles(count, existing_emails=self.existing_emails)

        created_ids = []

        for i, profile in enumerate(profiles, 1):
            print(
                f"\n{Fore.YELLOW}[{i}/{count}] {profile['display_name']}{Style.RESET_ALL}"
            )
            print(f"  Industry: {profile['industry']}")
            print(f"  Email: {profile['email']}")

            user_id = self.seed_profile(profile)

            if user_id:
                created_ids.append(user_id)
                print(f"  {Fore.GREEN}✓ Created{Style.RESET_ALL}")
            else:
                print(f"  {Fore.YELLOW}⊘ Skipped{Style.RESET_ALL}")

            # Rate limiting - delay between batches
            if i % batch_size == 0:
                delay = config.DELAY_BETWEEN_BATCHES
                print(f"\n{Fore.YELLOW}⏳ Pausing for {delay}s...{Style.RESET_ALL}")
                time.sleep(delay)

        # Print detailed statistics
        print(f"\n{Fore.GREEN}{'=' * 60}{Style.RESET_ALL}")
        print(f"{Fore.GREEN}✓ PROFILES SEEDING COMPLETE{Style.RESET_ALL}")
        print(f"{Fore.GREEN}{'=' * 60}{Style.RESET_ALL}")
        print(
            f"  Created:              {Fore.GREEN}{self.stats['created']:,}{Style.RESET_ALL}"
        )
        print(
            f"  Skipped (email):      {Fore.YELLOW}{self.stats['skipped_email_exists']:,}{Style.RESET_ALL}"
        )
        print(
            f"  Skipped (profile):    {Fore.YELLOW}{self.stats['skipped_profile_exists']:,}{Style.RESET_ALL}"
        )
        print(
            f"  Failed:               {Fore.RED if self.stats['failed'] > 0 else Fore.GREEN}{self.stats['failed']:,}{Style.RESET_ALL}"
        )
        print(
            f"  Total Processed:      {Fore.CYAN}{sum(self.stats.values()):,}{Style.RESET_ALL}"
        )
        print(f"{Fore.GREEN}{'=' * 60}{Style.RESET_ALL}\n")

        return created_ids

    def get_all_user_ids(self) -> List[str]:
        """Get all created user IDs"""
        return self.created_user_ids


# For testing
if __name__ == "__main__":
    import os
    from dotenv import load_dotenv

    load_dotenv()

    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if supabase_url and supabase_key:
        config.SUPABASE_URL = supabase_url
        config.SUPABASE_SERVICE_ROLE_KEY = supabase_key
        config.initialize()

        with httpx.Client() as http:
            seeder = ProfilesSeeder(http)

            # Test with 3 profiles
            user_ids = seeder.seed_profiles(count=3)
            print(f"\nCreated {len(user_ids)} users")
    else:
        print(
            "Missing Supabase credentials. Copy .env.example to .env and fill in your values."
        )
