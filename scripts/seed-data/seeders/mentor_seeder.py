"""
AI Mentor Seeder
Creates AI mentor sessions and messages
"""

import random
import time
from datetime import datetime, timedelta
from typing import List, Dict, Any
from colorama import Fore, Style

from config import config


class MentorSeeder:
    """Seeder for AI mentor sessions"""

    def __init__(self, supabase_client):
        self.supabase = supabase_client

    SESSION_TOPICS = [
        "Career advice in tech",
        "Starting a startup",
        "Learning programming",
        "Product development tips",
        "Work-life balance",
        "Technical interview prep",
        "Building a portfolio",
        "Networking strategies",
        "Skill development roadmap",
        "Industry trends discussion",
    ]

    AI_RESPONSES = [
        "That's a great question! Based on my experience, I'd recommend focusing on building practical projects that demonstrate your skills.",
        "Starting a startup is challenging but rewarding. The key is to identify a real problem and validate your solution early.",
        "Consistency is key when learning programming. Try to code daily, even if it's just for 30 minutes.",
        "Great progress so far! I'd suggest diving deeper into system design as you advance in your career.",
        "Work-life balance is crucial for long-term success. Make time for rest and hobbies outside of work.",
        "For technical interviews, practice problem-solving on platforms like LeetCode and do mock interviews.",
        "Your portfolio should showcase your best work. Quality over quantity - 3-4 strong projects are better than 10 weak ones.",
        "Networking is about building genuine relationships. Attend meetups, contribute to open source, and help others.",
        "I'd recommend creating a learning roadmap with specific goals for each quarter. Track your progress regularly.",
        "The tech industry is evolving rapidly. Stay curious and keep learning about emerging technologies.",
    ]

    def create_session(self, user_id: str, topic: str = None) -> str:
        """Create an AI mentor session"""
        try:
            if topic is None:
                topic = random.choice(self.SESSION_TOPICS)

            session = {
                "user_id": user_id,
                "topic": topic,
                "status": "active",
                "message_count": 0,
            }

            result = self.supabase.table("ai_mentor_sessions").insert(session).execute()

            if result.data and len(result.data) > 0:
                return result.data[0]["id"]

            return None

        except Exception as e:
            return None

    def create_message(
        self, session_id: str, is_user: bool, content: str, order_index: int
    ) -> bool:
        """Create a message in a mentor session"""
        try:
            message = {
                "session_id": session_id,
                "is_user": is_user,
                "content": content,
                "order_index": order_index,
            }

            result = self.supabase.table("ai_mentor_messages").insert(message).execute()

            if result.data:
                # Update session message count
                self.supabase.table("ai_mentor_sessions").update(
                    {"message_count": order_index + 1}
                ).eq("id", session_id).execute()

                return True

            return False

        except Exception as e:
            return False

    def seed_sessions(self, user_ids: List[str], count: int = None) -> int:
        """Seed AI mentor sessions"""

        if count is None:
            count = config.SEED_COUNT_MENTOR_SESSIONS

        print(f"\n{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}")
        print(f"{Fore.CYAN}SEEDING {count} MENTOR SESSIONS{Style.RESET_ALL}")
        print(f"{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}\n")

        created = 0

        for _ in range(count):
            user_id = random.choice(user_ids)
            topic = random.choice(self.SESSION_TOPICS)

            session_id = self.create_session(user_id, topic)

            if session_id:
                # Create conversation flow (2-4 exchanges)
                num_exchanges = random.randint(2, 4)

                for i in range(num_exchanges):
                    # User message
                    user_msg = f"Can you give me advice on {topic.lower()}?"
                    self.create_message(session_id, True, user_msg, i * 2)

                    # AI response
                    ai_response = random.choice(self.AI_RESPONSES)
                    self.create_message(session_id, False, ai_response, i * 2 + 1)

                created += 1

                if created % 10 == 0:
                    print(
                        f"{Fore.GREEN}✓ Created {created}/{count} sessions...{Style.RESET_ALL}"
                    )
                    time.sleep(config.DELAY_BETWEEN_BATCHES)

        print(f"\n{Fore.GREEN}{'=' * 60}{Style.RESET_ALL}")
        print(
            f"{Fore.GREEN}✓ Created {created}/{count} mentor sessions{Style.RESET_ALL}"
        )
        print(f"{Fore.GREEN}{'=' * 60}{Style.RESET_ALL}\n")

        return created


if __name__ == "__main__":
    print("Mentor seeder module loaded successfully")
