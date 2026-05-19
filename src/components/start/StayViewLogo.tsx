export function StayViewLogo() {
  return (
    <div className="start-logo" aria-label="StayView">
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <rect x="2" y="2" width="12" height="12" rx="3" fill="#C4C4C4" />
        <rect x="18" y="2" width="12" height="12" rx="3" fill="#C4C4C4" />
        <rect x="2" y="18" width="12" height="12" rx="3" fill="#C4C4C4" />
        <rect x="18" y="18" width="12" height="12" rx="3" fill="#C4C4C4" />
      </svg>
      <span className="start-logo__text">StayView</span>
    </div>
  );
}
