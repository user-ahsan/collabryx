"""
Notification sender module.
Port of notification-engine.ts lines 16–171.
Handles validation, preference checking, delivery, and real-time broadcast.
"""

import asyncio
import logging
from enum import Enum
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from shared.db import execute

logger = logging.getLogger(__name__)


# ── Type Mappings ──────────────────────────────────────────────────────────────


class NotificationType(str, Enum):
    """Valid notification types matching TS Zod schema enum (line 18)."""

    CONNECT = "connect"
    CONNECT_ACCEPTED = "connect_accepted"
    MESSAGE = "message"
    LIKE = "like"
    COMMENT = "comment"
    COMMENT_LIKE = "comment_like"
    MATCH = "match"
    MENTION = "mention"
    SYSTEM = "system"
    ACHIEVEMENT = "achievement"


class ResourceType(str, Enum):
    """Valid resource types for notification context (line 23)."""

    POST = "post"
    PROFILE = "profile"
    CONVERSATION = "conversation"
    MATCH = "match"
    COMMENT = "comment"


# Maps notification type → notification_preferences column name.
# Ported verbatim from TYPE_TO_PREF in notification-engine.ts lines 84–95.
TYPE_TO_PREF: dict[str, str] = {
    "connect": "push_new_connections",
    "connect_accepted": "push_connect_accepted",
    "message": "push_messages",
    "match": "push_match_alerts",
    "like": "push_post_likes",
    "comment": "push_comments",
    "comment_like": "push_comment_likes",
    "mention": "push_mentions",
    "achievement": "push_achievements",
    "system": "in_app_notifications",
}


# ── Pydantic Models ───────────────────────────────────────────────────────────
# Ported from NotificationSchema (TS Zod) in notification-engine.ts lines 16–25.


class NotificationInput(BaseModel):
    """Validated notification input. Accepts camelCase JSON via aliases."""

    model_config = ConfigDict(populate_by_name=True)

    user_id: str = Field(..., alias="userId")
    type: NotificationType
    content: str = Field(..., min_length=1, max_length=500)
    actor_id: Optional[str] = Field(None, alias="actorId")
    actor_name: Optional[str] = Field(None, alias="actorName", max_length=100)
    actor_avatar: Optional[str] = Field(None, alias="actorAvatar")
    resource_type: Optional[ResourceType] = Field(None, alias="resourceType")
    resource_id: Optional[str] = Field(None, alias="resourceId")


# ── Preference Checking ───────────────────────────────────────────────────────
# Ported from checkNotificationPreferences() lines 274–295.


async def check_notification_preferences(
    supabase,
    user_id: str,
    notification_type: str,
) -> bool:
    """Check whether the user has enabled notifications of *notification_type*.

    Behaviour mirrors the TS original:
    - Unknown types (no mapping) → ``True`` (allow).
    - No preferences row found → ``True`` (allow).
    - DB error → ``True`` (default to allow, fail open).
    - Explicit ``False`` stored in the column → ``False`` (block).
    """
    pref_column = TYPE_TO_PREF.get(notification_type)
    if not pref_column:
        return True  # Unknown type — always deliver

    try:
        result = await execute(
            supabase.table("notification_preferences")
            .select(pref_column)
            .eq("user_id", user_id)
        )
        if result.data and len(result.data) > 0:
            value = result.data[0].get(pref_column)
            return bool(value) if value is not None else True
        return True  # No row (TS: PGRST116) → allow
    except Exception:
        logger.warning("Failed to check preferences for user %s", user_id)
        return True  # Error → allow


# ── Send Single Notification ──────────────────────────────────────────────────
# Ported from sendNotification() lines 102–158.


async def send_notification(
    supabase,
    input_data: NotificationInput,
) -> dict:
    """Send a single notification.

    Steps (mirrors TS):
        1. Check user notification preferences (skipped for ``system`` type).
        2. Insert row into the ``notifications`` table.
        3. Best-effort real-time broadcast via Supabase Realtime channel.
        4. Return ``{success, notificationId?, error?}``.

    Args:
        supabase: Initialised Supabase client (from ``get_client()``).
        input_data: Validated notification payload.

    Returns:
        Dict with ``success``, optionally ``notificationId`` or ``error``.
    """
    # ── Step 1: Preference check ──────────────────────────────────────────
    if input_data.type != NotificationType.SYSTEM:
        allowed = await check_notification_preferences(
            supabase,
            input_data.user_id,
            input_data.type.value,
        )
        if not allowed:
            return {
                "success": True,
                "error": "Notification disabled by user preferences",
            }

    # ── Step 2: Insert into DB ────────────────────────────────────────────
    try:
        result = await execute(
            supabase.table("notifications")
            .insert(
                {
                    "user_id": input_data.user_id,
                    "type": input_data.type.value,
                    "content": input_data.content,
                    "actor_id": input_data.actor_id,
                    "actor_name": input_data.actor_name,
                    "actor_avatar": input_data.actor_avatar,
                    "resource_type": (
                        input_data.resource_type.value
                        if input_data.resource_type
                        else None
                    ),
                    "resource_id": input_data.resource_id,
                }
            )
            .select("id")
        )

        if not result.data or len(result.data) == 0:
            logger.error("Insert returned no data for user %s", input_data.user_id)
            return {"success": False, "error": "Failed to create notification"}

        notification_id: str = result.data[0]["id"]

        # ── Step 3: Real-time broadcast (best-effort) ─────────────────────
        try:
            channel = supabase.channel(
                f"notifications:user:{input_data.user_id}"
            )
            channel.send(
                {
                    "type": "broadcast",
                    "event": "new_notification",
                    "payload": {"id": notification_id},
                }
            )
            channel.unsubscribe()
        except Exception:
            logger.debug(
                "Best-effort broadcast failed for notification %s",
                notification_id,
            )

        return {"success": True, "notificationId": notification_id}

    except Exception as e:
        logger.error("Failed to send notification: %s", e)
        return {"success": False, "error": str(e)}


# ── Send Bulk Notifications ───────────────────────────────────────────────────
# Ported from sendBulkNotifications() lines 160–172.
# Python improvement: uses asyncio.gather() for concurrent delivery.


async def send_bulk_notifications(
    supabase,
    inputs: list[NotificationInput],
) -> dict:
    """Send multiple notifications concurrently.

    Uses ``asyncio.gather()`` — an improvement over the TS sequential loop.

    Returns:
        Dict with ``sent``, ``failed`` counts and an ``errors`` list.
    """
    if not inputs:
        return {"sent": 0, "failed": 0, "errors": []}

    results = await asyncio.gather(
        *[send_notification(supabase, inp) for inp in inputs],
        return_exceptions=True,
    )

    sent = 0
    failed = 0
    errors: list[str] = []

    for result in results:
        if isinstance(result, dict):
            if result.get("success") and result.get("notificationId"):
                sent += 1
            else:
                failed += 1
                err = result.get("error")
                if err:
                    errors.append(err)
        else:
            failed += 1
            errors.append(str(result))

    return {"sent": sent, "failed": failed, "errors": errors}
