/*
 * Frame manifest + loader for the home cinematic reel (CinematicReel.tsx).
 *
 * 40 WebP frames, 1280×720 (native clip resolution), ~1.0MB TOTAL — the v2
 * clip (subject before the dark grid backdrop), watermark-cleaned and
 * re-encoded at WebP q74 from the source JPGs. They are fetched as plain
 * HTMLImageElements (browser keeps only the encoded bytes in JS reach;
 * decoded bitmaps live in the evictable decode cache — we deliberately do NOT
 * retain 40 ImageBitmaps ≈ 145MB of pinned RGBA).
 *
 * fetchPriority "low" + post-mount start keep the sequence from ever competing
 * with above-the-fold assets; img.decode() pre-warms the decode cache so the
 * scrub never hits a synchronous decode longer than a 0.4MP WebP (~1-3ms).
 */

export const FRAME_COUNT = 40;

export const framePath = (i: number) =>
  `/images/home/reel/frame-${String(i + 1).padStart(3, "0")}.webp`;

export interface FrameLoader {
  /** Kick off loading (frame 0 first, then the rest, concurrency 4). */
  start: (onFirst?: () => void) => void;
  /** Closest decoded frame to `target` (prefers already-passed frames), or -1. */
  nearestReady: (target: number) => number;
  /** Whether frame `i` is decoded — the crossfade scrub needs exact pairs. */
  isReady: (i: number) => boolean;
  img: (i: number) => HTMLImageElement | undefined;
  dispose: () => void;
}

export function createFrameLoader(): FrameLoader {
  const imgs: HTMLImageElement[] = [];
  const ready: boolean[] = new Array(FRAME_COUNT).fill(false);
  let disposed = false;

  async function load(i: number) {
    const img = new window.Image();
    img.decoding = "async";
    // Frame 0 is the hero's visible backdrop from load — fetch it eagerly;
    // the rest of the reel stays low-priority behind everything else.
    (img as HTMLImageElement & { fetchPriority?: string }).fetchPriority =
      i === 0 ? "high" : "low";
    img.src = framePath(i);
    imgs[i] = img;
    try {
      await img.decode();
      ready[i] = true;
    } catch {
      /* failed/aborted frame — nearestReady simply skips it */
    }
  }

  return {
    start(onFirst) {
      void (async () => {
        await load(0);
        if (disposed) return;
        onFirst?.();
        const queue = Array.from({ length: FRAME_COUNT - 1 }, (_, k) => k + 1);
        await Promise.all(
          Array.from({ length: 4 }, async () => {
            while (queue.length && !disposed) await load(queue.shift()!);
          }),
        );
      })();
    },
    nearestReady(target) {
      if (ready[target]) return target;
      for (let d = 1; d < FRAME_COUNT; d++) {
        if (ready[target - d]) return target - d;
        if (ready[target + d]) return target + d;
      }
      return -1;
    },
    isReady: (i) => !!ready[i],
    img: (i) => imgs[i],
    dispose() {
      disposed = true;
    },
  };
}
