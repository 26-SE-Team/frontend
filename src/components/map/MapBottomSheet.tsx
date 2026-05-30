import type { Listing } from "../../types/listing";

interface MapBottomSheetProps {
  totalCount: number;
  listings: Listing[];
  selectedListing?: Listing | null;
  onListingClick?: (listing: Listing) => void;
}

export function MapBottomSheet({
  totalCount,
  listings,
  selectedListing,
  onListingClick,
}: MapBottomSheetProps) {
  const mappedListings = listings.filter((listing) => listing.mapPosition);

  return (
    <div className="map-sheet">
      <div className="map-sheet__handle" aria-hidden />
      <div className="map-sheet__header">
        <h2 className="map-sheet__title">매물</h2>
        <p className="map-sheet__meta">총 {totalCount}건</p>
      </div>

      <div className="map-sheet__list" aria-label="지도 매물 목록">
        {mappedListings.map((listing) => (
          <button
            type="button"
            className={`map-sheet__listing${
              selectedListing?.id === listing.id ? " is-active" : ""
            }`}
            onClick={() => onListingClick?.(listing)}
            key={listing.id}
          >
            <img src={listing.imageUrl} alt="" />
            <span>
              <strong>{listing.price}</strong>
              <span>{listing.type}</span>
              <span>{listing.info}</span>
            </span>
            <HeartIcon />
          </button>
        ))}
      </div>
    </div>
  );
}

function HeartIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff5b70" strokeWidth="1.8" aria-hidden>
      <path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 00-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 000-7.8z" />
    </svg>
  );
}
