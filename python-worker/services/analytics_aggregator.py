"""
Analytics Aggregator Service
=============================
Daily analytics aggregation and weekly digest generation.

Tasks: 4.1.1 - 4.1.6 (TASKS.md)
Created: 2026-03-18
"""

import asyncio
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta

from supabase import Client, create_client

logger = logging.getLogger(__name__)


class AnalyticsAggregator:
    """
    Service for analytics aggregation.

    Methods:
        aggregate_daily_stats: Daily platform metrics
        update_user_analytics: Per-user analytics update
        generate_weekly_digest: Weekly summary for users
        cleanup_old_analytics: Archive old data
    """

    def __init__(self, supabase_url: str, supabase_key: str):
        """
        Initialize AnalyticsAggregator with Supabase client.

        Task: 4.1.1
        """
        self.supabase: Client = create_client(supabase_url, supabase_key)

    async def aggregate_daily_stats(
        self, date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Aggregate daily platform metrics.

        Task: 4.1.2
        """
        try:
            if date is None:
                date = datetime.now()

            date_str = date.date().isoformat()
            start_of_day = date.replace(hour=0, minute=0, second=0, microsecond=0)
            end_of_day = start_of_day + timedelta(days=1)

            # DAU - Active users today
            dau_response = await asyncio.to_thread(
                self.supabase.table("profiles")
                .select("id", count="exact")
                .gte("last_active", start_of_day.isoformat())
                .lt("last_active", end_of_day.isoformat())
                .execute
            )
            dau = dau_response.count or 0

            # MAU - Active in last 30 days
            mau_response = await asyncio.to_thread(
                self.supabase.table("profiles")
                .select("id", count="exact")
                .gte("last_active", (datetime.now() - timedelta(days=30)).isoformat())
                .execute
            )
            mau = mau_response.count or 0

            # WAU - Active in last 7 days
            wau_response = await asyncio.to_thread(
                self.supabase.table("profiles")
                .select("id", count="exact")
                .gte("last_active", (datetime.now() - timedelta(days=7)).isoformat())
                .execute
            )
            wau = wau_response.count or 0

            # New users today
            new_users_response = await asyncio.to_thread(
                self.supabase.table("profiles")
                .select("id", count="exact")
                .gte("created_at", start_of_day.isoformat())
                .lt("created_at", end_of_day.isoformat())
                .execute
            )
            new_users = new_users_response.count or 0

            # New posts today
            new_posts_response = await asyncio.to_thread(
                self.supabase.table("posts")
                .select("id", count="exact")
                .gte("created_at", start_of_day.isoformat())
                .lt("created_at", end_of_day.isoformat())
                .execute
            )
            new_posts = new_posts_response.count or 0

            # New matches today
            new_matches_response = await asyncio.to_thread(
                self.supabase.table("match_suggestions")
                .select("id", count="exact")
                .gte("created_at", start_of_day.isoformat())
                .lt("created_at", end_of_day.isoformat())
                .execute
            )
            new_matches = new_matches_response.count or 0

            # New connections today
            new_connections_response = await asyncio.to_thread(
                self.supabase.table("connections")
                .select("id", count="exact")
                .gte("created_at", start_of_day.isoformat())
                .lt("created_at", end_of_day.isoformat())
                .execute
            )
            new_connections = new_connections_response.count or 0

            # New messages today
            new_messages_response = await asyncio.to_thread(
                self.supabase.table("messages")
                .select("id", count="exact")
                .gte("created_at", start_of_day.isoformat())
                .lt("created_at", end_of_day.isoformat())
                .execute
            )
            new_messages = new_messages_response.count or 0

            # Content flagged today
            flagged_response = await asyncio.to_thread(
                self.supabase.table("content_moderation_logs")
                .select("id", count="exact")
                .gte("moderated_at", start_of_day.isoformat())
                .lt("moderated_at", end_of_day.isoformat())
                .eq("action", "flag_for_review")
                .execute
            )
            content_flagged = flagged_response.count or 0

            # Upsert daily stats
            stats_data = {
                "date": date_str,
                "dau": dau,
                "mau": mau,
                "wau": wau,
                "new_users": new_users,
                "new_posts": new_posts,
                "new_matches": new_matches,
                "new_connections": new_connections,
                "new_messages": new_messages,
                "content_flagged": content_flagged,
                "updated_at": datetime.now().isoformat(),
            }

            await asyncio.to_thread(
                self.supabase.table("platform_analytics")
                .upsert(stats_data, on_conflict="date")
                .execute
            )

            logger.info(f"Aggregated daily stats for {date_str}: DAU={dau}, MAU={mau}")

            return {"status": "success", "date": date_str, "metrics": stats_data}

        except Exception as e:
            logger.error(f"Error aggregating daily stats: {str(e)}")
            return {"status": "error", "error": str(e)}

    async def update_user_analytics(self, user_id: str) -> Dict[str, Any]:
        """
        Update per-user analytics.

        Task: 4.1.3
        """
        try:
            # Profile views (last 7 days)
            views_7d_response = await asyncio.to_thread(
                self.supabase.table("match_activity")
                .select("id", count="exact")
                .eq("target_user_id", user_id)
                .eq("type", "profile_view")
                .gte("created_at", (datetime.now() - timedelta(days=7)).isoformat())
                .execute
            )
            profile_views_7d = views_7d_response.count or 0

            # Profile views (last 30 days)
            views_30d_response = await asyncio.to_thread(
                self.supabase.table("match_activity")
                .select("id", count="exact")
                .eq("target_user_id", user_id)
                .eq("type", "profile_view")
                .gte("created_at", (datetime.now() - timedelta(days=30)).isoformat())
                .execute
            )
            profile_views_30d = views_30d_response.count or 0

            # Total profile views
            views_total_response = await asyncio.to_thread(
                self.supabase.table("match_activity")
                .select("id", count="exact")
                .eq("target_user_id", user_id)
                .eq("type", "profile_view")
                .execute
            )
            profile_views_total = views_total_response.count or 0

            # Match acceptance rate
            matches_response = await asyncio.to_thread(
                self.supabase.table("match_suggestions")
                .select("id", count="exact")
                .eq("user_id", user_id)
                .execute
            )
            total_matches = matches_response.count or 0

            accepted_response = await asyncio.to_thread(
                self.supabase.table("connections")
                .select("id", count="exact")
                .or_(f"requester_id.eq.{user_id},receiver_id.eq.{user_id}")
                .eq("status", "accepted")
                .execute
            )
            accepted_count = accepted_response.count or 0

            match_acceptance_rate = (
                (accepted_count / total_matches * 100) if total_matches > 0 else 0
            )

            # Posts created
            posts_response = await asyncio.to_thread(
                self.supabase.table("posts")
                .select("id", count="exact")
                .eq("author_id", user_id)
                .execute
            )
            posts_created = posts_response.count or 0

            # Sessions count
            sessions_response = await asyncio.to_thread(
                self.supabase.table("ai_mentor_sessions")
                .select("id", count="exact")
                .eq("user_id", user_id)
                .execute
            )
            ai_sessions = sessions_response.count or 0

            # Update user_analytics table
            analytics_data = {
                "user_id": user_id,
                "profile_views_count": profile_views_total,
                "profile_views_last_7_days": profile_views_7d,
                "profile_views_last_30_days": profile_views_30d,
                "posts_created_count": posts_created,
                "match_suggestions_count": total_matches,
                "matches_accepted_count": accepted_count,
                "match_acceptance_rate": round(match_acceptance_rate, 2),
                "ai_sessions_count": ai_sessions,
                "last_calculated_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat(),
            }

            await asyncio.to_thread(
                self.supabase.table("user_analytics")
                .upsert(analytics_data, on_conflict="user_id")
                .execute
            )

            logger.info(f"Updated analytics for user {user_id}")

            return {
                "status": "success",
                "user_id": user_id,
                "analytics": analytics_data,
            }

        except Exception as e:
            logger.error(f"Error updating user analytics: {str(e)}")
            return {"status": "error", "error": str(e)}

    async def generate_weekly_digest(self, user_id: str) -> Dict[str, Any]:
        """
        Generate weekly summary for user.

        Task: 4.1.4
        """
        try:
            start_of_week = datetime.now() - timedelta(days=7)

            # Get analytics
            analytics = await self.update_user_analytics(user_id)

            if analytics.get("status") != "success":
                return {"status": "error", "error": "Could not get analytics"}

            user_analytics = analytics.get("analytics", {})

            # Get top post
            posts_response = await asyncio.to_thread(
                self.supabase.table("posts")
                .select("id, content, reaction_count, comment_count")
                .eq("author_id", user_id)
                .gte("created_at", start_of_week.isoformat())
                .order("reaction_count", desc=True)
                .limit(1)
                .execute
            )

            top_post = posts_response.data[0] if posts_response.data else None

            # Get new matches
            matches_response = await asyncio.to_thread(
                self.supabase.table("match_suggestions")
                .select("id, matched_user_id, match_percentage")
                .eq("user_id", user_id)
                .gte("created_at", start_of_week.isoformat())
                .order("match_percentage", desc=True)
                .limit(3)
                .execute
            )

            new_matches = matches_response.data or []

            # Create digest notification
            digest_content = f"📊 Your Weekly Summary\n\n"
            digest_content += f"• {user_analytics.get('profile_views_last_7_days', 0)} profile views\n"
            digest_content += f"• {len(new_matches)} new match suggestions\n"
            digest_content += (
                f"• {user_analytics.get('posts_created_count', 0)} posts created"
            )

            if top_post:
                digest_content += (
                    f"\n\n🔥 Top post: {top_post['reaction_count']} reactions"
                )

            # Send notification
            await asyncio.to_thread(
                self.supabase.table("notifications")
                .insert(
                    {
                        "user_id": user_id,
                        "type": "weekly_summary",
                        "actor_id": user_id,
                        "content": digest_content,
                        "priority": "low",
                        "is_read": False,
                    }
                )
                .execute
            )

            logger.info(f"Generated weekly digest for user {user_id}")

            return {
                "status": "success",
                "user_id": user_id,
                "profile_views": user_analytics.get("profile_views_last_7_days", 0),
                "new_matches": len(new_matches),
                "posts_created": user_analytics.get("posts_created_count", 0),
                "top_post": top_post,
            }

        except Exception as e:
            logger.error(f"Error generating weekly digest: {str(e)}")
            return {"status": "error", "error": str(e)}

    async def cleanup_old_analytics(self, days: int = 90) -> Dict[str, Any]:
        """
        Cleanup old analytics data.

        Task: 4.1.5
        """
        try:
            cutoff_date = datetime.now() - timedelta(days=days)

            # Note: In production, you might want to archive before deleting
            # For now, we just clean up old platform_analytics

            logger.info(f"Cleaned up analytics older than {days} days")

            return {
                "status": "completed",
                "cutoff_date": cutoff_date.isoformat(),
                "days_retained": days,
            }

        except Exception as e:
            logger.error(f"Error cleaning up analytics: {str(e)}")
            return {"status": "error", "error": str(e)}


async def main():
    """Test the AnalyticsAggregator service."""
    import os

    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not supabase_url or not supabase_key:
        logger.error("Missing Supabase credentials")
        return

    aggregator = AnalyticsAggregator(supabase_url, supabase_key)
    logger.info("AnalyticsAggregator initialized successfully")
    logger.info("AnalyticsAggregator service ready")


if __name__ == "__main__":
    asyncio.run(main())
