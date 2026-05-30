"""
User Analytics Seeder
Creates one analytics row per user with 30+ aggregate metrics
One row per user_id (PK) with plausible correlated metrics
"""

import random
import time
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from colorama import Fore, Style

from config import config
from seeders.base_seeder import BaseSeeder


class UserAnalyticsSeeder(BaseSeeder):
    """Seeder for user_analytics table using REST API"""

    def __init__(self, http_client):
        super().__init__(http_client)
        self.stats = {"created": 0, "skipped": 0, "failed": 0}

    # Engagement tiers: power users, regular users, lurkers
    # Each tier determines the baseline for all metrics
    def _generate_user_metrics(self, user_id: str, engagement_tier: str) -> Dict[str, Any]:
        """
        Generate a full set of analytics metrics for one user.
        Metrics are correlated: users with high posts also have high comments, reactions, etc.
        """
        now = datetime.utcnow()

        # Tier-based base multipliers
        tier_multipliers = {
            "power": {"base": 1.0, "variance": 0.3},
            "regular": {"base": 0.4, "variance": 0.25},
            "lurker": {"base": 0.05, "variance": 0.04},
        }

        tm = tier_multipliers.get(engagement_tier, tier_multipliers["regular"])

        # Base activity level (0-1) with some randomness
        activity = max(0, min(1, tm["base"] + random.uniform(-tm["variance"], tm["variance"])))
        # Secondary correlation factor: some users are more social, some more content-creators
        social_bias = random.uniform(0.3, 0.7)
        content_bias = 1 - social_bias

        # ---- Content metrics ----
        total_posts = max(0, int(activity * random.randint(1, 80)))
        total_comments = max(0, int(activity * random.randint(1, 200) * (1 + content_bias)))
        total_reactions_given = max(0, int(activity * random.randint(1, 300) * (1 + social_bias)))
        total_reactions_received = max(0, int(total_posts * random.uniform(0.5, 3.0)))
        total_post_saves = max(0, int(total_posts * random.uniform(0.1, 0.5)))

        # ---- Social metrics ----
        total_connections = max(0, int(activity * random.randint(1, 50)))
        total_messages_sent = max(0, int(activity * random.randint(1, 300) * social_bias))
        total_matches_received = max(0, int(activity * random.randint(0, 20)))
        total_matches_accepted = max(0, int(total_matches_received * random.uniform(0.3, 0.9)))
        total_profile_views = max(0, int(activity * random.randint(1, 150)))

        # ---- Activity metrics ----
        daily_active_streak = max(0, int(activity * random.randint(0, 30)))
        weekly_active_days = min(7, max(0, int(activity * 7 * random.uniform(0.3, 1.0))))
        active_days_last_7 = min(7, max(0, int(activity * 7 * random.uniform(0.2, 1.0))))
        active_days_last_30 = min(30, max(0, int(activity * 30 * random.uniform(0.15, 1.0))))

        # ---- Session metrics ----
        avg_session_duration_minutes = round(random.uniform(2, 45) * max(0.3, activity), 2)
        total_session_time_last_7_days = round(avg_session_duration_minutes * active_days_last_7 * random.uniform(1, 3), 2)
        sessions_last_7_days = max(0, int(active_days_last_7 * random.uniform(1, 4)))

        # ---- Engagement scores (0-100) ----
        engagement_score = round(min(100, activity * 100 * random.uniform(0.7, 1.3)), 2)
        influence_score = round(min(100, (total_connections * 0.5 + total_reactions_received * 0.3 + total_posts * 0.2) / max(1, total_connections) * 10), 2)
        contribution_score = round(min(100, (total_posts * 0.3 + total_comments * 0.2 + total_reactions_given * 0.1) * 2), 2)

        # Cap all scores at 100
        engagement_score = min(100, engagement_score)
        influence_score = min(100, influence_score)
        contribution_score = min(100, contribution_score)

        # ---- Response metrics ----
        if total_messages_sent > 0:
            response_rate = round(min(1.0, random.uniform(0.3, 0.95)), 4)
        else:
            response_rate = 0.0

        # ---- Timestamps ----
        last_active_at = now - timedelta(
            hours=random.randint(0, 24 * 7),
            minutes=random.randint(0, 59),
        )
        last_post_at = now - timedelta(days=random.randint(0, 14)) if total_posts > 0 else None
        last_connection_at = now - timedelta(days=random.randint(0, 30)) if total_connections > 0 else None

        # ---- Feature usage ----
        features_used = []
        if random.random() < 0.8:
            features_used.append("ai_mentor")
        if random.random() < 0.6:
            features_used.append("matching")
        if random.random() < 0.7:
            features_used.append("collaboration")
        if random.random() < 0.5:
            features_used.append("project_showcase")

        # ---- Build the row ----
        row = {
            "user_id": user_id,
            "total_posts": total_posts,
            "total_comments": total_comments,
            "total_reactions_given": total_reactions_given,
            "total_reactions_received": total_reactions_received,
            "total_post_saves": total_post_saves,
            "total_connections": total_connections,
            "total_messages_sent": total_messages_sent,
            "total_matches_received": total_matches_received,
            "total_matches_accepted": total_matches_accepted,
            "total_profile_views": total_profile_views,
            "total_reports_filed": max(0, int(activity * random.randint(0, 5))),
            "total_reports_received": max(0, int(activity * random.randint(0, 3))),
            "daily_active_streak": daily_active_streak,
            "weekly_active_days": weekly_active_days,
            "active_days_last_7": active_days_last_7,
            "active_days_last_30": active_days_last_30,
            "avg_session_duration_minutes": avg_session_duration_minutes,
            "total_session_time_last_7_days": total_session_time_last_7_days,
            "sessions_last_7_days": sessions_last_7_days,
            "engagement_score": engagement_score,
            "influence_score": influence_score,
            "contribution_score": contribution_score,
            "response_rate": response_rate,
            "onboarding_completed": random.random() < 0.85,
            "profile_completeness_score": round(min(100, random.uniform(40, 100)), 2),
            "features_used": features_used,
            "last_active_at": last_active_at.isoformat(),
            "last_post_at": last_post_at.isoformat() if last_post_at else None,
            "last_connection_at": last_connection_at.isoformat() if last_connection_at else None,
        }

        return row

    def seed(self, user_ids: List[str] = None, count: int = None) -> int:
        """Seed one analytics row per user"""
        self.stats = {"created": 0, "skipped": 0, "failed": 0}

        print(f"\n{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}")
        print(f"{Fore.CYAN}SEEDING USER ANALYTICS{Style.RESET_ALL}")
        print(f"{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}")

        # Fetch user IDs from profiles
        if user_ids is None:
            user_ids = self.fetch_user_ids()

        if not user_ids:
            print(
                f"{Fore.RED}  ✗ No profiles found. Cannot seed user analytics.{Style.RESET_ALL}"
            )
            return 0

        target_count = count if count is not None else len(user_ids)
        target_count = min(target_count, len(user_ids))
        selected_users = random.sample(user_ids, target_count)

        print(
            f"{Fore.YELLOW}  Target: {target_count} user analytics rows (one per user){Style.RESET_ALL}"
        )

        # Assign engagement tiers: 15% power, 55% regular, 30% lurker
        tiers = (
            ["power"] * int(target_count * 0.15)
            + ["regular"] * int(target_count * 0.55)
            + ["lurker"] * (target_count - int(target_count * 0.15) - int(target_count * 0.55))
        )
        random.shuffle(tiers)

        created = 0
        for i, (user_id, tier) in enumerate(zip(selected_users, tiers)):
            row = self._generate_user_metrics(user_id, tier)

            result = self.create_single("user_analytics", row, track=False)
            if result is not None:
                created += 1
                self.stats["created"] += 1
            else:
                self.stats["failed"] += 1

            self.log_progress(i, target_count, f"User analytics ({i + 1}/{target_count})")

            if (i + 1) % config.BATCH_SIZE == 0:
                time.sleep(config.DELAY_BETWEEN_BATCHES)

        self.log_stats(self.stats, "User Analytics")
        return self.stats["created"]


if __name__ == "__main__":
    print("User analytics seeder module loaded successfully")
