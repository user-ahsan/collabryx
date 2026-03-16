"""
Social Seeder
Creates connections and match suggestions
"""

import random
import time
from typing import List, Dict, Any
from colorama import Fore, Style

from config import config


class SocialSeeder:
    """Seeder for connections and match suggestions"""

    def __init__(self, supabase_client):
        self.supabase = supabase_client
        self.created_connection_ids = []

    def create_connection(
        self,
        requester_id: str,
        receiver_id: str,
        status: str = "accepted",
        message: str = None,
    ) -> bool:
        """Create a connection between two users"""
        try:
            connection = {
                "requester_id": requester_id,
                "receiver_id": receiver_id,
                "status": status,
                "message": message,
            }

            result = self.supabase.table("connections").insert(connection).execute()

            if result.data:
                self.created_connection_ids.append(result.data[0]["id"])
                return True

            return False

        except Exception as e:
            # Ignore duplicate connections
            return False

    def create_match_suggestion(
        self,
        user_id: str,
        matched_user_id: str,
        match_percentage: int,
        reasons: List[Dict] = None,
    ) -> bool:
        """Create a match suggestion"""
        try:
            if reasons is None:
                reasons = [
                    {"type": "skill", "label": "Complementary Skills"},
                    {
                        "type": "interest",
                        "label": f"Shared Interest: {random.choice(['Startups', 'AI/ML', 'Open Source'])}",
                    },
                ]

            suggestion = {
                "user_id": user_id,
                "matched_user_id": matched_user_id,
                "match_percentage": match_percentage,
                "reasons": reasons,
                "ai_confidence": random.uniform(0.7, 0.95),
                "ai_explanation": f"Strong match based on complementary skills and shared interests in {random.choice(['technology', 'innovation', 'entrepreneurship'])}.",
                "status": "active",
            }

            result = (
                self.supabase.table("match_suggestions").insert(suggestion).execute()
            )
            return bool(result.data)

        except Exception as e:
            return False

    def seed_connections(self, user_ids: List[str], count: int = None) -> int:
        """Seed connections between users"""

        if count is None:
            count = config.SEED_COUNT_CONNECTIONS

        print(f"\n{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}")
        print(f"{Fore.CYAN}SEEDING {count} CONNECTIONS{Style.RESET_ALL}")
        print(f"{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}\n")

        created = 0
        existing_pairs = set()

        for i in range(count * 3):  # Try 3x to account for duplicates
            if created >= count:
                break

            requester, receiver = random.sample(user_ids, 2)
            pair_key = tuple(sorted([requester, receiver]))

            if pair_key in existing_pairs:
                continue

            existing_pairs.add(pair_key)

            # Weighted status
            status = random.choices(
                ["accepted", "pending", "declined"], weights=[70, 20, 10]
            )[0]

            if self.create_connection(requester, receiver, status):
                created += 1

                # Create reverse connection for accepted
                if status == "accepted":
                    self.create_connection(receiver, requester, "accepted")

            if (created + 1) % 50 == 0:
                print(
                    f"{Fore.GREEN}✓ Created {created}/{count} connections...{Style.RESET_ALL}"
                )
                time.sleep(config.DELAY_BETWEEN_BATCHES)

        print(f"\n{Fore.GREEN}{'=' * 60}{Style.RESET_ALL}")
        print(f"{Fore.GREEN}✓ Created {created}/{count} connections{Style.RESET_ALL}")
        print(f"{Fore.GREEN}{'=' * 60}{Style.RESET_ALL}\n")

        return created

    def seed_match_suggestions(
        self, user_ids: List[str], suggestions_per_user: int = 5
    ) -> int:
        """Seed match suggestions for users"""

        print(f"\n{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}")
        print(f"{Fore.CYAN}SEEDING MATCH SUGGESTIONS{Style.RESET_ALL}")
        print(f"{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}\n")

        created = 0

        for user_id in user_ids[:50]:  # Limit to first 50 users
            # Get random potential matches
            potential_matches = [u for u in user_ids if u != user_id]
            matches = random.sample(
                potential_matches, min(suggestions_per_user, len(potential_matches))
            )

            for matched_user in matches:
                match_percentage = random.randint(60, 95)
                if self.create_match_suggestion(
                    user_id, matched_user, match_percentage
                ):
                    created += 1

            if (created + 1) % 50 == 0:
                print(
                    f"{Fore.GREEN}✓ Created {created} match suggestions...{Style.RESET_ALL}"
                )
                time.sleep(config.DELAY_BETWEEN_BATCHES)

        print(f"\n{Fore.GREEN}{'=' * 60}{Style.RESET_ALL}")
        print(f"{Fore.GREEN}✓ Created {created} match suggestions{Style.RESET_ALL}")
        print(f"{Fore.GREEN}{'=' * 60}{Style.RESET_ALL}\n")

        return created

    def seed_all(self, user_ids: List[str]) -> Dict[str, int]:
        """Seed all social data"""
        connections = self.seed_connections(user_ids)
        suggestions = self.seed_match_suggestions(user_ids)

        return {"connections": connections, "match_suggestions": suggestions}


if __name__ == "__main__":
    print("Social seeder module loaded successfully")
