"""
Activity Tracker Service
=========================
Match activity tracking with deduplication and feed retrieval.

Tasks: 1.4.1 - 1.4.7 (TASKS.md)
Created: 2026-03-18
"""

import asyncio
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta

from supabase import Client, create_client

logger = logging.getLogger(__name__)


class ActivityTracker:
    """
    Service for match activity tracking.

    Methods:
        track_profile_view: Log profile view with deduplication
        track_match_building: Track match building activity
        get_activity_feed: Retrieve activity feed for dashboard
        cleanup_old_activity: Archive/delete old activity
    """

    def __init__(self, supabase_url: str, supabase_key: str):
        """
        Initialize ActivityTracker with Supabase client.
        """
        self.supabase: Client = create_client(supabase_url, supabase_key)

    async def track_profile_view(
        self, viewer_id: str, target_id: str
    ) -> Dict[str, Any]:
        """
        Log profile view with deduplication (24h window).

        Task: 1.4.2
        """
        try:
            # Check if view already tracked in last 24h
            existing_response = await asyncio.to_thread(
                self.supabase.table("match_activity")
                .select("id, created_at")
                .eq("actor_user_id", viewer_id)
                .eq("target_user_id", target_id)
                .eq("type", "profile_view")
                .gte("created_at", (datetime.now() - timedelta(hours=24)).isoformat())
                .limit(1)
                .execute
            )

            if existing_response.data and len(existing_response.data) > 0:
                logger.info(
                    f"Profile view already tracked for {viewer_id} -> {target_id} in last 24h"
                )
                return {
                    "activity_id": None,
                    "status": "duplicate",
                    "message": "View already tracked in last 24 hours",
                }

            # Get target user's match percentage if available
            match_response = await asyncio.to_thread(
                self.supabase.table("match_suggestions")
                .select("match_percentage")
                .or_(f"user_id.eq.{viewer_id},matched_user_id.eq.{viewer_id}")
                .or_(f"user_id.eq.{target_id},matched_user_id.eq.{target_id}")
                .limit(1)
                .execute
            )

            match_percentage = None
            if match_response.data:
                match_percentage = match_response.data[0].get("match_percentage")

            # Insert activity
            activity_data = {
                "actor_user_id": viewer_id,
                "target_user_id": target_id,
                "type": "profile_view",
                "activity": "viewed your profile",
                "match_percentage": match_percentage,
                "is_read": False,
            }

            response = await asyncio.to_thread(
                self.supabase.table("match_activity").insert(activity_data).execute
            )

            activity_id = response.data[0]["id"] if response.data else None

            logger.info(f"Tracked profile view: {viewer_id} -> {target_id}")

            return {
                "activity_id": activity_id,
                "status": "tracked",
                "match_percentage": match_percentage,
            }

        except Exception as e:
            logger.error(f"Error tracking profile view: {str(e)}")
            return {"activity_id": None, "status": "failed", "error": str(e)}

    async def track_match_building(
        self, user_id: str, matched_user_id: str
    ) -> Dict[str, Any]:
        """
        Track when match is being built.

        Task: 1.4.3
        """
        try:
            # Get match percentage if available
            match_response = await asyncio.to_thread(
                self.supabase.table("match_suggestions")
                .select("match_percentage")
                .eq("user_id", user_id)
                .eq("matched_user_id", matched_user_id)
                .limit(1)
                .execute
            )

            match_percentage = None
            if match_response.data:
                match_percentage = match_response.data[0].get("match_percentage")

            # Insert activity
            activity_data = {
                "actor_user_id": user_id,
                "target_user_id": matched_user_id,
                "type": "building_match",
                "activity": "is building a match with you",
                "match_percentage": match_percentage,
                "is_read": False,
            }

            response = await asyncio.to_thread(
                self.supabase.table("match_activity").insert(activity_data).execute
            )

            activity_id = response.data[0]["id"] if response.data else None

            logger.info(f"Tracked match building: {user_id} -> {matched_user_id}")

            return {
                "activity_id": activity_id,
                "status": "tracked",
                "match_percentage": match_percentage,
            }

        except Exception as e:
            logger.error(f"Error tracking match building: {str(e)}")
            return {"activity_id": None, "status": "failed", "error": str(e)}

    async def get_activity_feed(
        self, user_id: str, limit: int = 20
    ) -> List[Dict[str, Any]]:
        """
        Retrieve activity feed for dashboard.

        Task: 1.4.4
        """
        try:
            # Get activity where user is the target
            response = await asyncio.to_thread(
                self.supabase.table("match_activity")
                .select("""
                    *,
                    actor_profile:profiles!match_activity_actor_user_id_fkey (
                        id,
                        display_name,
                        headline,
                        avatar_url
                    )
                """)
                .eq("target_user_id", user_id)
                .order("created_at", desc=True)
                .limit(limit)
                .execute
            )

            activities = response.data or []

            # Format activities
            formatted = []
            for activity in activities:
                actor_profile = activity.pop("actor_profile", {})
                formatted.append(
                    {
                        **activity,
                        "actor": {
                            "id": actor_profile.get("id"),
                            "display_name": actor_profile.get("display_name"),
                            "headline": actor_profile.get("headline"),
                            "avatar_url": actor_profile.get("avatar_url"),
                        },
                        "relative_time": self._get_relative_time(
                            activity.get("created_at")
                        ),
                    }
                )

            logger.info(f"Retrieved {len(formatted)} activities for user {user_id}")

            return formatted

        except Exception as e:
            logger.error(f"Error getting activity feed: {str(e)}")
            return []

    async def cleanup_old_activity(self, days: int = 30) -> Dict[str, Any]:
        """
        Archive/delete old activity.

        Task: 1.4.5
        """
        try:
            cutoff_date = datetime.now() - timedelta(days=days)

            # Delete old activity
            response = await asyncio.to_thread(
                self.supabase.table("match_activity")
                .delete()
                .lt("created_at", cutoff_date.isoformat())
                .execute
            )

            logger.info(f"Cleaned up activity older than {days} days")

            return {
                "status": "completed",
                "cutoff_date": cutoff_date.isoformat(),
                "days_retained": days,
            }

        except Exception as e:
            logger.error(f"Error cleaning up activity: {str(e)}")
            return {"status": "failed", "error": str(e)}

    def _get_relative_time(self, created_at: Optional[str]) -> str:
        """Get human-readable relative time."""
        if not created_at:
            return ""

        try:
            dt = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
            now = datetime.now(dt.tzinfo)
            diff = now - dt

            if diff.days > 7:
                return dt.strftime("%b %d")
            elif diff.days > 0:
                return f"{diff.days}d ago"
            elif diff.seconds > 3600:
                return f"{diff.seconds // 3600}h ago"
            elif diff.seconds > 60:
                return f"{diff.seconds // 60}m ago"
            else:
                return "Just now"

        except Exception:
            return ""


async def main():
    """Test the ActivityTracker service."""
    import os

    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not supabase_url or not supabase_key:
        logger.error("Missing Supabase credentials")
        return

    tracker = ActivityTracker(supabase_url, supabase_key)
    logger.info("ActivityTracker initialized successfully")
    logger.info("ActivityTracker service ready")


if __name__ == "__main__":
    asyncio.run(main())
