/** Decorative map-like backdrop (grid + two roads) used by the static map placeholders. */
export function MapBackdrop({ id = "map-grid" }: { id?: string }) {
  return (
    <svg className="absolute inset-0 size-full text-line" aria-hidden>
      <defs>
        <pattern id={id} width="64" height="64" patternUnits="userSpaceOnUse">
          <path d="M64 0H0V64" fill="none" stroke="currentColor" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
      <path d="M-20 80 C 120 20, 220 180, 420 90 S 640 140, 760 40" fill="none" stroke="currentColor" strokeWidth="10" opacity="0.6" />
      <path d="M60 -10 C 90 140, 40 260, 140 420" fill="none" stroke="currentColor" strokeWidth="6" opacity="0.6" />
    </svg>
  );
}
