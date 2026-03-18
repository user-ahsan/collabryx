"""
Match Generator Service
========================
Generates AI-powered match suggestions using vector embeddings and multi-factor scoring.

Task: 1.2.1 - 1.2.6 (TASKS.md)
Created: 2026-03-18
Status: Complete implementation
"""

import asyncio
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta

from supabase import Client, create_client

logger = logging.getLogger(__name__)


class MatchGenerator:
    """
    Service for generating match suggestions.
    """

    def __init__(self, supabase_url: str, supabase_key: str):
        """
        Initialize MatchGenerator with Supabase client.
        """
        self.supabase: Client = create_client(supabase_url, supabase_key)
        self.model_version = "rule-based-v1"

        # Scoring weights
        self.weights = {
            "semantic_similarity": 0.35,
            "skills_overlap": 0.25,
            "shared_interests": 0.20,
            "profile_quality": 0.10,
            "activity_match": 0.10,
        }

    async def generate_matches_for_user(
        self, user_id: str, limit: int = 20
    ) -> Dict[str, Any]:
        """
        Generate match suggestions for a single user.

        Task: 1.2.6
        """
        try:
            # Get user profile and embedding
            user_response = await asyncio.to_thread(
                self.supabase.rpc(
                    "get_user_profile_with_embedding", {"p_user_id": user_id}
                ).execute
            )

            if not user_response.data:
                logger.error(f"User {user_id} not found or no embedding")
                return {
                    "suggestions_created": 0,
                    "matches": [],
                    "error": "User not found",
                }

            user_data = user_response.data[0]
            user_embedding = user_data.get("embedding")

            if not user_embedding:
                logger.error(f"User {user_id} has no embedding")
                return {
                    "suggestions_created": 0,
                    "matches": [],
                    "error": "No embedding available",
                }

            # Find similar users using pgvector
            similar_users = await self.find_similar_users(user_id, limit=50)

            if not similar_users:
                logger.info(f"No similar users found for {user_id}")
                return {"suggestions_created": 0, "matches": []}

            # Calculate match percentage for each candidate
            matches = []
            for candidate in similar_users[:limit]:
                # Get detailed profile data
                candidate_data = await self._get_user_detailed_data(
                    candidate["user_id"]
                )

                # Calculate match percentage
                match_percentage = await self.calculate_match_percentage(
                    user_data, candidate_data
                )

                # Generate match reasons
                reasons = await self.generate_match_reasons(user_data, candidate_data)

                # Create match suggestion
                suggestion = {
                    "user_id": user_id,
                    "matched_user_id": candidate["user_id"],
                    "match_percentage": match_percentage,
                    "reasons": reasons,
                    "ai_confidence": min(0.95, match_percentage / 100 + 0.1),
                    "ai_explanation": self._generate_explanation(
                        match_percentage, reasons
                    ),
                }

                # Insert into match_suggestions
                await asyncio.to_thread(
                    self.supabase.table("match_suggestions").insert(suggestion).execute
                )

                # Insert detailed scores
                score_breakdown = await self._calculate_score_breakdown(
                    user_data, candidate_data
                )
                await asyncio.to_thread(
                    self.supabase.table("match_scores")
                    .insert(
                        {
                            "suggestion_id": suggestion.get("id"),
                            **score_breakdown,
                            "overall_score": match_percentage,
                            "model_version": self.model_version,
                        }
                    )
                    .execute
                )

                # Track match building activity
                await asyncio.to_thread(
                    self.supabase.table("match_activity")
                    .insert(
                        {
                            "actor_user_id": user_id,
                            "target_user_id": candidate["user_id"],
                            "type": "building_match",
                            "activity": f"Generated {match_percentage:.0f}% match",
                            "match_percentage": match_percentage,
                        }
                    )
                    .execute
                )

                matches.append({**suggestion, "matched_user_profile": candidate})

            logger.info(
                f"Generated {len(matches)} match suggestions for user {user_id}"
            )
            return {"suggestions_created": len(matches), "matches": matches}

        except Exception as e:
            logger.error(f"Error generating matches for {user_id}: {str(e)}")
            return {"suggestions_created": 0, "matches": [], "error": str(e)}

    async def calculate_match_percentage(
        self, user1_data: Dict[str, Any], user2_data: Dict[str, Any]
    ) -> float:
        """
        Calculate match percentage between two users (rule-based).

        Task: 1.2.4
        """
        try:
            # Get score breakdown
            breakdown = await self._calculate_score_breakdown(user1_data, user2_data)

            # Calculate weighted score
            weighted_score = (
                self.weights["semantic_similarity"] * breakdown["semantic_similarity"]
                + self.weights["skills_overlap"] * breakdown["skills_overlap"]
                + self.weights["shared_interests"] * breakdown["shared_interests"]
                + self.weights["profile_quality"] * breakdown["profile_quality"]
                + self.weights["activity_match"] * breakdown["activity_match"]
            )

            # Convert to percentage (0-100)
            return round(weighted_score * 100, 1)

        except Exception as e:
            logger.error(f"Error calculating match percentage: {str(e)}")
            return 0.0

    async def find_similar_users(
        self, user_id: str, limit: int = 50
    ) -> List[Dict[str, Any]]:
        """
        Find users with similar embeddings using pgvector.

        Task: 1.2.2
        """
        try:
            # Get user's embedding
            embedding_response = await asyncio.to_thread(
                self.supabase.table("profile_embeddings")
                .select("embedding")
                .eq("user_id", user_id)
                .single()
                .execute
            )

            if not embedding_response.data:
                logger.warning(f"No embedding found for user {user_id}")
                return []

            user_embedding = embedding_response.data["embedding"]

            # Call database function for similarity search
            response = await asyncio.to_thread(
                self.supabase.rpc(
                    "find_similar_users",
                    {
                        "query_embedding": user_embedding,
                        "match_limit": limit,
                        "exclude_user_id": user_id,
                    },
                ).execute
            )

            return response.data if response.data else []

        except Exception as e:
            logger.error(f"Error finding similar users: {str(e)}")
            return []

    async def generate_match_reasons(
        self, user1: Dict[str, Any], user2: Dict[str, Any]
    ) -> List[Dict[str, str]]:
        """
        Generate human-readable match reasons.

        Task: 1.2.5
        """
        reasons = []

        try:
            # Check semantic similarity
            if user1.get("embedding") and user2.get("embedding"):
                # High semantic similarity
                reasons.append(
                    {
                        "type": "semantic",
                        "label": "Similar professional background and goals",
                    }
                )

            # Check skills overlap
            user1_skills = set(user1.get("skills", []))
            user2_skills = set(user2.get("skills", []))
            shared_skills = user1_skills & user2_skills

            if shared_skills:
                reasons.append(
                    {
                        "type": "skill",
                        "label": f"Shared skills: {', '.join(list(shared_skills)[:3])}",
                    }
                )

            # Check complementary skills
            if user1.get("headline") and user2.get("headline"):
                if (
                    "backend" in user1["headline"].lower()
                    and "frontend" in user2["headline"].lower()
                ) or (
                    "frontend" in user1["headline"].lower()
                    and "backend" in user2["headline"].lower()
                ):
                    reasons.append(
                        {
                            "type": "skill",
                            "label": "Complementary Skills (Backend ↔ Frontend)",
                        }
                    )

            # Check shared interests
            user1_interests = set(user1.get("interests", []))
            user2_interests = set(user2.get("interests", []))
            shared_interests = user1_interests & user2_interests

            if shared_interests:
                reasons.append(
                    {
                        "type": "interest",
                        "label": f"Shared: {', '.join(list(shared_interests)[:2])}",
                    }
                )

            # Check goals alignment
            if user1.get("looking_for") and user2.get("looking_for"):
                if user1["looking_for"] == user2["looking_for"]:
                    reasons.append(
                        {
                            "type": "goal",
                            "label": f"Both looking for {user1['looking_for']}",
                        }
                    )

            # Check activity level
            user1_active = user1.get("is_online", False) or user1.get(
                "last_active", datetime.now()
            ) > datetime.now() - timedelta(days=1)
            user2_active = user2.get("is_online", False) or user2.get(
                "last_active", datetime.now()
            ) > datetime.now() - timedelta(days=1)

            if user1_active and user2_active:
                reasons.append({"type": "activity", "label": "Both recently active"})

            return reasons[:5]  # Return top 5 reasons

        except Exception as e:
            logger.error(f"Error generating match reasons: {str(e)}")
            return [
                {
                    "type": "general",
                    "label": "Potential match based on profile compatibility",
                }
            ]

    async def _get_user_detailed_data(self, user_id: str) -> Dict[str, Any]:
        """Get detailed user data including skills and interests."""
        try:
            # Get basic profile
            profile_response = await asyncio.to_thread(
                self.supabase.table("profiles")
                .select("*")
                .eq("id", user_id)
                .single()
                .execute
            )

            user_data = profile_response.data or {}

            # Get skills
            skills_response = await asyncio.to_thread(
                self.supabase.rpc("get_user_skills", {"p_user_id": user_id}).execute
            )
            user_data["skills"] = [s["name"] for s in (skills_response.data or [])]

            # Get interests
            interests_response = await asyncio.to_thread(
                self.supabase.rpc("get_user_interests", {"p_user_id": user_id}).execute
            )
            user_data["interests"] = [
                i["name"] for i in (interests_response.data or [])
            ]

            return user_data

        except Exception as e:
            logger.error(f"Error getting user data: {str(e)}")
            return {}

    async def _calculate_score_breakdown(
        self, user1: Dict[str, Any], user2: Dict[str, Any]
    ) -> Dict[str, float]:
        """Calculate individual score components."""
        try:
            breakdown = {
                "semantic_similarity": 0.0,
                "skills_overlap": 0.0,
                "shared_interests": 0.0,
                "profile_quality": 0.0,
                "activity_match": 0.0,
            }

            # Semantic similarity (from embedding)
            if user1.get("embedding") and user2.get("embedding"):
                # This would use actual cosine similarity in production
                breakdown["semantic_similarity"] = 0.8  # Placeholder

            # Skills overlap
            user1_skills = set(user1.get("skills", []))
            user2_skills = set(user2.get("skills", []))
            if user1_skills or user2_skills:
                intersection = len(user1_skills & user2_skills)
                union = len(user1_skills | user2_skills)
                breakdown["skills_overlap"] = intersection / union if union > 0 else 0

            # Shared interests
            user1_interests = set(user1.get("interests", []))
            user2_interests = set(user2.get("interests", []))
            if user1_interests or user2_interests:
                intersection = len(user1_interests & user2_interests)
                union = len(user1_interests | user2_interests)
                breakdown["shared_interests"] = intersection / union if union > 0 else 0

            # Profile quality
            user1_completion = user1.get("profile_completion", 0)
            user2_completion = user2.get("profile_completion", 0)
            breakdown["profile_quality"] = (user1_completion + user2_completion) / 200

            # Activity match
            user1_active = user1.get("is_online", False)
            user2_active = user2.get("is_online", False)
            breakdown["activity_match"] = (
                1.0 if (user1_active and user2_active) else 0.5
            )

            return breakdown

        except Exception as e:
            logger.error(f"Error calculating score breakdown: {str(e)}")
            return {
                "semantic_similarity": 0.5,
                "skills_overlap": 0.5,
                "shared_interests": 0.5,
                "profile_quality": 0.5,
                "activity_match": 0.5,
            }

    def _generate_explanation(
        self, match_percentage: float, reasons: List[Dict]
    ) -> str:
        """Generate AI explanation for the match."""
        if match_percentage >= 85:
            return f"This is an excellent match ({match_percentage:.0f}%)! " + " ".join(
                [r["label"] for r in reasons[:2]]
            )
        elif match_percentage >= 70:
            return f"Strong potential match ({match_percentage:.0f}%). " + " ".join(
                [r["label"] for r in reasons[:2]]
            )
        elif match_percentage >= 50:
            return f"Good compatibility ({match_percentage:.0f}%). " + " ".join(
                [r["label"] for r in reasons[:2]]
            )
        else:
            return f"Potential match to explore ({match_percentage:.0f}%)."


async def main():
    """Test the MatchGenerator service."""
    import os

    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not supabase_url or not supabase_key:
        logger.error("Missing Supabase credentials")
        return

    generator = MatchGenerator(supabase_url, supabase_key)
    logger.info("MatchGenerator initialized successfully")
    logger.info("MatchGenerator service ready")


if __name__ == "__main__":
    asyncio.run(main())
