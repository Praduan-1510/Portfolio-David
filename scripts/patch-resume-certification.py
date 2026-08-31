#!/usr/bin/env python3
"""
Insert the Google UX Design certificate into the résumé PDF's CERTIFICATIONS list.

Companion to patch-resume-title.py and patch-resume-insightstap.py, and safe for
the same checked reasons: a classic xref table, one marked-content block per
visual line with an absolute Td, and no font re-embedding.

An INSERT is the harder direction: unlike the internship deletion, this adds
marked content, adds structure elements, adds objects, and pushes drawn rules
down the page. Everything it derives, it derives from the document rather than
from taste:

  * Entry geometry: certification entries are spaced a uniform 28.8pt, with the
    issuer line 12.2pt under the title. Both are measured off the existing list.
  * The date's x position is a TAB STOP: the next multiple of 36 past the end of
    the title. That rule reproduces all seven existing datelines exactly, so the
    new one is placed by the same rule and not by eye.
  * The note's x is the issuer's rendered width, computed from the font's own
    /Widths. The same computation reproduces the existing note offsets to 0.02pt.

WHAT IS OMITTED, and why: the LinkedIn credential ID (IJH8K4U6YXZ3) is NOT in
the PDF. The embedded Carlito subsets carry no glyphs for "3", "4", "Y" or "Z"
in any weight, so those characters cannot be drawn without re-embedding a font,
which is a re-export job. No other certificate in this document prints an ID
either, so the omission is consistent with the list rather than a gap in it.
The note text is likewise written within the subset: no apostrophe glyph exists,
so "Google's" cannot be set and the note is phrased around it.

Run:  python3 scripts/patch-resume-certification.py            (verifies, writes)
      python3 scripts/patch-resume-certification.py --dry-run  (verifies, writes nothing)

Always re-run scripts/verify-resume-pdf.py afterwards.
"""
import re
import sys
import zlib
from pathlib import Path

PDF = Path("public/pdf/Praduan_Saha_Resume.pdf")

TITLE = "Google UX Design"
DATE = "Aug 2026"
ISSUER = "Google"
NOTE = " · 8-course UX Design Professional Certificate — user research, wireframing, prototyping, and usability studies."

# The entry this one is inserted directly above (the list's current first).
ANCHOR = "Graphic Design"
TAB = 36.0          # tab-stop pitch, verified against all seven existing rows
LEFT = 36.1         # left margin the list sets its titles on

BLOCK = re.compile(rb"/([A-Za-z0-9#]+)<</MCID (\d+)>>BDC\n(.*?)\nEMC\n", re.S)
TD = re.compile(rb"([\d.]+) ([\d.]+) Td /(F\d+) ([\d.]+) Tf")
RULE = re.compile(rb"([\d.]+) ([\d.]+) m\n([\d.]+) ([\d.]+) l S")


def parse_objects(data: bytes) -> dict[int, bytes]:
    return {
        int(m.group(1)): m.group(2)
        for m in re.finditer(rb"(\d+)\s+0\s+obj(.*?)endobj", data, re.S)
    }


def stream_bytes(body: bytes) -> tuple[bytes, bytes, bytes]:
    m = re.search(rb"(stream\r?\n)(.*?)(\s*endstream)", body, re.S)
    return body[: m.start(2)], m.group(2), body[m.end(2) :]


def parse_cmap(text: str) -> dict[int, str]:
    mp: dict[int, str] = {}
    for blk in re.findall(r"beginbfchar(.*?)endbfchar", text, re.S):
        for a, b in re.findall(r"<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>", blk):
            mp[int(a, 16)] = "".join(chr(int(b[i : i + 4], 16)) for i in range(0, len(b), 4))
    for blk in re.findall(r"beginbfrange(.*?)endbfrange", text, re.S):
        for a, b, c in re.findall(
            r"<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>", blk
        ):
            lo, hi, st = int(a, 16), int(b, 16), int(c, 16)
            for i in range(lo, hi + 1):
                mp[i] = chr(st + i - lo)
    return mp


class Font:
    def __init__(self, objs: dict[int, bytes], num: int):
        f = objs[num].decode("latin-1")
        self.first = int(re.search(r"/FirstChar\s+(\d+)", f).group(1))
        self.widths = [float(w) for w in re.search(r"/Widths\[([^\]]*)\]", f, re.S).group(1).split()]
        tu = int(re.search(r"/ToUnicode\s+(\d+)\s+0\s+R", f).group(1))
        _, raw, _ = stream_bytes(objs[tu])
        self.cmap = parse_cmap(zlib.decompress(raw).decode("latin-1"))
        self.inv = {v: k for k, v in self.cmap.items()}

    def check(self, text: str, label: str) -> None:
        missing = sorted({c for c in text if c not in self.inv})
        if missing:
            raise SystemExit(
                f"{label}: font subset has no glyph for {missing}. "
                "Re-embedding a font is a re-export job, not a byte patch."
            )

    def hexs(self, text: str) -> bytes:
        return "".join(f"{self.inv[c]:02X}" for c in text).encode()

    def advance(self, text: str, size: float) -> float:
        return sum(self.widths[self.inv[c] - self.first] for c in text) / 1000.0 * size


def block(tag: bytes, mcid: int, x: float, y: float, font: bytes, size: str,
          hexs: bytes, grey: bool = False) -> bytes:
    fill = b"0.3333333333 0.3333333333 0.3333333333" if grey else b"0 0 0"
    return (
        b"/%s<</MCID %d>>BDC\nq %s rg\nBT\n%s %s Td /%s %s Tf<%s>Tj\nET\nQ\nEMC\n"
        % (tag, mcid, fill, f"{x:g}".encode(), f"{y:g}".encode(), font,
           size.encode(), hexs)
    )


def main() -> int:
    dry = "--dry-run" in sys.argv
    data = PDF.read_bytes()
    objs = parse_objects(data)

    fdict = dict(re.findall(rb"/(F\d+)\s+(\d+)\s+0\s+R", objs[133]))
    F1 = Font(objs, int(fdict[b"F1"]))   # Carlito-Bold: titles
    F2 = Font(objs, int(fdict[b"F2"]))   # Carlito-Regular: dates, issuer, notes
    F1.check(TITLE, "title")
    F2.check(DATE, "date")
    F2.check(ISSUER, "issuer")
    F2.check(NOTE, "note")

    page2_num = int(re.search(r"/Contents\s+(\d+)\s+0\s+R", objs[58].decode("latin-1")).group(1))
    pre, raw, post = stream_bytes(objs[page2_num])
    content = zlib.decompress(raw)

    blocks = []
    for m in BLOCK.finditer(content):
        td = TD.search(m.group(3))
        txt = ""
        if td:
            cm = {b"F1": F1, b"F2": F2}.get(td.group(3))
            if cm:
                after = m.group(3)[td.end() :]
                txt = "".join(
                    cm.cmap.get(int(h[i : i + 2], 16), "")
                    for h in re.findall(rb"<([0-9A-Fa-f]+)>", after)
                    for i in range(0, len(h.decode()), 2)
                )
        blocks.append({"span": (m.start(), m.end()), "tag": m.group(1),
                       "mcid": int(m.group(2)), "body": m.group(3),
                       "y": float(td.group(2)) if td else None, "text": txt})
    ids = [b["mcid"] for b in blocks]
    if ids != list(range(len(ids))):
        raise SystemExit("page-2 MCIDs are not contiguous; refusing to renumber")

    hits = [i for i, b in enumerate(blocks) if b["text"] == ANCHOR]
    if len(hits) != 1:
        raise SystemExit(f"expected one block reading {ANCHOR!r}, found {len(hits)}")
    at = hits[0]
    if any(b["text"] == TITLE for b in blocks):
        raise SystemExit(f"{TITLE!r} is already in the PDF: already patched?")

    # Entry geometry, measured from the list rather than chosen.
    title_y = blocks[at]["y"]
    issuer_y = blocks[at + 2]["y"]
    lead = round(title_y - issuer_y, 2)
    next_title = next(b for b in blocks[at + 1 :] if b["y"] is not None and b["y"] < issuer_y - 1)
    pitch = round(title_y - next_title["y"], 2)
    print(f"geometry: entry pitch {pitch}pt, title→issuer {lead}pt (measured)")

    # Date x is the next tab stop past the title; verify the rule reproduces the
    # existing rows before trusting it with a new one.
    def tab_after(text: str) -> float:
        end = LEFT + F1.advance(text, 10)
        return round(LEFT + TAB * ((end - LEFT) // TAB + 1), 1)

    checked = 0
    for i, b in enumerate(blocks):
        if b["tag"] == b"Standard" and b["y"] is not None and b"F1 10 Tf" in b["body"]:
            nxt = blocks[i + 1]
            if nxt["y"] == b["y"] and b["text"] and nxt["text"]:
                want = tab_after(b["text"])
                got = float(TD.search(nxt["body"]).group(1))
                if abs(want - got) > 0.05:
                    raise SystemExit(f"tab rule fails on {b['text']!r}: {want} vs {got}")
                checked += 1
    print(f"tab rule: reproduces {checked} existing datelines exactly ✓")

    date_x = tab_after(TITLE)
    note_x = round(LEFT + F2.advance(ISSUER, 9.5), 1)
    print(f"placing : title x={LEFT} y={title_y}, date x={date_x}, note x={note_x}")

    new = (
        block(b"Standard", 0, LEFT, title_y, b"F1", "10", F1.hexs(TITLE))
        + block(b"Standard", 1, date_x, title_y, b"F2", "9.5", F2.hexs(DATE))
        + block(b"Standard", 2, LEFT, issuer_y, b"F2", "9.5", F2.hexs(ISSUER))
        + block(b"Standard", 3, note_x, issuer_y, b"F2", "9.5", F2.hexs(NOTE), grey=True)
    )
    # Renumber the placeholders once the base MCID is known.
    base = blocks[at]["mcid"]
    for i in range(4):
        new = new.replace(b"<</MCID %d>>" % i, b"<</MCID %d>>" % (base + i), 1)

    # ---- Rebuild the content stream -----------------------------------------
    out, cursor = bytearray(), 0
    for b in blocks:
        start, end = b["span"]
        out += content[cursor:start]
        cursor = end
        if b["mcid"] == base:
            out += new
        body = b["body"]
        mcid = b["mcid"]
        if mcid >= base:
            mcid += 4
            def bump(m: "re.Match[bytes]") -> bytes:
                return b"%s %s Td /%s %s Tf" % (
                    m.group(1), f"{round(float(m.group(2)) - pitch, 2):g}".encode(),
                    m.group(3), m.group(4))
            body = TD.sub(bump, body)
        out += b"/%s<</MCID %d>>BDC\n" % (b["tag"], mcid) + body + b"\nEMC\n"
    out += content[cursor:]
    content_new = bytes(out)

    # Drawn rules below the insertion move with the text they underline.
    def move_rule(m: "re.Match[bytes]") -> bytes:
        y = float(m.group(2))
        if y >= title_y:
            return m.group(0)
        ny = f"{round(y - pitch, 2):g}".encode()
        return b"%s %s m\n%s %s l S" % (m.group(1), ny, m.group(3), ny)

    content_new, n_rules = RULE.subn(move_rule, content_new)
    moved = len({float(m.group(2)) for m in RULE.finditer(content) if float(m.group(2)) < title_y})
    print(f"rules   : {moved} distinct below the insert, moved down {pitch}pt")

    baselines = lambda c: [float(m.group(1)) for m in re.finditer(rb"[\d.]+ ([\d.]+) Td /F", c)]
    ys, was = baselines(content_new), baselines(content)
    print(f"page 2  : lowest baseline {min(ys)} (was {min(was)})")
    if min(ys) < 36:
        raise SystemExit("insert pushes text under the bottom margin; the page is full")

    # ---- Structure tree ------------------------------------------------------
    data = repair_struct(data, objs, base, page_ref=b"/Pg 58 0 R")

    # ---- Splice, fix /Length, rebuild xref -----------------------------------
    new_raw = zlib.compress(content_new, 9)
    length_obj = int(re.search(rb"/Length\s+(\d+)\s+0\s+R", pre).group(1))
    objs2 = parse_objects(data)
    data = data.replace(b"%d 0 obj" % page2_num + objs2[page2_num] + b"endobj",
                        b"%d 0 obj" % page2_num + pre + new_raw + post + b"endobj", 1)
    data = data.replace(b"%d 0 obj" % length_obj + objs2[length_obj] + b"endobj",
                        b"%d 0 obj\n%d\nendobj" % (length_obj, len(new_raw)), 1)
    print(f"length  : object {length_obj} -> {len(new_raw)}")

    data = rebuild_xref(data)
    if dry:
        print("dry run: nothing written")
        return 0
    PDF.write_bytes(data)
    print(f"wrote {PDF} ({len(data)} bytes)")
    return 0


def repair_struct(data: bytes, objs: dict[int, bytes], base: int, page_ref: bytes) -> bytes:
    """Shift page-2 MCIDs up by 4, then add two paragraph elements for the entry.

    The new elements mirror the pair every other certification uses: one
    /Standard holding [title, date], one holding [issuer, note], both children of
    the document element, spliced in immediately before the entry they precede.
    """
    # 1. Every page-2 StructElem MCID at or past the insert shifts by 4.
    for num, body in list(objs.items()):
        if b"/Type/StructElem" not in body or page_ref not in body:
            continue
        km = re.search(rb"/K\[(.*?)\]", body, re.S)
        if not km:
            continue
        toks = []
        for t in re.finditer(rb"(\d+)\s+0\s+R|(\d+)", km.group(1)):
            if t.group(1):
                toks.append(b"%s 0 R" % t.group(1))
            else:
                v = int(t.group(2))
                toks.append(b"%d" % (v + 4 if v >= base else v))
        new_body = body[: km.start(1)] + b" ".join(toks) + b" " + body[km.end(1) :]
        if new_body != body:
            data = data.replace(b"%d 0 obj" % num + body + b"endobj",
                                b"%d 0 obj" % num + new_body + b"endobj", 1)

    # 2. Two new elements, numbered after the last existing object.
    nmax = max(objs)
    a, b_ = nmax + 1, nmax + 2
    tmpl = (b"<</Type/StructElem\n/S/Standard\n/P 4 0 R\n/Pg 58 0 R\n"
            b"/A <</O/Layout/Placement/Block /SpaceBefore %s >>\n/K[%d %d ]\n>>")
    new_objs = (b"\n%d 0 obj\n" % a + tmpl % (b"0.06", base, base + 1) + b"\nendobj\n"
                b"\n%d 0 obj\n" % b_ + tmpl % (b"0.01", base + 2, base + 3) + b"\nendobj\n")

    # 3. Link them into the document element, before the entry they precede.
    root = objs[4]
    km = re.search(rb"/K\[(.*?)\]", root, re.S)
    refs = re.findall(rb"(\d+) 0 R", km.group(1))
    owner = None
    for num, body in objs.items():
        if b"/Type/StructElem" in body and page_ref in body:
            k = re.search(rb"/K\[(.*?)\]", body, re.S)
            # `objs` is the PRE-shift parse, so the anchor entry's element still
            # lists the original MCID here, not the shifted one.
            if k and re.search(rb"\b%d\b" % base, k.group(1)):
                owner = num
                break
    if owner is None or b"%d" % owner not in refs:
        raise SystemExit("could not find where to link the new structure elements")
    pos = refs.index(b"%d" % owner)
    refs[pos:pos] = [b"%d" % a, b"%d" % b_]
    rendered = b" ".join(b"%s 0 R " % r for r in refs)
    new_root = root[: km.start(1)] + rendered + root[km.end(1) :]
    data = data.replace(b"4 0 obj" + root + b"endobj", b"4 0 obj" + new_root + b"endobj", 1)
    print(f"struct  : added {a}, {b_}; linked into doc element before {owner} "
          f"(kids {len(refs) - 2} -> {len(refs)})")

    # 4. Append the objects just before the xref table.
    xm = re.search(rb"\nxref\r?\n0\s+\d+\r?\n", data)
    data = data[: xm.start() + 1] + new_objs + data[xm.start() + 1 :]

    return rebuild_parent_tree(data, base, a, b_)


def rebuild_parent_tree(data: bytes, base: int, a: int, b_: int) -> bytes:
    """Splice four entries into /ParentTree Nums[1], which is indexed by MCID."""
    pt = int(re.search(rb"/ParentTree (\d+) 0 R", data).group(1))
    body = re.search(rb"(?:^|\n)%d 0 obj\n(.*?)\nendobj" % pt, data, re.S).group(1)
    nums = re.search(rb"1 \[(.*?)\]", body, re.S)
    entries = re.findall(rb"(\d+) 0 R", nums.group(1))
    entries[base:base] = [b"%d" % a, b"%d" % a, b"%d" % b_, b"%d" % b_]
    rows = [b" ".join(b"%s 0 R" % e for e in entries[i : i + 10]) for i in range(0, len(entries), 10)]
    new_body = body[: nums.start(1)] + b"\n".join(rows) + b" " + body[nums.end(1) :]
    print(f"partree : page-2 entries {len(entries) - 4} -> {len(entries)}")
    return data.replace(b"%d 0 obj\n" % pt + body, b"%d 0 obj\n" % pt + new_body, 1)


def rebuild_xref(data: bytes) -> bytes:
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
