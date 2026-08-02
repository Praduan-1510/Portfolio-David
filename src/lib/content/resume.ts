/*
 * Résumé content — the single source of truth for the /resume route.
 *
 * Every line here is transcribed from the PDF in public/pdf (the file the
 * download button serves), condensed from its Situation/Task/Action/Result
 * bullets into one result-led sentence each. Nothing is invented: no metrics,
 * employers, dates, or claims that aren't in the document itself.
 *
 * Two deliberate departures from the PDF, both for the web context:
 *   1. The headline title uses site.jobTitle ("Product Designer (Design +
 *      Front-End)") so the site speaks with one voice. Employer titles below
 *      stay verbatim — those are matters of record.
 *   2. The phone number printed on the PDF is NOT rendered in HTML (scrapeable
 *      on a public page). Contact routes through the site email / LinkedIn.
 */

/** The downloadable file, served from public/. */
export const RESUME_PDF = "/pdf/Praduan_Saha_Resume.pdf";

/** Human-readable revision stamp shown in the masthead + document footer. */
export const RESUME_UPDATED = "August 2026";

/** Page count of the PDF — shown as a spec so the download is a known quantity. */
export const RESUME_PAGES = 2;

export const SUMMARY =
  "Product designer and front-end designer with 5+ years across instructional design, content development, and user-centric digital experiences. I design intuitive web and mobile interfaces, lead front-end visual overhauls, build scalable design systems, and translate complex ideas — including GTM and data-heavy concepts — into clean, usable work. Hands-on with Figma, wireframing, prototyping, and modern design workflows that serve both the business and the person using it.";

/** Masthead spec strip — four facts, read as an instrument readout. */
export const SPECS = [
  { label: "Based", value: "Kolkata, IN" },
  { label: "Experience", value: "5+ years" },
  { label: "Focus", value: "Product · Front-end" },
  { label: "Updated", value: RESUME_UPDATED },
] as const;

export type SkillGroup = { label: string; items: string[] };

export const SKILLS: SkillGroup[] = [
  {
    label: "Design",
    items: [
      "UI/UX design (web & mobile)",
      "Wireframing & user flows",
      "High-fidelity UI & prototyping",
      "Information architecture",
      "Design systems",
      "Accessibility & usability",
    ],
  },
  {
    label: "Build & craft",
    items: [
      "Front-end development",
      "Responsive web design",
      "Visual design & branding",
      "Multimedia & interactive content",
      "Cross-functional collaboration",
    ],
  },
  {
    label: "Tools",
    items: [
      "Figma",
      "Canva",
      "WordPress",
      "HubSpot",
      "Microsoft Office",
      "Audio & multimedia editing",
    ],
  },
];

export type Role = {
  /** Employer title, verbatim from the document. */
  title: string;
  /** Employment type + arrangement, e.g. "Full-time · On-site". */
  mode: string;
  period: string;
  bullets: string[];
};

export type Position = {
  company: string;
  meta: string;
  /** Span across all roles at this company (the company-level dateline). */
  period: string;
  roles: Role[];
};

export const EXPERIENCE: Position[] = [
  {
    company: "InsightsTap",
    meta: "Kolkata, West Bengal, India",
    period: "Sep 2025 – Present",
    roles: [
      {
        title: "Graphic Designer",
        mode: "Full-time · On-site",
        period: "Feb 2026 – Present",
        bullets: [
          "Own brand-aligned creative as InsightsTap scales its GTM and AI-focused marketing — marketing visuals, UI layouts, and campaign assets built alongside the marketing, strategy, and product teams — delivering a cohesive visual identity that strengthened brand recognition across GTM touchpoints.",
          "Built a quick-iteration workflow in Figma on reusable components and shared style references, cutting creative turnaround time and raising feedback-to-final velocity without losing brand recall.",
        ],
      },
      {
        title: "Graphic Designer",
        mode: "Internship · Remote",
        period: "Sep 2025 – Feb 2026",
        bullets: [
          "Produced on-brand creative for a B2B SaaS team launching GTM and AI-focused marketing — LinkedIn carousels, ad visuals, banners, pitch decks, and landing-page layouts in Canva and Figma, plus early UI concepts for marketing microsites.",
          "Delivered 20+ creatives and wireframes that improved visual consistency and readability across GTM assets — earning a full-time conversion.",
        ],
      },
    ],
  },
  {
    company: "Simplilearn",
    meta: "Bengaluru, Karnataka, India · Remote",
    period: "Nov 2021 – Sep 2022",
    roles: [
      {
        title: "Learning Designer",
        mode: "Full-time · Remote",
        period: "Nov 2021 – Sep 2022",
        bullets: [
          "Designed end-to-end digital learning flows for professional certification courses — modular modules, structured navigation, and multimedia — partnering with subject-matter experts to align outcomes to business goals, and launching multiple certification modules that supported higher retention and completion.",
          "Restructured course layouts, hierarchy, and interactive elements against user-centred principles, closing usability gaps that made content easier to scan, navigate, and finish.",
          "Produced and integrated audio, video, and interactive elements to carry course delivery beyond static text.",
        ],
      },
    ],
  },
  {
    company: "LeadsArk",
    meta: "Kolkata, West Bengal, India · Remote",
    period: "Mar 2019 – Sep 2021",
    roles: [
      {
        title: "Content Developer",
        mode: "Full-time · Remote",
        period: "Mar 2019 – Sep 2021",
        bullets: [
          "Created infographics, blog visuals, and marketing assets aligned to user intent, partnering with the SEO team on keyword research and search-friendly content structures — a consistent stream of infographic-led content that improved clarity, brand recall, and on-page engagement.",
          "Translated dense topics into clear layouts, visual hierarchies, and infographic formats that made complex material readable.",
          "Standardised layouts, typography, and visual treatments across content series, giving marketing content one consistent brand look.",
        ],
      },
    ],
  },
];

export type ResumeProject = {
  title: string;
  meta: string;
  period: string;
  /** Case study on this site, when one exists. */
  href?: string;
  bullets: string[];
};

export const PROJECTS: ResumeProject[] = [
  {
    title: "Front-end development of the InsightsTap website",
    meta: 'InsightsTap · "Intent Signals as a Service" · Team project',
    period: "Mar 2026 – Apr 2026",
    href: "/work/insightstap",
    bullets: [
      "Led the front-end development and visual overhaul, translating dense GTM and intent-signal concepts into a clean, component-based interface — responsive layouts built in Figma and implemented in code against brand guidelines and accessibility standards.",
      "Built reusable UI components, typography scales, and shared style references, then applied them across key pages so a multi-contributor site kept consistent spacing, hierarchy, and styling.",
      "Partnered with fellow contributors on layout, component structure, and visual direction, iterating quickly on feedback to ship the overhauled site on schedule.",
    ],
  },
];

export const EDUCATION = {
  degree: "B.A. English (Honours)",
  school: "Amity University, Kolkata",
  period: "Aug 2018 – May 2021",
  notes: [
    "Academic research comparing post-colonial perspectives across Derrida, Barthes, and Foucault.",
    "Active in the photography and event clubs; contributed visual and organisational support to campus events.",
  ],
};

export type Certification = {
  title: string;
  issuer: string;
  date: string;
  note: string;
};

/** Newest first. */
export const CERTIFICATIONS: Certification[] = [
  {
    title: "Claude Code in Action",
    issuer: "Anthropic",
    date: "Jul 2026",
    note: "Agentic coding workflows — context management, custom workflows, and hooks.",
  },
  {
    title: "Vibe Coding Fundamentals",
    issuer: "University of Colorado System",
    date: "Jun 2026",
    note: "Prompt engineering and AI-assisted development — building applications with LLMs in natural language.",
  },
  {
    title: "Graphic Design",
    issuer: "Adobe",
    date: "Apr 2026",
    note: "Graphic design and visual hierarchy fundamentals.",
  },
  {
    title: "WordPress 2026: The Complete WordPress Website Course",
    issuer: "Udemy",
    date: "Apr 2026",
    note: "Full-Site Editing (FSE), dashboard administration, and site building.",
  },
  {
    title: "SEO",
    issuer: "HubSpot Academy",
    date: "Apr 2026",
    note: "On-page optimisation, SEO auditing, and search best practices · valid through May 2027.",
  },
  {
    title: "Figma UI/UX Design Essentials",
    issuer: "Udemy",
    date: "Nov 2025",
    note: "UX and UI essentials with hands-on Figma practice.",
  },
  {
    title: "Complete Web & Mobile Designer: UI/UX, Figma & More",
    issuer: "Udemy",
    date: "Oct 2025",
    note: "End-to-end UI/UX for web and mobile — wireframing, prototyping, responsive layouts, modern UI patterns.",
  },
];

export const STRENGTHS = [
  "Teamwork & communication",
  "Time management",
  "Adaptability",
  "Working under pressure",
  "Project management",
  "Cross-functional collaboration",
];

export const LANGUAGES = [
  { name: "English", level: "Fluent" },
  { name: "Bengali", level: "Fluent" },
  { name: "Hindi", level: "Fluent" },
  { name: "French", level: "Beginner" },
];
