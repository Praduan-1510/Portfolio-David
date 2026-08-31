#!/usr/bin/env python3
"""
Re-flow the résumé PDF's PROFESSIONAL SUMMARY and CORE SKILLS paragraphs.

Why: the PDF's title line already reads "PRODUCT DESIGNER (DESIGN + FRONT-END)"
(patch-resume-title.py), but the summary directly beneath it still opened
"UI/UX & Graphic Designer with 5+ years…", and CORE SKILLS still carried the old
broad list with the marketing-tool tail. A document that contradicts its own
headline in the next paragraph is worse than one that was never updated.

This is the hardest of the four patches, because unlike a deletion or an insert
of a known-size block, replacing a wrapped paragraph CHANGES ITS LINE COUNT. So
this one re-wraps text itself: it measures words against the font's own /Widths,
breaks lines greedily at the same measure the document uses, emits the new
lines, and shifts everything below by the difference.

Safe on this file for the reasons the others are, plus one more that was
checked rather than assumed: **the paragraphs are ragged-right, not justified.**
Measured line widths are 495.84 / 531.14 / 537.40 / 332.46 against a 539.85pt
measure — if they were justified they would all equal the measure, and
reproducing inter-word justification would be a different job. Kerning pairs in
the originals are ±1/1000 em and are not reproduced; at 9.5pt that is under
0.01pt per pair.

Run:  python3 scripts/patch-resume-summary.py            (verifies, writes)
      python3 scripts/patch-resume-summary.py --dry-run  (verifies, writes nothing)

Always re-run scripts/verify-resume-pdf.py afterwards.
"""
import re
import sys
import zlib
from pathlib import Path

PDF = Path("public/pdf/Praduan_Saha_Resume.pdf")

LEFT = 36.1
RIGHT = 575.95
MEASURE = RIGHT - LEFT
LEADING = 11.6          # measured: 670.20 → 658.60 → 647.00 → 635.40
SIZE = 9.5

# Each paragraph is identified by a distinctive prefix of its FIRST line, so the
# script fails loudly if the document is not in the state it expects.
REPLACEMENTS = [
    {
        "name": "summary",
        "starts": "UI/UX & Graphic Designer with 5+ years",
        "lines": 4,
        "text": (
            "Product designer and front-end designer with 5+ years, working on operational B2B "
            "software: ledgers, consoles and multi-tenant tools, where trust, state and permissions "
            "are the hard part. I design intuitive web and mobile interfaces, build scalable design "
            "systems, and ship the production front-end for what I design, translating complex GTM "
            "and data-heavy concepts into clean, usable work. Background in instructional design and "
            "content development, and hands-on with Figma, wireframing, and prototyping."
        ),
    },
    {
        "name": "core skills",
        "starts": "UI/UX Design (Web & Mobile)",
        "lines": 3,
        "text": (
            "Product Design: UI/UX design (web & mobile) · Wireframing & user flows · Information "
            "architecture · High-fidelity UI · Interaction design. Design Systems: Component "
            "libraries · Design tokens · Accessibility & usability · Visual design & branding. "
            "Front-End: Front-end development · React & Next.js · Responsive web design · "
            "Motion & interaction."
        ),
    },
    {
        "name": "tools",
        "starts": "Tools: Figma · Canva",
        "lines": 1,
        "text": (
            "Tools: Figma (components & prototyping) · Working HTML/CSS/JS prototypes · "
            "WordPress · HubSpot"
        ),
    },
]

BLOCK = re.compile(rb"/([A-Za-z0-9#]+)<</MCID (\d+)>>BDC\n(.*?)\nEMC\n", re.S)
TD = re.compile(rb"([\d.]+) ([\d.]+) Td /(F\d+) ([\d.]+) Tf")
RULE = re.compile(rb"([\d.]+) ([\d.]+) m\n([\d.]+) ([\d.]+) l S")


def parse_objects(data: bytes) -> dict[int, bytes]:
    return {int(m.group(1)): m.group(2)
            for m in re.finditer(rb"(\d+)\s+0\s+obj(.*?)endobj", data, re.S)}


def stream_bytes(body: bytes) -> tuple[bytes, bytes, bytes]:
    m = re.search(rb"(stream\r?\n)(.*?)(\s*endstream)", body, re.S)
    return body[: m.start(2)], m.group(2), body[m.end(2):]


def parse_cmap(text: str) -> dict[int, str]:
    mp: dict[int, str] = {}
    for blk in re.findall(r"beginbfchar(.*?)endbfchar", text, re.S):
        for a, b in re.findall(r"<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>", blk):
            mp[int(a, 16)] = "".join(chr(int(b[i:i+4], 16)) for i in range(0, len(b), 4))
    for blk in re.findall(r"beginbfrange(.*?)endbfrange", text, re.S):
        for a, b, c in re.findall(r"<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>", blk):
            lo, hi, st = int(a, 16), int(b, 16), int(c, 16)
            for i in range(lo, hi + 1):
                mp[i] = chr(st + i - lo)
    return mp


class Font:
    def __init__(self, objs, num):
        f = objs[num].decode("latin-1")
        self.first = int(re.search(r"/FirstChar\s+(\d+)", f).group(1))
        self.widths = [float(w) for w in re.search(r"/Widths\[([^\]]*)\]", f, re.S).group(1).split()]
        tu = int(re.search(r"/ToUnicode\s+(\d+)\s+0\s+R", f).group(1))
        _, raw, _ = stream_bytes(objs[tu])
        self.cmap = parse_cmap(zlib.decompress(raw).decode("latin-1"))
        self.inv = {v: k for k, v in self.cmap.items()}

    def advance(self, text, size=SIZE):
        return sum(self.widths[self.inv[c] - self.first] for c in text) / 1000.0 * size

    def hexs(self, text):
        return "".join(f"{self.inv[c]:02X}" for c in text).encode()

    def check(self, text, label):
        missing = sorted({c for c in text if c not in self.inv})
        if missing:
            raise SystemExit(f"{label}: font subset has no glyph for {missing}")


def wrap(text: str, font: Font) -> list[str]:
    """Greedy break at the document's own measure — the same algorithm that
    produced the original ragged-right lines."""
    words, lines, cur = text.split(" "), [], ""
    for w in words:
        trial = w if not cur else f"{cur} {w}"
        if font.advance(trial) <= MEASURE:
            cur = trial
        else:
            if not cur:
                raise SystemExit(f"word does not fit the measure: {w!r}")
            lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def main() -> int:
    dry = "--dry-run" in sys.argv
    data = PDF.read_bytes()
    objs = parse_objects(data)
    fdict = dict(re.findall(rb"/(F\d+)\s+(\d+)\s+0\s+R", objs[133]))
    F2 = Font(objs, int(fdict[b"F2"]))

    page1 = int(re.search(r"/Contents\s+(\d+)\s+0\s+R", objs[1].decode("latin-1")).group(1))
    pre, raw, post = stream_bytes(objs[page1])
    content = zlib.decompress(raw)

    blocks = []
    for m in BLOCK.finditer(content):
        td = TD.search(m.group(3))
        txt = ""
        if td and td.group(3) == b"F2":
            after = m.group(3)[td.end():]
            txt = "".join(F2.cmap.get(int(h[i:i+2], 16), "")
                          for h in re.findall(rb"<([0-9A-Fa-f]+)>", after)
                          for i in range(0, len(h.decode()), 2))
        blocks.append({"tag": m.group(1), "mcid": int(m.group(2)), "body": m.group(3),
                       "span": (m.start(), m.end()), "y": float(td.group(2)) if td else None,
                       "text": txt})
    ids = [b["mcid"] for b in blocks]
    if ids != list(range(len(ids))):
        raise SystemExit("page-1 MCIDs are not contiguous; refusing to renumber")

    # Locate each paragraph and pre-compute its replacement lines.
    plan = []
    for rep in REPLACEMENTS:
        hits = [i for i, b in enumerate(blocks) if b["text"].startswith(rep["starts"])]
        if len(hits) != 1:
            raise SystemExit(
                f"{rep['name']}: expected one line starting {rep['starts']!r}, found {len(hits)}. "
                "Already patched?")
        F2.check(rep["text"], rep["name"])
        at = hits[0]
        # The paragraph must be the contiguous run of lines the config declares.
        run = blocks[at: at + rep["lines"]]
        for j in range(1, len(run)):
            gap = round(run[j - 1]["y"] - run[j]["y"], 2)
            if gap != LEADING:
                raise SystemExit(f"{rep['name']}: line {j} gap {gap} != leading {LEADING}")
        new_lines = wrap(rep["text"], F2)
        plan.append({**rep, "at": at, "new_lines": new_lines,
                     "delta_lines": len(new_lines) - rep["lines"], "top_y": run[0]["y"]})
        print(f"{rep['name']:12} {rep['lines']} lines -> {len(new_lines)} "
              f"(widths {' '.join(f'{F2.advance(l):.0f}' for l in new_lines)} / {MEASURE:.0f})")

    total_delta = sum(p["delta_lines"] for p in plan) * LEADING
    print(f"page 1 grows by {total_delta:.1f}pt")

    by_at = {p["at"]: p for p in plan}
    replaced_mcids = {}   # old first-line mcid -> list of new mcids
    skip_until = -1
    out, cursor, next_id, shift = bytearray(), 0, 0, 0.0
    remap = {}
    for i, b in enumerate(blocks):
        start, end = b["span"]
        out += content[cursor:start]
        cursor = end
        if i < skip_until:
            continue
        if i in by_at:
            p = by_at[i]
            skip_until = i + p["lines"]
            first_new = next_id
            for k, line in enumerate(p["new_lines"]):
                y = round(p["top_y"] - shift - k * LEADING, 2)
                out += (b"/%s<</MCID %d>>BDC\nq 0 0 0 rg\nBT\n%s %s Td /F2 9.5 Tf<%s>Tj\nET\nQ\nEMC\n"
                        % (b["tag"], next_id, f"{LEFT:g}".encode(),
                           f"{y:g}".encode(), F2.hexs(line)))
                next_id += 1
            replaced_mcids[b["mcid"]] = (list(range(first_new, next_id)), p["lines"])
            shift += p["delta_lines"] * LEADING
            continue
        body = b["body"]
        if shift:
            def bump(m):
                return b"%s %s Td /%s %s Tf" % (
                    m.group(1), f"{round(float(m.group(2)) - shift, 2):g}".encode(),
                    m.group(3), m.group(4))
            body = TD.sub(bump, body)
        remap[b["mcid"]] = next_id
        out += b"/%s<</MCID %d>>BDC\n" % (b["tag"], next_id) + body + b"\nEMC\n"
        next_id += 1
    out += content[cursor:]
    content_new = bytes(out)

    # Rules under the first change move with the text they underline.
    first_y = max(p["top_y"] for p in plan)

    def move_rule(m):
        y = float(m.group(2))
        if y > first_y:
            return m.group(0)
        # A rule shifts by the growth accumulated ABOVE it.
        d = sum(p["delta_lines"] for p in plan if p["top_y"] > y) * LEADING
        if not d:
            return m.group(0)
        ny = f"{round(y - d, 2):g}".encode()
        return b"%s %s m\n%s %s l S" % (m.group(1), ny, m.group(3), ny)

    content_new = RULE.sub(move_rule, content_new)

    ys = [float(m.group(1)) for m in re.finditer(rb"[\d.]+ ([\d.]+) Td /F", content_new)]
    print(f"page 1 lowest baseline {min(ys)} (bottom margin 36)")
    if min(ys) < 36:
        raise SystemExit("re-flow pushes text under the bottom margin")

    data = repair_struct(data, objs, remap, replaced_mcids)

    new_raw = zlib.compress(content_new, 9)
    length_obj = int(re.search(rb"/Length\s+(\d+)\s+0\s+R", pre).group(1))
    objs2 = parse_objects(data)
    data = data.replace(b"%d 0 obj" % page1 + objs2[page1] + b"endobj",
                        b"%d 0 obj" % page1 + pre + new_raw + post + b"endobj", 1)
    data = data.replace(b"%d 0 obj" % length_obj + objs2[length_obj] + b"endobj",
                        b"%d 0 obj\n%d\nendobj" % (length_obj, len(new_raw)), 1)
    data = rebuild_xref(data)

    if dry:
        print("dry run: nothing written")
        return 0
    PDF.write_bytes(data)
    print(f"wrote {PDF} ({len(data)} bytes)")
    return 0


def repair_struct(data, objs, remap, replaced):
    """Remap page-1 MCIDs, expanding the replaced paragraphs to their new line counts."""
    # old mcid -> new list, for every line of a replaced paragraph.
    expand = {}
    for old_first, (new_ids, n_old) in replaced.items():
        for k in range(n_old):
            expand[old_first + k] = new_ids if k == 0 else []
    order = []   # new mcid -> owning StructElem number, for the ParentTree
    for num, body in objs.items():
        if b"/Type/StructElem" not in body or b"/Pg 1 0 R" not in body:
            continue
        km = re.search(rb"/K\[(.*?)\]", body, re.S)
        if not km:
            continue
        toks = []
        for tok in re.finditer(rb"(\d+)\s+0\s+R|(\d+)", km.group(1)):
            if tok.group(1):
                toks.append(b"%s 0 R" % tok.group(1))
                continue
            v = int(tok.group(2))
            if v in expand:
                for nid in expand[v]:
                    toks.append(b"%d" % nid)
                    order.append((nid, num))
            elif v in remap:
                toks.append(b"%d" % remap[v])
                order.append((remap[v], num))
        new_body = body[: km.start(1)] + b" ".join(toks) + b" " + body[km.end(1):]
        if new_body != body:
            data = data.replace(b"%d 0 obj" % num + body + b"endobj",
                                b"%d 0 obj" % num + new_body + b"endobj", 1)

    pt = int(re.search(rb"/ParentTree (\d+) 0 R", data).group(1))
    ptb = re.search(rb"(?:^|\n)%d 0 obj\n(.*?)\nendobj" % pt, data, re.S).group(1)
    nums = re.search(rb"0 \[(.*?)\]", ptb, re.S)
    entries = [b"%d" % num for _, num in sorted(order)]
    if [nid for nid, _ in sorted(order)] != list(range(len(order))):
        raise SystemExit("structure tree does not cover every new MCID exactly once")
    rows = [b" ".join(b"%s 0 R" % e for e in entries[i:i+10]) for i in range(0, len(entries), 10)]
    new_ptb = ptb[: nums.start(1)] + b"\n".join(rows) + b" " + ptb[nums.end(1):]
    was = len(re.findall(rb"\d+ 0 R", nums.group(1)))
    print(f"partree : page-1 entries {was} -> {len(entries)}")
    return data.replace(b"%d 0 obj\n" % pt + ptb, b"%d 0 obj\n" % pt + new_ptb, 1)


def rebuild_xref(data):
    xm = re.search(rb"\nxref\r?\n0\s+\d+\r?\n", data)
    body_end = xm.start() + 1
    offsets = {int(m.group(1)): m.start()
               for m in re.finditer(rb"(?m)^(\d+)\s+0\s+obj", data[:body_end])}
    size = max(offsets) + 1
    if sorted(offsets) != list(range(1, size)):
        raise SystemExit("object numbering is not contiguous")
    xref = [b"xref\n", b"0 %d\n" % size, b"0000000000 65535 f \n"]
    xref += [b"%010d 00000 n \n" % offsets[i] for i in range(1, size)]
    trailer = re.search(rb"trailer(.*?)>>", data, re.S).group(0)
    trailer = re.sub(rb"/Size\s+\d+", b"/Size %d" % size, trailer)
    return data[:body_end] + b"".join(xref) + trailer + b"\nstartxref\n%d\n%%%%EOF\n" % body_end


if __name__ == "__main__":
    raise SystemExit(main())
