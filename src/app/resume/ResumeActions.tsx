"use client";

import { ArrowDown, Printer } from "lucide-react";
import { Button } from "@/components/primitives";
import { Magnetic } from "@/components/motion";
import { RESUME_PDF, RESUME_PAGES } from "@/lib/content/resume";

/*
 * Résumé actions — download the PDF, or print the page itself.
 *
 * The print path is the point of the whole route: `@media print` in globals.css
 * strips the chrome and re-sets this document as ink-on-paper (see the .resume-*
 * rules), so "Print" produces a clean résumé rather than a screenshot of a dark
 * website. Client island only because window.print() needs the browser; the
 * document above it stays a Server Component.
 *
 * Hidden from print output via data-noprint (the paper copy has no buttons).
 */
export function ResumeActions() {
  return (
    <div
      data-noprint
      className="flex flex-wrap items-center gap-space-4"
    >
      <Magnetic className="inline-block">
        <Button
          href={RESUME_PDF}
          download
          variant="invert"
          className="group/dl"
          aria-label={`Download résumé as PDF (${RESUME_PAGES} pages)`}
        >
          Download PDF
          <ArrowDown
            aria-hidden="true"
            className="h-[15px] w-[15px] shrink-0 transition-transform duration-fast ease-out-quad group-hover/dl:translate-y-0.5"
          />
        </Button>
      </Magnetic>

      <Magnetic className="inline-block">
        <Button
          type="button"
          variant="secondary"
          onClick={() => window.print()}
          className="group/pr"
        >
          Print
          <Printer
            aria-hidden="true"
            className="h-[15px] w-[15px] shrink-0 transition-transform duration-fast ease-out-quad group-hover/pr:-translate-y-0.5"
          />
        </Button>
      </Magnetic>
    </div>
  );
}
