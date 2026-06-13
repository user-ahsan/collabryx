"""
Notification cleanup module.
Port of notification-engine.ts lines 222–272.
Batch deletes expired notifications with optional user filter and dry-run mode.
"""

import logging
from datetime import datetime, timedelta
from typing import Optional

from shared.db import execute

logger = logging.getLogger(__name__)


# ── Cleanup Expired Notifications ─────────────────────────────────────────────
# Ported from cleanupExpiredNotifications() lines 222–272.


async def cleanup_expired_notifications(
    supabase,
    options: Optional[dict] = None,
) -> dict:
    """Delete (or count) notifications older than a configurable cutoff.

    Args:
        supabase: Initialised Supabase client.
        options: Optional dict with:
            - ``olderThanDays`` (int): Age threshold in days (default: 30).
            - ``batchSize`` (int): Batch size for chunked deletes (default: 500).
            - ``dryRun`` (bool): If ``True``, count only; no deletes (default: ``False``).
            - ``userId`` (str): Optional user filter.

    Returns:
        Dict with ``notificationsDeleted``, ``notificationsArchived``, ``errors``.
    """
    opts = options or {}
    older_than_days: int = opts.get("olderThanDays", 30)
    batch_size: int = opts.get("batchSize", 500)
    dry_run: bool = opts.get("dryRun", False)
    user_id: Optional[str] = opts.get("userId")

    cutoff = datetime.utcnow() - timedelta(days=older_than_days)
    cutoff_iso: str = cutoff.isoformat()

    # ── Step 1: Count matching notifications ──────────────────────────────
    try:
        count_query = (
            supabase.table("notifications")
            .select("id", count="exact", head=True)
            .lt("created_at", cutoff_iso)
        )
        if user_id:
            count_query = count_query.eq("user_id", user_id)

        count_result = await execute(count_query)
    except Exception as e:
        logger.error("Failed to count expired notifications: %s", e)
        return {
            "notificationsDeleted": 0,
            "notificationsArchived": 0,
            "errors": [str(e)],
        }

    total_count = count_result.count if hasattr(count_result, "count") else 0
    if dry_run or total_count == 0:
        return {
            "notificationsDeleted": 0,
            "notificationsArchived": total_count,
            "errors": [],
        }

    # ── Step 2: Batch delete ──────────────────────────────────────────────
    deleted = 0
    errors: list[str] = []

    for offset in range(0, total_count, batch_size):
        try:
            # Fetch batch IDs
            fetch_query = (
                supabase.table("notifications")
                .select("id")
                .lt("created_at", cutoff_iso)
                .range(offset, offset + batch_size - 1)
            )
            if user_id:
                fetch_query = fetch_query.eq("user_id", user_id)

            fetch_result = await execute(fetch_query)

            if not fetch_result.data or len(fetch_result.data) == 0:
                break

            batch_ids = [row["id"] for row in fetch_result.data]

            # Delete batch
            delete_query = (
                supabase.table("notifications")
                .delete()
                .in_("id", batch_ids)
            )
            await execute(delete_query)

            deleted += len(batch_ids)

        except Exception as e:
            errors.append(f"Batch at offset {offset}: {e}")
            logger.warning("Cleanup batch failed at offset %d: %s", offset, e)

    return {
        "notificationsDeleted": deleted,
        "notificationsArchived": 0,
        "errors": errors,
    }
