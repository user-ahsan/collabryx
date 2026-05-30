"""
Platform Analytics Seeder
Creates daily aggregate platform analytics with realistic trending patterns
One row per date (PK) with 45+ aggregate metrics
"""

import random
import time
import math
from datetime import datetime, timedelta, date
from typing import List, Dict, Any, Optional
from colorama import Fore, Style

from config import config
from seeders.base_seeder import BaseSeeder


class PlatformAnalyticsSeeder(BaseSeeder):
    """Seeder for platform_analytics table using REST API"""

    def __init__(self, http_client):
        super().__init__(http_client)
        self.stats = {"created": 0, "skipped": 0, "failed": 0}

    def generate_daily_metrics(
        self,
        day: date,
        day_index: int,
        total_days: int,
        base_users: int = 100,
    ) -> Dict[str, Any]:
        """
        Generate a full day of platform metrics with realistic patterns.
        - Gradual growth over time (day_index / total_days)
        - Weekend dips for engagement metrics
        - Weekday peaks for content creation
        - All cumulative metrics build on previous values
        """
        # Growth factor: gradual increase over time (0 to ~30% growth)
        growth_factor = 1.0 + (day_index / total_days) * 0.3

        # Day-of-week factors: weekday/weekend cycles
        weekday = day.weekday()  # 0=Mon, 6=Sun
        is_weekend = weekday >= 5

        # Weekend factors: fewer posts/comments, more connections/messages
        if is_weekend:
            content_factor = 0.6  # Less content creation on weekends
            social_factor = 1.2   # More social activity on weekends
        else:
            content_factor = 1.0 + (1 - weekday / 5) * 0.2  # Higher early week
            social_factor = 1.0

        # Random daily variance (seasonal noise)
        daily_variance = random.uniform(0.85, 1.15)

        # ---- User metrics (cumulative, always growing) ----
        total_users = int(base_users * growth_factor * random.uniform(0.97, 1.03))
        new_users = max(1, int(total_users * 0.02 * daily_variance * content_factor))
        total_users = max(total_users, base_users)

        # Active users (depend on day of week)
        active_users_daily = int(total_users * random.uniform(0.15, 0.35) * (0.7 if is_weekend else 1.0))
        active_users_weekly = int(total_users * random.uniform(0.45, 0.65))
        active_users_monthly = int(total_users * random.uniform(0.7, 0.9))

        # New user retention (follows new users)
        new_users_retained_day1 = int(new_users * random.uniform(0.4, 0.7))
        new_users_retained_day7 = int(new_users * random.uniform(0.15, 0.35))

        # ---- Content metrics ----
        new_posts = max(0, int(total_users * 0.03 * daily_variance * content_factor * random.uniform(0.8, 1.2)))
        total_posts = int(new_posts * (day_index + 1) * 0.8)  # Cumulative approx

        new_comments = int(new_posts * random.uniform(2, 5) * content_factor)
        total_comments = int(new_comments * (day_index + 1) * 0.7)

        new_reactions = int(new_posts * random.uniform(5, 15) * content_factor)
        total_reactions = int(new_reactions * (day_index + 1) * 0.6)

        # ---- Social metrics ----
        new_connections = int(new_users * random.uniform(1.5, 3.0) * social_factor)
        total_connections = int(new_connections * (day_index + 1) * 0.9)

        new_messages = int(active_users_daily * random.uniform(3, 8) * social_factor)
        total_messages = int(new_messages * (day_index + 1) * 0.5)

        new_matches = int(new_users * random.uniform(0.5, 1.5) * social_factor)
        total_matches = int(new_matches * (day_index + 1) * 0.7)

        # ---- Session metrics ----
        avg_session_duration_seconds = int(random.uniform(180, 600) * (0.8 if is_weekend else 1.0))
        total_sessions = int(active_users_daily * random.uniform(1.5, 3.5))
        median_session_duration_seconds = int(avg_session_duration_seconds * random.uniform(0.7, 0.9))
        p95_session_duration_seconds = int(avg_session_duration_seconds * random.uniform(2.5, 4.0))
        bounce_rate = round(random.uniform(0.25, 0.45), 4)
        avg_pages_per_session = round(random.uniform(2.5, 6.0), 2)

        # ---- Engagement rates ----
        daily_engagement_rate = round(
            active_users_daily / max(total_users, 1) * random.uniform(0.8, 1.2),
            4,
        )
        weekly_engagement_rate = round(
            active_users_weekly / max(total_users, 1) * random.uniform(0.8, 1.2),
            4,
        )
        monthly_engagement_rate = round(
            active_users_monthly / max(total_users, 1) * random.uniform(0.8, 1.2),
            4,
        )

        # ---- Conversion metrics ----
        signup_to_profile_completion = round(random.uniform(0.5, 0.8), 4)
        profile_to_connection = round(random.uniform(0.4, 0.7), 4)
        connection_to_message = round(random.uniform(0.6, 0.85), 4)
        message_to_match = round(random.uniform(0.2, 0.4), 4)

        # ---- Notification metrics ----
        notifications_sent = int(active_users_daily * random.uniform(2, 6))
        notifications_opened = int(notifications_sent * random.uniform(0.3, 0.6))
        notification_click_rate = round(
            notifications_opened / max(notifications_sent, 1), 4
        )

        # ---- Feature adoption ----
        ai_mentor_sessions = int(active_users_daily * random.uniform(0.05, 0.15))
        matching_feature_uses = int(active_users_daily * random.uniform(0.1, 0.25))
        search_queries = int(active_users_daily * random.uniform(0.5, 1.5))

        # ---- Retention ----
        day_1_retention_rate = round(random.uniform(0.35, 0.65), 4)
        day_7_retention_rate = round(random.uniform(0.15, 0.35), 4)
        day_30_retention_rate = round(random.uniform(0.05, 0.15), 4)

        # ---- Error metrics ----
        error_count = int(total_sessions * random.uniform(0.01, 0.05))
        api_error_rate = round(error_count / max(total_sessions, 1), 4)
        avg_api_response_time_ms = round(random.uniform(80, 350), 2)

        # ---- Build the row ----
        row = {
            "date": day.isoformat(),
            # User metrics
            "total_users": total_users,
            "new_users": new_users,
            "active_users_daily": active_users_daily,
            "active_users_weekly": active_users_weekly,
            "active_users_monthly": active_users_monthly,
            "new_users_retained_day1": new_users_retained_day1,
            "new_users_retained_day7": new_users_retained_day7,
            # Content metrics
            "total_posts": total_posts,
            "new_posts": new_posts,
            "total_comments": total_comments,
            "new_comments": new_comments,
            "total_reactions": total_reactions,
            "new_reactions": new_reactions,
            # Social metrics
            "total_connections": total_connections,
            "new_connections": new_connections,
            "total_messages": total_messages,
            "new_messages": new_messages,
            "total_matches": total_matches,
            "new_matches": new_matches,
            # Session metrics
            "avg_session_duration_seconds": avg_session_duration_seconds,
            "median_session_duration_seconds": median_session_duration_seconds,
            "p95_session_duration_seconds": p95_session_duration_seconds,
            "total_sessions": total_sessions,
            "bounce_rate": bounce_rate,
            "avg_pages_per_session": avg_pages_per_session,
            # Engagement
            "daily_engagement_rate": daily_engagement_rate,
            "weekly_engagement_rate": weekly_engagement_rate,
            "monthly_engagement_rate": monthly_engagement_rate,
            # Conversion
            "signup_to_profile_completion": signup_to_profile_completion,
            "profile_to_connection": profile_to_connection,
            "connection_to_message": connection_to_message,
            "message_to_match": message_to_match,
            # Notifications
            "notifications_sent": notifications_sent,
            "notifications_opened": notifications_opened,
            "notification_click_rate": notification_click_rate,
            # Feature usage
            "ai_mentor_sessions": ai_mentor_sessions,
            "matching_feature_uses": matching_feature_uses,
            "search_queries": search_queries,
            # Retention
            "day_1_retention_rate": day_1_retention_rate,
            "day_7_retention_rate": day_7_retention_rate,
            "day_30_retention_rate": day_30_retention_rate,
            # Performance
            "error_count": error_count,
            "api_error_rate": api_error_rate,
            "avg_api_response_time_ms": avg_api_response_time_ms,
        }

        return row

    def seed(self, days: int = None) -> int:
        """
        Seed platform analytics with historical daily data.
        Creates one row per day with realistic trending patterns.
        """
        self.stats = {"created": 0, "skipped": 0, "failed": 0}

        if days is None:
            days = random.randint(7, 30)

        print(f"\n{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}")
        print(f"{Fore.CYAN}SEEDING PLATFORM ANALYTICS{Style.RESET_ALL}")
        print(f"{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}")
        print(
            f"{Fore.YELLOW}  Target: {days} daily analytics rows{Style.RESET_ALL}"
        )

        now = datetime.utcnow()
        created = 0

        for i in range(days):
            day = (now - timedelta(days=days - 1 - i)).date()

            # Base users grows over time: start at ~50-150 and grow to 100-300
            start_users = random.randint(50, 150)
            base_users = start_users + int(start_users * (i / max(days, 1)) * 0.5)

            row = self.generate_daily_metrics(
                day=day,
                day_index=i,
                total_days=days,
                base_users=base_users,
            )

            result = self.create_single("platform_analytics", row, track=False)
            if result is not None:
                created += 1
                self.stats["created"] += 1
            else:
                self.stats["failed"] += 1

            self.log_progress(i, days, f"Platform analytics ({i + 1}/{days})")

            if (i + 1) % config.BATCH_SIZE == 0:
                time.sleep(config.DELAY_BETWEEN_BATCHES)

        self.log_stats(self.stats, "Platform Analytics")
        return self.stats["created"]


if __name__ == "__main__":
    print("Platform analytics seeder module loaded successfully")
