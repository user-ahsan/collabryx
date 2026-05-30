"""
Audit Logs Seeder
Creates audit log entries referencing auth.users (not public.profiles)
Uses Supabase Auth Admin API to fetch real auth user IDs
"""

import random
import time
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from colorama import Fore, Style

from config import config
from seeders.base_seeder import BaseSeeder


class AuditLogsSeeder(BaseSeeder):
    """Seeder for audit_logs table using REST API"""

    def __init__(self, http_client):
        super().__init__(http_client)
        self.stats = {"created": 0, "skipped": 0, "failed": 0}
        self._auth_user_ids: List[str] = []

    AUDIT_ACTIONS = [
        "user.login",
        "user.logout",
        "user.register",
        "user.delete",
        "user.suspend",
        "profile.update",
        "profile.view",
        "profile.avatar_change",
        "profile.privacy_change",
        "post.create",
        "post.update",
        "post.delete",
        "post.report",
        "comment.create",
        "comment.delete",
        "connection.request",
        "connection.accept",
        "connection.reject",
        "connection.remove",
        "message.send",
        "message.delete",
        "match.accept",
        "match.decline",
        "notification.read",
        "notification.dismiss",
        "settings.update",
        "password.change",
        "email.change",
        "mfa.enable",
        "mfa.disable",
        "session.create",
        "session.revoke",
        "api.key_generated",
        "api.key_revoked",
        "admin.user_impersonate",
        "admin.settings_change",
        "report.submit",
        "report.resolve",
        "content.moderation_action",
    ]

    RESOURCE_TYPES = [
        "user",
        "profile",
        "post",
        "comment",
        "connection",
        "message",
        "match",
        "notification",
        "session",
        "settings",
        "api_key",
        "report",
    ]

    USER_AGENTS = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_2) AppleWebKit/605.1.15 Safari/605.1.15",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/119.0.0.0 Safari/537.36",
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148",
        "Mozilla/5.0 (iPad; CPU OS 17_2 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148",
        "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36",
        "PostmanRuntime/7.36.0",
        "axios/1.6.2",
        "curl/8.4.0",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Edge/120.0.0.0",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_1) AppleWebKit/537.36 Chrome/119.0.0.0 Safari/537.36",
    ]

    def fetch_auth_user_ids(self) -> List[str]:
        """
        Fetch user IDs from auth.users via Supabase Auth Admin API.
        This is the correct source since audit_logs.user_id REFERENCES auth.users.
        Falls back to fetching from profiles if auth admin API fails.
        """
        if self._auth_user_ids:
            return self._auth_user_ids

        # Strategy 1: Try Auth Admin API
        try:
            auth_headers = {**config.API_HEADERS}
            auth_url = f"{config.SUPABASE_AUTH_URL}/admin/users?select=id"
            print(
                f"{Fore.YELLOW}  → Fetching auth users from: {auth_url}{Style.RESET_ALL}"
            )
            response = self.http.get(auth_url, headers=auth_headers)
            print(
                f"{Fore.YELLOW}  → Auth API response status: {response.status_code}{Style.RESET_ALL}"
            )

            if response.status_code == 200:
                data = response.json()
                # Auth admin API returns { "users": [...] } where each user has "id"
                users = data.get("users", []) if isinstance(data, dict) else data
                if isinstance(users, list) and len(users) > 0:
                    self._auth_user_ids = [
                        u["id"] for u in users if isinstance(u, dict) and "id" in u
                    ]
                    print(
                        f"{Fore.YELLOW}  → Found {len(self._auth_user_ids)} auth users via Admin API{Style.RESET_ALL}"
                    )
                    return self._auth_user_ids
                else:
                    print(
                        f"{Fore.YELLOW}  → Auth Admin API returned empty users list{Style.RESET_ALL}"
                    )

        except Exception as e:
            print(
                f"{Fore.YELLOW}  ⚠️  Auth Admin API failed: {e}{Style.RESET_ALL}"
            )

        # Strategy 2: Fallback to profiles table
        print(
            f"{Fore.YELLOW}  → Falling back to profiles table for user IDs{Style.RESET_ALL}"
        )
        profile_ids = self.fetch_user_ids()
        if profile_ids:
            self._auth_user_ids = profile_ids
            print(
                f"{Fore.YELLOW}  → Using {len(self._auth_user_ids)} profile IDs as fallback{Style.RESET_ALL}"
            )
        else:
            print(
                f"{Fore.RED}  ✗ Could not fetch any user IDs from any source{Style.RESET_ALL}"
            )

        return self._auth_user_ids

    def generate_ip_address(self) -> str:
        """Generate a realistic-looking IP address"""
        ip_type = random.random()
        if ip_type < 0.6:
            # Private range 192.168.x.x
            return f"192.168.{random.randint(0, 255)}.{random.randint(1, 254)}"
        elif ip_type < 0.85:
            # Private range 10.x.x.x
            return f"10.{random.randint(0, 255)}.{random.randint(0, 255)}.{random.randint(1, 254)}"
        else:
            # Public-looking IP
            return f"{random.randint(1, 223)}.{random.randint(0, 255)}.{random.randint(0, 255)}.{random.randint(1, 254)}"

    def generate_audit_entry(self, user_id: Optional[str], timestamp: datetime) -> Dict[str, Any]:
        """Generate a single realistic audit log entry"""
        action = random.choice(self.AUDIT_ACTIONS)
        resource_type = random.choice(self.RESOURCE_TYPES)

        # Some actions imply specific resource types
        if action.startswith("user."):
            resource_type = "user"
        elif action.startswith("profile."):
            resource_type = "profile"
        elif action.startswith("post."):
            resource_type = "post"
        elif action.startswith("comment."):
            resource_type = "comment"
        elif action.startswith("connection."):
            resource_type = "connection"
        elif action.startswith("message."):
            resource_type = "message"
        elif action.startswith("match."):
            resource_type = "match"
        elif action.startswith("notification."):
            resource_type = "notification"
        elif action.startswith("admin."):
            resource_type = "settings"
        elif action.startswith("report."):
            resource_type = "report"

        # Generate a plausible resource_id
        resource_id = None
        if resource_type != "settings" and random.random() < 0.85:
            import uuid
            resource_id = str(uuid.uuid4())

        details = {}
        if random.random() < 0.5:
            details["browser"] = random.choice(["Chrome", "Firefox", "Safari", "Edge", "Mobile Safari"])
        if random.random() < 0.3:
            details["platform"] = random.choice(["web", "mobile", "api", "cli"])
        if random.random() < 0.2:
            details["referrer"] = random.choice([
                "https://collabryx.com/dashboard",
                "https://collabryx.com/profile",
                "https://collabryx.com/settings",
                None,
            ])

        entry = {
            "user_id": user_id,
            "action": action,
            "resource_type": resource_type,
            "resource_id": resource_id,
            "details": details,
            "ip_address": self.generate_ip_address(),
            "user_agent": random.choice(self.USER_AGENTS),
            "created_at": timestamp.isoformat(),
        }

        return entry

    def seed(self, count: int = None) -> int:
        """Seed audit log entries"""
        self.stats = {"created": 0, "skipped": 0, "failed": 0}

        if count is None:
            count = random.randint(100, 500)

        print(f"\n{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}")
        print(f"{Fore.CYAN}SEEDING AUDIT LOGS{Style.RESET_ALL}")
        print(f"{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}")
        print(
            f"{Fore.YELLOW}  Target: {count} audit log entries{Style.RESET_ALL}"
        )

        # Fetch auth user IDs
        user_ids = self.fetch_auth_user_ids()
        if not user_ids:
            print(
                f"{Fore.RED}  ✗ No users available. Will create entries with user_id=null.{Style.RESET_ALL}"
            )
        else:
            print(
                f"{Fore.GREEN}  ✓ Using {len(user_ids)} auth users{Style.RESET_ALL}"
            )

        # Generate entries across the last 30 days
        now = datetime.utcnow()
        created = 0

        for i in range(count):
            # Random user_id (70% chance of having a user, 30% null)
            user_id = None
            if user_ids and random.random() < 0.7:
                user_id = random.choice(user_ids)

            # Timestamp: weighted more toward recent
            days_ago = random.expovariate(1.0 / 3.0)  # avg 3 days ago
            days_ago = min(days_ago, 30)
            timestamp = now - timedelta(days=days_ago, hours=random.randint(0, 23), minutes=random.randint(0, 59))

            entry = self.generate_audit_entry(user_id, timestamp)

            result = self.create_single("audit_logs", entry, track=False)
            if result is not None:
                created += 1
                self.stats["created"] += 1
            else:
                self.stats["failed"] += 1

            self.log_progress(i, count, f"Audit logs ({i + 1}/{count})")

            if (i + 1) % config.BATCH_SIZE == 0:
                time.sleep(config.DELAY_BETWEEN_BATCHES)

        self.log_stats(self.stats, "Audit Logs")
        return self.stats["created"]


if __name__ == "__main__":
    print("Audit logs seeder module loaded successfully")
