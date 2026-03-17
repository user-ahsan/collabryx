"""
Notifications Seeder
Creates notifications for users using Supabase REST API
With incremental seeding - skips existing notifications
"""

import random
import time
import httpx
from datetime import datetime, timedelta
from typing import List, Dict, Any, Set
from colorama import Fore, Style

from config import config
from seeders.base_seeder import BaseSeeder


class NotificationsSeeder(BaseSeeder):
    """Seeder for notifications using REST API with incremental seeding"""

    def __init__(self, http_client):
        super().__init__(http_client)
        self.stats = {"created": 0, "skipped": 0, "failed": 0}
        self.existing_notifications: Set[str] = set()

    NOTIFICATION_TYPES = [
        "connection_request",
        "connection_accepted",
        "post_reaction",
        "comment_on_post",
        "mention",
        "match_suggestion",
        "message_received",
    ]

    TITLES = {
        "connection_request": "New Connection Request",
        "connection_accepted": "Connection Accepted",
        "post_reaction": "Liked your post",
        "comment_on_post": "Commented on your post",
        "mention": "Mentioned you",
        "match_suggestion": "New Match Suggestion",
        "message_received": "New Message",
    }

    def _load_existing_notifications(self, user_id: str = None):
        """Fetch existing notifications for duplicate checking"""
        try:
            if user_id:
                response = self.http.get(
                    f"{config.SUPABASE_REST_URL}/notifications?select=id,user_id,type,actor_id&user_id=eq.{user_id}",
                    headers=config.API_HEADERS,
                )
            else:
                response = self.http.get(
                    f"{config.SUPABASE_REST_URL}/notifications?select=id,user_id,type,actor_id",
                    headers=config.API_HEADERS,
                )
            response.raise_for_status()
            notifications = response.json() or []
            self.existing_notifications = {
                f"{n['user_id']}:{n['type']}:{n.get('actor_id', 'system')}"
                for n in notifications
            }
            print(
                f"{Fore.YELLOW}  → Found {len(self.existing_notifications)} existing notifications{Style.RESET_ALL}"
            )
        except Exception as e:
            print(
                f"{Fore.RED}✗ Failed to fetch existing notifications: {e}{Style.RESET_ALL}"
            )

    def _notification_exists(
        self, user_id: str, notification_type: str, actor_id: str = None
    ) -> bool:
        """Check if notification already exists"""
        if not self.existing_notifications:
            self._load_existing_notifications()
        notification_key = f"{user_id}:{notification_type}:{actor_id or 'system'}"
        return notification_key in self.existing_notifications

    def create_notification(
        self,
        user_id: str,
        notification_type: str,
        title: str = None,
        message: str = None,
        actor_id: str = None,
        is_read: bool = False,
    ) -> bool:
        """Create a notification via REST API with duplicate checking"""
        try:
            # Check for duplicate
            if self._notification_exists(user_id, notification_type, actor_id):
                print(
                    f"{Fore.YELLOW}  ⚠️  Notification exists, skipping{Style.RESET_ALL}"
                )
                self.stats["skipped"] += 1
                return False

            if title is None:
                title = self.TITLES.get(notification_type, "Notification")

            if message is None:
                message = f"You have a new {notification_type.replace('_', ' ')}"

            notification = {
                "user_id": user_id,
                "type": notification_type,
                "title": title,
                "message": message,
                "actor_id": actor_id,
                "is_read": is_read,
                "data": {},
            }

            response = self.http.post(
                f"{config.SUPABASE_REST_URL}/notifications",
                json=notification,
                headers=config.API_HEADERS,
            )

            if response.status_code in [200, 201]:
                self.existing_notifications.add(
                    f"{user_id}:{notification_type}:{actor_id or 'system'}"
                )
                self.stats["created"] += 1
                return True
            else:
                self.stats["failed"] += 1
                return False

        except Exception as e:
            self.stats["failed"] += 1
            return False

    def seed(self, user_ids: List[str] = None, count: int = None) -> int:
        """Seed notifications for users (incremental - skips existing)"""

        # Reset stats
        self.stats = {"created": 0, "skipped": 0, "failed": 0}

        if count is None:
            count = (
                int(config.LIMIT_NOTIFICATIONS_PER_USER)
                if config.LIMIT_NOTIFICATIONS_PER_USER != "-1"
                else 100
            )

        print(
            f"\n{Fore.YELLOW}⏳ Loading existing notifications for duplicate checking...{Style.RESET_ALL}"
        )
        self._load_existing_notifications()

        print(f"\n{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}")
        print(f"{Fore.CYAN}CURRENT DATABASE STATUS{Style.RESET_ALL}")
        print(f"{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}")
        print(
            f"  🔔 Existing Notifications: {Fore.GREEN}{len(self.existing_notifications):,}{Style.RESET_ALL}"
        )
        print(f"{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}")
        print(
            f"\n{Fore.YELLOW}➕ Attempting to add {count:,} new notifications...{Style.RESET_ALL}\n"
        )

        print(f"{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}")
        print(f"{Fore.CYAN}SEEDING NOTIFICATIONS (Incremental Mode){Style.RESET_ALL}")
        print(f"{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}\n")

        created = 0
        attempts = 0
        max_attempts = count * 2

        for _ in range(max_attempts):
            if self.stats["created"] >= count:
                break

            user_id = random.choice(user_ids)
            actor_id = random.choice([u for u in user_ids if u != user_id])
            notification_type = random.choice(self.NOTIFICATION_TYPES)

            # Most notifications are unread
            is_read = random.random() < 0.3

            if self.create_notification(
                user_id=user_id,
                notification_type=notification_type,
                actor_id=actor_id,
                is_read=is_read,
            ):
                created += 1

            if (self.stats["created"] + 1) % 50 == 0:
                print(
                    f"{Fore.GREEN}✓ Created {self.stats['created']}/{count} notifications...{Style.RESET_ALL}"
                )
                time.sleep(config.DELAY_BETWEEN_BATCHES)

        # Print detailed statistics
        print(f"\n{Fore.GREEN}{'=' * 60}{Style.RESET_ALL}")
        print(f"{Fore.GREEN}✓ NOTIFICATIONS SEEDING COMPLETE{Style.RESET_ALL}")
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
    print("Notifications seeder module loaded successfully")
