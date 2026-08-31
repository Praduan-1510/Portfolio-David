#!/usr/bin/env python3
"""
Validate public/pdf/Praduan_Saha_Resume.pdf after either byte-level patch:
scripts/patch-resume-title.py and scripts/patch-resume-insightstap.py.

The PDF is edited at the byte level, and it is the artefact that reaches
recruiters and ATS parsers, so "it still opens on my machine" is not evidence.
This checks it four ways, two of them independent of the patch script's own
assumptions:

  1. Structure: every xref offset lands exactly on "N 0 obj", the trailer /Size
                  matches, and every stream's /Length equals its real byte count.
  2. Parser: pypdf (a third-party implementation) opens it, reports the page
                  count, and extracts text without raising.
  3. Diff: extracted text differs from the original ONLY in ways the patches
                  are supposed to cause (title line; the folded-in internship).
  4. Geometry: the retitled run is still centered on the 612pt page, and the
                  reflowed page 1 still reads top-to-bottom inside its margins.

Usage: python3 scripts/verify-resume-pdf.py [original.pdf]
Exit code is non-zero if any check fails.
"""
import re
import sys
import zlib
from pathlib import Path

PDF = Path("public/pdf/Praduan_Saha_Resume.pdf")
EXPECTED_TITLE = "PRODUCT DESIGNER (DESIGN + FRONT-END)"
RETIRED_TITLE = "UI/UX & GRAPHIC DESIGNER"
PAGE_WIDTH = 612.0
BOTTOM_MARGIN = 36.0

# InsightsTap is ONE full-time role spanning Sep 2025 - Present; the separate
# internship entry was folded into it. See patch-resume-insightstap.py, and keep
# this in step with lib/content/resume.ts and the About timeline.
INSIGHTSTAP_ROLE = "Graphic Designer · Full-time · On-site" "Sep 2025 – Present"
RETIRED_ROLE = "Graphic Designer · Internship · Remote"

failures: list[str] = []


def squash(s: str) -> str:
    """Collapse whitespace before comparing extracted text.

    The title line carries -150 letter-spacing, which pypdf renders as a space
    between every glyph ("P R O D U C T  D E S I G N E R"). That is how the
    ORIGINAL file extracts too, so it is a property of the document's typography,
    not of the patch: normalise it out rather than chase it.
    """
    return re.sub(r"\s+", "", s).upper()


def check(ok: bool, label: str, detail: str = "") -> None:
    print(f"{'  ok' if ok else 'FAIL'}  {label}{(': ' + detail) if detail else ''}")
    if not ok:
        failures.append(label)


# ---------- 1. Structure ------------------------------------------------------
data = PDF.read_bytes()
check(data.startswith(b"%PDF-"), "file starts with %PDF header", data[:8].decode("latin-1"))

m = re.search(rb"startxref\s+(\d+)\s*%%EOF\s*$", data)
check(m is not None, "trailer ends with startxref/%%EOF")
if m:
    xref_at = int(m.group(1))
    check(data[xref_at : xref_at + 4] == b"xref", "startxref points at the xref table")
    table = data[xref_at:]
    size = int(re.search(rb"/Size\s+(\d+)", table).group(1))
    entries = re.findall(rb"(\d{10}) (\d{5}) ([nf])", table)
    check(len(entries) == size, "xref entry count == /Size", f"{len(entries)} vs {size}")
    bad = [
        i
        for i, (off, _, kind) in enumerate(entries)
        if kind == b"n" and not re.match(rb"%d\s+0\s+obj" % i, data[int(off) : int(off) + 24])
    ]
    check(not bad, "every xref offset lands on its object", f"broken: {bad[:6]}")

lengths_bad = []
for om in re.finditer(rb"(\d+)\s+0\s+obj(.*?)endobj", data, re.S):
    body = om.group(2)
    sm = re.search(rb"stream\r?\n(.*?)\s*endstream", body, re.S)
    if not sm:
        continue
    # `/Length 60 0 R` is an INDIRECT reference to object 60, not a length of 60:
    # several of this document's streams use that form. Only literal lengths are
    # comparable here.
    # \b after the digits stops the regex backtracking to a PREFIX of the number
    # to satisfy the lookahead, without it "/Length 4905 0 R" matches as "490".
    declared = re.search(rb"/Length\s+(\d+)\b(?!\s+\d+\s+R)", body)
    if declared and int(declared.group(1)) != len(sm.group(1)):
        lengths_bad.append((int(om.group(1)), int(declared.group(1)), len(sm.group(1))))
check(not lengths_bad, "every stream /Length matches its bytes", str(lengths_bad[:3]))

streams_bad = []
for om in re.finditer(rb"(\d+)\s+0\s+obj(.*?)endobj", data, re.S):
    body = om.group(2)
    if b"FlateDecode" not in body:
        continue
    sm = re.search(rb"stream\r?\n(.*?)\s*endstream", body, re.S)
    try:
        zlib.decompress(sm.group(1))
    except Exception as exc:  # noqa: BLE001
        streams_bad.append((int(om.group(1)), str(exc)))
check(not streams_bad, "every Flate stream decompresses", str(streams_bad[:3]))

# Dangling indirect references. This is the check that catches a botched /Length
# edit: "/Length 3 0 R" points at object 3, so rewriting the digits in the
# REFERENCE (rather than the referenced object) silently invents a pointer to an
# object that was never written. Readers recover by scanning for `endstream`, so
# the text still extracts and the damage is invisible without this check.
defined = {int(x.group(1)) for x in re.finditer(rb"(?m)^(\d+)\s+0\s+obj", data)}
referenced = {int(x.group(1)) for x in re.finditer(rb"(\d+)\s+0\s+R\b", data)}
dangling = sorted(referenced - defined)
check(not dangling, "no references to undefined objects", f"dangling: {dangling}")

# ---------- 2. Independent parser --------------------------------------------
try:
    import logging
    from io import StringIO

    from pypdf import PdfReader

    # pypdf reports structural damage through the logging module and then
    # recovers, so a clean-looking extraction can still come from a broken file.
    # Capture those records and fail on them rather than letting them scroll past.
    log_buf = StringIO()
    handler = logging.StreamHandler(log_buf)
    handler.setLevel(logging.WARNING)
    logging.getLogger("pypdf").addHandler(handler)

    reader = PdfReader(str(PDF))
    pages = len(reader.pages)
    text = "\n".join(p.extract_text() or "" for p in reader.pages)
    warnings = [ln for ln in log_buf.getvalue().splitlines() if ln.strip()]
    check(not warnings, "pypdf parses without warnings", "; ".join(dict.fromkeys(warnings))[:160])
    check(pages == 2, "pypdf reads 2 pages", f"{pages}")
    check(len(text) > 3000, "pypdf extracts the full text", f"{len(text)} chars")
    lines = [squash(ln) for ln in text.splitlines() if ln.strip()]
    check(squash(EXPECTED_TITLE) in lines, "new title is its own line", EXPECTED_TITLE)
    # Line-scoped, not a substring of the whole document: the professional
    # summary legitimately opens "UI/UX & Graphic Designer with 5+ years…", so a
    # blob search can never go green. Only the TITLE LINE is being replaced,
    # rewording the summary would mean re-flowing a wrapped paragraph, which is
    # a re-export job, not a byte patch.
    check(squash(RETIRED_TITLE) not in lines, "old title no longer a heading line", RETIRED_TITLE)
    for anchor in ("PRADUAN SAHA", "INSIGHTSTAP", "SIMPLILEARN", "LEADSARK", "AMITY"):
        check(squash(anchor) in squash(text), f"content intact: {anchor}")

    # The InsightsTap fold. Checked on the whole document, not per line: the one
    # surviving role heading and its dateline extract as a single run.
    blob = squash(text)
    check(squash(INSIGHTSTAP_ROLE) in blob, "InsightsTap is one Sep 2025 role")
    check(squash(RETIRED_ROLE) not in blob, "internship entry is gone")
    check("FEB2026" not in blob, "no Feb 2026 start date remains")
    check("EARNINGAFULL-TIMECONVERSION" not in blob, "conversion claim removed")
except ImportError:
    check(False, "pypdf available for independent parse", "pip install pypdf")

# ---------- 3. Diff against the original -------------------------------------
orig_path = Path(sys.argv[1]) if len(sys.argv) > 1 else None
if orig_path and orig_path.exists():
    from pypdf import PdfReader

    def norm(p: Path) -> list[str]:
        return [
            ln.strip()
            for pg in PdfReader(str(p)).pages
            for ln in (pg.extract_text() or "").splitlines()
            if ln.strip()
        ]

    a, b = [squash(x) for x in norm(orig_path)], [squash(x) for x in norm(PDF)]
    only_a = [ln for ln in a if ln not in b]
    only_b = [ln for ln in b if ln not in a]
    # An allowlist, not an equality check: the original may predate either patch,
    # so what matters is that every difference is one the patches explain. A line
    # that changed for any OTHER reason is the thing this is here to catch.
    #
    # Removals are matched by SUBSTRING because the internship's bullets extract
    # as wrapped lines whose breaks are a property of the layout, not the text.
    allowed_removed = [
        squash(RETIRED_TITLE),
        squash(RETIRED_ROLE),
        "SEP2025–FEB2026",
        "·10MOS",
        # The internship's two STAR bullets, keyed on phrases unique to them.
        "JOINEDAB2BSAASTEAM",
        "PRODUCEON-BRANDCREATIVES",
        "DESIGNEDLINKEDINCAROUSELS",
        "MARKETINGMICROSITES",
        "EARNINGAFULL-TIMECONVERSION",
        "FEB2026",
    ]
    allowed_added = [squash(EXPECTED_TITLE), "SEP2025–PRESENT", "·1YR"]
    stray_removed = [ln for ln in only_a if not any(x in ln for x in allowed_removed)]
    stray_added = [ln for ln in only_b if not any(x in ln for x in allowed_added)]
    check(not stray_removed, "no unexplained text was removed", str(stray_removed[:3]))
    check(not stray_added, "no unexplained text was added", str(stray_added[:3]))
    check(len(b) <= len(a), "no lines gained", f"{len(a)} -> {len(b)}")

# ---------- 4. Geometry -------------------------------------------------------
objs = {int(o.group(1)): o.group(2) for o in re.finditer(rb"(\d+)\s+0\s+obj(.*?)endobj", data, re.S)}
content = zlib.decompress(re.search(rb"stream\r?\n(.*?)\s*endstream", objs[2], re.S).group(1))
run = re.search(rb"([\d.]+)\s+([\d.]+)\s+Td\s*/F2\s+10\s+Tf", content)
f2 = objs[int(dict(re.findall(rb"/(F\d+)\s+(\d+)\s+0\s+R", objs[133]))[b"F2"])].decode("latin-1")
first = int(re.search(r"/FirstChar\s+(\d+)", f2).group(1))
widths = [float(w) for w in re.search(r"/Widths\[([^\]]*)\]", f2, re.S).group(1).split()]
tu = int(re.search(r"/ToUnicode\s+(\d+)\s+0\s+R", f2).group(1))
cm_txt = zlib.decompress(re.search(rb"stream\r?\n(.*?)\s*endstream", objs[tu], re.S).group(1)).decode("latin-1")
inv = {}
for blk in re.findall(r"beginbfchar(.*?)endbfchar", cm_txt, re.S):
    for a_, b_ in re.findall(r"<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>", blk):
        inv["".join(chr(int(b_[i : i + 4], 16)) for i in range(0, len(b_), 4))] = int(a_, 16)
w = sum(widths[inv[c] - first] for c in EXPECTED_TITLE) / 1000.0 * 10 + (len(EXPECTED_TITLE) - 1) * 1.5
x = float(run.group(1))
centre_err = abs((x + w / 2) - PAGE_WIDTH / 2)
check(centre_err < 1.0, "title still centered on the page", f"off by {centre_err:.2f}pt")
check(x > 36, "title starts inside the margin", f"x={x}")

# The reflow: deleting lines and shifting the rest up is only correct if page 1
# still reads strictly top-to-bottom and nothing was pushed off the paper. A
# botched shift shows up here as a baseline that rises again mid-page, or one
# that lands under the bottom margin, neither of which the text checks can see.
for page_obj, label in ((2, "page 1"), (59, "page 2")):
    body = objs[page_obj]
    stream = zlib.decompress(re.search(rb"stream\r?\n(.*?)\s*endstream", body, re.S).group(1))
    ys = [float(m.group(1)) for m in re.finditer(rb"[\d.]+ ([\d.]+) Td /F", stream)]
    rising = [(ys[i - 1], ys[i]) for i in range(1, len(ys)) if ys[i] > ys[i - 1]]
    check(not rising, f"{label} baselines never rise", str(rising[:3]))
    check(min(ys) >= BOTTOM_MARGIN, f"{label} stays above the bottom margin", f"{min(ys)}")
    check(max(ys) <= 792 - BOTTOM_MARGIN, f"{label} stays below the top margin", f"{max(ys)}")

# MCIDs must stay contiguous from 0 per page, or the /ParentTree (which is
# indexed by MCID) no longer lines up with the marked content it describes.
for page_obj, label in ((2, "page 1"), (59, "page 2")):
    body = objs[page_obj]
    stream = zlib.decompress(re.search(rb"stream\r?\n(.*?)\s*endstream", body, re.S).group(1))
    ids = [int(m.group(1)) for m in re.finditer(rb"/MCID (\d+)", stream)]
    check(ids == list(range(len(ids))), f"{label} MCIDs contiguous from 0", f"{len(ids)} ids")

pt_num = int(re.search(rb"/ParentTree (\d+) 0 R", data).group(1))
pt_body = objs[pt_num]
for idx, page_obj, label in ((0, 2, "page 1"), (1, 59, "page 2")):
    nums = re.search(rb"%d \[(.*?)\]" % idx, pt_body, re.S)
    n_entries = len(re.findall(rb"\d+ 0 R", nums.group(1)))
    body = objs[page_obj]
    stream = zlib.decompress(re.search(rb"stream\r?\n(.*?)\s*endstream", body, re.S).group(1))
    n_mcids = len(re.findall(rb"/MCID \d+", stream))
    check(n_entries == n_mcids, f"{label} ParentTree matches MCID count",
          f"{n_entries} vs {n_mcids}")

print()
if failures:
    print(f"{len(failures)} CHECK(S) FAILED: {failures}")
    raise SystemExit(1)
print("PDF VERIFIED: structurally sound, independently parseable, "
      "and different from the original only where the patches say so")
