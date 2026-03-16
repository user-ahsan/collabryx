"""
Base Seeder
Common utilities for all seeders using Supabase REST API
"""

import random
import time
from typing import List, Dict, Any, Optional, Set, Tuple
from colorama import Fore, Style

from config import config


class BaseSeeder:
    """Base class with common Supabase REST API utilities for all seeders"""

    def __init__(self, http_client):
        self.http = http_client
        self._user_ids_cache = None
        self._existing_data_cache = {}

    # =========================================================================
    # DATA FETCHING - Get real UUIDs from Supabase
    # =========================================================================

    def fetch_user_ids(self, limit: int = None) -> List[str]:
        """Fetch actual user UUIDs from profiles table"""
        try:
            if self._user_ids_cache is not None:
                return self._user_ids_cache

            url = f"{config.SUPABASE_REST_URL}/profiles?select=id"
            if limit:
                url += f"&limit={limit}"

            print(f"{Fore.YELLOW}  → Fetching from: {url}{Style.RESET_ALL}")
            response = self.http.get(url, headers=config.API_HEADERS)
            print(
                f"{Fore.YELLOW}  → Response status: {response.status_code}{Style.RESET_ALL}"
            )
            response.raise_for_status()
            profiles = response.json() or []
            print(f"{Fore.YELLOW}  → Found {len(profiles)} profiles{Style.RESET_ALL}")

            self._user_ids_cache = [p["id"] for p in profiles]
            return self._user_ids_cache

        except Exception as e:
            print(f"{Fore.RED}✗ Failed to fetch user IDs: {e}{Style.RESET_ALL}")
            import traceback

            traceback.print_exc()
            return []

    def fetch_random_user_ids(self, count: int, exclude: List[str] = None) -> List[str]:
        """Fetch random user UUIDs for relationships"""
        try:
            all_ids = self.fetch_user_ids()

            if exclude:
                all_ids = [uid for uid in all_ids if uid not in exclude]

            if len(all_ids) < count:
                return all_ids

            return random.sample(all_ids, count)

        except Exception as e:
            print(f"{Fore.RED}✗ Failed to fetch random user IDs: {e}{Style.RESET_ALL}")
            return []

    def fetch_connected_user_ids(self, user_id: str) -> Set[str]:
        """Fetch users already connected to a specific user"""
        try:
            cache_key = f"connected_{user_id}"
            if cache_key in self._existing_data_cache:
                return self._existing_data_cache[cache_key]

            # Get connections where user is requester or receiver
            response = self.http.get(
                f"{config.SUPABASE_REST_URL}/connections?select=requester_id,receiver_id&or=(requester_id.eq.{user_id},receiver_id.eq.{user_id})&status.eq.accepted",
                headers=config.API_HEADERS,
            )
            response.raise_for_status()
            connections = response.json() or []

            connected = set()
            for conn in connections:
                if conn["requester_id"] == user_id:
                    connected.add(conn["receiver_id"])
                else:
                    connected.add(conn["requester_id"])

            self._existing_data_cache[cache_key] = connected
            return connected

        except Exception as e:
            return set()

    def fetch_existing_posts(self, limit: int = None) -> List[Dict[str, Any]]:
        """Fetch existing posts for comments/reactions"""
        try:
            cache_key = "posts"
            if cache_key in self._existing_data_cache:
                return self._existing_data_cache[cache_key]

            url = f"{config.SUPABASE_REST_URL}/posts?select=id,author_id"
            if limit:
                url += f"&limit={limit}"

            response = self.http.get(url, headers=config.API_HEADERS)
            response.raise_for_status()
            posts = response.json() or []

            self._existing_data_cache[cache_key] = posts
            return posts

        except Exception as e:
            return []

    def fetch_existing_conversations(self) -> List[Dict[str, Any]]:
        """Fetch existing conversations"""
        try:
            cache_key = "conversations"
            if cache_key in self._existing_data_cache:
                return self._existing_data_cache[cache_key]

            response = self.http.get(
                f"{config.SUPABASE_REST_URL}/conversations?select=id,participant_1,participant_2",
                headers=config.API_HEADERS,
            )
            response.raise_for_status()
            conversations = response.json() or []

            self._existing_data_cache[cache_key] = conversations
            return conversations

        except Exception as e:
            return []

    def fetch_existing_connections(self) -> Set[Tuple[str, str]]:
        """Fetch existing connections to avoid duplicates"""
        try:
            cache_key = "connections"
            if cache_key in self._existing_data_cache:
                return self._existing_data_cache[cache_key]

            response = self.http.get(
                f"{config.SUPABASE_REST_URL}/connections?select=requester_id,receiver_id",
                headers=config.API_HEADERS,
            )
            response.raise_for_status()
            connections = response.json() or []

            existing = {(c["requester_id"], c["receiver_id"]) for c in connections}

            self._existing_data_cache[cache_key] = existing
            return existing

        except Exception as e:
            return set()

    # =========================================================================
    # UPSERT & CREATE UTILITIES
    # =========================================================================

    def upsert_batch(
        self, table: str, data: List[Dict], unique_fields: List[str] = None
    ) -> Tuple[int, int]:
        """
        Upsert data with conflict handling
        Returns: (created_count, skipped_count)
        """
        created = 0
        skipped = 0

        for item in data:
            try:
                response = self.http.post(
                    f"{config.SUPABASE_REST_URL}/{table}",
                    json=item,
                    headers=config.API_HEADERS,
                )

                if response.status_code in [200, 201]:
                    created += 1
                elif response.status_code == 409:
                    skipped += 1
                else:
                    response.raise_for_status()

            except Exception:
                skipped += 1

        return created, skipped

    def create_single(self, table: str, data: Dict[str, Any]) -> Optional[str]:
        """Create a single record, return ID if successful"""
        try:
            response = self.http.post(
                f"{config.SUPABASE_REST_URL}/{table}",
                json=data,
                headers=config.API_HEADERS,
            )

            if response.status_code in [200, 201, 409]:
                result = response.json()
                if result and len(result) > 0:
                    return result[0].get("id")
                return None

            response.raise_for_status()
            return None

        except Exception as e:
            return None

    # =========================================================================
    # LOGGING & PROGRESS
    # =========================================================================

    def log_progress(self, current: int, total: int, message: str = ""):
        """Log seeding progress"""
        if total > 0 and (current + 1) % max(1, total // 10) == 0:
            percentage = ((current + 1) / total) * 100
            print(
                f"{Fore.GREEN}✓ {message} ({current + 1}/{total}) - {percentage:.0f}%{Style.RESET_ALL}"
            )

    def log_stats(self, stats: Dict[str, int], entity_name: str):
        """Log final statistics"""
        print(f"\n{Fore.GREEN}{'=' * 60}{Style.RESET_ALL}")
        print(f"{Fore.GREEN}✓ {entity_name} Seeding Complete{Style.RESET_ALL}")

        for key, value in stats.items():
            if value > 0:
                color = (
                    Fore.GREEN
                    if key in ["created", "success"]
                    else Fore.YELLOW
                    if "skip" in key
                    else Fore.RED
                )
                print(f"{color}{key.capitalize()}: {value}{Style.RESET_ALL}")

        print(f"{Fore.GREEN}{'=' * 60}{Style.RESET_ALL}\n")

    # =========================================================================
    # UTILITIES
    # =========================================================================

    def parse_limit_range(self, limit_str: str) -> Tuple[int, int]:
        """Parse limit string like '3,8' into (3, 8) or '5' into (5, 5)"""
        try:
            if "," in limit_str:
                parts = limit_str.split(",")
                return int(parts[0].strip()), int(parts[1].strip())
            else:
                val = int(limit_str)
                return val, val
        except:
            return 1, 1

    def clear_cache(self):
        """Clear all caches to fetch fresh data"""
        self._user_ids_cache = None
        self._existing_data_cache = {}

    def get_table_count(self, table: str) -> int:
        """Get row count for a single table"""
        try:
            response = self.http.get(
                f"{config.SUPABASE_REST_URL}/{table}?select=id&limit=1",
                headers=config.API_HEADERS,
                timeout=5.0,  # Add timeout
            )
            if response.status_code != 200:
                print(
                    f"{Fore.YELLOW}  ⚠️  Warning: Could not fetch {table} count (status {response.status_code}){Style.RESET_ALL}"
                )
                return 0
            content_range = response.headers.get("Content-Range", "")
            if "/" in content_range:
                return int(content_range.split("/")[-1])
            return 0
        except Exception as e:
            print(
                f"{Fore.YELLOW}  ⚠️  Warning: Could not fetch {table} count ({type(e).__name__}){Style.RESET_ALL}"
            )
            return 0

    def print_database_status(self):
        """Print current database status"""
        print(f"\n{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}")
        print(f"{Fore.CYAN}DATABASE STATUS{Style.RESET_ALL}")
        print(f"{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}")

        tables = [
            ("profiles", "👤 Profiles"),
            ("posts", "📝 Posts"),
            ("comments", "💬 Comments"),
            ("post_reactions", "👍 Reactions"),
            ("connections", "🔗 Connections"),
            ("match_suggestions", "🎯 Matches"),
            ("conversations", "💭 Conversations"),
            ("messages", "📩 Messages"),
            ("notifications", "🔔 Notifications"),
            ("ai_mentor_sessions", "🤖 Mentor Sessions"),
            ("profile_embeddings", "🧠 Embeddings"),
        ]

        for table, label in tables:
            count = self.get_table_count(table)
            if count >= 0:
                print(f"  {label}: {Fore.GREEN}{count:,}{Style.RESET_ALL}")
            else:
                print(f"  {label}: {Fore.RED}Error{Style.RESET_ALL}")

        print(f"{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}\n")
