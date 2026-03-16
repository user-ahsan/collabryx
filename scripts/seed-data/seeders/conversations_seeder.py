"""
Conversations Seeder
Creates conversations between users using Supabase REST API
Fetches real user UUIDs from database
"""

import random
import time
from datetime import datetime, timedelta
from typing import List, Dict, Any, Set, Tuple
from colorama import Fore, Style

from config import config
from seeders.base_seeder import BaseSeeder
from data_generators.conversations import generate_conversation


class ConversationsSeeder(BaseSeeder):
    """Seeder for conversations between users"""

    def __init__(self, http_client):
        super().__init__(http_client)
        self.existing_conversations = None

    def create_conversation(self, participant_1: str, participant_2: str) -> str:
        """Create a conversation between two users"""
        try:
            # Check if conversation already exists
            p1, p2 = (
                min(participant_1, participant_2),
                max(participant_1, participant_2),
            )

            response = self.http.get(
                f"{config.SUPABASE_REST_URL}/conversations?participant_1=eq.{p1}&participant_2=eq.{p2}",
                headers=config.API_HEADERS,
            )
            response.raise_for_status()
            existing = response.json()

            if existing and len(existing) > 0:
                return existing[0]["id"]

            conversation = {
                "participant_1": p1,
                "participant_2": p2,
                "last_message_text": None,
                "last_message_at": None,
                "unread_count_1": 0,
                "unread_count_2": 0,
                "is_archived": False,
            }

            result = self.create_single("conversations", conversation)
            return result or None

        except Exception as e:
            return None

    def seed(self, limit: int = None) -> Dict[str, int]:
        """Seed conversations with messages"""

        if limit is None:
            limit = (
                int(config.LIMIT_CONVERSATIONS)
                if config.LIMIT_CONVERSATIONS != "-1"
                else 150
            )

        print(f"\n{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}")
        print(f"{Fore.CYAN}SEEDING {limit} CONVERSATIONS{Style.RESET_ALL}")
        print(f"{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}\n")

        # Fetch user IDs
        user_ids = self.fetch_user_ids()

        if len(user_ids) < 2:
            print(
                f"{Fore.RED}✗ Need at least 2 users. Seed profiles first.{Style.RESET_ALL}"
            )
            return {"created": 0, "skipped": 0, "failed": 0}

        created = 0
        used_pairs: Set[Tuple[str, str]] = set()

        for _ in range(limit * 2):  # Try 2x for duplicates
            if created >= limit:
                break

            user1, user2 = random.sample(user_ids, 2)
            pair_key = tuple(sorted([user1, user2]))

            if pair_key in used_pairs:
                continue

            used_pairs.add(pair_key)

            # Create conversation
            conv_id = self.create_conversation(user1, user2)

            if conv_id:
                created += 1

            self.log_progress(created, limit, "Conversations")

            if created % config.BATCH_SIZE == 0:
                time.sleep(config.DELAY_BETWEEN_BATCHES)

        stats = {"created": created}
        self.log_stats(stats, "Conversations")
        return stats


if __name__ == "__main__":
    import httpx
    from config import config

    config.initialize()

    with httpx.Client() as http:
        seeder = ConversationsSeeder(http)
        seeder.seed(limit=10)
