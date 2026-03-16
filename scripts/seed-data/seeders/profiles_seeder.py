"""
Profiles Seeder
Creates auth users and their associated profile data using Supabase REST API
"""

import time
import random
import httpx
from datetime import datetime
from typing import List, Dict, Any, Optional
from colorama import Fore, Style

from config import config
from data_generators.profiles import generate_profiles


class ProfilesSeeder:
    """Seeder for user profiles and related data using REST API"""

    def __init__(self, http_client: httpx.Client):
        self.http = http_client
        self.created_user_ids = []

    def create_auth_user(
        self, email: str, password: str, full_name: str = None
    ) -> Optional[str]:
        """Create a Supabase auth user via REST API"""
        try:
            user_data = {
                "email": email,
                "password": password,
                "email_confirm": True,
            }

            if full_name:
                user_data["user_metadata"] = {"full_name": full_name}

            # Use Supabase Admin API (Gotrue) - correct endpoint
            response = self.http.post(
                f"{config.SUPABASE_AUTH_URL}/admin/users",
                json=user_data,
                headers={
                    "apikey": config.SUPABASE_SERVICE_ROLE_KEY,
                    "Authorization": f"Bearer {config.SUPABASE_SERVICE_ROLE_KEY}",
                    "Content-Type": "application/json",
                },
            )

            if response.status_code != 200:
                print(
                    f"{Fore.RED}✗ Auth API Error {response.status_code}: {response.text[:200]}{Style.RESET_ALL}"
                )
                return None

            user = response.json()
            return user.get("id")

        except httpx.HTTPStatusError as e:
            print(
                f"{Fore.RED}✗ Failed to create auth user {email}: HTTP {e.response.status_code} - {e.response.text[:200]}{Style.RESET_ALL}"
            )
            return None
        except Exception as e:
            print(
                f"{Fore.RED}✗ Failed to create auth user {email}: {type(e).__name__}: {e}{Style.RESET_ALL}"
            )
            return None

    def create_profile(self, user_id: str, profile_data: Dict[str, Any]) -> bool:
        """Create profile record via REST API"""
        try:
            profile = {
                "id": user_id,
                "email": profile_data["email"],
                "display_name": profile_data["display_name"],
                "full_name": profile_data["full_name"],
                "headline": profile_data["headline"],
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
            }

            response = self.http.post(
                f"{config.SUPABASE_REST_URL}/profiles",
                json=profile,
                headers=config.API_HEADERS,
            )
            response.raise_for_status()
            print(
                f"{Fore.GREEN}✓ Created profile for {profile_data['display_name']}{Style.RESET_ALL}"
            )
            return True

        except Exception as e:
            print(f"{Fore.RED}✗ Failed to create profile: {e}{Style.RESET_ALL}")
            return False

    def create_skills(self, user_id: str, skills: List[Dict[str, Any]]) -> bool:
        """Create user skills via REST API"""
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
            response.raise_for_status()
            return True

        except Exception as e:
            print(f"{Fore.RED}✗ Failed to create skills: {e}{Style.RESET_ALL}")
            return False

    def create_interests(self, user_id: str, interests: List[str]) -> bool:
        """Create user interests via REST API"""
        try:
            interests_data = [
                {"user_id": user_id, "interest": interest} for interest in interests
            ]

            response = self.http.post(
                f"{config.SUPABASE_REST_URL}/user_interests",
                json=interests_data,
                headers=config.API_HEADERS,
            )
            response.raise_for_status()
            return True

        except Exception as e:
            print(f"{Fore.RED}✗ Failed to create interests: {e}{Style.RESET_ALL}")
            return False

    def create_experiences(
        self, user_id: str, experiences: List[Dict[str, Any]]
    ) -> bool:
        """Create user experiences via REST API"""
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
            response.raise_for_status()
            return True

        except Exception as e:
            print(f"{Fore.RED}✗ Failed to create experiences: {e}{Style.RESET_ALL}")
            return False

    def create_projects(self, user_id: str, projects: List[Dict[str, Any]]) -> bool:
        """Create user projects via REST API"""
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
            response.raise_for_status()
            return True

        except Exception as e:
            print(f"{Fore.RED}✗ Failed to create projects: {e}{Style.RESET_ALL}")
            return False

    def seed_profile(
        self, profile_data: Dict[str, Any], password: str = "DemoPass123!"
    ) -> Optional[str]:
        """Seed a complete profile with all related data"""

        # Step 1: Create auth user
        user_id = self.create_auth_user(
            email=profile_data["email"],
            password=password,
            full_name=profile_data["full_name"],
        )

        if not user_id:
            return None

        # Step 2: Create profile
        if not self.create_profile(user_id, profile_data):
            return None

        # Step 3: Create skills
        self.create_skills(user_id, profile_data["skills"])

        # Step 4: Create interests
        self.create_interests(user_id, profile_data["interests"])

        # Step 5: Create experiences
        self.create_experiences(user_id, profile_data["experiences"])

        # Step 6: Create projects
        self.create_projects(user_id, profile_data["projects"])

        self.created_user_ids.append(user_id)
        return user_id

    def seed_profiles(self, count: int = None, batch_size: int = None) -> List[str]:
        """Seed multiple profiles"""

        if count is None:
            count = config.SEED_COUNT_PROFILES

        if batch_size is None:
            batch_size = config.BATCH_SIZE

        print(f"\n{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}")
        print(f"{Fore.CYAN}SEEDING {count} PROFILES{Style.RESET_ALL}")
        print(f"{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}\n")

        # Generate profile data
        profiles = generate_profiles(count)

        created_ids = []

        for i, profile in enumerate(profiles, 1):
            print(
                f"\n{Fore.YELLOW}[{i}/{count}] Creating: {profile['display_name']}{Style.RESET_ALL}"
            )
            print(f"  Industry: {profile['industry']}")
            print(f"  Email: {profile['email']}")

            user_id = self.seed_profile(profile)

            if user_id:
                created_ids.append(user_id)

            # Rate limiting - delay between batches
            if i % batch_size == 0:
                delay = config.DELAY_BETWEEN_BATCHES
                print(f"\n{Fore.YELLOW}⏳ Pausing for {delay}s...{Style.RESET_ALL}")
                time.sleep(delay)

        print(f"\n{Fore.GREEN}{'=' * 60}{Style.RESET_ALL}")
        print(
            f"{Fore.GREEN}✓ Successfully created {len(created_ids)}/{count} profiles{Style.RESET_ALL}"
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
