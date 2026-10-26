"""Record the komarev profile view total and render daily views as an SVG.

komarev.com only exposes a cumulative counter, and every request (including
this script's own fetch) increments it. Each run stores the returned total;
daily views are the difference between consecutive runs minus one for the
script's own hit, assigned to the KST day before the run.
"""
import json
import re
import sys
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

USERNAME = "sngmng6506"
KST = timezone(timedelta(hours=9))
DAYS = 90
HISTORY = Path("views/history.json")
GRAPH = Path("views/daily.svg")


def fetch_total() -> int:
    url = f"https://komarev.com/ghpvc/?username={USERNAME}"
    req = urllib.request.Request(url, headers={"User-Agent": f"{USERNAME}-profile-views"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        svg = resp.read().decode("utf-8", "replace")
    numbers = [
        int(re.sub(r"[,\s]", "", t))
        for t in re.findall(r">\s*([0-9][0-9,\s]*)\s*<", svg)
    ]
    if not numbers:
        sys.exit("Could not find a view count in the komarev badge:\n" + svg[:500])
    return max(numbers)


def daily_views(history: list[dict]) -> dict[str, int]:
    days: dict[str, int] = {}
    for prev, cur in zip(history, history[1:]):
        delta = cur["total"] - prev["total"] - 1  # minus this run's own fetch
        if delta < 0:  # counter reset or anomaly
            continue
        at = datetime.fromisoformat(cur["at"]).astimezone(KST)
        elapsed = at - datetime.fromisoformat(prev["at"]).astimezone(KST)
        # Spread over the days covered when a scheduled run was skipped.
        n = max(1, round(elapsed / timedelta(days=1)))
        last = (at - timedelta(days=1)).date()
        for k in range(n):
            share = delta // n + (1 if k < delta % n else 0)
            day = (last - timedelta(days=k)).isoformat()
            days[day] = days.get(day, 0) + share
    return days


def render(days: dict[str, int], today: datetime) -> str:
    end = today.date() - timedelta(days=1)
    rows = [(end - timedelta(days=DAYS - 1 - i)) for i in range(DAYS)]
    values = [days.get(d.isoformat()) for d in rows]
    left, right, top, bottom = 30, 982, 35, 118
    maximum = max([1] + [v for v in values if v is not None])
    x = lambda i: left + i * (right - left) / (DAYS - 1)
    y = lambda v: bottom - v / maximum * (bottom - top)

    path, connected = [], False
    for i, v in enumerate(values):
        if v is None:
            connected = False
            continue
        path.append(f"{'L' if connected else 'M'}{x(i):.2f},{y(v):.2f}")
        connected = True
    dots = "".join(
        f'<circle cx="{x(i):.2f}" cy="{y(v):.2f}" r="1.8" class="dot"/>'
        for i, v in enumerate(values) if v
    )
    day_ticks = "".join(
        f'<line x1="{x(i):.2f}" y1="118" x2="{x(i):.2f}" y2="121" class="grid" opacity=".4"/>'
        for i in range(DAYS)
    )
    labels = "".join(
        f'<text x="{x(i):.2f}" y="141" text-anchor="middle">{d.month}/{d.day}</text>'
        for i, d in enumerate(rows) if i % 14 == 0 or i == DAYS - 1
    )
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="150" viewBox="0 0 1000 150" role="img" aria-labelledby="title desc">
<title id="title">Daily profile views</title>
<desc id="desc">Profile page views per KST day over the last {DAYS} days, from the difference of a cumulative hit counter. Days without data are left blank.</desc>
<style>
text{{font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Arial,sans-serif;font-size:11px;fill:#6e7781}}
.heading{{font-size:12px;font-weight:600;fill:#57606a}}
.grid{{stroke:#d8dee4;stroke-width:1}}
.line{{fill:none;stroke:#318b9e;stroke-width:1.5;stroke-linejoin:round;stroke-linecap:round}}
.dot{{fill:#318b9e;stroke:#fff;stroke-width:1}}
@media(prefers-color-scheme:dark){{text{{fill:#8b949e}}.heading{{fill:#b1bac4}}.grid{{stroke:#30363d}}.line{{stroke:#65b7c6}}.dot{{fill:#65b7c6;stroke:#0d1117}}}}
</style>
<text x="30" y="15" class="heading">DAILY PROFILE VIEWS</text>
<text x="982" y="15" text-anchor="end">Last {DAYS} days · KST</text>
<line x1="30" y1="35" x2="982" y2="35" class="grid" stroke-dasharray="2 4" opacity=".55"/>
<line x1="30" y1="118" x2="982" y2="118" class="grid"/>
<text x="20" y="39" text-anchor="end">{maximum}</text><text x="20" y="122" text-anchor="end">0</text>
<path d="{' '.join(path)}" class="line"/>{dots}{day_ticks}{labels}
</svg>
"""


def main() -> None:
    history = json.loads(HISTORY.read_text()) if HISTORY.exists() else []
    now = datetime.now(timezone.utc)
    if "--render-only" not in sys.argv:
        history.append({"at": now.isoformat(timespec="seconds"), "total": fetch_total()})
    HISTORY.parent.mkdir(parents=True, exist_ok=True)
    HISTORY.write_text(json.dumps(history, indent=1) + "\n")
    GRAPH.write_text(render(daily_views(history), now.astimezone(KST)))
    print(f"entries={len(history)} latest_total={history[-1]['total'] if history else None}")


if __name__ == "__main__":
    main()
