import type { Listing } from "../../types/listing";

interface MapBottomSheetProps {
  totalCount: number;
  selectedListing?: Listing | null;
  onDetailClick?: () => void;
}

export function MapBottomSheet({
  totalCount,
  selectedListing,
  onDetailClick,
}: MapBottomSheetProps) {
  return (
    <div className="map-sheet">
      <div className="map-sheet__handle" aria-hidden />
      <h2 className="map-sheet__title">매물</h2>
      <p className="map-sheet__meta">
        총 {totalCount}건
      </p>
      {selectedListing && (
        <div className="map-sheet__listing">
          <img src={selectedListing.imageUrl} alt="" />
          <div>
            <p>{selectedListing.mapPosition?.label ?? selectedListing.location}</p>
            <strong>{selectedListing.price}</strong>
            <span>
              {selectedListing.type} · {selectedListing.info}
            </span>
          </div>
          <button type="button" onClick={onDetailClick}>
            상세
          </button>
        </div>
      )}
    </div>
  );
}
