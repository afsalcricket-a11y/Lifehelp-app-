export default function Logo({ size = 56, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} role="img" aria-label="LIFEHELP logo">
      <defs>
        <linearGradient id="lh-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0d9488" />
          <stop offset="1" stopColor="#2dd4bf" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="url(#lh-grad)" />
      <path d="M32 49C18 39 13 31 13 24a10 10 0 0 1 19-4.4A10 10 0 0 1 51 24c0 7-5 15-19 25z" fill="#fff" />
      <path d="M32 25v12M26 31h12" stroke="#0d9488" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}
