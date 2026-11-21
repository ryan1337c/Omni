import Link from 'next/link';
import type { ReactNode } from 'react';

type BentoTileProps = {
  title: string;
  href: string;
  linkLabel: string;
  className?: string;
  /** Background art (the wave). Painted inside the frame, so it carries on through the grown edge. */
  art?: ReactNode;
  children: ReactNode;
};

// Shared tile shell. Layers, back to front:
//   .bento-tilt-back  gradient card for the pointer-following border (driven by TiltGrid)
//   .bento-frame      the visible panel: surface and border, clips everything inside it
//     .bento-art      resting-size box inside the frame holding the background art and textures
//                     (dots / pinstripes / wave). They are drawn at a fixed position and size, so
//                     the frame growing just reveals more of them and the ring matches the tile.
//   content           the tile's illustration, clipped to the tile's resting size
//   title + expand    on top
// On hover only the frame, title and expand button move outward (see .bento-tilt in
// globals.css); the content stays where it is.
// Grid placement classes (col-span / min-h / h) go on the outer element, bento-* texture classes on
// the texture layer inside the frame.
// No hooks, so it renders as plain server HTML.
const isLayoutClass = (c: string) => /(^|:)(col-span|row-span|min-h|max-h|h)-/.test(c);

const BentoTile = ({ title, href, linkLabel, className = '', art, children }: BentoTileProps) => {
  const classes = className.split(/\s+/).filter(Boolean);
  const layout = classes.filter(isLayoutClass).join(' ');
  const texture = classes.filter((c) => !isLayoutClass(c)).join(' ');

  return (
    <article className={`bento-tilt relative isolate ${layout}`}>
      <div aria-hidden="true" className="bento-tilt-back" />
      <div
        aria-hidden="true"
        className="bento-frame overflow-hidden border border-[#ece8ee] bg-white shadow-[0_1px_2px_rgba(30,20,50,0.04)] dark:border-[#2c3444] dark:bg-[#1c2230] dark:shadow-none"
      >
        <div className="bento-art">
          {texture && <div className={`absolute -inset-1.5 ${texture}`} />}
          {art}
        </div>
      </div>
      <div className="relative z-[2] h-full overflow-hidden rounded-2xl">{children}</div>

      <h3 className="bento-title absolute left-[18px] right-14 top-[18px] z-20 text-[17px] font-semibold leading-snug tracking-tight text-[#111118] sm:text-lg lg:left-6 lg:right-16 lg:top-[22px] lg:text-xl dark:text-slate-100">
        {title}
      </h3>
      <Link
        href={href}
        aria-label={linkLabel}
        className="bento-expand absolute right-3.5 top-3.5 z-20 flex h-[26px] w-[26px] items-center justify-center rounded-md border after:absolute after:-inset-2 after:content-[''] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 lg:right-5 lg:top-5 lg:h-8 lg:w-8 lg:rounded-lg"
      >
        {/* Expand icon: the two arrows slide apart while the tile is hovered */}
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5 overflow-visible lg:h-4 lg:w-4" fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round">
          <g className="bento-arrow bento-arrow-tr">
            <polyline points="15 3 21 3 21 9" />
            <line x1="14" y1="10" x2="21" y2="3" />
          </g>
          <g className="bento-arrow bento-arrow-bl">
            <polyline points="9 21 3 21 3 15" />
            <line x1="3" y1="21" x2="10" y2="14" />
          </g>
        </svg>
      </Link>
    </article>
  );
};

export default BentoTile;
