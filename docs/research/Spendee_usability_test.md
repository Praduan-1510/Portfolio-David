# Spendee: moderated usability test (n=5)

> **Status:** plan only. Nothing here has been run, and no result from it appears
> on the site. When it runs, the write-up template at the end is what goes into
> `src/content/work/spendee.mdx`.

## Why this test exists

The Spendee case study makes three claims and labels two of them honestly:

| Goal | Current status in the study |
| --- | --- |
| First-time owner records their first ledger entry in under 30s, unaided | **Untested hypothesis** |
| Every screen leads with the next action | Design intent |
| GST filing feels like a guided task: see what's due and act in ≤2 taps | **Untested hypothesis** |

Those two "Untested hypothesis" labels are the most valuable words on the page,
and they are also an open invitation. This test closes them, and nothing else.

The study's own Reflection already specifies the work: *"watch five owners record
a day of entries against their paper khata and count where the app's model
diverges from theirs."* That is the test. This document is that sentence with
enough detail to run it.

**Do not widen the scope.** A test that tries to evaluate nineteen screens
returns opinions. A test that evaluates two flows returns findings.

## What is actually being tested

A **Figma prototype**: nineteen screens, clickable end to end, and that
constraint shapes everything below.

What that means honestly:

- **No free-form data entry.** Typing goes nowhere; the prototype advances on
  tap. So the 30-second target measures *navigation and comprehension*, not
  real entry speed. Say so in the write-up rather than letting the number imply
  more than it can carry.
- **Off-path taps dead-end.** Every one is a finding, not a participant error.
  Log where they tried to go — that is the highest-value data this format
  produces, because it shows the model they expected.
- **No persistence, no real amounts.** Do not ask questions whose answer
  depends on the numbers being theirs.

## Participants

**Five.** Not a statistical sample and never described as one — five is where
this kind of test stops returning new severe findings, and the claim being made
is "here is what broke", not "here is what percentage broke".

**Screener — recruit people who match the study's premise:**

1. Do you own or run a small business in India? *(must be yes)*
2. How do you currently record money you gave or received? *(must involve a
   paper khata, notebook, or a basic ledger app — exclude anyone using
   full accounting software with a bookkeeper)*
3. Are you GST-registered, and who files your returns? *(recruit at least two
   who file themselves or watch it being filed)*
4. Have you used Khatabook, OkCredit, or similar? *(mixed is ideal; note it)*
5. Do you work with a designer, or in software? *(must be no)*

**Bring their own khata to the session** — physical or app. Half of the
divergence finding depends on comparing against what they actually do.

## Tasks

Two flows. Read the scenario, then stop talking.

### Task 1 — the core loop (closes hypothesis 1)

> "You have just sold ₹4,500 of goods to a regular customer, and they have not
> paid yet. Record that, the way you would if this were your business."

- Start on the signed-in dashboard, not onboarding.
- **Time from first tap to the entry appearing recorded.** Target: under 30s.
- Then: *"Now show me where you'd check what that customer owes you in total."*

### Task 2 — the GST path (closes hypothesis 2)

> "It's the 18th of the month. Show me anything you need to deal with about GST."

- Start on the dashboard.
- **Count taps from dashboard to a screen where they could act.** Target: ≤2.
- Then: *"What do you think happens if you tap that?"* — asked **before** they
  tap. Predicted outcome vs. actual is where guided-task claims die.

### Task 3 — divergence (the Reflection's actual question)

> "Open your own khata. Walk me through yesterday's entries, and tell me how
> you'd put each one into this app."

Unscripted. Note every place their model and the app's disagree: what they
record that the app has no field for, what the app demands that they never
track, and what they call things.

## What to measure

**Per task:** completed unaided / completed with a nudge / not completed;
time (task 1); taps (task 2); every off-path tap and what they expected there.

**Across the session:** the words they use for entries, customers, and
amounts, against the words on screen. A vocabulary mismatch in this domain is
a severity-1 finding, not a copy tweak.

**Do not measure** satisfaction ratings or preference scores. With five people
they are noise, and quoting them would be exactly the kind of fabricated metric
this portfolio's rules forbid.

## Moderating rules

- Read scenarios verbatim. Improvised wording leads the witness.
- Never answer "where do I tap?" — return it: *"Where would you expect to?"*
- Silence after a question. Count to five before filling it.
- When they dead-end: *"What did you expect to happen?"*, then advance them
  manually and continue.
- Record screen and audio **with consent**, stated at the start, with the right
  to stop at any point.

## Severity, for triage afterwards

| | Meaning |
| --- | --- |
| **1** | Blocked the task, or the app's model contradicts how they keep books |
| **2** | Completed, but slowly or via the wrong route |
| **3** | Noticed, recovered unaided |
| **4** | Preference, no task impact — record, do not fix |

Fix 1s before touching anything else. A portfolio v2 that polishes 3s while a
1 stands is a worse artefact than the v1.

## The write-up (goes into spendee.mdx)

Add as a `## Testing & iteration` section between `## What revision caught` and
`## Craft`. Keep it this shape:

```mdx
## Testing & iteration

Five owners, moderated, against the Figma prototype. What broke:

<Goals>
  <Goal
    goal="First ledger entry in under 30 seconds, unaided."
    signal="[n]/5 completed unaided. Median [t]s. [What blocked the others.]"
    status="[Confirmed | Failed | Partly confirmed]"
  />
</Goals>

**What changed as a result.** [The v1 → v2 diff, per severity-1 finding:
what broke, why, what it is now.]

**What I did not change, and why.** [The findings deliberately left. This
paragraph is the one that makes the section credible.]
```

Then update the `status` on the two hypotheses in `## Goals & signals` — that
is the point of the whole exercise. **If a hypothesis fails, say it failed and
keep the finding.** A study that reports a failed hypothesis and what it
changed is worth more than one that reports three successes, and every
experienced reader knows it.

## Before publishing anything from this

- No participant names, business names, or real figures from their khata.
- "Five participants" everywhere. Never a percentage — 3/5 is not 60%.
- No claim the prototype's constraints cannot support (see the honesty list
  at the top).
