#!/usr/bin/env python3
"""Inspect CWG domain-case contexts and hreflang conflicts in detail."""
import os, re
from collections import Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

ctx = Counter()
for f in sorted(os.listdir(ROOT)):
    p = os.path.join(ROOT, f)
    if not os.path.isfile(p) or f.rsplit(".", 1)[-1] not in ("html", "xml", "txt", "js", "json", "md"):
        continue
    s = open(p, encoding="utf-8", errors="replace").read()
    for m in re.finditer(r".{0,28}ChinaWiFiGo\.com.{0,10}", s):
        ctx[m.group(0)[:70]] += 1
print("== distinct domain contexts (top 40) ==")
for k, v in ctx.most_common(40):
    print("  %4d  %r" % (v, k))

print()
print("== hreflang/canonical per file ==")
def hl(f):
    s = open(os.path.join(ROOT, f), encoding="utf-8", errors="replace").read()
    c = re.search(r'<link rel="canonical" href="([^"]*)"', s)
    h = re.findall(r'<link rel="alternate" hreflang="([^"]+)" href="([^"]*)"', s)
    return (c.group(1) if c else None), h

files = sorted(f for f in os.listdir(ROOT) if f.endswith(".html"))
conflict = []
for f in files:
    c, h = hl(f)
    if not c or not h:
        continue
    cp = c.replace("https://www.ChinaWiFiGo.com", "").replace("https://www.chinawifigo.com", "")
    bad = [(k, v) for k, v in h if v.replace("https://www.ChinaWiFiGo.com", "").replace("https://www.chinawifigo.com", "") != cp]
    if bad:
        conflict.append((f, c, h, bad))
print("files with any hreflang != canonical:", len(conflict))
for f, c, h, bad in conflict:
    print(" ", f, "canon=", c)
    for k, v in h:
        print("      ", k, "->", v)
