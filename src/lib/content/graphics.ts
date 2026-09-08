/*
 * The seventeen squares, in narrative order, as one list.
 *
 * Two components draw from this: the home page's drifting wall
 * (GraphicsShowcase, which takes the first nine and the last eight as its two
 * counter-moving rows) and the work index's contact sheet (ContactSheet, which
 * takes all seventeen at once). They are deliberately opposite presentations of
 * the same set, and the only thing that would make them disagree is two copies
 * of the data, so there is one.
 *
 * `alt` describes the artwork for someone who cannot see it. `label` and `note`
 * are editorial: the name a frame goes by and the one line about why it is set
 * the way it is. They are not alternatives to each other.
 */

export type GraphicStrand = "Carousel" | "Field notes" | "Campaign";

export interface GraphicFrame {
  src: string;
  alt: string;
  /** Short name, set beside the frame number on the sheet. */
  label: string;
  /** One line on the decision the frame makes. */
  note: string;
  strand: GraphicStrand;
}

export const GRAPHIC_FRAMES: GraphicFrame[] = [
  {
    src: "/Graphics/slide_01.png",
    alt: "Carousel cover: “Figma's AI didn't replace designers. It did something worse — smarter,” with “worse” struck through and “smarter” set in orange beside the Figma mark",
    label: "Cover",
    note: "The whole argument, corrected in the same breath. The strikethrough is the hook: you have to read both words.",
    strand: "Carousel",
  },
  {
    src: "/Graphics/slide_02.png",
    alt: "Core philosophy slide: “Creative — designs from the gut” against “Corporate — designs from the data,” each illustrated by a phone screen",
    label: "Core philosophy",
    note: "Two columns, two registers, one grid. The split is the argument.",
    strand: "Carousel",
  },
  {
    src: "/Graphics/slide_03.png",
    alt: "The workspace slide: a free-form canvas of shapes beside a component library in a laptop, under the line “Where the work begins”",
    label: "The workspace",
    note: "A free-form canvas against a component library. Drawn, not described.",
    strand: "Carousel",
  },
  {
    src: "/Graphics/slide_04.png",
    alt: "How wins are measured: a red “Site of the Day” award card beside a blue analytics card showing a conversion lift after an onboarding redesign",
    label: "How a win is counted",
    note: "An award card against a conversion chart. Both are wins. They are not the same win.",
    strand: "Carousel",
  },
  {
    src: "/Graphics/slide_05.png",
    alt: "Why it matters: “The new floor is your old ceiling,” over three panels comparing the same prompt in the manual era, with AI, and with taste plus AI",
    label: "Why it matters",
    note: "Interior slides drop the masthead to a hairline and hand the argument the top third of the square.",
    strand: "Carousel",
  },
  {
    src: "/Graphics/slide_06.png",
    alt: "Constraints: “The shape of freedom,” an open spiral on an infinite canvas beside two rectangles locked to a twelve-column grid",
    label: "Constraints",
    note: "A spiral on an infinite canvas, and a rectangle locked to twelve columns. The caption asks which one you painted yourself into.",
    strand: "Carousel",
  },
  {
    src: "/Graphics/slide_07.png",
    alt: "Stakeholders: “Who's in the room?” — a three-person studio circle beside a fourteen-person corporate team table",
    label: "Stakeholders",
    note: "Three named people against fourteen roles. The headcount is the punchline.",
    strand: "Carousel",
  },
  {
    src: "/Graphics/slide_08.png",
    alt: "Evolution: “What pulls you forward,” a list of named colour trends beside an A/B test card comparing two variants",
    label: "Evolution",
    note: "Trend names against a test result. Two forces pulling on the same work.",
    strand: "Carousel",
  },
  {
    src: "/Graphics/slide_09.png",
    alt: "The takeaway, set on a magenta gradient: “Fluidity over Friction,” with a note that the best designers build the bridge between expression and engineering",
    label: "The takeaway",
    note: "The only slide with no diagram on it. After eight comparisons, the resolution gets silence and a gradient.",
    strand: "Carousel",
  },
  {
    src: "/Graphics/slide_10.png",
    alt: "Closing slide: “So tell me — where do you design?” with a two-option live poll between The Studio and The Ecosystem",
    label: "The close",
    note: "It ends on a question with two buttons. A carousel that resolves itself gives the reader nothing to do.",
    strand: "Carousel",
  },
  {
    src: "/Graphics/standalone_post.png",
    alt: "Standalone post: “Figma's AI didn't replace designers. It just made being average obsolete,” with “average” struck through",
    label: "One square",
    note: "The same argument compressed to a single frame, for the readers who will never swipe.",
    strand: "Carousel",
  },
  {
    src: "/Graphics/post_03_microinteractions.png",
    alt: "Field Notes volume three: “Six micro-interactions that actually convert,” a six-cell grid covering haptics, optimistic UI, skeleton screens, inline validation, forgiving undo and visible progress",
    label: "Field Notes III",
    note: "Six patterns, each with its own miniature UI. Every cell is drawn, so the grid holds one weight throughout.",
    strand: "Field notes",
  },
  {
    src: "/Graphics/ux_2026_linkedin_post.png",
    alt: "Field Notes volume seven: “Designing for intent, not interfaces,” a six-cell grid of shifts including generative UI, agentic flows, conversational primacy, spatial computing, accessibility by default and designed trust",
    label: "Field Notes VII",
    note: "A serif headline with an italic pivot over a mono grid. The register says journal, which is the claim the post is making about itself.",
    strand: "Field notes",
  },
  {
    src: "/Graphics/monsoon-01-rain-can-stay.png",
    alt: "Monsoon campaign for a Kolkata home salon: “The rain can stay. So can you,” set over a rain-streaked window",
    label: "Monsoon",
    note: "The objection answered in the headline. Waterlogged roads are the reason not to book, so the service takes the road out of it.",
    strand: "Campaign",
  },
  {
    src: "/Graphics/pujo-01-pujo-is-coming.png",
    alt: "Durga Pujo campaign opener: the Bengali line আসছে দুর্গাপূজা above “Pujo is coming. Let's get you ready,” over a dhunuchi dance in deep maroon and gold",
    label: "Pujo opener",
    note: "Bengali sets the emotional register and English carries the offer. Neither is a translation of the other.",
    strand: "Campaign",
  },
  {
    src: "/Graphics/pujo-04-pujo-diary.png",
    alt: "Festival diary: “Five days. Five looks,” a rate card listing Shashthi through Dashami in Bengali and English with a service and a price against each day",
    label: "The rate card",
    note: "The hardest piece here: five rows, two scripts, real dates and real prices, and it still had to read as festive rather than as a menu.",
    strand: "Campaign",
  },
  {
    src: "/Graphics/pujo-08-file-polish.png",
    alt: "Offer graphic: “Express File & Polish, ₹299,” set in gold over a henna-covered hand",
    label: "The offer",
    note: "One service, one price, one duration, so the diary above it does not have to sell anything.",
    strand: "Campaign",
  },
];

/** The ten-part carousel and the standalone square that restates it. */
export const GRAPHICS_ROW_A = GRAPHIC_FRAMES.slice(0, 9);
/** The rest of the carousel, both field notes, and the campaign. */
export const GRAPHICS_ROW_B = GRAPHIC_FRAMES.slice(9);
