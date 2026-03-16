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
    """Seeder for messages in conversations"""

    def __init__(self, http_client):
        super().__init__(http_client)

    def create_message(
        self,
        conversation_id: str,
        sender_id: str,
        content: str,
        created_at: datetime = None,
    ) -> bool:
        """Create a message in a conversation"""
        message = {
            "conversation_id": conversation_id,
            "sender_id": sender_id,
            "content": content,
            "is_read": True,
            "created_at": created_at.isoformat()
            if created_at
            else datetime.utcnow().isoformat(),
        }

        result = self.create_single("messages", message)

        if result:
            # Update conversation last message
            self._update_conversation_last_message(
                conversation_id, content, message["created_at"]
            )
            return True

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
        """Seed messages in conversations"""

        if messages_per_conversation is None:
            messages_per_conversation = config.LIMIT_MESSAGES_PER_CONVERSATION or "5,20"

        msg_range = self.parse_limit_range(messages_per_conversation)

        print(f"\n{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}")
        print(
            f"{Fore.CYAN}SEEDING MESSAGES ({msg_range[0]}-{msg_range[1]} per conversation){Style.RESET_ALL}"
        )
        print(f"{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}\n")

        # Fetch conversations
        conversations = self.fetch_existing_conversations()

        if not conversations:
            print(
                f"{Fore.RED}✗ No conversations found. Seed conversations first.{Style.RESET_ALL}"
            )
            return {"created": 0, "skipped": 0, "failed": 0}

        created = 0

        for conv in conversations:
            conv_id = conv["id"]
            participant_1 = conv["participant_1"]
            participant_2 = conv["participant_2"]

            # Generate messages
            num_messages = random.randint(*msg_range)
            conv_data = generate_conversation(
                participant_1, participant_2, message_count=num_messages
            )

            base_time = datetime.now() - timedelta(days=random.randint(1, 30))

            for msg_idx, msg in enumerate(conv_data["messages"]):
                sender = participant_1 if msg["sender_index"] == 0 else participant_2
                msg_time = base_time + timedelta(minutes=msg_idx * 5)

                if self.create_message(conv_id, sender, msg["content"], msg_time):
                    created += 1

            self.log_progress(created, len(conversations) * msg_range[1], "Messages")

            if created % config.BATCH_SIZE == 0:
                time.sleep(config.DELAY_BETWEEN_BATCHES)

        stats = {"created": created}
        self.log_stats(stats, "Messages")
        return stats


if __name__ == "__main__":
    import httpx
    from config import config

    config.initialize()

    with httpx.Client() as http:
        seeder = MessagesSeeder(http)
        seeder.seed()
