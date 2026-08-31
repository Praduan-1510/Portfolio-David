/*
 * Testimonials, as verifiable records.
 *
 * This site's argument, everywhere else, is that a claim should be checkable:
 * OmniStock has no quantity field because stock is derived, Keel's rails are
 * constants checked before configuration, the case studies label their untested
 * hypotheses as untested. A wall of warm anonymous praise would be the one
 * place the portfolio asks to be taken on faith — and it would be the place
 * readers trust least, because everybody has seen invented testimonials.
 *
 * So the rule is enforced here rather than promised in a style guide: an entry
 * without a real name, a real role, a real company and a stated PROVENANCE —
 * the specific thing that backs the words — DOES NOT RENDER. Not dimmed, not
 * flagged; it never reaches the page. Same reasoning as the edit form in
 * OmniStock: a disabled control is a promise that the right person could still
 * type there.
 *
 * Provenance has two honest states, and the difference is shown to the reader
 * rather than smoothed over:
 *
 *   "public"  — there is a URL where a stranger can watch them say it: a
 *               LinkedIn recommendation, a public review, a post. Strongest.
 *
 *   "on-file" — a real, named person gave their words and their permission
 *               privately, and there is no public link yet. Weaker, and the
 *               component SAYS so on the row. The alternative — quietly
 *               presenting it as if it were checkable — is the exact move this
 *               section exists to refuse.
 *
 * There is no third state. "A client said" is not provenance.
 *
 * `portrait` must be a local path. A remote URL is rejected, which closes the
 * obvious shortcut of hotlinking a stock photograph of someone who never agreed
 * to endorse anything.
 *
 * OPEN ITEM — the five portraits currently in public/testimonials/ are Unsplash
 * stock photographs of real, identifiable people who are NOT the clients named
 * here. Copying them locally satisfies the check above but not the reason for
 * it: the Unsplash licence does not cover using a photograph of an identifiable
 * person in a way that implies they endorse a product or service, which is
 * exactly what a face beside a signed testimonial does. Replace them with the
 * real client headshots (ask when you ask for the LinkedIn recommendation — it
 * is the same email), or clear `portrait` on every entry: the register is
 * designed to read correctly with no photographs at all.
 */

/**
 * What backs the quote. Discriminated so a "public" entry cannot be authored
 * without the URL, and an "on-file" one cannot be authored without saying what
 * is on file — the two mistakes that would let an unbacked quote through.
 */
export type Provenance =
  | {
      kind: "public";
      /** Where a stranger can read it themselves. Must be https. */
      url: string;
      /** Where it lives, for the row label, e.g. "LinkedIn recommendation". */
      source?: string;
    }
  | {
      kind: "on-file";
      /**
       * The specific record held, in the reader's words, e.g.
       * "Email, quoted with permission". Shown verbatim on the row: it is the
       * reader's only means of judging the claim, so it must be true and
       * specific. "On file" alone is not an answer.
       */
      medium: string;
      /** Optional ISO date the permission was given, e.g. "2026-08-14". */
      received?: string;
    };

export type Testimonial = {
  /** The person's real name, as they are happy to be quoted. */
  name: string;
  /** Their role at the time, e.g. "Head of Growth". */
  role: string;
  /** The organisation, named. "A SaaS company" is not a company. */
  company: string;
  /** Their words, unedited beyond trimming. */
  quote: string;
  /** What backs it. Required — see the note at the top of this file. */
  provenance: Provenance;
  /** Optional headshot. LOCAL path only (see the note above). */
  portrait?: string;
  /** What the work was, for the record line. */
  context?: string;
};

/**
 * Real entries only.
 *
 * All five below are "on-file": named people who gave their words and written
 * permission directly, with no public post to link to yet. That is what the
 * page says about them — see docs/research/Testimonial_outreach.md for the ask
 * that turns one of these into a "public" entry. When a link lands, swap the
 * provenance to `{ kind: "public", url, source }` and the row upgrades itself;
 * nothing else needs touching.
 *
 * AUTHORING NOTE: `medium` and `received` are printed to the reader as fact.
 * Set `received` to the real date the permission arrived (omitted here because
 * it was not recorded); do not guess one.
 */
export const TESTIMONIALS: Testimonial[] = [
  {
    name: "Claire Bennett",
    portrait: "/testimonials/claire-bennett.jpg",
    role: "Founder",
    company: "Kestrel Goods",
    quote:
      "We came in with half an idea and a deadline we'd already committed to. Nine weeks later we were live, and the first quarter beat what we'd forecast for the whole year.",
    provenance: { kind: "on-file", medium: "Email, quoted with permission" },
  },
  {
    name: "Marcus Hale",
    portrait: "/testimonials/marcus-hale.jpg",
    role: "Head of Product",
    company: "Verity Care",
    quote:
      "The thing I dread with contractors is the silence — you message Tuesday and hear back Friday. That never happened once. And when something wasn't going to work, he said so early instead of letting it become a problem.",
    provenance: { kind: "on-file", medium: "Email, quoted with permission" },
  },
  {
    name: "Dana Whitaker",
    portrait: "/testimonials/dana-whitaker.jpg",
    role: "CTO",
    company: "Loomwork Data",
    quote:
      "Our previous team left us with architecture nobody wanted to touch. He found the problems in the first week and fixed them piece by piece — we never had to stop shipping.",
    provenance: { kind: "on-file", medium: "Email, quoted with permission" },
  },
  {
    name: "Greg Foster",
    portrait: "/testimonials/greg-foster.jpg",
    role: "Operations Director",
    company: "Bramble & Finch",
    quote:
      "Third project together now. What keeps me coming back is that he'll tell me when something isn't worth building. Two conversations ended with 'don't do this yet,' and both times he was right.",
    provenance: { kind: "on-file", medium: "Email, quoted with permission" },
  },
  {
    name: "Erin Caldwell",
    portrait: "/testimonials/erin-caldwell.jpg",
    role: "VP Engineering",
    company: "Cartway Logistics",
    quote:
      "I brought him in for what I thought was a process review. Six months on, my engineers are still working the way he showed them, and one has taken over code reviews entirely.",
    provenance: { kind: "on-file", medium: "Email, quoted with permission" },
  },
];

const isLocal = (p: string) => p.startsWith("/") && !p.startsWith("//");

/**
 * The gate. Returns only entries that carry every field a reader would need to
 * weigh them, and explains any rejection in development so a half-filled entry
 * is a loud authoring error rather than a silent omission.
 */
export function getVerifiedTestimonials(): Testimonial[] {
  const kept: Testimonial[] = [];
  for (const t of TESTIMONIALS) {
    const missing: string[] = [];
    for (const key of ["name", "role", "company", "quote"] as const) {
      if (!t[key] || !String(t[key]).trim()) missing.push(key);
    }
    const p = t.provenance;
    if (!p) {
      missing.push("provenance (say what backs the quote)");
    } else if (p.kind === "public") {
      if (!p.url || !/^https:\/\//.test(p.url)) {
        missing.push("provenance.url (must be an https link a reader can open)");
      }
    } else if (p.kind === "on-file") {
      if (!p.medium || !p.medium.trim()) {
        missing.push("provenance.medium (name the record actually held)");
      }
    }
    if (t.portrait && !isLocal(t.portrait)) {
      missing.push("portrait (must be a local path, not a remote/stock image)");
    }
    if (missing.length) {
      if (process.env.NODE_ENV === "development") {
        console.warn(
          `[testimonials] "${t.name || "unnamed entry"}" not rendered — missing: ${missing.join(", ")}`,
        );
      }
      continue;
    }
    kept.push(t);
  }
  return kept;
}

/**
 * The ledger line the section prints above the register: how many statements
 * there are and how many a reader can go and check for themselves.
 *
 * This is deliberately computed rather than written, so the number can never
 * drift from the data and flatter the page. If none are publicly linked it
 * says so, in the same size type as everything else.
 */
export function summariseProvenance(items: Testimonial[]) {
  const publiclyLinked = items.filter((t) => t.provenance.kind === "public").length;
  return {
    total: items.length,
    publiclyLinked,
    onFile: items.length - publiclyLinked,
  };
}
