"""
Learner Module — Learns Complementary Pairs and Algorithm Weights

Replaces ALL hardcoded values in the matching algorithm with data-driven
insights learned from real user behavior:

  1. Complementary skill category pairs are mined from accepted connections.
     If frontend + backend users connect frequently, that pair gets a high score.
  2. Algorithm weights are learned from match score breakdowns vs. actual
     connection outcomes. A dimension that strongly predicts connection (e.g.
     skill_gap) gets a higher weight.

When no real connection data exists yet, the module seeds initial pairs using
known cross-domain category families from ``skill_categories.py``.  These seed
values are overwritten as soon as real data arrives.

All DB I/O is dispatched through ``shared.db.execute()``, which runs queries
in a dedicated thread pool so the asyncio event loop is never blocked.
"""

from __future__ import annotations

import logging
import statistics
from typing import Any

from shared.db import execute

logger = logging.getLogger(__name__)


# =============================================================================
# PUBLIC API
# =============================================================================


async def fetch_complementary_pairs(supabase) -> set[tuple[str, str]]:
    """Fetch learned complementary category pairs from the database.

    Queries the ``complementary_pairs`` table for pairs whose ``score`` is
    at least 30 (meaningful co-occurrence).  Returns a bidirectional set:
    if (frontend, backend) is stored, both (frontend, backend) and
    (backend, frontend) are included so callers can look up either direction
    without branching.

    Args:
        supabase: Initialised Supabase client.

    Returns:
        A set of ``(category_a, category_b)`` tuples.  Empty set when no
        learned pairs exist yet.
    """
    pairs: set[tuple[str, str]] = set()
    response = await execute(
        supabase.from_("complementary_pairs")
        .select("category_a, category_b")
        .gte("score", 30)
    )
    for row in response.data or []:
        a: str = row["category_a"]
        b: str = row["category_b"]
        pairs.add((a, b))
        pairs.add((b, a))  # Bidirectional lookup
    return pairs


async def fetch_algorithm_weights(supabase) -> dict[str, float]:
    """Fetch learned algorithm weights from the database.

    Queries the ``algorithm_weights`` table for dimensions that have been
    learned (``sample_size > 0``), ordered by most recent ``last_updated``.
    Returns a dict like ``{"skill_gap": 0.35, "role_complementarity": 0.25,
    ...}``.

    Args:
        supabase: Initialised Supabase client.

    Returns:
        Mapping of dimension name to weight.  Empty dict when no learned
        weights exist (caller should fall back to hardcoded defaults).
    """
    response = await execute(
        supabase.from_("algorithm_weights")
        .select("dimension, weight")
        .gt("sample_size", 0)
        .order("last_updated", desc=True)
    )
    return {row["dimension"]: row["weight"] for row in (response.data or [])}


async def refresh_learned_data(supabase) -> dict[str, Any]:
    """Refresh all learned data from real user behavior.

    This is the main learning function.  It performs three steps:

    **Step A — Complementary pairs:**
        Queries the ``connections`` table for accepted connections and joins
        against ``user_skills`` to discover which skill categories co-occur.
        Co-occurrence counts are converted to a 0-100 score and upserted into
        ``complementary_pairs``.  If no connections exist yet, falls back to
        :func:`_seed_initial_pairs`.

    **Step B — Algorithm weights:**
        Queries ``match_scores`` joined with ``connections`` to compare score
        breakdowns for user pairs that eventually connected vs. those that did
        not.  For each dimension (skill_gap, role_complementarity, etc.), the
        mean score difference between connected and non-connected pairs becomes
        the learned weight, normalised to 0-1.

    **Step C — Cleanup (reserved):**
        Placeholder for future stale-data purging.

    Args:
        supabase: Initialised Supabase client.

    Returns:
        Summary dict with counts of what was learned:

        .. code-block:: python

            {
                "pairs_learned": int,             # complementary pairs upserted
                "total_connections_analyzed": int, # accepted connections counted
                "weights_updated": int,            # score rows processed
            }
    """
    # ------------------------------------------------------------------
    # Step A — Count total accepted connections
    # ------------------------------------------------------------------
    conn_resp = await execute(
        supabase.from_("connections")
        .select("id", count="exact")
        .eq("status", "accepted")
    )
    total_connections: int = conn_resp.count if hasattr(conn_resp, "count") else 0

    if total_connections == 0:
        # No real data yet — seed from cross-domain category families
        return await _seed_initial_pairs(supabase)

    # ------------------------------------------------------------------
    # Step A — Learn complementary pairs from accepted connections
    # ------------------------------------------------------------------
    # For every accepted connection, find the skill categories of both
    # participants.  A pair (cat_a, cat_b) is counted each time a user
    # whose category is cat_a connects with a user whose category is cat_b.
    query = """
    WITH accepted_connections AS (
        SELECT c.requester_id, c.receiver_id
        FROM connections c
        WHERE c.status = 'accepted'
    )
    SELECT
        us1.skill_category AS cat_a,
        us2.skill_category AS cat_b,
        COUNT(*) AS co_count
    FROM accepted_connections ac
    JOIN user_skills us1
        ON us1.user_id = ac.requester_id
        AND us1.skill_category IS NOT NULL
    JOIN user_skills us2
        ON us2.user_id = ac.receiver_id
        AND us2.skill_category IS NOT NULL
    WHERE us1.skill_category != us2.skill_category
    GROUP BY us1.skill_category, us2.skill_category
    HAVING COUNT(*) >= 2
    ORDER BY co_count DESC
    """

    try:
        raw_resp = await execute(supabase.raw(query))
        rows: list[dict[str, Any]] = raw_resp.data if raw_resp.data else []
    except Exception:
        logger.exception("Raw query for complementary pairs failed")
        rows = []

    pair_count = 0
    for row in rows:
        score = min(100.0, (row["co_count"] / max(total_connections, 1)) * 100)
        await execute(
            supabase.from_("complementary_pairs").upsert(
                {
                    "category_a": row["cat_a"],
                    "category_b": row["cat_b"],
                    "score": round(score, 1),
                    "co_occurrence_count": row["co_count"],
                    "connection_count": total_connections,
                    "last_updated": "now()",
                },
                on_conflict="category_a,category_b",
            )
        )
        pair_count += 1

    # ------------------------------------------------------------------
    # Step B — Learn algorithm weights from score breakdowns vs. outcomes
    # ------------------------------------------------------------------
    weight_query = """
    SELECT
        ms.skill_gap_score,
        ms.role_complementarity_score,
        ms.complementary_score,
        ms.semantic_similarity,
        ms.shared_interests,
        ms.overall_score,
        CASE WHEN c.status = 'accepted' THEN 1 ELSE 0 END AS connected
    FROM match_scores ms
    JOIN match_suggestions m ON m.id = ms.suggestion_id
    LEFT JOIN connections c ON
        c.requester_id = m.user_id AND c.receiver_id = m.matched_user_id
    WHERE ms.overall_score > 0
    """

    try:
        weight_resp = await execute(supabase.raw(weight_query))
        score_rows: list[dict[str, Any]] = weight_resp.data if weight_resp.data else []
    except Exception:
        logger.exception("Raw query for algorithm weights failed")
        score_rows = []

    weights_updated = 0
    if len(score_rows) >= 10:
        # Collect scores from connected vs. non-connected pairs per dimension
        connected_scores: dict[str, list[float]] = {
            "skill_gap": [],
            "role_complementarity": [],
            "complementary": [],
            "semantic": [],
            "interests": [],
        }
        not_connected_scores: dict[str, list[float]] = {
            "skill_gap": [],
            "role_complementarity": [],
            "complementary": [],
            "semantic": [],
            "interests": [],
        }

        field_map: dict[str, str] = {
            "skill_gap": "skill_gap_score",
            "role_complementarity": "role_complementarity_score",
            "complementary": "complementary_score",
            "semantic": "semantic_similarity",
            "interests": "shared_interests",
        }

        for row in score_rows:
            is_connected = row.get("connected", 0) == 1
            for dim, field in field_map.items():
                val: float = row.get(field, 0) or 0.0
                if is_connected:
                    connected_scores[dim].append(val)
                else:
                    not_connected_scores[dim].append(val)

        # Derive weight: dimensions whose scores differ more between connected
        # and non-connected pairs are more predictive and deserve higher weight
        for dim in connected_scores:
            conn_vals = connected_scores[dim]
            not_conn_vals = not_connected_scores[dim]
            if conn_vals and not_conn_vals:
                avg_conn = statistics.mean(conn_vals)
                avg_not = statistics.mean(not_conn_vals)
                diff = avg_conn - avg_not
                sample = len(conn_vals) + len(not_conn_vals)

                # Clamp weight to [0, 1] — diff can be up to 100 theoretically
                weight = round(max(0.0, min(1.0, diff / 100.0)), 3)

                await execute(
                    supabase.from_("algorithm_weights").upsert(
                        {
                            "dimension": dim,
                            "weight": weight,
                            "sample_size": sample,
                            "connection_rate": round(avg_conn / 100.0, 3),
                            "last_updated": "now()",
                        },
                        on_conflict="dimension",
                    )
                )
                weights_updated += 1

    logger.info(
        "Refresh complete: %d pairs learned, %d connections analyzed, "
        "%d weight dimensions updated",
        pair_count,
        total_connections,
        weights_updated,
    )

    return {
        "pairs_learned": pair_count,
        "total_connections_analyzed": total_connections,
        "weights_updated": weights_updated,
    }


# =============================================================================
# INTERNAL HELPERS
# =============================================================================


async def _seed_initial_pairs(supabase) -> dict[str, Any]:
    """Seed initial complementary pairs from known cross-domain category families.

    Used when no real connection data exists yet (zero accepted connections).
    Creates pairs between categories in different "families" — for example,
    every tech category is paired with every business, creative, and hands-on
    category.  Each pair is assigned a default score of 60.

    These seed values are replaced by real learned data once connections start
    happening, so they act purely as a bootstrap for the matching algorithm.

    Args:
        supabase: Initialised Supabase client.

    Returns:
        Summary dict (same shape as :func:`refresh_learned_data`) noting that
        seed data was used.
    """
    # Deferred import to avoid circular dependency at module level
    from skill_categories import (  # type: ignore[import-untyped]  # noqa: PLC0415
        CATEGORY_NAMES,
    )

    categories: set[str] = set(CATEGORY_NAMES.keys())

    # Define cross-domain families — pairs between different families are
    # considered complementary by default
    tech_cats = {
        "frontend",
        "backend",
        "database",
        "devops",
        "cloud",
        "ai-ml",
        "security",
        "mobile",
    }
    business_cats = {"business", "marketing", "sales", "finance", "legal"}
    creative_cats = {
        "design",
        "creative",
        "performing-arts",
        "arts",
        "media-journalism",
    }
    hands_on_cats = {"trades", "manufacturing", "engineering", "construction"}

    families = [tech_cats, business_cats, creative_cats, hands_on_cats]

    pairs_created = 0
    for i, fam_a in enumerate(families):
        for fam_b in families[i + 1 :]:
            for cat_a in fam_a:
                for cat_b in fam_b:
                    if cat_a in categories and cat_b in categories:
                        await execute(
                            supabase.from_("complementary_pairs").upsert(
                                {
                                    "category_a": cat_a,
                                    "category_b": cat_b,
                                    "score": 60.0,
                                    "co_occurrence_count": 0,
                                    "connection_count": 0,
                                },
                                on_conflict="category_a,category_b",
                            )
                        )
                        pairs_created += 1

    logger.info(
        "Seeded %d initial complementary pairs from category families "
        "(no real connection data yet)",
        pairs_created,
    )

    return {
        "pairs_learned": pairs_created,
        "total_connections_analyzed": 0,
        "weights_updated": 0,
        "note": (
            "Seeded from category families.  Will be replaced by real "
            "data as connections grow."
        ),
    }
