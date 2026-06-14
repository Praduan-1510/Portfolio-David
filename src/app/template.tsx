import { PageTransition } from "@/components/motion";

/*
 * App Router template — re-mounts on every navigation (unlike layout), so it's
 * the natural home for the route-transition choreography. The client
 * <PageTransition> owns the wipe + cross-fade and degrades to instant under
 * reduced motion (see component).
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
