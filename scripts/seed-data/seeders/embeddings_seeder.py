"""
Embeddings Seeder
Triggers embedding generation via local Python worker using Supabase REST API
"""

import time
import httpx
from typing import List, Dict, Any
from colorama import Fore, Style

from config import config


class EmbeddingsSeeder:
    """Seeder for profile embeddings using Python worker and REST API"""

    def __init__(self, http_client: httpx.Client, worker_url: str = None):
        self.http = http_client
        self.worker_url = worker_url or config.PYTHON_WORKER_URL
        self.successful = 0
        self.failed = 0

    def get_profiles_without_embeddings(self) -> List[Dict[str, Any]]:
        """Get profiles that don't have embeddings yet via REST API"""
        try:
            # Get all profiles
            profiles_response = self.http.get(
                f"{config.SUPABASE_REST_URL}/profiles?select=id,display_name,headline,bio,location,looking_for",
                headers=config.API_HEADERS,
            )
            profiles_response.raise_for_status()
            profiles = profiles_response.json()

            if not profiles:
                return []

            # Get existing embeddings
            embeddings_response = self.http.get(
                f"{config.SUPABASE_REST_URL}/profile_embeddings?select=user_id,status",
                headers=config.API_HEADERS,
            )
            embeddings_response.raise_for_status()
            embeddings = embeddings_response.json()

            embedded_users = set()
            if embeddings:
                embedded_users = {
                    e["user_id"] for e in embeddings if e["status"] == "completed"
                }

            # Filter to profiles without embeddings
            result = [p for p in profiles if p["id"] not in embedded_users]

            return result

        except Exception as e:
            print(f"{Fore.RED}✗ Failed to get profiles: {e}{Style.RESET_ALL}")
            return []

    def get_user_data(self, user_id: str, table: str) -> List[Dict]:
        """Get related data for a user via REST API"""
        try:
            response = self.http.get(
                f"{config.SUPABASE_REST_URL}/{table}?user_id=eq.{user_id}",
                headers=config.API_HEADERS,
            )
            response.raise_for_status()
            return response.json() or []
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

    def queue_profiles_for_embeddings(self, user_ids: List[str]) -> int:
        """Add profiles to the pending queue for embedding generation"""
        print(f"\n{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}")
        print(
            f"{Fore.CYAN}QUEUING {len(user_ids)} PROFILES FOR EMBEDDINGS{Style.RESET_ALL}"
        )
        print(f"{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}\n")

        queued = 0

        for user_id in user_ids:
            try:
                # Insert into pending queue (upsert - replace if exists)
                queue_data = {
                    "user_id": user_id,
                    "status": "pending",
                    "trigger_source": "manual",
                    "metadata": {"seeded": True},
                }

                response = self.http.post(
                    f"{config.SUPABASE_REST_URL}/embedding_pending_queue",
                    json=queue_data,
                    headers=config.API_HEADERS,
                )

                if response.status_code in [200, 201, 409]:
                    queued += 1
                else:
                    print(
                        f"{Fore.RED}✗ Failed to queue {user_id}: {response.status_code}{Style.RESET_ALL}"
                    )

            except Exception as e:
                print(f"{Fore.RED}✗ Error queuing {user_id}: {e}{Style.RESET_ALL}")

        print(f"\n{Fore.GREEN}{'=' * 60}{Style.RESET_ALL}")
        print(
            f"{Fore.GREEN}✓ Queued {queued}/{len(user_ids)} profiles for embedding generation{Style.RESET_ALL}"
        )
        print(f"{Fore.GREEN}{'=' * 60}{Style.RESET_ALL}\n")

        return queued

    def seed_embeddings(self, batch_size: int = None) -> Dict[str, int]:
        """Seed embeddings for profiles by calling Python worker"""

        if batch_size is None:
            batch_size = config.BATCH_SIZE

        print(f"\n{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}")
        print(f"{Fore.CYAN}GENERATING EMBEDDINGS (via Python Worker){Style.RESET_ALL}")
        print(f"{Fore.CYAN}Worker URL: {self.worker_url}{Style.RESET_ALL}")
        print(f"{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}\n")

        # Check if worker is available
        try:
            health_response = httpx.get(f"{self.worker_url}/health", timeout=5.0)
            if health_response.status_code != 200:
                print(
                    f"{Fore.YELLOW}⚠️  Python worker not available at {self.worker_url}{Style.RESET_ALL}"
                )
                print(
                    f"{Fore.YELLOW}   Make sure Docker container is running: docker-compose up -d{Style.RESET_ALL}"
                )
                return {"successful": 0, "failed": 0, "skipped": 0}
            print(f"{Fore.GREEN}✓ Python worker is healthy{Style.RESET_ALL}")
        except Exception as e:
            print(
                f"{Fore.YELLOW}⚠️  Cannot connect to Python worker at {self.worker_url}{Style.RESET_ALL}"
            )
            print(f"{Fore.YELLOW}   Error: {e}{Style.RESET_ALL}")
            print(
                f"{Fore.YELLOW}   Make sure Docker container is running: cd ../../python-worker && docker-compose up -d{Style.RESET_ALL}"
            )
            return {"successful": 0, "failed": 0, "skipped": 0}

        # Get profiles from pending queue
        try:
            queue_response = self.http.get(
                f"{config.SUPABASE_REST_URL}/embedding_pending_queue?select=user_id&status=eq.pending",
                headers=config.API_HEADERS,
            )
            queue_response.raise_for_status()
            queue = queue_response.json() or []

            if not queue:
                print(f"{Fore.GREEN}✓ No profiles in pending queue{Style.RESET_ALL}")
                return {"successful": 0, "failed": 0, "skipped": 0}

            print(
                f"{Fore.YELLOW}Found {len(queue)} profiles in pending queue{Style.RESET_ALL}\n"
            )

            # Process each profile in queue
            for i, item in enumerate(queue, 1):
                user_id = item.get("user_id")
                if not user_id:
                    continue

                # Get profile data
                profile_response = self.http.get(
                    f"{config.SUPABASE_REST_URL}/profiles?id=eq.{user_id}&select=id,display_name,headline,bio,location,looking_for",
                    headers=config.API_HEADERS,
                )
                profiles = profile_response.json() or []

                if not profiles:
                    print(f"[{i}/{len(queue)}] Profile {user_id} not found")
                    continue

                profile = profiles[0]
                skills = self.get_user_data(user_id, "user_skills")
                interests = self.get_user_data(user_id, "user_interests")

                semantic_text = self.construct_semantic_text(profile, skills, interests)

                if len(semantic_text.strip()) < 10:
                    print(
                        f"[{i}/{len(queue)}] Skipping {profile.get('display_name', user_id)} (insufficient data)"
                    )
                    continue

                print(
                    f"[{i}/{len(queue)}] Generating embedding for {profile.get('display_name', user_id)}..."
                )

                if self.request_embedding(user_id, semantic_text):
                    print(f"{Fore.GREEN}  ✓ Sent to worker{Style.RESET_ALL}")
                else:
                    print(f"{Fore.RED}  ✗ Failed or rate limited{Style.RESET_ALL}")

                # Rate limiting
                if i % batch_size == 0:
                    print(
                        f"\n{Fore.YELLOW}⏳ Pausing for {config.DELAY_BETWEEN_BATCHES}s...{Style.RESET_ALL}"
                    )
                    time.sleep(config.DELAY_BETWEEN_BATCHES)

        except Exception as e:
            print(f"{Fore.RED}✗ Error processing queue: {e}{Style.RESET_ALL}")

        print(f"\n{Fore.GREEN}{'=' * 60}{Style.RESET_ALL}")
        print(f"{Fore.GREEN}✓ Successful: {self.successful}{Style.RESET_ALL}")
        print(f"{Fore.RED}✗ Failed: {self.failed}{Style.RESET_ALL}")
        print(f"{Fore.GREEN}{'=' * 60}{Style.RESET_ALL}\n")

        return {
            "successful": self.successful,
            "failed": self.failed,
            "skipped": len(queue) - self.successful - self.failed,
        }


if __name__ == "__main__":
    print("Embeddings seeder module loaded successfully")
