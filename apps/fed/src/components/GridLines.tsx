// Decorative 12-column grid overlay — the brutalist "engineering on show" device. Purely visual:
// aria-hidden and pointer-events-none, so it never reaches the accessibility tree and never
// intercepts a click. Below md every other line is hidden (12 hairlines on a phone read as noise),
// leaving a 6-column grid.
const COLUMNS = Array.from({ length: 12 }, (_, i) => i);

export function GridLines() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 grid grid-cols-6 [&>i:nth-child(even)]:hidden md:grid-cols-12 md:[&>i:nth-child(even)]:block"
    >
      {COLUMNS.map((i) => (
        <i key={i} className="border-r border-border last:border-r-0" />
      ))}
    </div>
  );
}
