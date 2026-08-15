export function LabMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      aria-label="CCTP Knowledge Lab"
      role="img"
    >
      <rect x="5" y="4.5" width="22" height="23" rx="1.25" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10.5 4.5v23" stroke="currentColor" strokeWidth="1.4" />
      <rect x="13.5" y="8.5" width="10" height="2.1" fill="currentColor" />
      <rect x="13.5" y="13.25" width="8" height="2.1" fill="currentColor" opacity="0.72" />
      <rect x="13.5" y="18" width="9" height="2.1" fill="currentColor" opacity="0.48" />
      <rect x="13.5" y="22.75" width="6" height="2.1" fill="currentColor" opacity="0.28" />
    </svg>
  );
}
