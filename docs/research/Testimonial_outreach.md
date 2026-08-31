# Getting real testimonials, fast

The site has a working "On the record" section. It needs, per person: their
words, their name/role/company, and a public URL where a reader can see them
say it. A LinkedIn recommendation supplies all four at once and costs the
sender about two minutes.

## Same-day option: check what you already have

Open LinkedIn → Profile → Recommendations → **Received**. Anything already
there is real, already public, and already has a URL. If there is even one, it
can be on the homepage in ten minutes — send me the text and the profile link.

Also worth checking: Upwork/Fiverr reviews if you ever used them, and any
client email that already says something good (ask that person to post the same
two sentences to LinkedIn, since email is not verifiable).

## The ask

Send individually, never as a group message. Two minutes each.

### 1 — Colleague at InsightsTap

> Hi [name] — small favour. I'm putting a page together for my portfolio and
> I'd rather have two honest sentences from someone I actually worked with than
> the usual marketing copy.
>
> Would you be up for leaving a short LinkedIn recommendation? The specific
> thing I'd love you to talk about, if you agree with it, is the front-end
> overhaul of the site — I designed it and then shipped the production build,
> and you saw how that ran day to day.
>
> Two or three sentences is plenty. If it's easier, answer these and I'll never
> touch a word:
> - What was the problem before I picked it up?
> - What was actually different about how it got done?
> - Would you work with me on it again, and why?
>
> And genuinely no pressure — if you'd rather not, or can't for work reasons,
> just say and it won't be awkward.

### 2 — A past freelance client

> Hi [name] — hope things are good at [company].
>
> I'm rebuilding my portfolio and I'm only putting up quotes from people I
> actually worked for, with a link so readers can check they're real. Would you
> be willing to leave a short LinkedIn recommendation about the [specific
> project] work?
>
> Anything from two sentences up. If it helps, the bits worth mentioning are
> whatever you'd tell someone who asked whether to hire me — including what was
> hard about it.
>
> If it's not a yes, that's completely fine and I won't ask twice.

## What makes a reply usable

Ask about **one specific thing**, not "what was I like to work with". Generic
praise is unusable and everyone can tell. If a reply comes back vague, it is
fine to go back once: *"Could you add one line about [the specific thing]? That
detail is the part people actually find useful."*

## Rules when adding them

- **Verbatim.** Trim for length only. Never smooth their wording — polished
  quotes are the main reason testimonial sections read as fake.
- **Named, with the link.** No "Product Manager at a SaaS company".
- **Get the OK on the exact text** you publish, especially the role and company.
- Paste into `TESTIMONIALS` in `src/lib/content/testimonials.ts`. Anything
  missing a field simply will not render.

## Realistic timeline

Ask five people today; expect two or three replies inside a week, and at least
one same-day if a recommendation already exists. Three real, checkable quotes
beat five invented ones by a margin that is not close — because the invented
ones have to survive a client mentioning one to the person it is attributed to.
