#!/usr/bin/env python3
"""
Replace every em dash (U+2014) in the repo with correct alternative punctuation.

An em dash is not a character you can find-and-replace: it does four different
grammatical jobs here, and each wants different punctuation. Swapping them all
for "-" would read worse than leaving them. So each occurrence is classified:

  PAIRED, bracketing an aside      A — b, c — D   ->  A (b, c) D   [parens when
                                                      the aside has commas, so
                                                      the commas don't collide]
                                   A — b — D      ->  A, b, D
  SINGLE, introducing a list or
  a restatement                    X — a, b and c ->  X: a, b and c
  SINGLE, before an independent
  clause                           X — it does Y  ->  X; it does Y
  SINGLE, short trailing tag       X — not Y      ->  X, not Y
  NIL MARKER in a data table       <td>—</td>     ->  <td>–</td>   [en dash: the
                                                      cell means "no value", so
                                                      punctuation would be wrong]

En dashes (–, ranges like 2018–2021) and minus signs (−) are left alone: neither
is an em dash.

  python3 scripts/strip-em-dashes.py --dry-run          # report, change nothing
  python3 scripts/strip-em-dashes.py --dry-run --only src/content
  python3 scripts/strip-em-dashes.py --apply
"""
import re
import subprocess
import sys
from pathlib import Path

EM = "—"
EN = "–"

# Files where an em dash is DATA, not prose, and a substitution would corrupt it.
# All four are edited by hand instead:
#   strip-em-dashes.py / find-em-dashes.py  the EM = "—" constant, and docstrings
#                                           whose whole subject is the character
#   FlapText.tsx                            "—" is a glyph in the split-flap
#                                           flutter charset, not punctuation
#   typography.ts                           a regex that MATCHES em dashes; the
#                                           function exists only to stop them
#                                           dangling in titles
SKIP_FILES = {
    "package-lock.json",
    "strip-em-dashes.py",
    "find-em-dashes.py",
    "FlapText.tsx",
    "typography.ts",
}
EXTS = {".ts", ".tsx", ".mjs", ".js", ".css", ".html", ".md", ".mdx", ".py", ".json", ".example"}

# A tail that starts with one of these is a qualifier, not a new clause.
TAG_STARTS = re.compile(
    r"^(not|no|never|just|only|and|but|or|so|yet|then|plus|minus|without|with|for|from|"
    r"including|often|always|usually|mostly|still|even|about|roughly|around|nearly)\b",
    re.I,
)
# A tail that looks like a full independent clause wants a semicolon.
CLAUSE_START = re.compile(
    r"^(it|they|he|she|we|i|you|that|this|there|these|those|its|their|his|her|our|your|"
    r"the|a|an)\s+\S+\s+(is|are|was|were|has|have|had|does|do|did|will|would|can|could|"
    r"should|must|may|might|gets|got|keeps|kept|makes|made|takes|took|goes|went|comes|came|"
    r"needs|needed|lets|let|stays|stayed|sits|sat|runs|ran|reads|read|carries|carried)\b",
    re.I,
)
SHORT_CLAUSE = re.compile(
    r"^(it|they|he|she|we|i|you|there|that|this)\s+(is|are|was|were|has|have|had|does|do|"
    r"did|will|would|can|could|should|must|may|might)\b",
    re.I,
)
# A tail opening with a participle continues the preceding clause rather than
# restating it: "…across GTM assets: earning a conversion" is one sentence with
# a trailing participial phrase, so it takes a comma. A colon there ("assets:
# earning a conversion") reads as an announcement of something that never comes.
PARTICIPLE_START = re.compile(r"^\w+ing\b", re.I)
# Words that look like participles but are ordinary nouns/adjectives here.
NOT_PARTICIPLE = re.compile(
    r"^(nothing|something|anything|everything|during|thing|things|string|strings|"
    r"spring|bring|king|ring|wing|being|ceiling|building|meaning|morning|evening|"
    r"heading|landing|listing|setting|settings|rating|ratings|writing|drawing)\b",
    re.I,
)


def norm(text: str) -> str:
    """Strip line-leading comment furniture so a sentence that wraps across
    comment lines still reads as one sentence when we look for its boundaries."""
    return re.sub(r"(?m)^[ \t]*(\*|//|#|>|-)[ \t]?", lambda m: " " * len(m.group(0)), text)


def sentence_bounds(flat: str, i: int) -> tuple[int, int]:
    """Rough sentence containing offset i, in the normalised text."""
    start = 0
    for m in re.finditer(r"[.!?:;][\s\"')\]]|\n\s*\n", flat[:i]):
        start = m.end()
    end = len(flat)
    m = re.search(r"[.!?][\s\"')\]]|\n\s*\n", flat[i:])
    if m:
        end = i + m.start() + 1
    return start, end


def is_nil_marker(text: str, i: int) -> bool:
    """A lone em dash standing in for 'no value' in a table cell or label."""
    before = text[max(0, i - 40) : i]
    after = text[i + 1 : i + 40]
    return bool(re.search(r"(>|\|)\s*$", before) and re.match(r"\s*(<|\|)", after))


def classify(text: str, i: int) -> tuple[str, str]:
    """Return (replacement_for_this_dash, reason)."""
    if is_nil_marker(text, i):
        return EN, "nil marker"

    flat = norm(text)
    s, e = sentence_bounds(flat, i)
    sentence = flat[s:e]
    rel = i - s
    dashes = [m.start() for m in re.finditer(EM, sentence)]

    tail_raw = sentence[rel + 1 :]
    tail = tail_raw.strip()

    # --- paired: this dash and one more in the same sentence bracket an aside ---
    if len(dashes) == 2:
        a, b = dashes
        inner = sentence[a + 1 : b].strip()
        after_close = sentence[b + 1 :].strip()
        # Only a true bracket if the sentence continues after the closing dash.
        if after_close and len(inner) < 120:
            if "," not in inner:
                return (",", "paired open" if rel == a else "paired close")
            if rel == a:
                return "(", "paired open"
            # Closing a parenthesis: the aside interrupted the sentence, so what
            # follows normally resumes it and needs no comma ("screens (a, b, c)
            # sit on navy"). A participle is the exception: it starts a new
            # phrase and the sentence needs the comma the dash was supplying
            # ("courses (a, b, c), partnering with SMEs").
            if PARTICIPLE_START.match(after_close) and not NOT_PARTICIPLE.match(after_close):
                return "),", "paired close + comma"
            return ")", "paired close"

    # --- single ---
    if not tail:
        return ".", "trailing"

    # A list or an enumeration being introduced -> colon.
    if ("," in tail and " and " in tail) or re.match(r"^\w+(,\s*\w+){2,}", tail):
        if not SHORT_CLAUSE.match(tail):
            return ":", "introduces a list"

    if TAG_STARTS.match(tail):
        return ",", "qualifier"

    # Trailing participial phrase: continues the clause, so a comma.
    if PARTICIPLE_START.match(tail) and not NOT_PARTICIPLE.match(tail):
        return ",", "participial phrase"

    if CLAUSE_START.match(tail) and len(tail.split()) > 4:
        return ";", "independent clause"

    # Restatement / definition of what precedes.
    head = sentence[:rel].strip()
    if head and len(tail.split()) >= 3 and not SHORT_CLAUSE.match(tail):
        return ":", "restatement"

    return ",", "default"


def quote_yaml_scalars(text: str) -> str:
    """Re-quote frontmatter values that now contain a colon.

    `title: Decathlon: App Redesign` is not valid YAML: gray-matter either
    throws or silently truncates, which would take every case study down. Any
    unquoted scalar that gained a ": " has to be wrapped. Runs AFTER the
    replacement pass, over the frontmatter block only.
    """
    m = re.match(r"(?s)^(---\n)(.*?)(\n---\n)", text)
    if not m:
        return text
    head, body, tail = m.groups()

    def fix(line: str) -> str:
        km = re.match(r"^(\s*(?:- )?[A-Za-z_][\w.-]*:\s+)(.*)$", line)
        if not km:
            return line
        key, val = km.groups()
        v = val.strip()
        if not v or v[0] in "\"'|>[{#&*!" or ": " not in v:
            return line
        # A trailing YAML comment must stay outside the quotes.
        comment = ""
        cm = re.search(r"\s+#\s.*$", v)
        if cm:
            comment, v = cm.group(0), v[: cm.start()].rstrip()
        return f'{key}"{v.replace(chr(34), chr(92) + chr(34))}"{comment}'

    return head + "\n".join(fix(l) for l in body.split("\n")) + tail + text[m.end() :]


def transform(text: str) -> tuple[str, list[tuple[str, str, str]]]:
    out = []
    notes = []
    i = 0
    while True:
        j = text.find(EM, i)
        if j == -1:
            out.append(text[i:])
            break
        rep, reason = classify(text, j)
        ctx_a = text[max(0, j - 60) : j].split("\n")[-1]
        ctx_b = text[j + 1 : j + 60].split("\n")[0]

        # A spaced em dash carries its own spaces; the replacement must not.
        # "a — b" -> "a, b" (space before the dash is dropped), except for an
        # opening parenthesis, where the space belongs in front of it instead.
        k = len(out)
        out.append(text[i:j])
        seg = out[k]
        if rep == "(":
            out[k] = seg.rstrip(" \t") + " ("
            i = j + 1
            while i < len(text) and text[i] in " \t":
                i += 1
        elif rep == ")":
            out[k] = seg.rstrip(" \t") + ")"
            i = j + 1
        else:
            out[k] = seg.rstrip(" \t") + rep
            i = j + 1
        notes.append((reason, ctx_a + EM + ctx_b, rep))
    return "".join(out), notes


def transform_file(path: Path, text: str) -> tuple[str, list[tuple[str, str, str]]]:
    new, notes = transform(text)
    if path.suffix == ".mdx":
        new = quote_yaml_scalars(new)
    return new, notes


def main() -> int:
    apply = "--apply" in sys.argv
    only = None
    for a in sys.argv[1:]:
        if a.startswith("--only"):
            continue
    if "--only" in sys.argv:
        only = sys.argv[sys.argv.index("--only") + 1]

    files = subprocess.run(["git", "ls-files"], capture_output=True, text=True, check=True).stdout.split("\n")
    total = 0
    by_reason: dict[str, int] = {}
    changed_files = 0

    for f in files:
        if not f or Path(f).name in SKIP_FILES:
            continue
        p = Path(f)
        if p.suffix not in EXTS:
            continue
        if only and not f.startswith(only):
            continue
        try:
            text = p.read_text(encoding="utf-8")
        except (UnicodeDecodeError, FileNotFoundError):
            continue
        if EM not in text:
            continue

        new, notes = transform_file(p, text)
        if new == text:
            continue
        changed_files += 1
        total += len(notes)
        for reason, _, _ in notes:
            by_reason[reason] = by_reason.get(reason, 0) + 1
        if apply:
            p.write_text(new, encoding="utf-8")

    print(f"{'reason':<24} count")
    print("-" * 32)
    for r in sorted(by_reason, key=lambda k: -by_reason[k]):
        print(f"{r:<24} {by_reason[r]}")
    print("-" * 32)
    print(f"{'TOTAL':<24} {total}  across {changed_files} files")
    print("APPLIED" if apply else "dry run: nothing written")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
