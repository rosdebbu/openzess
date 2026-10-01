"""
Lightweight Prometheus-style metrics for Openzess.

Zero external dependencies - exposes counters/histograms as text at
GET /metrics for scraping (Prometheus, Grafana Agent, etc.).

Tracked metrics:
- openzess_http_requests_total{method, path, status}
- openzess_http_request_duration_seconds_bucket / _count / _sum
- openzess_rate_limited_total
- openzess_active_sessions (gauge, snapshot at scrape time)
"""

import time
import threading
from collections import defaultdict

_lock = threading.Lock()
_started_at = time.time()

_counters: dict = defaultdict(int)
_histograms: dict = defaultdict(list)  # path -> list of durations

# Histogram buckets (seconds) - tuned for LLM latencies (up to 60s+)
_BUCKETS = (0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0, 30.0, 60.0, float("inf"))

# Long per-user paths are normalized to their route template so the
# metrics cardinality stays bounded.
def _normalize_path(path: str) -> str:
    for prefix, template in (
        ("/api/sessions/", "/api/sessions/{id}"),
        ("/api/messages/", "/api/messages/{id}"),
        ("/api/notes/", "/api/notes/{id}"),
        ("/api/personas/", "/api/personas/{id}"),
        ("/api/memory/", "/api/memory/{id}"),
        ("/api/mcp/", "/api/mcp/{id}"),
        ("/api/cron/", "/api/cron/{id}"),
        ("/api/watchdog/", "/api/watchdog/{id}"),
    ):
        if path.startswith(prefix):
            return template
    return path


def record_request(method: str, path: str, status_code: int, duration: float) -> None:
    """Record one HTTP request observation. Called by the metrics middleware."""
    norm = _normalize_path(path)
    with _lock:
        _counters[f"http:{method}:{norm}:{status_code}"] += 1
        hist = _histograms[norm]
        hist.append(duration)
        # Bound memory: keep the most recent 1000 observations per route
        if len(hist) > 1000:
            del hist[: len(hist) - 1000]
        _counters["http:total"] += 1


def record_rate_limited() -> None:
    with _lock:
        _counters["rate_limited"] += 1


def render_metrics(active_sessions: int = 0) -> str:
    """Render all metrics in Prometheus text exposition format."""
    lines = [
        "# HELP openzess_http_requests_total Total HTTP requests.",
        "# TYPE openzess_http_requests_total counter",
    ]
    with _lock:
        snapshot_counters = dict(_counters)
        snapshot_hists = {k: list(v) for k, v in _histograms.items()}
    uptime = time.time() - _started_at

    for key, val in sorted(snapshot_counters.items()):
        if key.startswith("http:") and key != "http:total":
            _, method, path, status_code = key.split(":", 3)
            lines.append(
                f'openzess_http_requests_total{{method="{method}",path="{path}",status="{status_code}"}} {val}'
            )

    lines.append("# HELP openzess_http_request_duration_seconds Request duration in seconds.")
    lines.append("# TYPE openzess_http_request_duration_seconds histogram")
    for path, durations in sorted(snapshot_hists.items()):
        cumulative = 0
        sorted_d = sorted(durations)
        for b in _BUCKETS[:-1]:
            cumulative = sum(1 for d in sorted_d if d <= b)
            lines.append(
                f'openzess_http_request_duration_seconds_bucket{{path="{path}",le="{b}"}} {cumulative}'
            )
        total = len(sorted_d)
        total_sum = sum(sorted_d)
        lines.append(
            f'openzess_http_request_duration_seconds_bucket{{path="{path}",le="+Inf"}} {total}'
        )
        lines.append(
            f'openzess_http_request_duration_seconds_count{{path="{path}"}} {total}'
        )
        lines.append(
            f'openzess_http_request_duration_seconds_sum{{path="{path}"}} {total_sum:.6f}'
        )

    lines.append("# HELP openzess_rate_limited_total Requests rejected by the rate limiter.")
    lines.append("# TYPE openzess_rate_limited_total counter")
    lines.append(f"openzess_rate_limited_total {snapshot_counters.get('rate_limited', 0)}")

    lines.append("# HELP openzess_active_sessions Currently cached in-memory agent sessions.")
    lines.append("# TYPE openzess_active_sessions gauge")
    lines.append(f"openzess_active_sessions {active_sessions}")

    lines.append("# HELP openzess_uptime_seconds Process uptime in seconds.")
    lines.append("# TYPE openzess_uptime_seconds gauge")
    lines.append(f"openzess_uptime_seconds {uptime:.3f}")
    lines.append("")
    return "\n".join(lines)