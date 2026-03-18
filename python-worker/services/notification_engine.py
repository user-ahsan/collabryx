"""
Notification Engine Service
============================
Smart notification processing with priority queuing and batching.

Tasks: 1.3.1 - 1.3.7 (TASKS.md)
Created: 2026-03-18
"""

import asyncio
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from collections import defaultdict

from supabase import Client, create_client

logger = logging.getLogger(__name__)


# Priority mappings
PRIORITY_HIGH = ["message", "match", "connection_accepted"]
PRIORITY_MEDIUM = ["connection_request", "like", "comment"]
PRIORITY_LOW = ["profile_view", "weekly_summary"]


class NotificationEngine:
    """
    Service for smart notification processing.

    Methods:
        send_notification: Send single notification with priority
        send_batched_notifications: Batch medium-priority notifications
        send_daily_digest: Compile daily activity summary
        cleanup_old_notifications: Archive/delete old notifications
    """

    def __init__(self, supabase_url: str, supabase_key: str):
        """
        Initialize NotificationEngine with Supabase client.
        """
        self.supabase: Client = create_client(supabase_url, supabase_key)

        # Batching configuration
        self.batch_delay_seconds = 300  # 5 minutes
        self.batch_threshold = 5  # Send after 5 notifications

        # In-memory batch queue
        self.batch_queues: Dict[str, List[Dict]] = defaultdict(list)
        self.batch_timers: Dict[str, datetime] = {}

    async def send_notification(
        self,
        user_id: str,
        type: str,
        actor_id: str,
        content: str,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        priority: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Send single notification with priority.

        Task: 1.3.2
        """
        try:
            # Auto-determine priority if not specified
            if not priority:
                if type in PRIORITY_HIGH:
                    priority = "high"
                elif type in PRIORITY_MEDIUM:
                    priority = "medium"
                else:
                    priority = "low"

            # Check if should be batched
            if priority == "medium":
                return await self._queue_for_batching(
                    user_id=user_id,
                    type=type,
                    actor_id=actor_id,
                    content=content,
                    resource_type=resource_type,
                    resource_id=resource_id,
                    priority=priority,
                )

            # Insert high/low priority immediately
            notification_data = {
                "user_id": user_id,
                "type": type,
                "actor_id": actor_id,
                "content": content,
                "resource_type": resource_type,
                "resource_id": resource_id,
                "priority": priority,
                "is_read": False,
            }

            response = await asyncio.to_thread(
                self.supabase.table("notifications").insert(notification_data).execute
            )

            notification_id = response.data[0]["id"] if response.data else None

            logger.info(f"Sent {priority} priority notification to {user_id}: {type}")

            return {
                "notification_id": notification_id,
                "status": "sent",
                "priority": priority,
            }

        except Exception as e:
            logger.error(f"Error sending notification: {str(e)}")
            return {"notification_id": None, "status": "failed", "error": str(e)}

    async def _queue_for_batching(
        self,
        user_id: str,
        type: str,
        actor_id: str,
        content: str,
        resource_type: Optional[str],
        resource_id: Optional[str],
        priority: str,
    ) -> Dict[str, Any]:
        """Queue medium-priority notification for batching."""
        try:
            # Add to batch queue
            self.batch_queues[user_id].append(
                {
                    "type": type,
                    "actor_id": actor_id,
                    "content": content,
                    "resource_type": resource_type,
                    "resource_id": resource_id,
                    "priority": priority,
                    "queued_at": datetime.now(),
                }
            )

            # Set timer if not already set
            if user_id not in self.batch_timers:
                self.batch_timers[user_id] = datetime.now()

            # Check if batch should be sent
            if len(self.batch_queues[user_id]) >= self.batch_threshold:
                return await self._send_batch(user_id)

            return {
                "notification_id": None,
                "status": "batched",
                "queue_size": len(self.batch_queues[user_id]),
            }

        except Exception as e:
            logger.error(f"Error queueing notification for batching: {str(e)}")
            return {"notification_id": None, "status": "failed", "error": str(e)}

    async def send_batched_notifications(self, user_id: str) -> Dict[str, Any]:
        """
        Send batched notifications for a user.

        Task: 1.3.3
        """
        try:
            if user_id not in self.batch_queues or not self.batch_queues[user_id]:
                return {"status": "no_notifications", "sent_count": 0}

            return await self._send_batch(user_id)

        except Exception as e:
            logger.error(f"Error sending batched notifications: {str(e)}")
            return {"status": "failed", "error": str(e)}

    async def _send_batch(self, user_id: str) -> Dict[str, Any]:
        """Send accumulated batch for a user."""
        try:
            batch = self.batch_queues[user_id]

            if not batch:
                return {"status": "empty", "sent_count": 0}

            # Group notifications by type for smarter batching
            grouped = defaultdict(list)
            for notif in batch:
                grouped[notif["type"]].append(notif)

            sent_count = 0
            for type_key, notifications in grouped.items():
                if len(notifications) > 1:
                    # Combine multiple notifications of same type
                    combined_content = self._combine_notifications(
                        type_key, notifications
                    )
                    result = await self.send_notification(
                        user_id=user_id,
                        type=type_key,
                        actor_id=notifications[0]["actor_id"],
                        content=combined_content,
                        priority="medium",
                    )
                    if result["status"] == "sent":
                        sent_count += 1
                else:
                    # Send single notification
                    notif = notifications[0]
                    result = await asyncio.to_thread(
                        self.supabase.table("notifications")
                        .insert(
                            {
                                "user_id": user_id,
                                "type": notif["type"],
                                "actor_id": notif["actor_id"],
                                "content": notif["content"],
                                "resource_type": notif.get("resource_type"),
                                "resource_id": notif.get("resource_id"),
                                "priority": "medium",
                                "is_read": False,
                            }
                        )
                        .execute
                    )
                    if result.data:
                        sent_count += 1

            # Clear batch queue
            self.batch_queues[user_id] = []
            if user_id in self.batch_timers:
                del self.batch_timers[user_id]

            logger.info(f"Sent batch of {sent_count} notifications to {user_id}")

            return {"status": "sent", "sent_count": sent_count}

        except Exception as e:
            logger.error(f"Error sending batch: {str(e)}")
            return {"status": "failed", "error": str(e)}

    def _combine_notifications(self, type_key: str, notifications: List[Dict]) -> str:
        """Combine multiple notifications into one message."""
        if type_key == "like":
            names = list(
                set([n["actor_id"][:8] for n in notifications])
            )  # Use first 8 chars of ID
            if len(names) > 2:
                return f"{names[0]}, {names[1]} and {len(names) - 2} others liked your post"
            elif len(names) == 2:
                return f"{names[0]} and {names[1]} liked your post"
            else:
                return f"{names[0]} liked your post"

        elif type_key == "comment":
            count = len(notifications)
            return f"You have {count} new comments on your post"

        else:
            count = len(notifications)
            return f"You have {count} new {type_key} notifications"

    async def send_daily_digest(self, user_id: str) -> Dict[str, Any]:
        """
        Compile daily activity summary.

        Task: 1.3.4
        """
        try:
            # Get activity from last 24 hours
            yesterday = datetime.now() - timedelta(days=1)

            # Profile views
            views_response = await asyncio.to_thread(
                self.supabase.table("match_activity")
                .select("id", count="exact")
                .eq("target_user_id", user_id)
                .eq("type", "profile_view")
                .gte("created_at", yesterday.isoformat())
                .execute
            )
            profile_views = views_response.count or 0

            # New matches
            matches_response = await asyncio.to_thread(
                self.supabase.table("match_suggestions")
                .select("id", count="exact")
                .eq("user_id", user_id)
                .gte("created_at", yesterday.isoformat())
                .execute
            )
            new_matches = matches_response.count or 0

            # Get top post
            posts_response = await asyncio.to_thread(
                self.supabase.table("posts")
                .select("id, content, reaction_count")
                .eq("author_id", user_id)
                .order("reaction_count", desc=True)
                .limit(1)
                .execute
            )
            top_post = posts_response.data[0] if posts_response.data else None

            # Create digest notification
            digest_content = f"📊 Your daily summary: {profile_views} profile views, {new_matches} new matches"
            if top_post:
                digest_content += (
                    f", and your top post has {top_post['reaction_count']} reactions!"
                )

            result = await self.send_notification(
                user_id=user_id,
                type="weekly_summary",
                actor_id=user_id,  # System notification
                content=digest_content,
                priority="low",
            )

            logger.info(f"Sent daily digest to {user_id}")

            return {
                "status": "sent",
                "profile_views": profile_views,
                "new_matches": new_matches,
                "top_post_reactions": top_post["reaction_count"] if top_post else 0,
            }

        except Exception as e:
            logger.error(f"Error sending daily digest: {str(e)}")
            return {"status": "failed", "error": str(e)}

    async def cleanup_old_notifications(self, days: int = 30) -> Dict[str, Any]:
        """
        Archive/delete old notifications.

        Task: 1.3.5
        """
        try:
            cutoff_date = datetime.now() - timedelta(days=days)

            # Delete old notifications
            response = await asyncio.to_thread(
                self.supabase.table("notifications")
                .delete()
                .lt("created_at", cutoff_date.isoformat())
                .execute
            )

            # Count deleted (PostgREST doesn't return count directly)
            logger.info(f"Cleaned up notifications older than {days} days")

            return {
                "status": "completed",
                "cutoff_date": cutoff_date.isoformat(),
                "days_retained": days,
            }

        except Exception as e:
            logger.error(f"Error cleaning up notifications: {str(e)}")
            return {"status": "failed", "error": str(e)}


async def main():
    """Test the NotificationEngine service."""
    import os

    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not supabase_url or not supabase_key:
        logger.error("Missing Supabase credentials")
        return

    engine = NotificationEngine(supabase_url, supabase_key)
    logger.info("NotificationEngine initialized successfully")
    logger.info("NotificationEngine service ready")


if __name__ == "__main__":
    asyncio.run(main())
