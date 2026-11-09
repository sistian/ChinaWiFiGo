#!/usr/bin/env python3
"""ChinaWiFiGo SEO indexability analyzer (read-only, idempotent)."""
import os, re, sys, json
from collections import defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def html_files():
    return sorted(f for f in os.listdir(ROOT) if f.endswith(".html") and os.path.isfile(os.path.join(ROOT, f)))

def read(f):
    with open(os.path.join(ROOT, f), encoding="utf-8", errors="replace") as fh:
        return fh.read()

def meta(s, name):
    m = re.search(r'<meta\s+name="%s"\s+content="([^"]*)"' % re.escape(name), s, re.I)
    return m.group(1) if m else None

def title(s):
    m = re.search(r"<title>(.*?)</title>", s, re.S | re.I)
    return re.sub(r"\s+", " ", m.group(1)).strip() if m else None

def noindex(s):
    m = re.search(r'<meta\s+name="robots"\s+content="([^"]*)"', s, re.I)
    return bool(m and "noindex" in m.group(1).lower())

def canonical(s):
    m = re.search(r'<link\s+rel="canonical"\s+href="([^"]*)"', s, re.I)
    return m.group(1) if m else None

def hreflangs(s):
    return dict(re.findall(r'<link\s+rel="alternate"\s+hreflang="([^"]+)"\s+href="([^"]*)"', s, re.I))

def analyze():
    files = html_files()
    out = {"total_pages": len(files)}
    titles, descs = defaultdict(list), defaultdict(list)
    missing_canon, missing_canon_idx = [], []
    hreflang_conflicts = []
    noidx = []
    for f in files:
        s = read(f)
        t, d = title(s), meta(s, "description")
        if t: titles[t].append(f)
        if d: descs[d].append(f)
        if noindex(s): noidx.append(f)
        c = canonical(s)
        if not c:
            missing_canon.append(f)
            if not noindex(s): missing_canon_idx.append(f)
        hl = hreflangs(s)
        if c and hl:
            en = hl.get("en"); xd = hl.get("x-default")
            cpath = c.replace("https://www.chinawifigo.com", "").replace("https://www.ChinaWiFiGo.com", "")
            for k, v in hl.items():
                vpath = v.replace("https://www.chinawifigo.com", "").replace("https://www.ChinaWiFiGo.com", "")
                if vpath != cpath:
                    hreflang_conflicts.append({"file": f, "hreflang": k, "href": v, "canonical": c})
                    break
    out["missing_canonical"] = missing_canon
    out["missing_canonical_indexable"] = missing_canon_idx
    out["dup_title_groups"] = [sorted(v) for k, v in titles.items() if len(v) > 1]
    out["dup_desc_groups"] = [sorted(v) for k, v in descs.items() if len(v) > 1]
    out["hreflang_conflicts"] = hreflang_conflicts
    out["noindex_pages"] = noidx

    # inbound links
    inbound = defaultdict(set)
    allhref = re.compile(r'href="([^"#][^"]*?)(?:#[^"]*)?"', re.I)
    for f in files:
        s = read(f)
        for m in allhref.finditer(s):
            href = m.group(1).strip()
            if href.startswith(("http://", "https://", "mailto:", "tel:", "//")): continue
            tgt = os.path.basename(href)
            if tgt and tgt.endswith(".html") and tgt != f:
                inbound[tgt].add(f)
    out["inbound_counts"] = {k: len(v) for k, v in inbound.items()}
    cities = [f for f in files if f.startswith("city-")]
    out["city_pages"] = len(cities)
    out["city_pages_zero_inbound"] = sorted([c for c in cities if not inbound.get(c)])

    # static city links in cities.html / index.html (source-level, excluding JS template strings)
    def static_city_links(f):
        s = read(f)
        # strip <script> blocks
        s2 = re.sub(r"<script\b.*?</script>", "", s, flags=re.S | re.I)
        return set(re.findall(r'href="(city-[a-z0-9-]+\.html)"', s2))
    out["cities_html_static_city_links"] = len(static_city_links("cities.html"))
    out["index_html_static_city_links"] = len(static_city_links("index.html"))

    sp = os.path.join(ROOT, "sitemap.xml")
    if os.path.exists(sp):
        with open(sp, encoding="utf-8", errors="replace") as fh:
            sx = fh.read()
        out["sitemap_urls"] = len(re.findall(r"<loc>", sx))
        out["sitemap_city_urls"] = len(re.findall(r"<loc>[^<]*city-[^<]*</loc>", sx))
        out["sitemap_uppercase_host"] = len(re.findall(r"ChinaWiFiGo\.com", sx))
    # uppercase host occurrences site-wide
    upper = 0
    for f in os.listdir(ROOT):
        p = os.path.join(ROOT, f)
        if os.path.isfile(p) and f.rsplit(".", 1)[-1] in ("html", "xml", "txt", "js", "json", "md"):
            with open(p, encoding="utf-8", errors="replace") as fh:
                upper += len(re.findall(r"ChinaWiFiGo\.com", fh.read()))
    out["uppercase_host_occurrences"] = upper
    return out

if __name__ == "__main__":
    r = analyze()
    mode = sys.argv[1] if len(sys.argv) > 1 else "counts"
    if mode == "report":
        print(json.dumps({k: v for k, v in r.items() if k != "inbound_counts"}, indent=1, ensure_ascii=False))
    else:
        print("total_pages", r["total_pages"])
        print("missing_canonical", len(r["missing_canonical"]))
        print("missing_canonical_indexable", len(r["missing_canonical_indexable"]))
        print("dup_title_groups", len(r["dup_title_groups"]))
        print("dup_desc_groups", len(r["dup_desc_groups"]))
        print("hreflang_conflicts", len(r["hreflang_conflicts"]))
        print("city_pages", r["city_pages"])
        print("city_pages_zero_inbound", len(r["city_pages_zero_inbound"]))
        print("cities_html_static_city_links", r["cities_html_static_city_links"])
        print("index_html_static_city_links", r["index_html_static_city_links"])
        print("sitemap_urls", r["sitemap_urls"])
        print("sitemap_city_urls", r["sitemap_city_urls"])
        print("uppercase_host_occurrences", r["uppercase_host_occurrences"])
        for c in r["hreflang_conflicts"][:40]:
            print("  HL CONFLICT:", c["file"], c["hreflang"], c["href"])
