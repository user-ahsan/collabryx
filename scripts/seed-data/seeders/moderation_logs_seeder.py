"""
Moderation Logs Seeder
Creates content moderation log entries with realistic ML scores
References profiles (user_id FK -> public.profiles)
"""

import random
import time
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from colorama import Fore, Style

from config import config
from seeders.base_seeder import BaseSeeder


class ModerationLogsSeeder(BaseSeeder):
    """Seeder for content_moderation_logs table using REST API"""

    def __init__(self, http_client):
        super().__init__(http_client)
        self.stats = {"created": 0, "skipped": 0, "failed": 0}

    CONTENT_TYPES = [
        "post",
        "comment",
        "profile",
        "message",
        "image",
        "file_attachment",
    ]

    ACTIONS = [
        "approved",
        "flagged",
        "rejected",
        "reviewed",
    ]

    MODERATORS = [
        "auto",
        "admin_1",
        "admin_2",
        "moderator_ai",
        "moderator_human_1",
        "moderator_human_2",
    ]

    MODERATION_REASONS = [
        None,  # Approved items may have no reason
        "spam_detected",
        "toxic_language",
        "hate_speech",
        "harassment",
        "nsfw_content",
        "violent_content",
        "explicit_language",
        "promotional_content",
        "misinformation",
        "impersonation",
        "copyright_violation",
        "personal_information",
        "self_harm_content",
        "illegal_activity",
        "low_quality_content",
        "duplicate_content",
        "off_topic",
    ]

    def seed(self, user_ids: List[str] = None, count: int = None) -> int:
        """Seed moderation log entries"""
        self.stats = {"created": 0, "skipped": 0, "failed": 0}

        if count is None:
            count = random.randint(50, 200)

        print(f"\n{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}")
        print(f"{Fore.CYAN}SEEDING CONTENT MODERATION LOGS{Style.RESET_ALL}")
        print(f"{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}")
        print(
            f"{Fore.YELLOW}  Target: {count} moderation log entries{Style.RESET_ALL}"
        )

        # Fetch user IDs if not provided
        if user_ids is None:
            user_ids = self.fetch_user_ids()
            if not user_ids:
                print(
                    f"{Fore.YELLOW}  ⚠️  No user IDs available. Will use user_id=null{Style.RESET_ALL}"
                )

        now = datetime.utcnow()
        created = 0

        for i in range(count):
            action = random.choice(self.ACTIONS)

            # Assign ML scores based on action type
            # Approved items -> low scores, Rejected -> high scores
            if action == "approved":
                toxicity = round(random.uniform(0, 0.3), 4)
                spam = round(random.uniform(0, 0.2), 4)
                nsfw = round(random.uniform(0, 0.15), 4)
                reason = None
            elif action == "rejected":
                toxicity = round(random.uniform(0.5, 0.9), 4)
                spam = round(random.uniform(0.4, 0.8), 4)
                nsfw = round(random.uniform(0.3, 0.7), 4)
                reason = random.choice([r for r in self.MODERATION_REASONS if r is not None])
            elif action == "flagged":
                toxicity = round(random.uniform(0.3, 0.7), 4)
                spam = round(random.uniform(0.2, 0.6), 4)
                nsfw = round(random.uniform(0.15, 0.5), 4)
                reason = random.choice(self.MODERATION_REASONS)
            else:  # reviewed
                toxicity = round(random.uniform(0, 0.5), 4)
                spam = round(random.uniform(0, 0.4), 4)
                nsfw = round(random.uniform(0, 0.3), 4)
                reason = random.choice(self.MODERATION_REASONS)

            # Choose moderator - auto is most common for initial scans
            if action == "approved" and random.random() < 0.6:
                moderator = "auto"
            elif action == "flagged":
                moderator = random.choice(["auto", "moderator_ai"])
            else:
                moderator = random.choice(self.MODERATORS)

            # Pick a user (70% chance, rest null for system actions)
            user_id = None
            if user_ids and random.random() < 0.7:
                user_id = random.choice(user_ids)

            content_type = random.choice(self.CONTENT_TYPES)

            moderation_details = {}
            if action in ("flagged", "rejected"):
                # Add more detailed ML analysis data for flagged/rejected items
                moderation_details = {
                    "matched_keywords": random.sample(
                        ["viagra", "casino", "click here", "free money", "earn fast"],
                        random.randint(1, 3),
                    ),
                    "ml_model_version": f"v{random.randint(1, 3)}.{random.randint(0, 9)}.{random.randint(0, 99)}",
                    "confidence": round(random.uniform(0.6, 0.99), 4),
                    "rule_matches": random.randint(1, 5),
                }
                if random.random() < 0.3:
                    moderation_details["review_notes"] = "Reviewed by moderator - action confirmed"

            if action == "reviewed" and random.random() < 0.4:
                moderation_details["overturned"] = True
                moderation_details["previous_action"] = random.choice(["flagged", "rejected"])
                moderation_details["review_notes"] = "Overturned upon human review - false positive"

            # Timestamp within last 7 days
            timestamp = now - timedelta(
                days=random.randint(0, 7),
                hours=random.randint(0, 23),
                minutes=random.randint(0, 59),
            )

            entry = {
                "user_id": user_id,
                "content_type": content_type,
                "content_id": str(uuid.uuid4()),
                "action": action,
                "moderation_reason": reason,
                "toxicity_score": toxicity,
                "spam_score": spam,
                "nsfw_score": nsfw,
                "moderation_details": moderation_details,
                "moderated_by": moderator,
                "created_at": timestamp.isoformat(),
            }

            result = self.create_single("content_moderation_logs", entry, track=False)
            if result is not None:
                created += 1
                self.stats["created"] += 1
            else:
                self.stats["failed"] += 1

            self.log_progress(i, count, f"Moderation logs ({i + 1}/{count})")

            if (i + 1) % config.BATCH_SIZE == 0:
                time.sleep(config.DELAY_BETWEEN_BATCHES)

        self.log_stats(self.stats, "Content Moderation Logs")
        return self.stats["created"]


if __name__ == "__main__":
    print("Moderation logs seeder module loaded successfully")
