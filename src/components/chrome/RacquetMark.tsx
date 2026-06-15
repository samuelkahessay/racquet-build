/** Minimal line-art racquet glyph used as the brand mark. */
export function RacquetMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden="true"
    >
      {/* head */}
      <ellipse cx="16" cy="11" rx="8.5" ry="10" />
      {/* throat */}
      <path d="M11 19.5 L14.5 25.5 M21 19.5 L17.5 25.5" />
      {/* handle */}
      <path d="M14.5 25.5 L15.4 31 M17.5 25.5 L16.6 31" />
      {/* string bed */}
      <path
        d="M10 8 H22 M10 11 H22 M10 14 H22 M13 3.5 V19 M16 2 V20 M19 3.5 V19"
        strokeWidth={0.75}
        opacity={0.7}
      />
    </svg>
  );
}
