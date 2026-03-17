"""
Messages Seeder
Creates messages in conversations using Supabase REST API
Fetches real conversation and user UUIDs from database
"""

import random
import time
from datetime import datetime, timedelta
from typing import List, Dict, Any
from colorama import Fore, Style

from config import config
from seeders.base_seeder import BaseSeeder
from data_generators.conversations import generate_conversation


class MessagesSeeder(BaseSeeder):
    """Seeder for messages in conversations with incremental seeding"""

    def __init__(self, http_client):
        super().__init__(http_client)
        self.stats = {"created": 0, "skipped": 0, "failed": 0}
        self.existing_messages_cache = {}

    def _load_existing_messages(self, conversation_id: str):
        """Load existing messages for a conversation"""
        try:
            response = self.http.get(
                f"{config.SUPABASE_REST_URL}/messages?select=sender_id,content,created_at&conversation_id=eq.{conversation_id}",
                headers=config.API_HEADERS,
            )
            response.raise_for_status()
            messages = response.json() or []
            self.existing_messages_cache[conversation_id] = {
                f"{m['sender_id']}:{m['content'][:100]}:{str(m['created_at'])[:19]}"
                for m in messages
            }
        except Exception:
            self.existing_messages_cache[conversation_id] = set()

    def _message_exists(
        self, conversation_id: str, sender_id: str, content: str, created_at: datetime
    ) -> bool:
        """Check if message already exists"""
        if conversation_id not in self.existing_messages_cache:
            self._load_existing_messages(conversation_id)
        msg_hash = f"{sender_id}:{content[:100]}:{str(created_at)[:19]}"
        return msg_hash in self.existing_messages_cache.get(conversation_id, set())

    def create_message(
        self,
        conversation_id: str,
        sender_id: str,
        content: str,
        created_at: datetime = None,
    ) -> bool:
        """Create a message in a conversation with duplicate checking"""
        if created_at is None:
            created_at = datetime.utcnow()

        # Check for duplicate
        if self._message_exists(conversation_id, sender_id, content, created_at):
            print(f"{Fore.YELLOW}  ⚠️  Message exists, skipping{Style.RESET_ALL}")
            self.stats["skipped"] += 1
            return False

        message = {
            "conversation_id": conversation_id,
            "sender_id": sender_id,
            "content": content,
            "is_read": True,
            "created_at": created_at.isoformat(),
        }

        result = self.create_single("messages", message)

        if result:
            # Update conversation last message
            self._update_conversation_last_message(
                conversation_id, content, message["created_at"]
            )
            # Cache the new message
            if conversation_id not in self.existing_messages_cache:
                self.existing_messages_cache[conversation_id] = set()
            self.existing_messages_cache[conversation_id].add(
                f"{sender_id}:{content[:100]}:{str(created_at)[:19]}"
            )
            self.stats["created"] += 1
            return True

        self.stats["failed"] += 1
        return False

    def _update_conversation_last_message(
        self, conversation_id: str, text: str, timestamp: str
    ):
        """Update conversation's last message info"""
        try:
            self.http.patch(
                f"{config.SUPABASE_REST_URL}/conversations?id=eq.{conversation_id}",
                json={"last_message_text": text[:100], "last_message_at": timestamp},
                headers=config.API_HEADERS,
            )
        except:
            pass

    def seed(self, messages_per_conversation: str = None) -> Dict[str, int]:
        """Seed messages in conversations (incremental - skips existing)"""

        # Reset stats
        self.stats = {"created": 0, "skipped": 0, "failed": 0}

        if messages_per_conversation is None:
            messages_per_conversation = config.LIMIT_MESSAGES_PER_CONVERSATION or "5,20"

        msg_range = self.parse_limit_range(messages_per_conversation)

        print(f"\n{Fore.YELLOW}⏳ Fetching conversations...{Style.RESET_ALL}")
        conversations = self.fetch_existing_conversations()

        if not conversations:
            print(
                f"{Fore.RED}✗ No conversations found. Seed conversations first.{Style.RESET_ALL}"
            )
            return self.stats

        print(f"\n{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}")
        print(f"{Fore.CYAN}CURRENT DATABASE STATUS{Style.RESET_ALL}")
        print(f"{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}")
        print(
            f"  💬 Conversations: {Fore.GREEN}{len(conversations):,}{Style.RESET_ALL}"
        )
        print(f"{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}")
        print(
            f"\n{Fore.YELLOW}➕ Seeding messages ({msg_range[0]}-{msg_range[1]} per conversation - Incremental Mode)...{Style.RESET_ALL}\n"
        )

        print(f"{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}")
        print(f"{Fore.CYAN}SEEDING MESSAGES{Style.RESET_ALL}")
        print(f"{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}\n")

        total_expected = len(conversations) * ((msg_range[0] + msg_range[1]) // 2)

        for conv_idx, conv in enumerate(conversations):
            conv_id = conv["id"]
            participant_1 = conv["participant_1"]
            participant_2 = conv["participant_2"]

            print(
                f"{Fore.CYAN}[{conv_idx + 1}/{len(conversations)}] Processing conversation...{Style.RESET_ALL}"
            )

            # Generate messages
            num_messages = random.randint(*msg_range)
            conv_data = generate_conversation(
                participant_1, participant_2, message_count=num_messages
            )

            base_time = datetime.now() - timedelta(days=random.randint(1, 30))

            for msg_idx, msg in enumerate(conv_data["messages"]):
                sender = participant_1 if msg["sender_index"] == 0 else participant_2
                msg_time = base_time + timedelta(minutes=msg_idx * 5)

                self.create_message(conv_id, sender, msg["content"], msg_time)

            print(
                f"  {Fore.GREEN}✓ Created: {self.stats['created']}, Skipped: {self.stats['skipped']}{Style.RESET_ALL}\n"
            )

            if (
                self.stats["created"] % config.BATCH_SIZE == 0
                and self.stats["created"] > 0
            ):
                time.sleep(config.DELAY_BETWEEN_BATCHES)

        # Print detailed statistics
        print(f"\n{Fore.GREEN}{'=' * 60}{Style.RESET_ALL}")
        print(f"{Fore.GREEN}✓ MESSAGES SEEDING COMPLETE{Style.RESET_ALL}")
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
        seeder = MessagesSeeder(http)
        seeder.seed()
