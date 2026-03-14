"""
Rate Limiter Module for Embedding Service
Implements sliding window rate limiting with caching
"""

from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)


class RateLimiter:
    """Rate limiter for embedding generation requests"""

    RATE_LIMIT = 3  # requests per window
    WINDOW_HOURS = 1  # 1 hour window
    CACHE_TTL_SECONDS = 60  # Cache results for 60 seconds

    def __init__(self, supabase_client):
        """
        Initialize rate limiter

        Args:
            supabase_client: Supabase client instance
        """
        self.supabase = supabase_client
        self.cache: Dict[str, dict] = {}

    async def check_rate_limit(self, user_id: str) -> Dict[str, Any]:
        """
        Check if user is within rate limits

        Args:
            user_id: User UUID to check

        Returns:
            dict: {
                allowed: bool,
                remaining: int,
                reset_at: str (ISO format),
                retry_after: int (seconds)
            }
        """
        # Check cache first
        if user_id in self.cache:
            cached = self.cache[user_id]
            now = datetime.utcnow().timestamp()
            if now < cached["expires"]:
                logger.debug(f"Rate limit cache hit for user {user_id}")
                return cached["result"]
            else:
                # Cache expired, remove it
                del self.cache[user_id]

        # Call database function
        try:
            response = self.supabase.rpc(
                "check_embedding_rate_limit", {"p_user_id": user_id}
            ).execute()

            if response.data and len(response.data) > 0:
                result = response.data[0]
                rate_limit_result = {
                    "allowed": result["allowed"],
                    "remaining": result["remaining"],
                    "reset_at": result["reset_at"],
                    "retry_after": self._calculate_retry_after(result["reset_at"]),
                }

                # Cache result
                self.cache[user_id] = {
                    "result": rate_limit_result,
                    "expires": datetime.utcnow().timestamp() + self.CACHE_TTL_SECONDS,
                }

                logger.info(
                    f"Rate limit check for user {user_id}: allowed={rate_limit_result['allowed']}, remaining={rate_limit_result['remaining']}"
                )

                return rate_limit_result

            # Fallback: allow if DB check fails (fail open)
            logger.warning(
                f"Rate limit DB check returned no data for user {user_id}, failing open"
            )
            return {
                "allowed": True,
                "remaining": self.RATE_LIMIT,
                "reset_at": None,
                "retry_after": 0,
            }

        except Exception as e:
            logger.error(f"Rate limit check failed for user {user_id}: {e}")
            # Fail open - allow request if rate limiting service fails
            return {
                "allowed": True,
                "remaining": self.RATE_LIMIT,
                "reset_at": None,
                "retry_after": 0,
            }

    def _calculate_retry_after(self, reset_at: Optional[str]) -> int:
        """
        Calculate seconds until rate limit resets

        Args:
            reset_at: ISO format timestamp when limit resets

        Returns:
            int: Seconds until reset (0 if no reset time)
        """
        if not reset_at:
            return 0

        try:
            # Parse ISO format timestamp and ensure timezone-aware comparison
            reset_time = datetime.fromisoformat(reset_at.replace("Z", "+00:00"))

            # Always use timezone-aware datetime for comparison
            if reset_time.tzinfo:
                now = datetime.now(reset_time.tzinfo)
            else:
                # If reset_time is naive, treat both as UTC
                now = datetime.utcnow()
                reset_time = reset_time.replace(tzinfo=None)  # Ensure both are naive

            delta = reset_time - now
            return max(0, int(delta.total_seconds()))
        except Exception as e:
            logger.error(f"Failed to calculate retry_after: {e}")
            return 3600  # Default to 1 hour if parsing fails

    def clear_cache(self, user_id: str):
        """
        Clear rate limit cache for user

        Args:
            user_id: User UUID to clear from cache
        """
        if user_id in self.cache:
            del self.cache[user_id]
            logger.debug(f"Rate limit cache cleared for user {user_id}")

    def clear_all_cache(self):
        """Clear entire rate limit cache"""
        self.cache.clear()
        logger.info("Rate limit cache cleared")
