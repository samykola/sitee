export function Logo({
  className = 'h-7 w-auto',
  withText = true,
}: {
  className?: string;
  withText?: boolean;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={withText ? '0 0 384 130' : '18 18 92 92'}
      className={className}
      role="img"
      aria-label="CLIPROOM"
    >
      {withText ? (
        <>
          <g transform="translate(-4 1)">
            <path
              d="M104 52 L104 48 A24 24 0 0 0 80 24 L48 24 A24 24 0 0 0 24 48 L24 80 A24 24 0 0 0 48 104 L80 104 A24 24 0 0 0 104 80 C104 68 100 62 92 62"
              fill="none"
              stroke="currentColor"
              strokeWidth="7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
          <text
            x="126"
            y="79"
            fontFamily="Inter, 'Helvetica Neue', Arial, sans-serif"
            fontSize="38"
            fontWeight="300"
            letterSpacing="4.5"
            fill="currentColor"
          >
            CLIPROOM
          </text>
        </>
      ) : (
        <path
          d="M104 52 L104 48 A24 24 0 0 0 80 24 L48 24 A24 24 0 0 0 24 48 L24 80 A24 24 0 0 0 48 104 L80 104 A24 24 0 0 0 104 80 C104 68 100 62 92 62"
          fill="none"
          stroke="currentColor"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}
