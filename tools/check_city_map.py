#!/usr/bin/env python3
"""Extract city display names from city-*.html h1 + inspect JS list gaps."""
import os, re, json
from collections import Counter, defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

s = open(os.path.join(ROOT, "cities.html"), encoding="utf-8").read()
names = re.findall(r"name:'([^']*)',\s*cn:'([^']*)'", s)
entries = []
for n, cn in names:
    slug = re.sub(r"\s+", "-", re.sub(r"[^a-z]", "", n.lower()))
    entries.append((n, cn, slug))
cnt = Counter(sl for _, _, sl in entries)
print("== dup slug JS entries ==")
by = defaultdict(list)
for n, cn, sl in entries:
    by[sl].append((n, cn))
for sl, c in cnt.items():
    if c > 1:
        print(" ", sl, by[sl])

files = sorted(f for f in os.listdir(ROOT) if f.startswith("city-") and f.endswith(".html"))
print("== h1 extraction check ==")
missing_h1 = []
out = []
for f in files:
    html = open(os.path.join(ROOT, f), encoding="utf-8", errors="replace").read()
    m = re.search(r"<h1[^>]*>(.*?)</h1>", html, re.S)
    if not m:
        missing_h1.append(f)
        out.append({"file": f, "en": f[5:-5], "cn": ""})
        continue
    t = re.sub(r"<[^>]+>", "", m.group(1))
    t = re.sub(r"\s+", " ", t).strip()
    mm = re.match(r"^(.*?)\s*\(([^)]*)\)\s*$", t)
    if mm:
        out.append({"file": f, "en": mm.group(1).strip(), "cn": mm.group(2).strip()})
    else:
        out.append({"file": f, "en": t, "cn": ""})
print("no h1:", missing_h1)
print("sample:", out[:3])
# files with no cn
print("no cn:", [o["file"] for o in out if not o["cn"]][:10])
json.dump(out, open("/tmp/cwg_city_names.json", "w"), ensure_ascii=False, indent=1)
