/**
 * Shared SVG filters for the hand-drawn look. Rendered once in the root layout.
 *  - #fr-crayon : wobbly edges + streaky crayon fill (blobs, highlights)
 *  - #fr-rough  : slight wobble for marker strokes and outlines
 */
export function DoodleDefs() {
  return (
    <svg width="0" height="0" aria-hidden focusable="false" style={{ position: "absolute" }}>
      <defs>
        <filter id="fr-crayon" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="3" result="warp" />
          <feDisplacementMap in="SourceGraphic" in2="warp" scale="9" xChannelSelector="R" yChannelSelector="G" result="shape" />
          <feTurbulence type="fractalNoise" baseFrequency="0.7 0.06" numOctaves="2" seed="8" result="grain" />
          <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.1 1.32" result="grainAlpha" />
          <feComposite in="shape" in2="grainAlpha" operator="in" />
        </filter>
        <filter id="fr-rough" x="-5%" y="-20%" width="110%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed="5" result="warp" />
          <feDisplacementMap in="SourceGraphic" in2="warp" scale="4" />
        </filter>
      </defs>
    </svg>
  );
}
