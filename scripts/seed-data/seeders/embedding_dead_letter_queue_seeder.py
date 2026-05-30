"""
Embedding Dead Letter Queue Seeder
Creates embedding_dead_letter_queue entries using Supabase REST API
Simulates failed embedding generation attempts
"""

import random
import time
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional, List
from colorama import Fore, Style

from config import config
from seeders.base_seeder import BaseSeeder


class EmbeddingDeadLetterQueueSeeder(BaseSeeder):
    """Seeder for embedding_dead_letter_queue with simulated failed embeddings"""

    def __init__(self, http_client):
        super().__init__(http_client)
        self.stats = {"created": 0, "skipped": 0, "failed": 0}

    def _load_cache(self):
        """Load existing DLQ records to avoid duplicates"""
        try:
            records = self.fetch_existing_ids(
                "embedding_dead_letter_queue",
                id_field="id",
                additional_fields=["user_id", "source_type", "source_id"],
            )
            self._existing = {(r["user_id"], r["source_type"], r.get("source_id", "")) for r in records}
            print(
                f"{Fore.YELLOW}  → Found {len(self._existing)} existing DLQ records{Style.RESET_ALL}"
            )
        except Exception as e:
            print(f"{Fore.RED}✗ Failed to load DLQ cache: {e}{Style.RESET_ALL}")
            self._existing = set()

    def create_dlq_entry(
        self, user_id: str, source_type: str, source_id: str, status: str
    ) -> Optional[str]:
        """Create a single DLQ entry"""
        dedup_key = (user_id, source_type, source_id)
        if dedup_key in self._existing:
            self.stats["skipped"] += 1
            return None

        error_messages = {
            "embedding": [
                "Model inference timeout after 30s",
                "Invalid text input: empty content",
                "Vector dimension mismatch: expected 384",
                "Model returned NaN values",
                "API rate limit exceeded",
            ],
            "validation": [
                "Content exceeds max length of 8192 characters",
                "Invalid character encoding detected",
                "Language not supported by model",
            ],
            "network": [
                "Connection reset by peer",
                "DNS resolution failed for embedding service",
                "SSL handshake failed",
            ],
        }

        retry_counts = {"pending": 0, "failed": random.randint(1, 3), "resolved": random.randint(1, 3)}

        data = {
            "user_id": user_id,
            "source_type": source_type,
            "source_id": source_id,
            "status": status,
            "max_retries": 3,
            "retry_count": retry_counts.get(status, 0),
            "error_message": random.choice(
                error_messages.get(
                    random.choice(list(error_messages.keys()))
                )
            ),
            "created_at": (datetime.now(timezone.utc) - timedelta(hours=random.randint(1, 48))).isoformat(),
        }

        if status == "resolved":
            data["resolved_at"] = (datetime.now(timezone.utc) - timedelta(hours=random.randint(0, 24))).isoformat()
        elif status == "failed":
            data["last_retry_at"] = (datetime.now(timezone.utc) - timedelta(minutes=random.randint(5, 120))).isoformat()

        record_id = self.create_single("embedding_dead_letter_queue", data)
        if record_id:
            self.stats["created"] += 1
            self._existing.add(dedup_key)
            return record_id
        self.stats["failed"] += 1
        return None

    def seed(self, limit: Optional[int] = None) -> Dict[str, int]:
        """Seed DLQ entries"""
        self.stats = {"created": 0, "skipped": 0, "failed": 0}
        self._load_cache()

        user_ids = self.fetch_user_ids()
        if not user_ids:
            print(f"{Fore.RED}✗ No users found{Style.RESET_ALL}")
            return self.stats

        num_entries = limit if limit else min(len(user_ids) * 3, 100)
        statuses = ["pending", "failed", "resolved", "pending", "failed"]
        source_types = ["profile", "post", "comment"]

        print(
            f"\n{Fore.CYAN}Seeding {num_entries} dead letter queue entries...{Style.RESET_ALL}"
        )

        for i in range(num_entries):
            user_id = random.choice(user_ids)
            source_type = random.choice(source_types)
            source_id = user_id if source_type == "profile" else str(random.choice(user_ids))
            status = random.choice(statuses)

            self.create_dlq_entry(user_id, source_type, source_id, status)

            if (i + 1) % 20 == 0:
                time.sleep(0.1)
                print(f"  → {i + 1}/{num_entries} entries processed")

        self.log_stats(self.stats, "Embedding Dead Letter Queue")
        return self.stats
