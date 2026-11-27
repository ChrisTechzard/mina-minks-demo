"""Small in-process rate limiter for abuse-prone endpoints.

Limitation: state is per Python process. Use a shared store (e.g. Redis)
before running more than one API worker in production.
"""

from __future__ import annotations

import threading
import time
from collections import defaultdict, deque
from typing import Final


class InMemoryRateLimiter:
    """Sliding-window limiter keyed by an arbitrary string."""

    def __init__(self, max_requests: int, window_seconds: float = 60.0) -> None:
        self._max_requests = max_requests
        self._window_seconds = window_seconds
        self._events: dict[str, deque[float]] = defaultdict(deque)
        self._lock: Final[threading.Lock] = threading.Lock()

    def check(self, key: str) -> bool:
        """Return True when the request is permitted, consuming one slot."""

        now = time.monotonic()
        with self._lock:
            events = self._events[key]
            cutoff = now - self._window_seconds
            while events and events[0] <= cutoff:
                events.popleft()
            if len(events) >= self._max_requests:
                return False
            events.append(now)
            return True
