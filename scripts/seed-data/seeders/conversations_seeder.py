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
    """Seeder for conversations between users with incremental seeding"""

    def __init__(self, http_client):
        super().__init__(http_client)
        self.stats = {"created": 0, "skipped": 0, "failed": 0}
        self.existing_conversations = set()

    def _load_existing_conversations(self):
        """Fetch existing conversations for duplicate checking"""
        try:
            response = self.http.get(
                f"{config.SUPABASE_REST_URL}/conversations?select=id,participant_1,participant_2",
                headers=config.API_HEADERS,
            )
            response.raise_for_status()
            conversations = response.json() or []
            # Store as sorted tuples for easy lookup
            self.existing_conversations = {
                tuple(sorted([c["participant_1"], c["participant_2"]]))
                for c in conversations
            }
            print(
                f"{Fore.YELLOW}  → Found {len(self.existing_conversations)} existing conversations{Style.RESET_ALL}"
            )
        except Exception as e:
            print(
                f"{Fore.RED}✗ Failed to fetch existing conversations: {e}{Style.RESET_ALL}"
            )

    def conversation_exists(self, participant_1: str, participant_2: str) -> bool:
        """Check if conversation already exists"""
        pair_key = tuple(sorted([participant_1, participant_2]))
        return pair_key in self.existing_conversations

    def create_conversation(self, participant_1: str, participant_2: str) -> str:
        """Create a conversation between two users with duplicate checking"""
        try:
            # Check if conversation already exists
            if self.conversation_exists(participant_1, participant_2):
                print(
                    f"{Fore.YELLOW}  ⚠️  Conversation exists, skipping{Style.RESET_ALL}"
                )
                self.stats["skipped"] += 1
                return None

            p1, p2 = (
                min(participant_1, participant_2),
                max(participant_1, participant_2),
            )

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
            if result:
                self.existing_conversations.add((p1, p2))
                self.stats["created"] += 1
            return result or None

        except Exception as e:
            self.stats["failed"] += 1
            return None

    def seed(self, limit: int = None) -> Dict[str, int]:
        """Seed conversations (incremental - skips existing)"""

        # Reset stats
        self.stats = {"created": 0, "skipped": 0, "failed": 0}

        if limit is None:
            limit = (
                int(config.LIMIT_CONVERSATIONS)
                if config.LIMIT_CONVERSATIONS != "-1"
                else 150
            )

        # Fetch existing conversations for duplicate checking
        print(
            f"\n{Fore.YELLOW}⏳ Loading existing conversations for duplicate checking...{Style.RESET_ALL}"
        )
        self._load_existing_conversations()

        # Show current database status
        existing_count = len(self.existing_conversations)

        print(f"\n{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}")
        print(f"{Fore.CYAN}CURRENT DATABASE STATUS{Style.RESET_ALL}")
        print(f"{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}")
        print(
            f"  💬 Existing Conversations: {Fore.GREEN}{existing_count:,}{Style.RESET_ALL}"
        )
        print(f"{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}")
        print(
            f"\n{Fore.YELLOW}➕ Attempting to add {limit:,} new conversations...{Style.RESET_ALL}\n"
        )

        print(f"{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}")
        print(
            f"{Fore.CYAN}SEEDING {limit} CONVERSATIONS (Incremental Mode){Style.RESET_ALL}"
        )
        print(f"{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}\n")

        # Fetch user IDs
        print(f"{Fore.YELLOW}⏳ Fetching user IDs from database...{Style.RESET_ALL}")
        user_ids = self.fetch_user_ids()
        print(f"{Fore.GREEN}✓ Found {len(user_ids)} users{Style.RESET_ALL}\n")

        if len(user_ids) < 2:
            print(
                f"{Fore.RED}✗ Need at least 2 users. Seed profiles first.{Style.RESET_ALL}"
            )
            return self.stats

        attempts = 0
        max_attempts = limit * 2  # Try 2x for duplicates

        for _ in range(max_attempts):
            if self.stats["created"] >= limit:
                break

            user1, user2 = random.sample(user_ids, 2)
            pair_key = tuple(sorted([user1, user2]))

            # Create conversation (will skip if exists)
            conv_id = self.create_conversation(user1, user2)

            self.log_progress(self.stats["created"], limit, "Conversations")

            if self.stats["created"] % config.BATCH_SIZE == 0:
                time.sleep(config.DELAY_BETWEEN_BATCHES)

        # Print detailed statistics
        print(f"\n{Fore.GREEN}{'=' * 60}{Style.RESET_ALL}")
        print(f"{Fore.GREEN}✓ CONVERSATIONS SEEDING COMPLETE{Style.RESET_ALL}")
        print(f"{Fore.GREEN}{'=' * 60}{Style.RESET_ALL}")
        print(f"  Created:     {Fore.GREEN}{self.stats['created']:,}{Style.RESET_ALL}")
        print(f"  Skipped:     {Fore.YELLOW}{self.stats['skipped']:,}{Style.RESET_ALL}")
        print(f"  Failed:      {Fore.GREEN}{self.stats['failed']:,}{Style.RESET_ALL}")
        print(
            f"  Total:       {Fore.CYAN}{sum(self.stats.values()):,}{Style.RESET_ALL}"
        )
        print(f"{Fore.GREEN}{'=' * 60}{Style.RESET_ALL}\n")

        return self.stats


if __name__ == "__main__":
    import httpx
    from config import config

    config.initialize()

    with httpx.Client() as http:
        seeder = ConversationsSeeder(http)
        seeder.seed(limit=10)
