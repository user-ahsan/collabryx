"""
Event Processor Service
========================
Real-time event processing pipeline.

Tasks: 3.2.1 - 3.2.7 (TASKS.md)
Created: 2026-03-18
"""

import asyncio
import logging
from typing import Dict, Any, Optional, Callable
from datetime import datetime

from supabase import Client, create_client

logger = logging.getLogger(__name__)


class EventProcessor:
    """
    Service for real-time event processing.

    Methods:
        start_listening: Start Supabase Realtime listener
        process_event: Route events to handlers
        handle_engagement: Process post reactions/comments
        handle_network_change: Process connection events
        handle_communication: Process message events
    """

    def __init__(self, supabase_url: str, supabase_key: str):
        """
        Initialize EventProcessor with Supabase client.

        Task: 3.2.1
        """
        self.supabase: Client = create_client(supabase_url, supabase_key)
        self.running = False
        self.channels = {}

        # Event handlers registry
        self.handlers: Dict[str, Callable] = {
            "post_reaction": self.handle_engagement,
            "comment_created": self.handle_engagement,
            "connection_requested": self.handle_network_change,
            "connection_accepted": self.handle_network_change,
            "connection_declined": self.handle_network_change,
            "message_sent": self.handle_communication,
            "profile_viewed": self.handle_profile_activity,
            "match_building": self.handle_match_activity,
            "post_created": self.handle_content_creation,
            "profile_updated": self.handle_profile_update,
        }

    async def start_listening(self):
        """
        Start listening to Supabase Realtime channels.

        Task: 3.2.2
        """
        try:
            self.running = True
            logger.info("Starting Realtime event listener...")

            # Subscribe to events table
            channel = self.supabase.channel("events_channel")

            channel.on(
                "postgres_changes",
                {"event": "INSERT", "schema": "public", "table": "events"},
                self._on_event_insert,
            )

            await channel.subscribe()
            self.channels["events"] = channel

            logger.info("✓ Realtime event listener started")

            # Keep connection alive
            while self.running:
                await asyncio.sleep(30)

        except Exception as e:
            logger.error(f"Error starting event listener: {str(e)}")
            self.running = False

    async def stop_listening(self):
        """Stop all Realtime listeners."""
        try:
            self.running = False

            for channel_name, channel in self.channels.items():
                await channel.unsubscribe()
                logger.info(f"Stopped listening to {channel_name}")

            self.channels = {}
            logger.info("All Realtime listeners stopped")

        except Exception as e:
            logger.error(f"Error stopping listeners: {str(e)}")

    def _on_event_insert(self, payload: Dict[str, Any]):
        """Handle new event insert from Realtime."""
        try:
            event = payload.get("new", {})
            event_type = event.get("event_type")

            logger.debug(f"Received event: {event_type}")

            # Route to appropriate handler
            if event_type in self.handlers:
                asyncio.create_task(self.process_event(event))
            else:
                logger.warning(f"No handler for event type: {event_type}")

        except Exception as e:
            logger.error(f"Error processing event insert: {str(e)}")

    async def process_event(self, event: Dict[str, Any]):
        """
        Route event to appropriate handler.

        Task: 3.2.1
        """
        try:
            event_type = event.get("event_type")

            if event_type not in self.handlers:
                logger.warning(f"No handler for event type: {event_type}")
                return

            handler = self.handlers[event_type]
            await handler(event)

            logger.debug(f"Processed event: {event_type}")

        except Exception as e:
            logger.error(f"Error processing event: {str(e)}")

    async def handle_engagement(self, event: Dict[str, Any]):
        """
        Process post reactions/comments.

        Task: 3.2.3
        """
        try:
            actor_id = event.get("actor_id")
            target_id = event.get("target_id")
            event_type = event.get("event_type")

            # Update user activity score
            await self._update_activity_score(actor_id, +1)

            # Check if post is trending
            if target_id:
                await self._check_trending_status(target_id)

            # Trigger notification (handled by database triggers)
            logger.info(
                f"Engagement event processed: {actor_id} -> {target_id} ({event_type})"
            )

        except Exception as e:
            logger.error(f"Error handling engagement: {str(e)}")

    async def handle_network_change(self, event: Dict[str, Any]):
        """
        Process connection events.

        Task: 3.2.4
        """
        try:
            actor_id = event.get("actor_id")
            metadata = event.get("metadata", {})
            event_type = event.get("event_type")

            if event_type == "connection_accepted":
                # Update mutual connections
                await self._update_mutual_connections(
                    actor_id, metadata.get("receiver_id")
                )

                # Recalculate match scores for network
                await self._recalculate_network_matches(actor_id)

            logger.info(f"Network change processed: {actor_id} ({event_type})")

        except Exception as e:
            logger.error(f"Error handling network change: {str(e)}")

    async def handle_communication(self, event: Dict[str, Any]):
        """
        Process message events.

        Task: 3.2.5
        """
        try:
            actor_id = event.get("actor_id")
            metadata = event.get("metadata", {})

            # Update conversation activity
            conversation_id = metadata.get("conversation_id")
            if conversation_id:
                await self._update_conversation_activity(conversation_id)

            # Track response time
            await self._track_response_time(actor_id, metadata)

            logger.info(f"Communication event processed: {actor_id}")

        except Exception as e:
            logger.error(f"Error handling communication: {str(e)}")

    async def handle_profile_activity(self, event: Dict[str, Any]):
        """Handle profile view events."""
        try:
            actor_id = event.get("actor_id")
            target_id = event.get("target_id")

            # Update profile view count
            await self._update_profile_views(target_id)

            logger.info(f"Profile activity processed: {actor_id} -> {target_id}")

        except Exception as e:
            logger.error(f"Error handling profile activity: {str(e)}")

    async def handle_match_activity(self, event: Dict[str, Any]):
        """Handle match building events."""
        try:
            actor_id = event.get("actor_id")
            target_id = event.get("target_id")
            match_percentage = event.get("metadata", {}).get("match_percentage")

            # Update match activity tracking
            logger.info(
                f"Match activity: {actor_id} interested in {target_id} ({match_percentage}%)"
            )

        except Exception as e:
            logger.error(f"Error handling match activity: {str(e)}")

    async def handle_content_creation(self, event: Dict[str, Any]):
        """Handle new content creation."""
        try:
            actor_id = event.get("actor_id")

            # Update user's post count
            await self._update_user_post_count(actor_id)

            logger.info(f"Content creation processed: {actor_id}")

        except Exception as e:
            logger.error(f"Error handling content creation: {str(e)}")

    async def handle_profile_update(self, event: Dict[str, Any]):
        """Handle profile update events."""
        try:
            actor_id = event.get("actor_id")

            # Trigger embedding regeneration if needed
            await self._trigger_embedding_regeneration(actor_id)

            logger.info(f"Profile update processed: {actor_id}")

        except Exception as e:
            logger.error(f"Error handling profile update: {str(e)}")

    # Helper methods

    async def _update_activity_score(self, user_id: str, delta: int):
        """Update user's activity score."""
        try:
            await asyncio.to_thread(
                self.supabase.rpc(
                    "increment_activity_score", {"p_user_id": user_id, "p_delta": delta}
                ).execute
            )
        except Exception as e:
            logger.debug(f"Could not update activity score: {str(e)}")

    async def _check_trending_status(self, post_id: str):
        """Check if post is trending."""
        try:
            # Get engagement in last hour
            from datetime import timedelta

            cutoff = (datetime.now() - timedelta(hours=1)).isoformat()

            response = await asyncio.to_thread(
                self.supabase.table("post_reactions")
                .select("id", count="exact")
                .eq("post_id", post_id)
                .gte("created_at", cutoff)
                .execute
            )

            engagement_count = response.count or 0

            # Mark as trending if >10 engagements in last hour
            if engagement_count >= 10:
                await asyncio.to_thread(
                    self.supabase.table("posts")
                    .update({"is_trending": True})
                    .eq("id", post_id)
                    .execute
                )
                logger.info(f"Post {post_id} is trending!")

        except Exception as e:
            logger.debug(f"Could not check trending status: {str(e)}")

    async def _update_mutual_connections(self, user1_id: str, user2_id: str):
        """Update mutual connections count."""
        try:
            # This would calculate and update mutual connections
            logger.debug(f"Updating mutual connections for {user1_id} and {user2_id}")
        except Exception as e:
            logger.debug(f"Could not update mutual connections: {str(e)}")

    async def _recalculate_network_matches(self, user_id: str):
        """Recalculate matches for user's network."""
        try:
            # Trigger match recalculation
            logger.debug(f"Recalculating network matches for {user_id}")
        except Exception as e:
            logger.debug(f"Could not recalculate network matches: {str(e)}")

    async def _update_conversation_activity(self, conversation_id: str):
        """Update conversation last activity."""
        try:
            await asyncio.to_thread(
                self.supabase.table("conversations")
                .update({"updated_at": datetime.now().isoformat()})
                .eq("id", conversation_id)
                .execute
            )
        except Exception as e:
            logger.debug(f"Could not update conversation: {str(e)}")

    async def _track_response_time(self, user_id: str, metadata: Dict):
        """Track message response time."""
        try:
            # Calculate and store response time
            logger.debug(f"Tracking response time for {user_id}")
        except Exception as e:
            logger.debug(f"Could not track response time: {str(e)}")

    async def _update_profile_views(self, user_id: str):
        """Increment profile view count."""
        try:
            await asyncio.to_thread(
                self.supabase.rpc(
                    "increment_profile_views", {"p_user_id": user_id}
                ).execute
            )
        except Exception as e:
            logger.debug(f"Could not update profile views: {str(e)}")

    async def _update_user_post_count(self, user_id: str):
        """Update user's post count."""
        try:
            await asyncio.to_thread(
                self.supabase.rpc(
                    "increment_post_count", {"p_user_id": user_id}
                ).execute
            )
        except Exception as e:
            logger.debug(f"Could not update post count: {str(e)}")

    async def _trigger_embedding_regeneration(self, user_id: str):
        """Trigger embedding regeneration after profile update."""
        try:
            # Add to embedding pending queue
            await asyncio.to_thread(
                self.supabase.table("embedding_pending_queue")
                .insert({"user_id": user_id, "status": "pending", "priority": "normal"})
                .execute
            )
            logger.info(f"Triggered embedding regeneration for {user_id}")
        except Exception as e:
            logger.debug(f"Could not trigger embedding regeneration: {str(e)}")


async def main():
    """Test the EventProcessor service."""
    import os

    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not supabase_url or not supabase_key:
        logger.error("Missing Supabase credentials")
        return

    processor = EventProcessor(supabase_url, supabase_key)
    logger.info("EventProcessor initialized successfully")
    logger.info("EventProcessor service ready")

    # Start listening (would run indefinitely)
    # await processor.start_listening()


if __name__ == "__main__":
    asyncio.run(main())
