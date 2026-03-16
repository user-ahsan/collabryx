"""
Notifications Seeder
Creates notifications for users using Supabase REST API
"""

import random
import time
import httpx
from datetime import datetime, timedelta
from typing import List, Dict, Any
from colorama import Fore, Style

from config import config


class NotificationsSeeder:
    """Seeder for notifications using REST API"""

    def __init__(self, http_client: httpx.Client):
        self.http = http_client

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

    def create_notification(
        self,
        user_id: str,
        notification_type: str,
        title: str = None,
        message: str = None,
        actor_id: str = None,
        is_read: bool = False,
    ) -> bool:
        """Create a notification via REST API"""
        try:
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
            return response.status_code == 201

        except Exception as e:
            return False

    def seed_notifications(self, user_ids: List[str], count: int = None) -> int:
        """Seed notifications for users"""

        if count is None:
            count = config.SEED_COUNT_NOTIFICATIONS

        print(f"\n{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}")
        print(f"{Fore.CYAN}SEEDING {count} NOTIFICATIONS{Style.RESET_ALL}")
        print(f"{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}\n")

        created = 0

        for _ in range(count):
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

            if (created + 1) % 50 == 0:
                print(
                    f"{Fore.GREEN}✓ Created {created}/{count} notifications...{Style.RESET_ALL}"
                )
                time.sleep(config.DELAY_BETWEEN_BATCHES)

        print(f"\n{Fore.GREEN}{'=' * 60}{Style.RESET_ALL}")
        print(f"{Fore.GREEN}✓ Created {created}/{count} notifications{Style.RESET_ALL}")
        print(f"{Fore.GREEN}{'=' * 60}{Style.RESET_ALL}\n")

        return created


if __name__ == "__main__":
    print("Notifications seeder module loaded successfully")
