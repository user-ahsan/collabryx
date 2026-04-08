"""
Circuit Breaker implementation for external API calls
"""

import asyncio
import logging
from datetime import datetime, timedelta
from enum import Enum
from typing import Callable

logger = logging.getLogger(__name__)


class CircuitState(Enum):
    CLOSED = "closed"  # Normal operation
    OPEN = "open"  # Failing, reject immediately
    HALF_OPEN = "half_open"  # Testing if service recovered


class CircuitBreaker:
    """Circuit breaker for external service calls."""

    def __init__(
        self,
        name: str,
        failure_threshold: int = 5,
        recovery_timeout: float = 60.0,
        half_open_max_calls: int = 3,
    ):
        self.name = name
        self.failure_threshold = failure_threshold
        self.recovery_timeout = timedelta(seconds=recovery_timeout)
        self.half_open_max_calls = half_open_max_calls

        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.last_failure_time: datetime | None = None
        self.half_open_calls = 0

    def record_success(self):
        """Record a successful call."""
        if self.state == CircuitState.HALF_OPEN:
            self.half_open_calls += 1
            if self.half_open_calls >= self.half_open_max_calls:
                self._transition_to_closed()
        elif self.state == CircuitState.CLOSED:
            self.failure_count = 0

    def record_failure(self):
        """Record a failed call."""
        self.failure_count += 1
        self.last_failure_time = datetime.utcnow()

        if self.state == CircuitState.HALF_OPEN:
            self._transition_to_open()
        elif self.failure_count >= self.failure_threshold:
            self._transition_to_open()

    def can_attempt(self) -> bool:
        """Check if a call should be attempted."""
        if self.state == CircuitState.CLOSED:
            return True

        if self.state == CircuitState.OPEN:
            if (
                self.last_failure_time
                and datetime.utcnow() - self.last_failure_time > self.recovery_timeout
            ):
                self._transition_to_half_open()
                return True
            return False

        # HALF_OPEN: allow limited calls
        return self.half_open_calls < self.half_open_max_calls

    def _transition_to_open(self):
        self.state = CircuitState.OPEN
        self.half_open_calls = 0
        logger.warning(f"Circuit breaker '{self.name}' OPENED")

    def _transition_to_half_open(self):
        self.state = CircuitState.HALF_OPEN
        self.half_open_calls = 0
        logger.info(f"Circuit breaker '{self.name}' HALF_OPEN")

    def _transition_to_closed(self):
        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.half_open_calls = 0
        self.last_failure_time = None
        logger.info(f"Circuit breaker '{self.name}' CLOSED")


# Singleton instances for common external services
hf_circuit_breaker = CircuitBreaker(
    "huggingface", failure_threshold=3, recovery_timeout=60.0
)
supabase_circuit_breaker = CircuitBreaker(
    "supabase", failure_threshold=5, recovery_timeout=30.0
)


async def with_circuit_breaker(
    breaker: CircuitBreaker,
    func: Callable,
    *args,
    **kwargs,
):
    """Execute a function with circuit breaker protection."""
    if not breaker.can_attempt():
        raise Exception(f"Circuit breaker '{breaker.name}' is OPEN")

    try:
        result = (
            await func(*args, **kwargs)
            if asyncio.iscoroutinefunction(func)
            else func(*args, **kwargs)
        )
        breaker.record_success()
        return result
    except Exception as e:
        breaker.record_failure()
        raise
