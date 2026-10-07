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
