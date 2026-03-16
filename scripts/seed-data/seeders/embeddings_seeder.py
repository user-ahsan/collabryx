"""
Embeddings Seeder
Triggers embedding generation via Python worker
"""

import time
import httpx
from typing import List, Dict, Any
from colorama import Fore, Style

from config import config


class EmbeddingsSeeder:
    """Seeder for profile embeddings using Python worker"""

    def __init__(self, supabase_client, worker_url: str = None):
        self.supabase = supabase_client
        self.worker_url = worker_url or config.PYTHON_WORKER_URL
        self.successful = 0
        self.failed = 0

    def get_profiles_without_embeddings(self) -> List[Dict[str, Any]]:
        """Get profiles that don't have embeddings yet"""
        try:
            # Get profiles without completed embeddings
            result = (
                self.supabase.table("profiles")
                .select("id, display_name, headline, bio, location, looking_for")
                .limit(100)
                .execute()
            )

            if not result.data:
                return []

            # Get existing embeddings
            embeddings_result = (
                self.supabase.table("profile_embeddings")
                .select("user_id, status")
                .execute()
            )
            embedded_users = set()

            if embeddings_result.data:
                embedded_users = {
                    e["user_id"]
                    for e in embeddings_result.data
                    if e["status"] == "completed"
                }

            # Filter to profiles without embeddings
            profiles = [p for p in result.data if p["id"] not in embedded_users]

            return profiles

        except Exception as e:
            print(f"{Fore.RED}✗ Failed to get profiles: {e}{Style.RESET_ALL}")
            return []

    def get_user_skills(self, user_id: str) -> List[Dict]:
        """Get skills for a user"""
        try:
            result = (
                self.supabase.table("user_skills")
                .select("skill_name")
                .eq("user_id", user_id)
                .execute()
            )
            return result.data or []
        except:
            return []

    def get_user_interests(self, user_id: str) -> List[Dict]:
        """Get interests for a user"""
        try:
            result = (
                self.supabase.table("user_interests")
                .select("interest")
                .eq("user_id", user_id)
                .execute()
            )
            return result.data or []
        except:
            return []

    def construct_semantic_text(
        self, profile: Dict, skills: List[Dict], interests: List[Dict]
    ) -> str:
        """Construct semantic text for embedding"""
        parts = []

        if profile.get("headline"):
            parts.append(f"Role: {profile['headline']}.")

        if profile.get("bio"):
            parts.append(f"Bio: {profile['bio']}.")

        if skills:
            skill_names = [s["skill_name"] for s in skills]
            parts.append(f"Skills: {', '.join(skill_names)}.")

        if interests:
            interest_names = [i["interest"] for i in interests]
            parts.append(f"Interests: {', '.join(interest_names)}.")

        if profile.get("location"):
            parts.append(f"Location: {profile['location']}.")

        return " ".join(parts)

    def request_embedding(self, user_id: str, text: str) -> bool:
        """Request embedding generation from Python worker"""
        try:
            response = httpx.post(
                f"{self.worker_url}/generate-embedding",
                json={
                    "user_id": user_id,
                    "text": text,
                    "request_id": f"seed-{user_id}",
                },
                timeout=10.0,
            )

            if response.status_code == 200:
                self.successful += 1
                return True
            elif response.status_code == 429:
                # Rate limited, skip
                return False
            else:
                self.failed += 1
                return False

        except Exception as e:
            self.failed += 1
            return False

    def seed_embeddings(self, batch_size: int = None) -> Dict[str, int]:
        """Seed embeddings for profiles"""

        if batch_size is None:
            batch_size = config.BATCH_SIZE

        print(f"\n{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}")
        print(f"{Fore.CYAN}SEEDING EMBEDDINGS (via Python Worker){Style.RESET_ALL}")
        print(f"{Fore.CYAN}Worker URL: {self.worker_url}{Style.RESET_ALL}")
        print(f"{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}\n")

        # Check if worker is available
        try:
            health_response = httpx.get(f"{self.worker_url}/health", timeout=5.0)
            if health_response.status_code != 200:
                print(
                    f"{Fore.YELLOW}⚠️  Python worker not available. Skipping embeddings.{Style.RESET_ALL}"
                )
                return {"successful": 0, "failed": 0, "skipped": 0}
        except:
            print(
                f"{Fore.YELLOW}⚠️  Cannot connect to Python worker. Skipping embeddings.{Style.RESET_ALL}"
            )
            return {"successful": 0, "failed": 0, "skipped": 0}

        profiles = self.get_profiles_without_embeddings()

        if not profiles:
            print(
                f"{Fore.GREEN}✓ All profiles already have embeddings{Style.RESET_ALL}"
            )
            return {"successful": 0, "failed": 0, "skipped": len(profiles)}

        print(
            f"{Fore.YELLOW}Found {len(profiles)} profiles without embeddings{Style.RESET_ALL}\n"
        )

        for i, profile in enumerate(profiles, 1):
            skills = self.get_user_skills(profile["id"])
            interests = self.get_user_interests(profile["id"])

            semantic_text = self.construct_semantic_text(profile, skills, interests)

            if len(semantic_text.strip()) < 10:
                print(
                    f"{Fore.YELLOW}⊘ Skipping {profile['display_name']} (insufficient data){Style.RESET_ALL}"
                )
                continue

            print(
                f"[{i}/{len(profiles)}] Requesting embedding for {profile['display_name']}..."
            )

            if self.request_embedding(profile["id"], semantic_text):
                print(f"{Fore.GREEN}  ✓ Queued{Style.RESET_ALL}")
            else:
                print(f"{Fore.RED}  ✗ Failed or rate limited{Style.RESET_ALL}")

            # Rate limiting - respect worker limits
            if i % batch_size == 0:
                print(
                    f"\n{Fore.YELLOW}⏳ Pausing for {config.DELAY_BETWEEN_BATCHES}s...{Style.RESET_ALL}"
                )
                time.sleep(config.DELAY_BETWEEN_BATCHES)

        print(f"\n{Fore.GREEN}{'=' * 60}{Style.RESET_ALL}")
        print(f"{Fore.GREEN}✓ Successful: {self.successful}{Style.RESET_ALL}")
        print(f"{Fore.RED}✗ Failed: {self.failed}{Style.RESET_ALL}")
        print(f"{Fore.GREEN}{'=' * 60}{Style.RESET_ALL}\n")

        return {
            "successful": self.successful,
            "failed": self.failed,
            "skipped": len(profiles) - self.successful - self.failed,
        }


if __name__ == "__main__":
    print("Embeddings seeder module loaded successfully")
