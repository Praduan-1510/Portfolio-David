#!/usr/bin/env python3
"""
Locate every em dash (U+2014) in the repo and classify it as CONTENT or COMMENT.

The distinction is the whole point: this codebase comments heavily, and those
em dashes are prose written for developers, not copy a visitor ever reads.
Replacing them would churn hundreds of lines for no user-visible effect. So each
occurrence is bucketed by stripping the comment syntax for its file type first:

  .ts/.tsx : // line and /* */ block comments removed; what remains is a string
              literal or a JSX text node, i.e. copy that ships
  .css     : /* */ removed (this file is comment-only prose)
  .html    : <!-- --> removed
  .mdx     : frontmatter + body are content; {/* */} is the one comment form
  .md      : docs/, internal writing, reported separately and never "site copy"

Usage:
  python3 scripts/find-em-dashes.py             # summary by bucket
  python3 scripts/find-em-dashes.py --list      # every content hit with context
  python3 scripts/find-em-dashes.py --list src/content   # limit to a subtree
"""
import re
import subprocess
import sys
from pathlib import Path

EM = "—"


def strip_ranges(text: str, spans: list[tuple[int, int]]) -> str:
    """Blank out spans, preserving length and newlines so line numbers survive."""
    chars = list(text)
    for a, b in spans:
        for i in range(a, min(b, len(chars))):
            if chars[i] != "\n":
                chars[i] = " "
    return "".join(chars)


def comment_spans(path: Path, text: str) -> list[tuple[int, int]]:
    ext = path.suffix
    spans: list[tuple[int, int]] = []
    if ext in (".ts", ".tsx", ".mjs", ".js"):
        for m in re.finditer(r"/\*.*?\*/", text, re.S):
            spans.append(m.span())
        # Line comments, but not the // inside a URL ("https://").
        for m in re.finditer(r"(?m)(^|[^:])//.*$", text):
            spans.append((m.start() + len(m.group(1)), m.end()))
    elif ext == ".css":
        for m in re.finditer(r"/\*.*?\*/", text, re.S):
            spans.append(m.span())
    elif ext in (".html", ".md", ".mdx"):
        for m in re.finditer(r"<!--.*?-->", text, re.S):
            spans.append(m.span())
        if ext == ".mdx":
            for m in re.finditer(r"\{/\*.*?\*/\}", text, re.S):
                spans.append(m.span())
    elif ext == ".py":
        for m in re.finditer(r"(?m)#.*$", text):
            spans.append(m.span())
        for m in re.finditer(r'""".*?"""', text, re.S):
            spans.append(m.span())
    return spans


def bucket(path: Path) -> str:
    p = str(path)
    if p.startswith("docs/"):
        return "docs (internal writing, not site copy)"
    if p.startswith("public/prototype/"):
        return "prototype HTML (read inside the demo iframe)"
    if p.startswith("scripts/"):
        return "scripts (tooling)"
    if p.startswith("src/content/"):
        return "case-study MDX (site copy)"
    if p.startswith("src/"):
        return "app + components (site copy)"
    return "other"


files = subprocess.run(
    ["git", "ls-files"], capture_output=True, text=True, check=True
).stdout.split("\n")

want_list = "--list" in sys.argv
limit = None
for a in sys.argv[1:]:
    if not a.startswith("--"):
        limit = a

buckets: dict[str, dict[str, int]] = {}
content_hits: list[tuple[str, int, str]] = []

for f in files:
    if not f:
        continue
    path = Path(f)
    if path.suffix not in (".ts", ".tsx", ".mjs", ".js", ".css", ".html", ".md", ".mdx", ".py", ".json"):
        continue
    try:
        text = path.read_text(encoding="utf-8")
    except (UnicodeDecodeError, FileNotFoundError):
        continue
    if EM not in text:
        continue

    stripped = strip_ranges(text, comment_spans(path, text))
    total = text.count(EM)
    in_content = stripped.count(EM)
    b = bucket(path)
    rec = buckets.setdefault(b, {"content": 0, "comment": 0, "files": 0})
    rec["content"] += in_content
    rec["comment"] += total - in_content
    if in_content:
        rec["files"] += 1

    if in_content and (limit is None or f.startswith(limit)):
        for i, line in enumerate(stripped.split("\n"), 1):
            if EM in line:
                real = text.split("\n")[i - 1]
                content_hits.append((f, i, real.strip()))

print(f"{'bucket':<46} {'content':>8} {'comment':>8}  files")
print("-" * 76)
tc = tk = 0
for b in sorted(buckets, key=lambda k: -buckets[k]["content"]):
    r = buckets[b]
    tc += r["content"]
    tk += r["comment"]
    print(f"{b:<46} {r['content']:>8} {r['comment']:>8}  {r['files']}")
print("-" * 76)
print(f"{'TOTAL':<46} {tc:>8} {tk:>8}")

if want_list:
    print(f"\n=== content occurrences{' under ' + limit if limit else ''} ===")
    cur = None
    for f, ln, line in content_hits:
        if f != cur:
            print(f"\n{f}")
            cur = f
        print(f"  {ln:>4}: {line[:150]}")
    print(f"\n{len(content_hits)} line(s)")
