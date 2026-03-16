"""
Messaging Seeder
Creates conversations and messages
"""

import random
import time
from datetime import datetime, timedelta
from typing import List, Dict, Any
from colorama import Fore, Style

from config import config
from data_generators.conversations import generate_conversation


class MessagingSeeder:
    """Seeder for conversations and messages"""

    def __init__(self, supabase_client):
        self.supabase = supabase_client
        self.created_conversation_ids = []

    def create_conversation(self, participant_1: str, participant_2: str) -> str:
        """Create a conversation between two users"""
        try:
            # Check if conversation already exists
            existing = (
                self.supabase.table("conversations")
                .select("id")
                .eq("participant_1", min(participant_1, participant_2))
                .eq("participant_2", max(participant_1, participant_2))
                .execute()
            )

            if existing.data and len(existing.data) > 0:
                return existing.data[0]["id"]

            conversation = {
                "participant_1": min(participant_1, participant_2),
                "participant_2": max(participant_1, participant_2),
                "last_message_text": None,
                "last_message_at": None,
                "unread_count_1": 0,
                "unread_count_2": 0,
                "is_archived": False,
            }

            result = self.supabase.table("conversations").insert(conversation).execute()

            if result.data and len(result.data) > 0:
                conv_id = result.data[0]["id"]
                self.created_conversation_ids.append(conv_id)
                return conv_id

            return None

        except Exception as e:
            print(f"{Fore.RED}✗ Failed to create conversation: {e}{Style.RESET_ALL}")
            return None

    def create_message(
        self,
        conversation_id: str,
        sender_id: str,
        content: str,
        created_at: datetime = None,
    ) -> bool:
        """Create a message in a conversation"""
        try:
            message = {
                "conversation_id": conversation_id,
                "sender_id": sender_id,
                "content": content,
                "is_read": True,
                "created_at": created_at.isoformat()
                if created_at
                else datetime.utcnow().isoformat(),
            }

            result = self.supabase.table("messages").insert(message).execute()

            if result.data:
                # Update conversation last message
                conv = (
                    self.supabase.table("conversations")
                    .select("participant_1, participant_2")
                    .eq("id", conversation_id)
                    .single()
                    .execute()
                )

                if conv.data:
                    self.supabase.table("conversations").update(
                        {
                            "last_message_text": content[:100],
                            "last_message_at": message["created_at"],
                        }
                    ).eq("id", conversation_id).execute()

                return True

            return False

        except Exception as e:
            return False

    def seed_conversations(self, user_ids: List[str], count: int = None) -> int:
        """Seed conversations with messages"""

        if count is None:
            count = config.SEED_COUNT_CONVERSATIONS

        print(f"\n{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}")
        print(f"{Fore.CYAN}SEEDING {count} CONVERSATIONS{Style.RESET_ALL}")
        print(f"{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}\n")

        created = 0
        used_pairs = set()

        for _ in range(count * 2):  # Try 2x for duplicates
            if created >= count:
                break

            user1, user2 = random.sample(user_ids, 2)
            pair_key = tuple(sorted([user1, user2]))

            if pair_key in used_pairs:
                continue

            used_pairs.add(pair_key)

            # Create conversation
            conv_id = self.create_conversation(user1, user2)

            if conv_id:
                # Generate messages
                conv_data = generate_conversation(
                    user1, user2, message_count=random.randint(5, 15)
                )

                base_time = datetime.now() - timedelta(days=random.randint(1, 30))

                for msg_idx, msg in enumerate(conv_data["messages"]):
                    sender = user1 if msg["sender_index"] == 0 else user2
                    msg_time = base_time + timedelta(minutes=msg_idx * 5)

                    self.create_message(conv_id, sender, msg["content"], msg_time)

                created += 1

                if created % 10 == 0:
                    print(
                        f"{Fore.GREEN}✓ Created {created}/{count} conversations...{Style.RESET_ALL}"
                    )
                    time.sleep(config.DELAY_BETWEEN_BATCHES)

        print(f"\n{Fore.GREEN}{'=' * 60}{Style.RESET_ALL}")
        print(f"{Fore.GREEN}✓ Created {created}/{count} conversations{Style.RESET_ALL}")
        print(f"{Fore.GREEN}{'=' * 60}{Style.RESET_ALL}\n")

        return created


if __name__ == "__main__":
    print("Messaging seeder module loaded successfully")
