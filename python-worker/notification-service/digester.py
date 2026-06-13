"""
Digest generator module.
Port of notification-engine.ts lines 174–220.
Queries unread notifications, groups them by user+type, and inserts digests.
"""

import logging
from datetime import datetime
from typing import Optional

from shared.db import execute

logger = logging.getLogger(__name__)


# ── Helper: group by user and type ────────────────────────────────────────────
# Ported from groupByUserAndType() lines 297–307.


def _group_by_user_and_type(
    notifications: list[dict],
) -> dict[str, dict[str, int]]:
    """Group a list of notification rows by ``user_id`` then by ``type``.

    Returns a nested dict: ``{user_id: {type: count, ...}, ...}``.

    Ported from the TS ``Map<string, Map<string, number>>`` pattern.
    """
    grouped: dict[str, dict[str, int]] = {}
    for n in notifications:
        uid = n.get("user_id", "")
        ntype = n.get("type", "")
        if uid not in grouped:
            grouped[uid] = {}
        grouped[uid][ntype] = grouped[uid].get(ntype, 0) + 1
    return grouped


# ── Helper: build digest content string ───────────────────────────────────────
# Ported from buildDigestContent() lines 309–313.


def _build_digest_content(date: str, type_counts: dict[str, int]) -> str:
    """Build a human-readable digest summary string.

    Example: ``"Daily digest (2026-06-07): 3 connect, 1 message"``
    """
    summary = ", ".join(
        f"{count} {ntype}" for ntype, count in type_counts.items()
    )
    return f"Daily digest ({date}): {summary}"


# ── Generate Digest ───────────────────────────────────────────────────────────
# Ported from generateDigest() lines 174–220.


async def generate_digest(
    supabase,
    options: Optional[dict] = None,
) -> dict:
    """Generate daily digests from unread notifications.

    Args:
        supabase: Initialised Supabase client.
        options: Optional dict with:
            - ``date`` (str): Target date (ISO date string, default: today).
            - ``batchSize`` (int): Max notifications to query (default: 100).
            - ``dryRun`` (bool): If ``True``, count only, don't insert (default: ``False``).

    Returns:
        Dict with ``digestsQueued``, ``digestsSent``, ``digestsFailed``, ``errors``.
    """
    opts = options or {}
    target_date: str = opts.get("date") or datetime.utcnow().strftime("%Y-%m-%d")
    batch_size: int = opts.get("batchSize", 100)
    dry_run: bool = opts.get("dryRun", False)

    # ── Query unread notifications for the target date ─────────────────────
    try:
        result = await execute(
            supabase.table("notifications")
            .select("id, user_id, type, content, created_at")
            .eq("is_read", False)
            .gte("created_at", f"{target_date}T00:00:00Z")
            .lte("created_at", f"{target_date}T23:59:59Z")
            .order("user_id")
            .limit(batch_size)
        )
    except Exception as e:
        logger.error("Failed to query unread notifications: %s", e)
        return {
            "digestsQueued": 0,
            "digestsSent": 0,
            "digestsFailed": 1,
            "errors": [str(e)],
        }

    if not result.data or len(result.data) == 0:
        return {
            "digestsQueued": 0,
            "digestsSent": 0,
            "digestsFailed": 0,
            "errors": [],
        }

    # ── Group by user and type ─────────────────────────────────────────────
    grouped = _group_by_user_and_type(result.data)
    digests_sent = 0
    digests_failed = 0
    errors: list[str] = []

    # ── Insert digest notifications ───────────────────────────────────────
    for user_id, type_counts in grouped.items():
        if dry_run:
            continue

        content = _build_digest_content(target_date, type_counts)
        try:
            await execute(
                supabase.table("notifications").insert(
                    {
                        "user_id": user_id,
                        "type": "system",
                        "content": content,
                    }
                )
            )
            digests_sent += 1
        except Exception as e:
            digests_failed += 1
            errors.append(f"User {user_id}: {e}")
            logger.warning("Digest insert failed for user %s: %s", user_id, e)

    return {
        "digestsQueued": len(grouped),
        "digestsSent": digests_sent,
        "digestsFailed": digests_failed,
        "errors": errors,
    }
