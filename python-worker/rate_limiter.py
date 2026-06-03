"""
Rate Limiter Module for Embedding Service
Implements sliding window rate limiting with database as source of truth
"""

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)


@dataclass
class RateLimitResult:
    """Structured result from a rate limit check"""
    allowed: bool
    remaining: int
    reset_at: Optional[str] = None
    retry_after: int = 0
    error: Optional[str] = None
    error_retry_seconds: int = 0


class RateLimiter:
    """Rate limiter for embedding generation requests (database-backed, no cache)"""

    RATE_LIMIT = 3  # requests per window
    WINDOW_HOURS = 1  # 1 hour window

    def __init__(self, supabase_client):
        """
        Initialize rate limiter

        Args:
            supabase_client: Supabase client instance
        """
        self.supabase = supabase_client
        # No in-memory cache - database is source of truth for distributed rate limiting

    async def check_rate_limit(
        self, user_id: str, bypass_rate_limit: bool = False
    ) -> RateLimitResult:
        """
        Check if user is within rate limits

        Args:
            user_id: User UUID to check
            bypass_rate_limit: If True, skip rate limiting (for admin/service operations)

        Returns:
            RateLimitResult with allowed, remaining, reset_at, retry_after
        """
        # Service role bypass for admin operations
        if bypass_rate_limit:
            logger.debug(f"Rate limit bypassed for service operation (user: {user_id})")
            return RateLimitResult(
                allowed=True,
                remaining=self.RATE_LIMIT,
                reset_at=None,
                retry_after=0,
            )

        # Always check database - no cache for distributed rate limiting
        # This ensures consistent rate limiting across multiple worker instances
        try:
            import asyncio
            loop = asyncio.get_event_loop()
            
            # Wrap the blocking synchronous Supabase .execute() call in run_in_executor to prevent event loop delays
            query = self.supabase.rpc("check_embedding_rate_limit", {"p_user_id": user_id})
            response = await loop.run_in_executor(None, query.execute)

            if response.data and len(response.data) > 0:
                result = response.data[0]
                rate_limit_result = RateLimitResult(
                    allowed=result["allowed"],
                    remaining=result["remaining"],
                    reset_at=result["reset_at"],
                    retry_after=self._calculate_retry_after(result["reset_at"]),
                )

                logger.debug(
                    f"Rate limit check for user {user_id}: allowed={rate_limit_result.allowed}, remaining={rate_limit_result.remaining}"
                )

                return rate_limit_result

            # Fallback: reject if DB check returns no data (fail closed)
            logger.warning(
                f"Rate limit DB check returned no data for user {user_id}, failing closed"
            )
            return RateLimitResult(
                allowed=False,
                remaining=0,
                error="Rate limit check unavailable",
                error_retry_seconds=3600,
            )

        except Exception as e:
            logger.error(f"Rate limit check failed for user {user_id}: {e}")
            logger.critical(
                f"Rate limiting service unavailable for {user_id}, failing closed"
            )
            return RateLimitResult(
                allowed=False,
                remaining=0,
                error=f"Rate limiting service unavailable: {e}",
                error_retry_seconds=60,
            )

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
