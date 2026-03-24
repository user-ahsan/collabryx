"""
Feed Scorer Service
====================
Personalized feed ranking using Thompson Sampling and hybrid scoring.

Tasks: 2.1.1 - 2.1.6 (TASKS.md)
Created: 2026-03-18
"""

import asyncio
import logging
import numpy as np
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta

from supabase import Client, create_client

logger = logging.getLogger(__name__)


class FeedScorer:
    """
    Service for feed ranking and personalization.

    Methods:
        calculate_feed_score: Calculate personalized score for a post
        get_personalized_feed: Get ranked feed for user
        compute_all_user_scores: Pre-compute scores for all posts
        update_trending_posts: Update trending posts cache
    """

    def __init__(self, supabase_url: str, supabase_key: str):
        """
        Initialize FeedScorer with Supabase client.
        """
        self.supabase: Client = create_client(supabase_url, supabase_key)

        # Scoring weights (from IMPLEMENTATION_PLAN.md)
        self.weights = {
            "semantic": 0.35,
            "engagement": 0.30,
            "recency": 0.20,
            "connection": 0.15,
        }

        # Thompson Sampling parameters
        self.ts_samples = 1000

    async def calculate_feed_score(self, user_id: str, post: Dict[str, Any]) -> float:
        """
        Calculate personalized feed score for a post.

        Task: 2.1.3 (Hybrid scoring formula)
        """
        try:
            # Get user data
            user_data = await self._get_user_data(user_id)

            # 1. Semantic Score (35%)
            semantic_score = await self._calculate_semantic_score(user_id, post)

            # 2. Engagement Score (30%) - Thompson Sampling
            engagement_score = self._thompson_sample(
                successes=post.get("reaction_count", 0) + post.get("comment_count", 0),
                failures=max(
                    0, post.get("impressions", 1) - post.get("engagements", 0)
                ),
            )

            # 3. Recency Score (20%) - Exponential decay
            recency_score = self._calculate_recency_score(post.get("created_at"))

            # 4. Connection Boost (15%)
            connection_boost = (
                1.5
                if await self._are_connected(user_id, post.get("author_id"))
                else 1.0
            )

            # Calculate final score
            base_score = (
                self.weights["semantic"] * semantic_score
                + self.weights["engagement"] * engagement_score
                + self.weights["recency"] * recency_score
            )

            # Apply connection boost
            final_score = base_score * connection_boost

            # Apply additional boosts
            if await self._has_shared_interests(user_id, post.get("author_id")):
                final_score *= 1.2

            if post.get("intent") and user_data.get("looking_for") == post.get(
                "intent"
            ):
                final_score *= 1.1

            return round(min(1.0, final_score), 4)

        except Exception as e:
            logger.error(f"Error calculating feed score: {str(e)}")
            return 0.5  # Default score

    async def get_personalized_feed(
        self, user_id: str, limit: int = 20
    ) -> List[Dict[str, Any]]:
        """
        Get personalized feed for user.

        Task: 2.1.4
        """
        try:
            # Get candidate posts (last 7 days)
            cutoff_date = datetime.now() - timedelta(days=7)

            posts_response = await asyncio.to_thread(
                self.supabase.table("posts")
                .select("""
                    *,
                    author:profiles!posts_author_id_fkey (
                        id,
                        display_name,
                        headline,
                        avatar_url
                    )
                """)
                .gte("created_at", cutoff_date.isoformat())
                .neq("author_id", user_id)
                .order("created_at", desc=True)
                .limit(100)  # Get more candidates for scoring
                .execute
            )

            posts = posts_response.data or []

            # Score each post
            scored_posts = []
            for post in posts:
                score = await self.calculate_feed_score(user_id, post)

                # Cache score in feed_scores table
                await self._cache_score(user_id, post["id"], score)

                scored_posts.append({**post, "feed_score": score})

            # Sort by score
            scored_posts.sort(key=lambda p: p["feed_score"], reverse=True)

            # Return top N
            return scored_posts[:limit]

        except Exception as e:
            logger.error(f"Error getting personalized feed: {str(e)}")
            return []

    async def compute_all_user_scores(self, user_id: str) -> Dict[str, Any]:
        """
        Pre-compute feed scores for all posts for a user.

        Task: 2.1.4
        """
        try:
            # Get all recent posts
            cutoff_date = datetime.now() - timedelta(days=7)

            posts_response = await asyncio.to_thread(
                self.supabase.table("posts")
                .select("id, author_id, created_at, reaction_count, comment_count")
                .gte("created_at", cutoff_date.isoformat())
                .neq("author_id", user_id)
                .execute
            )

            posts = posts_response.data or []

            # Score all posts
            scores = {}
            for post in posts:
                score = await self.calculate_feed_score(user_id, post)
                scores[post["id"]] = score

                # Cache
                await self._cache_score(user_id, post["id"], score)

            logger.info(f"Computed scores for {len(scores)} posts for user {user_id}")

            return {
                "user_id": user_id,
                "scores_computed": len(scores),
                "avg_score": sum(scores.values()) / len(scores) if scores else 0,
            }

        except Exception as e:
            logger.error(f"Error computing user scores: {str(e)}")
            return {"user_id": user_id, "scores_computed": 0, "error": str(e)}

    async def update_trending_posts(self) -> Dict[str, Any]:
        """
        Update trending posts cache.

        Task: 2.1.4
        """
        try:
            # Get posts from last 24 hours
            cutoff_date = datetime.now() - timedelta(hours=24)

            posts_response = await asyncio.to_thread(
                self.supabase.table("posts")
                .select("id, author_id, reaction_count, comment_count, created_at")
                .gte("created_at", cutoff_date.isoformat())
                .order("reaction_count", desc=True)
                .limit(50)
                .execute
            )

            posts = posts_response.data or []

            # Calculate trending score (engagement velocity)
            trending = []
            for post in posts:
                hours_old = max(
                    1,
                    (
                        datetime.now()
                        - datetime.fromisoformat(
                            post["created_at"].replace("Z", "+00:00")
                        )
                    ).total_seconds()
                    / 3600,
                )
                engagement = post.get("reaction_count", 0) + post.get(
                    "comment_count", 0
                )
                trending_score = engagement / hours_old  # Engagements per hour

                trending.append({**post, "trending_score": round(trending_score, 4)})

            # Sort by trending score
            trending.sort(key=lambda p: p["trending_score"], reverse=True)

            logger.info(f"Updated trending posts: {len(trending)} posts")

            return {
                "trending_count": len(trending),
                "top_post_id": trending[0]["id"] if trending else None,
            }

        except Exception as e:
            logger.error(f"Error updating trending posts: {str(e)}")
            return {"trending_count": 0, "error": str(e)}

    def _thompson_sample(self, successes: int, failures: int) -> float:
        """
        Thompson Sampling for engagement prediction.

        Task: 2.1.2
        """
        try:
            # Beta distribution sampling
            samples = np.random.beta(successes + 1, failures + 1, self.ts_samples)
            return float(np.mean(samples))
        except Exception as e:
            logger.error(f"Error in Thompson Sampling: {str(e)}")
            return 0.5

    async def _calculate_semantic_score(
        self, user_id: str, post: Dict[str, Any]
    ) -> float:
        """Calculate semantic similarity between user and post."""
        try:
            # Get user embedding
            user_emb_response = await asyncio.to_thread(
                self.supabase.table("profile_embeddings")
                .select("embedding")
                .eq("user_id", user_id)
                .eq("status", "completed")
                .single()
                .execute
            )

            if not user_emb_response.data:
                return 0.5

            # Get post embedding (if exists, otherwise use author's)
            post_emb_response = await asyncio.to_thread(
                self.supabase.table("profile_embeddings")
                .select("embedding")
                .eq("user_id", post.get("author_id"))
                .eq("status", "completed")
                .single()
                .execute
            )

            if not post_emb_response.data:
                return 0.5

            # Actual cosine similarity calculation
            user_embedding = user_emb_response.data["embedding"]
            post_embedding = post_emb_response.data["embedding"]

            # Convert to numpy arrays
            user_vec = np.array([float(x) for x in user_embedding])
            post_vec = np.array([float(x) for x in post_embedding])

            # Cosine similarity: dot(a,b) / (||a|| * ||b||)
            dot_product = np.dot(user_vec, post_vec)
            norm_user = np.linalg.norm(user_vec)
            norm_post = np.linalg.norm(post_vec)

            if norm_user == 0 or norm_post == 0:
                return 0.5

            similarity = dot_product / (norm_user * norm_post)

            # Normalize from [-1, 1] to [0, 1]
            return float((similarity + 1) / 2)

        except Exception as e:
            logger.error(f"Error calculating semantic score: {str(e)}")
            return 0.5

    def _calculate_recency_score(self, created_at: Optional[str]) -> float:
        """Calculate recency score with exponential decay."""
        try:
            if not created_at:
                return 0.0

            dt = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
            hours_old = (datetime.now(dt.tzinfo) - dt).total_seconds() / 3600

            # Exponential decay with 24-hour half-life
            return float(np.exp(-hours_old / 24))

        except Exception as e:
            logger.error(f"Error calculating recency score: {str(e)}")
            return 0.0

    async def _are_connected(self, user1_id: str, user2_id: str) -> bool:
        """Check if two users are connected."""
        try:
            response = await asyncio.to_thread(
                self.supabase.table("connections")
                .select("id")
                .or_(f"requester_id.eq.{user1_id},receiver_id.eq.{user2_id}")
                .or_(f"requester_id.eq.{user2_id},receiver_id.eq.{user1_id}")
                .eq("status", "accepted")
                .limit(1)
                .execute
            )

            return len(response.data) > 0

        except Exception as e:
            logger.error(f"Error checking connection: {str(e)}")
            return False

    async def _has_shared_interests(self, user1_id: str, user2_id: str) -> bool:
        """Check if users have shared interests."""
        try:
            # Get interests for both users
            user1_response = await asyncio.to_thread(
                self.supabase.rpc("get_user_interests", {"p_user_id": user1_id}).execute
            )
            user2_response = await asyncio.to_thread(
                self.supabase.rpc("get_user_interests", {"p_user_id": user2_id}).execute
            )

            user1_interests = set(i["name"] for i in (user1_response.data or []))
            user2_interests = set(i["name"] for i in (user2_response.data or []))

            return len(user1_interests & user2_interests) > 0

        except Exception as e:
            logger.error(f"Error checking shared interests: {str(e)}")
            return False

    async def _get_user_data(self, user_id: str) -> Dict[str, Any]:
        """Get user profile data."""
        try:
            response = await asyncio.to_thread(
                self.supabase.table("profiles")
                .select("id, looking_for, interests")
                .eq("id", user_id)
                .single()
                .execute
            )

            return response.data or {}

        except Exception as e:
            logger.error(f"Error getting user data: {str(e)}")
            return {}

    async def _cache_score(self, user_id: str, post_id: str, score: float):
        """Cache score in feed_scores table."""
        try:
            await asyncio.to_thread(
                self.supabase.table("feed_scores")
                .upsert(
                    {
                        "user_id": user_id,
                        "post_id": post_id,
                        "score": score,
                        "semantic_score": 0.7,
                        "engagement_score": 0.5,
                        "recency_score": 0.8,
                        "connection_boost": 1.0,
                        "expires_at": (datetime.now() + timedelta(hours=1)).isoformat(),
                    },
                    on_conflict="user_id,post_id",
                )
                .execute
            )
        except Exception as e:
            logger.error(f"Error caching score: {str(e)}")


async def main():
    """Test the FeedScorer service."""
    import os

    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not supabase_url or not supabase_key:
        logger.error("Missing Supabase credentials")
        return

    scorer = FeedScorer(supabase_url, supabase_key)
    logger.info("FeedScorer initialized successfully")
    logger.info("FeedScorer service ready")


if __name__ == "__main__":
    asyncio.run(main())
