interface EmblemProps {
  className?: string;
  title?: string;
}

/**
 * Team Agnivega emblem — a flame (agni) fused with a wheat sheaf and a road
 * arc (vega/velocity). Pure vector, no raster asset, theme-token coloured.
 */
export function Emblem({ className = "h-10 w-10", title = "Team Agnivega" }: EmblemProps) {
  return (
    <svg viewBox="0 0 64 64" role="img" aria-label={title} className={className}>
      <title>{title}</title>
      <circle cx="32" cy="32" r="30" fill="var(--forest)" />
      <circle cx="32" cy="32" r="30" fill="none" stroke="var(--gold)" strokeWidth="2" />
      <path
        d="M32 12c5 6 8 10 8 15a8 8 0 0 1-16 0c0-2 .8-4 2-6 .4 2 1.6 3.4 3 4 0-4 1-9 3-13z"
        fill="var(--gold)"
      />
      <path
        d="M20 52c8-1 13-5 15-11M44 52c-8-1-13-5-15-11"
        stroke="var(--gold)"
        strokeWidth="2.4"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M32 34v18" stroke="var(--gold)" strokeWidth="2.4" strokeLinecap="round" />
      <path
        d="M12 44c8 5 32 5 40 0"
        stroke="oklch(0.85 0.02 150)"
        strokeWidth="1.6"
        strokeDasharray="4 4"
        fill="none"
        opacity="0.7"
      />
    </svg>
  );
}
