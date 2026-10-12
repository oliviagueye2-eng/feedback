/** The icons of the back-office actions (24 × 24 strokes); the button carries the name. */
const paths = {
  check: <path d="M5 12l5 5L20 7" />,
  pencil: (
    <>
      <path d="M4 20h4L19 9l-4-4L4 16v4z" />
      <path d="M14 6l4 4" />
    </>
  ),
  merge: (
    <>
      <path d="M6 4v6a4 4 0 0 0 4 4h8" />
      <path d="M14 10l4 4-4 4" />
      <path d="M6 20v-2" />
    </>
  ),
  cross: <path d="M6 6l12 12M18 6L6 18" />,
  trash: (
    <>
      <path d="M4 7h16" />
      <path d="M10 11v6M14 11v6" />
      <path d="M6 7l1 13h10l1-13" />
      <path d="M9 7V4h6v3" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
};

export function Icon({ name }: { name: keyof typeof paths }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
