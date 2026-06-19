"""
Match Generator Module — Complementary Matching Algorithm
Generates match suggestions that prioritize skill-gap complementarity over
semantic similarity. Two frontend developers score lower than a frontend
developer matched with a backend developer, because the latter pair fills
more skill gaps.

Key changes from the old similarity-based algorithm:
  1. NEW: skill_gap_score (35%) — measures unique skills the other person has
  2. NEW: role_complementarity (25%) — cross-domain/cross-role synergy
  3. BOOSTED: complementary (20%) — inverse Jaccard of skills
  4. REDUCED: semantic (10%) — cosine similarity (was 40%)
  5. REMOVED: activity_match — collaboration_readiness was not predictive

All DB I/O is dispatched through shared.db.execute(), which runs queries in a
dedicated thread pool so the asyncio event loop is never blocked.
"""

from __future__ import annotations

import json
import logging
from typing import Optional

import numpy as np

from shared.db import execute
from skill_categories import get_skill_category, CATEGORY_NAMES
from learner import fetch_complementary_pairs, fetch_algorithm_weights

logger = logging.getLogger(__name__)

# ===========================================
# COSINE SIMILARITY (vectorized via numpy)
# ===========================================


def cosine_similarity(a: list[float], b: list[float]) -> float:
    """Vectorized cosine similarity using numpy."""
    a_arr = np.array(a, dtype=np.float64)
    b_arr = np.array(b, dtype=np.float64)
    dot = np.dot(a_arr, b_arr)
    norm_a = np.linalg.norm(a_arr)
    norm_b = np.linalg.norm(b_arr)
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0
    return float(dot / (norm_a * norm_b))


# ===========================================
# JACCARD SIMILARITY
# ===========================================


def jaccard_similarity(a: list[str], b: list[str]) -> float:
    """Jaccard similarity coefficient for skills/interest overlap.
    Case-insensitive. Returns 0.0 if both lists are empty.
    """
    set_a = set(s.lower().strip() for s in a)
    set_b = set(s.lower().strip() for s in b)
    if not set_a and not set_b:
        return 0.0
    intersection = set_a & set_b
    union = set_a | set_b
    return len(intersection) / len(union)


# ===========================================
# COMPLEMENTARY SCORING — NEW FUNCTIONS
# ===========================================


def calculate_skill_gap_score(
    user_skills: list[str],
    candidate_skills: list[str],
) -> float:
    """Calculate how many UNIQUE skills the candidate has that the user doesn't.

    Higher score = candidate fills more gaps in the user's skill set.
    Cross-category gaps (e.g., frontend vs backend) count 3x more than
    same-category gaps (e.g., react vs vue).

    Args:
        user_skills: Source user's skill names.
        candidate_skills: Candidate's skill names.

    Returns:
        Skill gap score 0-100.
    """
    if not candidate_skills:
        return 0.0

    user_lower = set(s.lower().strip() for s in user_skills)
    candidate_lower = set(s.lower().strip() for s in candidate_skills)

    # Skills the candidate has that the user doesn't
    gap_skills = candidate_lower - user_lower
    if not gap_skills:
        return 0.0

    # Determine categories the user already covers
    user_categories = {get_skill_category(s) for s in user_skills}

    weighted_sum = 0.0
    for skill in gap_skills:
        cat = get_skill_category(skill)
        if cat not in user_categories:
            weighted_sum += 3.0  # Cross-category gap = most valuable
        else:
            weighted_sum += 1.0  # Same-category gap = less valuable

    # Normalize: max possible score per gap skill is 3.0
    max_possible = len(gap_skills) * 3.0
    raw_score = (weighted_sum / max_possible) * 100.0 if max_possible > 0 else 0.0

    return round(min(100.0, raw_score))


def _get_default_cross_pairs(categories: set[str]) -> set[tuple[str, str]]:
    """Generate default cross-category pairs from category families."""
    tech = {"frontend", "backend", "database", "devops", "cloud", "ai-ml", "security", "mobile"} & categories
    business = {"business", "marketing", "sales", "finance", "legal"} & categories
    creative = {"design", "creative", "arts", "performing-arts", "media-journalism"} & categories
    hands_on = {"trades", "manufacturing", "engineering"} & categories

    families = [tech, business, creative, hands_on]
    pairs: set[tuple[str, str]] = set()

    for i, fam_a in enumerate(families):
        for fam_b in families[i+1:]:
            for cat_a in fam_a:
                for cat_b in fam_b:
                    pairs.add((cat_a, cat_b))
                    pairs.add((cat_b, cat_a))
    return pairs


def calculate_role_complementarity(
    user_skills: list[str],
    candidate_skills: list[str],
    learned_pairs: set[tuple[str, str]] | None = None,
) -> float:
    """Calculate how complementary two users' skill profiles are.

    Uses skill categories to determine if users have complementary roles.
    Frontend developer + backend developer = high score.
    Two frontend developers = low score.
    Software engineer + investor = high score.

    Args:
        user_skills: Source user's skill names.
        candidate_skills: Candidate's skill names.
        learned_pairs: Optional set of complementary category pairs learned
            from the database. If None or empty, falls back to default
            cross-family pairs generated from CATEGORY_NAMES.

    Returns:
        Role complementarity score 0-100.
    """
    if not user_skills or not candidate_skills:
        return 0.0

    # Get categories for both users' skills
    user_cats = {get_skill_category(s) for s in user_skills}
    candidate_cats = {get_skill_category(s) for s in candidate_skills}

    if not user_cats or not candidate_cats:
        return 0.0

    # Proportion of DIFFERENT categories
    overlapping = user_cats & candidate_cats
    total = user_cats | candidate_cats
    diff_ratio = 1.0 - (len(overlapping) / len(total)) if total else 0.0

    # Determine which cross-category pairs are complementary
    if learned_pairs and len(learned_pairs) > 0:
        active_pairs = learned_pairs
    else:
        # Fallback: generate from category families
        all_cats = set(CATEGORY_NAMES.keys())
        # Use default cross-family logic
        active_pairs = _get_default_cross_pairs(all_cats)

    cross_bonus = 0.0
    for uc in user_cats:
        for cc in candidate_cats:
            pair = (uc, cc)
            reverse = (cc, uc)
            if pair in active_pairs or reverse in active_pairs:
                cross_bonus += 12.0

    cross_bonus = min(cross_bonus, 40.0)

    return round(min(100.0, (diff_ratio * 60.0) + cross_bonus))


# ===========================================
# MATCH SCORE CALCULATION
# ===========================================


# ===========================================
# ROLE-BASED COMPATIBILITY BOOST
# ===========================================

# Strategic role pair boost mapping
# (role_a, role_b) -> (boost_points, reason)
ROLE_BOOSTS: dict[tuple[str, str], tuple[int, str]] = {
    ("founder", "investor"): (15, "Founder-Investor match"),
    ("mentor", "student"): (12, "Student-Mentor match"),
    ("founder", "professional"): (10, "Founder-Professional team match"),
}

SAME_ROLE_BOOST = 5
CROSS_ROLE_BOOST = 3


def calculate_role_boost(
    user_roles: list[str] | None,
    matched_roles: list[str] | None,
) -> tuple[int, str]:
    """Calculate role-based compatibility boost between two users.

    Returns (boost_points, reason_string).
    """
    if not user_roles or not matched_roles:
        return 0, ""

    # Check for high-value specific pairings
    for u_role in user_roles:
        for m_role in matched_roles:
            key = (u_role, m_role)
            if key in ROLE_BOOSTS:
                return ROLE_BOOSTS[key]
            # Also check reverse
            rev_key = (m_role, u_role)
            if rev_key in ROLE_BOOSTS:
                return ROLE_BOOSTS[rev_key]

    # Check for same-role overlap
    if set(user_roles) & set(matched_roles):
        return SAME_ROLE_BOOST, "Same-role peer match"

    # General cross-role
    return CROSS_ROLE_BOOST, "Cross-role general match"


def calculate_match_score(
    user_embedding: list[float],
    matched_embedding: list[float],
    user_skills: list[str],
    matched_skills: list[str],
    user_interests: list[str],
    matched_interests: list[str],
    user_roles: list[str] | None = None,
    matched_roles: list[str] | None = None,
    role_matching_enabled: bool = True,
    weights: dict[str, float] | None = None,
    learned_pairs: set[tuple[str, str]] | None = None,
) -> dict:
    """Calculate match score with complementary-weighted breakdown.

    The weighted formula (with configurable weights):
      overall = skill_gap*skill_gap_weight
                + role_complementarity*role_complementarity_weight
                + complementary*complementary_weight
                + semantic*100*semantic_weight
                + interests*interests_weight
                + role_boost (0-15 points)

    Default weights (used when ``weights`` is None):
      skill_gap=0.35, role_complementarity=0.25, complementary=0.20,
      semantic=0.10, interests=0.10

    Args:
        user_embedding: Source user's profile embedding vector.
        matched_embedding: Candidate's profile embedding vector.
        user_skills: Source user's skill names.
        matched_skills: Candidate's skill names.
        user_interests: Source user's interest tags.
        matched_interests: Candidate's interest tags.
        user_roles: Source user's role tags (e.g. ['founder']).
        matched_roles: Candidate's role tags (e.g. ['investor']).
        role_matching_enabled: When True, applies role compatibility boost.
        weights: Optional dict with weight keys (skill_gap, role_complementarity,
            complementary, semantic, interests). Falls back to defaults if None.
        learned_pairs: Optional set of complementary category pairs from the DB.
            Passed through to calculate_role_complementarity().

    Returns:
        Dict with overallScore, skillGapScore, roleComplementarity,
        complementaryScore, semanticSimilarity, sharedInterests,
        roleBoost, roleReason.
    """
    semantic_score = max(0.0, cosine_similarity(user_embedding, matched_embedding))
    complementary_score = round((1 - jaccard_similarity(user_skills, matched_skills)) * 100)
    shared_interests = round(jaccard_similarity(user_interests, matched_interests) * 100)

    # Complementary scoring
    skill_gap_score = calculate_skill_gap_score(user_skills, matched_skills)
    role_complementarity = calculate_role_complementarity(
        user_skills, matched_skills, learned_pairs=learned_pairs,
    )

    # Role-based compatibility boost
    role_boost = 0
    role_reason = ""
    if role_matching_enabled:
        role_boost, role_reason = calculate_role_boost(user_roles, matched_roles)

    w = weights or {
        "skill_gap": 0.35,
        "role_complementarity": 0.25,
        "complementary": 0.20,
        "semantic": 0.10,
        "interests": 0.10,
    }

    overall_score = round(
        skill_gap_score * w["skill_gap"]
        + role_complementarity * w["role_complementarity"]
        + complementary_score * w["complementary"]
        + semantic_score * 100 * w["semantic"]
        + shared_interests * w["interests"]
        + role_boost
    )

    return {
        "overallScore": max(0, min(100, overall_score)),
        "skillGapScore": skill_gap_score,
        "roleComplementarity": role_complementarity,
        "complementaryScore": complementary_score,
        "semanticSimilarity": round(semantic_score, 2),
        "sharedInterests": shared_interests,
        "roleBoost": role_boost,
        "roleReason": role_reason,
    }


# ===========================================
# HELPERS
# ===========================================


def parse_vector(v) -> list[float]:
    """Parse a pgvector column value into a list of floats."""
    if isinstance(v, list):
        return v
    if isinstance(v, str):
        try:
            parsed = json.loads(v)
            if isinstance(parsed, list):
                return parsed
            return []
        except (json.JSONDecodeError, TypeError):
            return []
    return []


def generate_reasons(breakdown: dict, user_skills: list[str], matched_skills: list[str]) -> list[str]:
    """Generate human-readable reason strings from a score breakdown.

    NEW: Prioritizes complementary reasons (skill gap, role match) over
    similarity-based reasons.

    Args:
        breakdown: Score breakdown dict from ``calculate_match_score()``.
        user_skills: Source user's skill names.
        matched_skills: Candidate's skill names.

    Returns:
        List of reason strings.
    """
    reasons: list[str] = []

    # Complementary reasons (primary — listed first)
    if breakdown["skillGapScore"] > 50:
        user_lower = set(s.lower().strip() for s in user_skills)
        matched_lower = set(s.lower().strip() for s in matched_skills)
        gap_skills = matched_lower - user_lower
        if gap_skills:
            top_gaps = ", ".join(list(gap_skills)[:3])
            reasons.append(f"Fills {len(gap_skills)} skill gaps: {top_gaps}")
        else:
            reasons.append(f"High skill gap ({breakdown['skillGapScore']}%) — complementary expertise")

    if breakdown["roleComplementarity"] > 50:
        reasons.append("Cross-domain role match — your skills complement each other")

    if breakdown["complementaryScore"] > 60:
        reasons.append("Complementary skill sets — you fill each other's gaps")

    # Similarity reasons (secondary)
    if breakdown["semanticSimilarity"] > 0.65:
        reasons.append("Shared professional interests and direction")

    if breakdown["sharedInterests"] > 25:
        reasons.append("Shared interests detected")

    # Fallback
    if not reasons:
        reasons.append("General profile compatibility")

    return reasons


# ===========================================
# PERSISTENCE
# ===========================================


async def persist_match_scores(
    supabase,
    user_id: str,
    suggestions: list[dict],
    all_candidate_skills: dict[str, list[str]],
) -> None:
    """Persist score breakdowns to the match_scores table for each suggestion."""
    if not suggestions:
        return

    matched_user_ids = [s["matchedUserId"] for s in suggestions]

    existing_data: list[dict] = []
    if matched_user_ids:
        response = await execute(
            supabase.from_("match_suggestions")
            .select("id, matched_user_id")
            .eq("user_id", user_id)
            .in_("matched_user_id", matched_user_ids)
        )
        existing_data = response.data if response.data else []

    suggestion_id_map: dict[str, str] = {
        row["matched_user_id"]: row["id"] for row in existing_data
    }

    scores_to_upsert: list[dict] = []
    for s in suggestions:
        suggestion_id = suggestion_id_map.get(s["matchedUserId"])
        if not suggestion_id:
            continue

        cand_skills = all_candidate_skills.get(s["matchedUserId"], [])
        overlapping_skills = [
            cs for cs in cand_skills
            if any(cs.lower() in r.lower() for r in s["reasons"])
        ]

        sd = s["scoreBreakdown"]
        scores_to_upsert.append({
            "suggestion_id": suggestion_id,
            "semantic_similarity": sd.get("semanticSimilarity", 0),
            "skills_overlap": 0,  # Deprecated in new algorithm
            "complementary_score": sd.get("complementaryScore", 0),
            "shared_interests": sd.get("sharedInterests", 0),
            "overall_score": sd.get("overallScore", 0),
            "skill_gap_score": sd.get("skillGapScore", 0),
            "role_complementarity_score": sd.get("roleComplementarity", 0),
            "overlapping_skills": overlapping_skills,
        })

    if scores_to_upsert:
        await execute(
            supabase.from_("match_scores").upsert(
                scores_to_upsert, on_conflict="suggestion_id"
            )
        )
        logger.debug("Upserted %d match_scores for user %s", len(scores_to_upsert), user_id)


# ===========================================
# MATCH GENERATION
# ===========================================


async def generate_matches_for_user(
    supabase,
    user_id: str,
    limit: int = 20,
    min_score: int = 50,
) -> dict:
    """Generate match suggestions for a single user using complementary scoring.

    Full pipeline:
    1. Fetch user's embedding from ``profile_embeddings``.
    2. Fetch user's skills, interests, and profile.
    3. Fetch blocked users (both directions) for exclusion.
    4. Fetch all candidate embeddings (excluding self + blocked).
    5. Batch-fetch candidate skills and interests.
    6. Score each candidate with the complementary-weighted formula.
    7. Sort by match percentage descending, apply limit.
    8. Upsert to ``match_suggestions`` and persist scores.

    Args:
        supabase: Initialised Supabase client.
        user_id: Source user UUID.
        limit: Maximum number of suggestions to return (default 20).
        min_score: Minimum match percentage threshold (default 50).

    Returns:
        Dict with success bool, suggestions list, and matches_generated count.
    """
    # ── Load learned algorithm data ────────────────────────────────────────
    # Replace hardcoded cross_pairs and static WEIGHTS with DB-learned data
    try:
        learned_pairs = await fetch_complementary_pairs(supabase)
        learned_weights = await fetch_algorithm_weights(supabase)
    except Exception:
        logger.warning("Failed to fetch learned algorithm data, using fallback")
        learned_pairs = set()
        learned_weights = {}

    # Use learned weights if available, otherwise fall back to defaults
    ACTIVE_WEIGHTS = {
        "skill_gap": learned_weights.get("skill_gap", 0.35),
        "role_complementarity": learned_weights.get("role_complementarity", 0.25),
        "complementary": learned_weights.get("complementary", 0.20),
        "semantic": learned_weights.get("semantic", 0.10),
        "interests": learned_weights.get("interests", 0.10),
    }

    # ── Step 1: Fetch user embedding ───────────────────────────────────────
    response = await execute(
        supabase.from_("profile_embeddings")
        .select("user_id, embedding, status")
        .eq("user_id", user_id)
        .eq("status", "completed")
        .limit(1)
    )
    user_emb_rows = response.data if response.data else []
    if not user_emb_rows or not user_emb_rows[0].get("embedding"):
        logger.info("No embedding found for user %s", user_id)
        return {"success": False, "suggestions": [], "matches_generated": 0}

    user_embedding = parse_vector(user_emb_rows[0]["embedding"])
    if not user_embedding:
        return {"success": False, "suggestions": [], "matches_generated": 0}

    # ── Step 2: Fetch user profile data (parallel) ─────────────────────────
    import asyncio

    skills_resp, interests_resp, prefs_resp, profile_resp = await asyncio.gather(
        execute(
            supabase.from_("user_skills").select("skill_name").eq("user_id", user_id)
        ),
        execute(
            supabase.from_("user_interests").select("interest").eq("user_id", user_id)
        ),
        execute(
            supabase.from_("match_preferences")
            .select("min_match_percentage, interested_in_types, role_matching_enabled")
            .eq("user_id", user_id)
            .limit(1)
        ),
        execute(
            supabase.from_("profiles")
            .select("roles")
            .eq("id", user_id)
            .limit(1)
        ),
    )

    user_skills = [row["skill_name"] for row in (skills_resp.data or [])]
    user_interests = [row["interest"] for row in (interests_resp.data or [])]
    pref_row = (prefs_resp.data or [None])[0] if prefs_resp.data else None
    pref_min_score = (pref_row or {}).get("min_match_percentage")
    effective_min_score = max(min_score, pref_min_score) if pref_min_score else min_score
    user_roles = ((profile_resp.data or [{}])[0]).get("roles") or []
    interested_in_types = (pref_row or {}).get("interested_in_types") or []
    role_matching_enabled = (pref_row or {}).get("role_matching_enabled", True)

    # ── Step 3: Fetch blocked users (both directions) ──────────────────────
    blocked_by_resp, blocking_resp = await asyncio.gather(
        execute(
            supabase.from_("blocked_users")
            .select("blocked_id")
            .eq("blocker_id", user_id)
        ),
        execute(
            supabase.from_("blocked_users")
            .select("blocker_id")
            .eq("blocked_id", user_id)
        ),
    )

    exclude_ids: set[str] = {user_id}
    for row in blocked_by_resp.data or []:
        exclude_ids.add(row["blocked_id"])
    for row in blocking_resp.data or []:
        exclude_ids.add(row["blocker_id"])

    # ── Step 4: Fetch candidate embeddings ─────────────────────────────────
    candidates_resp = await execute(
        supabase.from_("profile_embeddings")
        .select("user_id, embedding")
        .eq("status", "completed")
    )
    all_candidates = candidates_resp.data if candidates_resp.data else []

    candidates = [c for c in all_candidates if c["user_id"] not in exclude_ids]
    candidate_ids = [c["user_id"] for c in candidates if c.get("embedding")]

    if not candidate_ids:
        return {"success": True, "suggestions": [], "matches_generated": 0}

    # ── Step 5: Batch-fetch candidate skills, interests, and roles ──────────
    cand_skills_resp, cand_interests_resp, cand_profiles_resp = await asyncio.gather(
        execute(
            supabase.from_("user_skills")
            .select("user_id, skill_name")
            .in_("user_id", candidate_ids)
        ),
        execute(
            supabase.from_("user_interests")
            .select("user_id, interest")
            .in_("user_id", candidate_ids)
        ),
        execute(
            supabase.from_("profiles")
            .select("id, roles")
            .in_("id", candidate_ids)
        ),
    )

    # Build lookup maps
    cand_skills_map: dict[str, list[str]] = {}
    for row in cand_skills_resp.data or []:
        cand_skills_map.setdefault(row["user_id"], []).append(row["skill_name"])

    cand_interests_map: dict[str, list[str]] = {}
    for row in cand_interests_resp.data or []:
        cand_interests_map.setdefault(row["user_id"], []).append(row["interest"])

    cand_roles_map: dict[str, list[str]] = {}
    for row in cand_profiles_resp.data or []:
        roles = row.get("roles") or []
        cand_roles_map[row["id"]] = roles

    # ── Step 5b: Apply interested_in_types filter ───────────────────────────
    # If the user has specified who they're interested in matching with,
    # filter out candidates whose roles don't intersect
    if interested_in_types:
        filtered_candidates = []
        for c in candidates:
            cid = c["user_id"]
            cand_roles = cand_roles_map.get(cid, [])
            # If user has interested_in_types, candidate's roles must overlap
            if set(interested_in_types) & set(cand_roles):
                filtered_candidates.append(c)
            # Also keep candidates with no roles (legacy profiles)
            elif not cand_roles:
                filtered_candidates.append(c)
        candidates = filtered_candidates

    # ── Step 6: Score each candidate ────────────────────────────────────────
    suggestions: list[dict] = []
    all_candidate_skills: dict[str, list[str]] = {}
    scored_count = 0

    for candidate in candidates:
        cand_embedding_raw = candidate.get("embedding")
        if not cand_embedding_raw:
            continue

        cid = candidate["user_id"]
        cand_skills = cand_skills_map.get(cid, [])
        cand_interests = cand_interests_map.get(cid, [])
        cand_roles = cand_roles_map.get(cid, [])

        all_candidate_skills[cid] = cand_skills

        cand_embedding = parse_vector(cand_embedding_raw)
        if not cand_embedding:
            continue

        breakdown = calculate_match_score(
            user_embedding,
            cand_embedding,
            user_skills,
            cand_skills,
            user_interests,
            cand_interests,
            user_roles=user_roles,
            matched_roles=cand_roles,
            role_matching_enabled=role_matching_enabled,
            weights=ACTIVE_WEIGHTS,
            learned_pairs=learned_pairs,
        )

        if breakdown["overallScore"] < effective_min_score:
            continue

        scored_count += 1

        suggestions.append({
            "matchedUserId": cid,
            "matchPercentage": breakdown["overallScore"],
            "reasons": generate_reasons(breakdown, user_skills, cand_skills),
            "scoreBreakdown": breakdown,
        })

    # ── Step 7: Sort by match percentage descending, apply limit ────────────
    suggestions.sort(key=lambda s: s["matchPercentage"], reverse=True)
    top_suggestions = suggestions[:limit]

    logger.info(
        "Match generation for %s: %d candidates → %d scored → %d returned",
        user_id,
        len(candidates),
        scored_count,
        len(top_suggestions),
    )

    # ── Step 8: Persist to match_suggestions ───────────────────────────────
    if top_suggestions:
        await execute(
            supabase.from_("match_suggestions").upsert(
                [
                    {
                        "user_id": user_id,
                        "matched_user_id": s["matchedUserId"],
                        "match_percentage": s["matchPercentage"],
                        "reasons": s["reasons"],
                        "status": "active",
                    }
                    for s in top_suggestions
                ],
                on_conflict="user_id,matched_user_id",
            )
        )

        await persist_match_scores(supabase, user_id, top_suggestions, all_candidate_skills)

    return {
        "success": True,
        "suggestions": [
            {
                "matched_user_id": s["matchedUserId"],
                "match_percentage": s["matchPercentage"],
                "reasons": s["reasons"],
                "score_breakdown": s["scoreBreakdown"],
            }
            for s in top_suggestions
        ],
        "matches_generated": len(top_suggestions),
    }


# ===========================================
# BATCH MATCH GENERATION
# ===========================================


async def generate_batch_matches(
    supabase,
    user_ids: Optional[list[str]] = None,
    limit_per_user: int = 20,
) -> dict:
    """Generate matches for multiple users sequentially."""
    if not user_ids:
        response = await execute(
            supabase.from_("profile_embeddings")
            .select("user_id")
            .eq("status", "completed")
        )
        user_ids = [row["user_id"] for row in (response.data or []) if row.get("user_id")]

    users_count = len(user_ids)
    processed_count = 0

    for uid in user_ids:
        try:
            result = await generate_matches_for_user(
                supabase, uid, limit=limit_per_user
            )
            if result.get("success") and result.get("matches_generated", 0) > 0:
                processed_count += 1
        except Exception:
            logger.exception("Batch match generation failed for user %s", uid)

    return {
        "status": "completed",
        "users_count": users_count,
        "processed_count": processed_count,
    }
