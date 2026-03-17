"""
AI Mentor Seeder
Creates AI mentor sessions and messages using Supabase REST API
With incremental seeding - skips existing sessions
"""

import random
import time
import httpx
from datetime import datetime, timedelta
from typing import List, Dict, Any, Set
from colorama import Fore, Style

from config import config
from seeders.base_seeder import BaseSeeder


class MentorSeeder(BaseSeeder):
    """Seeder for AI mentor sessions using REST API with incremental seeding"""

    def __init__(self, http_client):
        super().__init__(http_client)
        self.stats = {"created": 0, "skipped": 0, "failed": 0}
        self.existing_sessions: Set[str] = set()

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

    def _load_existing_sessions(self):
        """Fetch existing sessions for duplicate checking"""
        try:
            response = self.http.get(
                f"{config.SUPABASE_REST_URL}/ai_mentor_sessions?select=id,user_id,topic",
                headers=config.API_HEADERS,
            )
            response.raise_for_status()
            sessions = response.json() or []
            self.existing_sessions = {f"{s['user_id']}:{s['topic']}" for s in sessions}
            print(
                f"{Fore.YELLOW}  → Found {len(self.existing_sessions)} existing sessions{Style.RESET_ALL}"
            )
        except Exception as e:
            print(
                f"{Fore.RED}✗ Failed to fetch existing sessions: {e}{Style.RESET_ALL}"
            )

    def _session_exists(self, user_id: str, topic: str) -> bool:
        """Check if session already exists"""
        if not self.existing_sessions:
            self._load_existing_sessions()
        session_key = f"{user_id}:{topic}"
        return session_key in self.existing_sessions

    def create_session(self, user_id: str, topic: str = None) -> str:
        """Create an AI mentor session via REST API with duplicate checking"""
        try:
            if topic is None:
                topic = random.choice(self.SESSION_TOPICS)

            # Check for duplicate
            if self._session_exists(user_id, topic):
                print(f"{Fore.YELLOW}  ⚠️  Session exists, skipping{Style.RESET_ALL}")
                self.stats["skipped"] += 1
                return None

            session = {
                "user_id": user_id,
                "topic": topic,
                "status": "active",
                "message_count": 0,
            }

            response = self.http.post(
                f"{config.SUPABASE_REST_URL}/ai_mentor_sessions",
                json=session,
                headers=config.API_HEADERS,
            )
            response.raise_for_status()
            result = response.json()

            if result and len(result) > 0:
                self.existing_sessions.add(f"{user_id}:{topic}")
                self.stats["created"] += 1
                return result[0]["id"]

            self.stats["failed"] += 1
            return None

        except Exception as e:
            self.stats["failed"] += 1
            return None

    def create_message(
        self, session_id: str, is_user: bool, content: str, order_index: int
    ) -> bool:
        """Create a message in a mentor session via REST API"""
        try:
            message = {
                "session_id": session_id,
                "is_user": is_user,
                "content": content,
                "order_index": order_index,
            }

            response = self.http.post(
                f"{config.SUPABASE_REST_URL}/ai_mentor_messages",
                json=message,
                headers=config.API_HEADERS,
            )
            response.raise_for_status()

            # Update session message count
            self._update_session_message_count(session_id, order_index + 1)
            return True

        except Exception as e:
            return False

    def _update_session_message_count(self, session_id: str, count: int):
        """Update session message count"""
        try:
            self.http.patch(
                f"{config.SUPABASE_REST_URL}/ai_mentor_sessions?id=eq.{session_id}",
                json={"message_count": count},
                headers=config.API_HEADERS,
            )
        except:
            pass

    def seed(self, user_ids: List[str], count: int = None) -> int:
        """Seed AI mentor sessions (incremental - skips existing)"""

        # Reset stats
        self.stats = {"created": 0, "skipped": 0, "failed": 0}

        if count is None:
            count = (
                int(config.LIMIT_MENTOR_SESSIONS)
                if config.LIMIT_MENTOR_SESSIONS != "-1"
                else 50
            )

        print(
            f"\n{Fore.YELLOW}⏳ Loading existing sessions for duplicate checking...{Style.RESET_ALL}"
        )
        self._load_existing_sessions()

        print(f"\n{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}")
        print(f"{Fore.CYAN}CURRENT DATABASE STATUS{Style.RESET_ALL}")
        print(f"{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}")
        print(
            f"  🤖 Existing Sessions: {Fore.GREEN}{len(self.existing_sessions):,}{Style.RESET_ALL}"
        )
        print(f"{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}")
        print(
            f"\n{Fore.YELLOW}➕ Attempting to add {count:,} new sessions...{Style.RESET_ALL}\n"
        )

        print(f"{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}")
        print(f"{Fore.CYAN}SEEDING MENTOR SESSIONS (Incremental Mode){Style.RESET_ALL}")
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

        # Print detailed statistics
        print(f"\n{Fore.GREEN}{'=' * 60}{Style.RESET_ALL}")
        print(f"{Fore.GREEN}✓ MENTOR SESSIONS SEEDING COMPLETE{Style.RESET_ALL}")
        print(f"{Fore.GREEN}{'=' * 60}{Style.RESET_ALL}")
        print(f"  Created:     {Fore.GREEN}{self.stats['created']:,}{Style.RESET_ALL}")
        print(f"  Skipped:     {Fore.YELLOW}{self.stats['skipped']:,}{Style.RESET_ALL}")
        print(f"  Failed:      {Fore.GREEN}{self.stats['failed']:,}{Style.RESET_ALL}")
        print(
            f"  Total:       {Fore.CYAN}{sum(self.stats.values()):,}{Style.RESET_ALL}"
        )
        print(f"{Fore.GREEN}{'=' * 60}{Style.RESET_ALL}\n")

        return self.stats["created"]


if __name__ == "__main__":
    print("Mentor seeder module loaded successfully")
