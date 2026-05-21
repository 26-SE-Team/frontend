interface MapFilterButtonProps {
  onClick?: () => void;
}

export function MapFilterButton({ onClick }: MapFilterButtonProps) {
  return (
    <button type="button" className="map-filter-btn" onClick={onClick}>
      거래 유형/가격
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
        <path
          d="M3 4.5L6 7.5L9 4.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
