// One wave drawn across the whole top row. Each of the two row-1 tiles renders its own copy
// at the full row width and offsets it (see .bento-swoosh in globals.css), so the curve
// lines up across the gap while each tile clips its own part. Below `lg` the tiles are
// stacked and each one just shows the whole wave in its own width.
//
// Everything here is static markup (no JS, no images): a few stacked, shifted copies of the
// same area give the soft fade from the tile background into the colour near the curve.

const LINE =
  'M0 204C21.7 202.3 66.7 196.5 100 196C133.3 195.5 166.7 199.5 200 201C233.3 202.5 271.7 206 300 205C328.3 204 350 200.5 370 195C390 189.5 406.7 179.8 420 172C433.3 164.2 436.7 155 450 148C463.3 141 481.7 134.5 500 130C518.3 125.5 536.7 122.8 560 121C583.3 119.2 616.7 121.5 640 119C663.3 116.5 680 109.2 700 106C720 102.8 738.3 101.7 760 100C781.7 98.3 806.7 98.3 830 96C853.3 93.7 882.5 89.3 900 86C917.5 82.7 925.8 83.7 935 76C944.2 68.3 948.3 49.3 955 40C961.7 30.7 965.8 25.3 975 20C984.2 14.7 999.2 12 1010 8';
const AREA = `${LINE}L1040 420L-30 420Z`;

// Smoothstep fade from ~12px above the curve to ~60px below it: [y offset, layer opacity].
const FADE: ReadonlyArray<readonly [number, number]> = [
  [-12, 0.034],
  [-3, 0.095],
  [6, 0.152],
  [15, 0.213],
  [24, 0.285],
  [33, 0.378],
  [42, 0.513],
  [51, 0.728],
  [60, 1],
];

// Silk lines: copies of the curve that drift further apart as they go down.
const SILK = [22, 50, 86, 132, 190];

const Swoosh = ({ id, side }: { id: string; side: 'a' | 'b' }) => (
  <svg
    aria-hidden="true"
    focusable="false"
    viewBox="0 0 1000 280"
    preserveAspectRatio="none"
    className={`bento-swoosh ${side === 'b' ? 'bento-swoosh-b' : ''}`}
  >
    <defs>
      <linearGradient id={`${id}-h`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1000" y2="0">
        <stop offset="0" className="bento-sw-1" />
        <stop offset="0.35" className="bento-sw-2" />
        <stop offset="0.65" className="bento-sw-3" />
        <stop offset="1" className="bento-sw-4" />
      </linearGradient>
      <linearGradient id={`${id}-v`} gradientUnits="userSpaceOnUse" x1="0" y1="200" x2="0" y2="280">
        <stop offset="0" className="bento-sw-4" stopOpacity="0" />
        <stop offset="1" className="bento-sw-4" stopOpacity="0.5" />
      </linearGradient>
    </defs>
    {FADE.map(([y, opacity]) => (
      <path key={y} d={AREA} fill={`url(#${id}-h)`} opacity={opacity} transform={`translate(0 ${y})`} />
    ))}
    <rect x="0" y="200" width="1000" height="90" fill={`url(#${id}-v)`} />
    <g className="bento-silk" fill="none" strokeWidth="1">
      {SILK.map((y) => (
        <path key={y} d={LINE} vectorEffect="non-scaling-stroke" transform={`translate(0 ${y})`} />
      ))}
    </g>
  </svg>
);

export default Swoosh;
