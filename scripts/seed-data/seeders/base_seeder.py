"""
Base Seeder
Common utilities for all seeders using Supabase REST API
"""

import random
import time
import httpx
from typing import List, Dict, Any, Optional, Set, Tuple
from colorama import Fore, Style

from config import config


class ResilientHTTPClient:
    """HTTP client with retry logic, timeouts, and connection pooling"""

    def __init__(self):
        self.timeout = httpx.Timeout(30.0, connect=10.0, read=60.0)
        self.limits = httpx.Limits(max_connections=100, max_keepalive_connections=20)
        self.max_retries = 3
        self.base_delay = 1.0
        self._client: Optional[httpx.Client] = None
        self._default_headers: Dict[str, str] = {}

    def __enter__(self):
        self._client = httpx.Client(timeout=self.timeout, limits=self.limits)
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if self._client:
            self._client.close()

    def set_headers(self, headers: Dict[str, str]):
        """Set default headers for all requests"""
        self._default_headers = headers

    def _should_retry(self, status_code: int) -> bool:
        """Determine if request should be retried"""
        return status_code in [429, 500, 502, 503, 504]

    def _calculate_delay(self, attempt: int) -> float:
        """Calculate exponential backoff delay"""
        import random

        base_delay = self.base_delay * (2**attempt)
        jitter = random.uniform(0, base_delay * 0.1)
        return base_delay + jitter

    def request(self, method: str, url: str, **kwargs) -> httpx.Response:
        """Make HTTP request with retry logic"""
        headers = {**self._default_headers, **kwargs.pop("headers", {})}

        if not self._client:
            raise RuntimeError(
                "Client not initialized. Use context manager: with ResilientHTTPClient()"
            )

        last_exception: Optional[Exception] = None

        for attempt in range(self.max_retries):
            try:
                response = self._client.request(method, url, headers=headers, **kwargs)
                status_code = response.status_code

                if self._should_retry(status_code):
                    if attempt < self.max_retries - 1:
                        delay = self._calculate_delay(attempt)
                        print(
                            f"{Fore.YELLOW}  ⚠️  Retry {attempt + 1}/{self.max_retries} after {delay:.1f}s (status: {status_code}){Style.RESET_ALL}"
                        )
                        time.sleep(delay)
                        continue
                    else:
                        response.raise_for_status()

                return response

            except (httpx.ConnectTimeout, httpx.ReadTimeout, httpx.ConnectError) as e:
                last_exception = e
                if attempt < self.max_retries - 1:
                    delay = self._calculate_delay(attempt)
                    print(
                        f"{Fore.YELLOW}  ⚠️  Retry {attempt + 1}/{self.max_retries} after {delay:.1f}s (connection error){Style.RESET_ALL}"
                    )
                    time.sleep(delay)
                else:
                    raise

        if last_exception:
            raise last_exception
        raise RuntimeError("Request failed without exception")

    def get(self, url: str, **kwargs) -> httpx.Response:
        """HTTP GET with retry"""
        return self.request("GET", url, **kwargs)

    def post(self, url: str, **kwargs) -> httpx.Response:
        """HTTP POST with retry"""
        return self.request("POST", url, **kwargs)

    def patch(self, url: str, **kwargs) -> httpx.Response:
        """HTTP PATCH with retry"""
        return self.request("PATCH", url, **kwargs)

    def delete(self, url: str, **kwargs) -> httpx.Response:
        """HTTP DELETE with retry"""
        return self.request("DELETE", url, **kwargs)


class BaseSeeder:
    """Base class with common Supabase REST API utilities for all seeders"""

    def __init__(self, http_client):
        if isinstance(http_client, ResilientHTTPClient):
            self.http = http_client
        else:
            self.http = http_client
        self._user_ids_cache = None
        self._existing_data_cache = {}
        self._creation_log = []

    # =========================================================================
    # DATA FETCHING - Get real UUIDs from Supabase
    # =========================================================================

    def fetch_user_ids(self, limit: Optional[int] = None) -> List[str]:
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

    def fetch_random_user_ids(
        self, count: int, exclude: Optional[List[str]] = None
    ) -> List[str]:
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

    def fetch_existing_posts(self, limit: Optional[int] = None) -> List[Dict[str, Any]]:
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
        self, table: str, data: List[Dict], unique_fields: Optional[List[str]] = None
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

    def create_single(
        self, table: str, data: Dict[str, Any], track: bool = True
    ) -> Optional[str]:
        """Create a single record, return ID if successful

        Args:
            table: Table name
            data: Record data
            track: Whether to track this creation for rollback
        """
        try:
            response = self.http.post(
                f"{config.SUPABASE_REST_URL}/{table}",
                json=data,
                headers=config.API_HEADERS,
            )

            if response.status_code in [200, 201]:
                result = response.json()
                if result and len(result) > 0:
                    record_id = result[0].get("id")
                    if track:
                        self._creation_log.append((table, record_id, data))
                    return record_id
                return None
            elif response.status_code == 409:
                # Conflict - record already exists
                return None

            response.raise_for_status()
            return None

        except Exception as e:
            print(f"{Fore.RED}  ✗ Error creating {table}: {e}{Style.RESET_ALL}")
            return None

    def rollback_last(self):
        """Delete the last created record"""
        if not self._creation_log:
            return

        table, record_id, _ = self._creation_log.pop()
        try:
            self.http.delete(
                f"{config.SUPABASE_REST_URL}/{table}?id=eq.{record_id}",
                headers=config.API_HEADERS,
            )
            print(f"{Fore.YELLOW}  ↩ Rolled back {table}.{record_id}{Style.RESET_ALL}")
        except Exception as e:
            print(
                f"{Fore.RED}  ✗ Failed to rollback {table}.{record_id}: {e}{Style.RESET_ALL}"
            )

    def rollback_all(self):
        """Delete all records created in this session (LIFO order)"""
        if not self._creation_log:
            print(f"{Fore.YELLOW}  No records to rollback{Style.RESET_ALL}")
            return

        print(
            f"{Fore.YELLOW}  Rolling back {len(self._creation_log)} records...{Style.RESET_ALL}"
        )
        count = 0
        for table, record_id, _ in reversed(self._creation_log):
            try:
                self.http.delete(
                    f"{config.SUPABASE_REST_URL}/{table}?id=eq.{record_id}",
                    headers=config.API_HEADERS,
                )
                count += 1
            except Exception:
                pass

        self._creation_log = []
        print(f"{Fore.GREEN}  ✓ Rolled back {count} records{Style.RESET_ALL}")

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

    def reaction_exists(self, post_id: str, user_id: str) -> bool:
        """Check if a user has already reacted to a post"""
        try:
            response = self.http.get(
                f"{config.SUPABASE_REST_URL}/post_reactions",
                params={"post_id": f"eq.{post_id}", "user_id": f"eq.{user_id}"},
                headers=config.API_HEADERS,
            )
            if response.status_code == 200:
                data = response.json()
                return len(data) > 0
            return False
        except Exception:
            return False

    def comment_exists(self, post_id: str, author_id: str, content: str) -> bool:
        """Check if a comment already exists (basic duplicate check)"""
        try:
            response = self.http.get(
                f"{config.SUPABASE_REST_URL}/comments",
                params={"post_id": f"eq.{post_id}", "author_id": f"eq.{author_id}"},
                headers=config.API_HEADERS,
            )
            if response.status_code == 200:
                data = response.json()
                # Check if any comment has same content
                for comment in data:
                    if comment.get("content") == content:
                        return True
            return False
        except Exception:
            return False

    def connection_exists(self, requester_id: str, receiver_id: str) -> bool:
        """Check if a connection already exists between two users"""
        try:
            response = self.http.get(
                f"{config.SUPABASE_REST_URL}/connections",
                params={
                    "requester_id": f"eq.{requester_id}",
                    "receiver_id": f"eq.{receiver_id}",
                },
                headers=config.API_HEADERS,
            )
            if response.status_code == 200:
                data = response.json()
                return len(data) > 0
            return False
        except Exception:
            return False

    def conversation_exists(self, participant_1: str, participant_2: str) -> bool:
        """Check if a conversation already exists between two users"""
        try:
            # Check both directions since conversations are bidirectional
            response = self.http.get(
                f"{config.SUPABASE_REST_URL}/conversations",
                params={
                    "or": f"(and(participant_1.eq.{participant_1},participant_2.eq.{participant_2}),and(participant_1.eq.{participant_2},participant_2.eq.{participant_1}))",
                },
                headers=config.API_HEADERS,
            )
            if response.status_code == 200:
                data = response.json()
                return len(data) > 0
            return False
        except Exception:
            return False

    def get_table_count(self, table: str) -> int:
        """Get row count for a single table using Content-Range header"""
        try:
            # Use Count=exact to get total count in Content-Range header
            count_headers = {
                **config.API_HEADERS,
                "Count": "exact",
                "Prefer": "count=exact",
            }
            response = self.http.get(
                f"{config.SUPABASE_REST_URL}/{table}?select=id&limit=1",
                headers=count_headers,
            )
            # Status 206 (Partial Content) is expected with limit=1 + Count=exact
            if response.status_code not in [200, 206]:
                print(
                    f"{Fore.YELLOW}  ⚠️  Warning: Could not fetch {table} count (status {response.status_code}){Style.RESET_ALL}"
                )
                return 0

            # Content-Range format: "bytes 0-0/1234" or "bytes */1234"
            # We need the total count after the "/"
            content_range = response.headers.get("Content-Range", "")
            if not content_range:
                return 0

            # Parse "bytes 0-0/1234" → extract "1234"
            parts = content_range.split("/")
            if len(parts) >= 2:
                total = parts[-1].strip()
                if total.isdigit():
                    return int(total)

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
