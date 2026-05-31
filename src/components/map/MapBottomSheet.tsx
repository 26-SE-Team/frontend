import React from "react";
import type { Listing } from "../../types/listing";
import { formatMapPrice } from "../../utils/formatMapPrice";

export type MapSheetState = "collapsed" | "expanded";

interface MapBottomSheetProps {
  totalCount: number;
  listings: Listing[];
  selectedListing?: Listing | null;
  favoriteIds?: string[];
  sheetState?: MapSheetState;
  onListingClick?: (listing: Listing) => void;
  onFavoriteToggle?: (listingId: string) => void;
  onSheetStateChange?: (state: MapSheetState) => void;
}

export function MapBottomSheet({
  totalCount,
  listings,
  selectedListing,
  favoriteIds = [],
  sheetState = "expanded",
  onListingClick,
  onFavoriteToggle,
  onSheetStateChange,
}: MapBottomSheetProps) {
  const dragStartYRef = React.useRef<number | null>(null);
  const didDragRef = React.useRef(false);
  const mappedListings = React.useMemo(
    () => listings.filter((listing) => listing.mapPosition),
    [listings]
  );
  const isCollapsed = sheetState === "collapsed";

  const toggleSheet = React.useCallback(() => {
    if (didDragRef.current) {
      didDragRef.current = false;
      return;
    }

    onSheetStateChange?.(isCollapsed ? "expanded" : "collapsed");
  }, [isCollapsed, onSheetStateChange]);

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    dragStartYRef.current = event.clientY;
    didDragRef.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    const startY = dragStartYRef.current;
    dragStartYRef.current = null;
    if (startY === null) return;

    const deltaY = event.clientY - startY;
    if (Math.abs(deltaY) < 18) return;

    didDragRef.current = true;
    onSheetStateChange?.(deltaY > 0 ? "collapsed" : "expanded");
  };

  return (
    <div className={`map-sheet map-sheet--${sheetState}`}>
      <button
        type="button"
        className="map-sheet__handle-button"
        aria-label={isCollapsed ? "매물 목록 펼치기" : "매물 목록 접기"}
        aria-expanded={!isCollapsed}
        onClick={toggleSheet}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        <span className="map-sheet__handle" aria-hidden />
      </button>
      <div className="map-sheet__header">
        <h2 className="map-sheet__title">매물</h2>
        <p className="map-sheet__meta">총 {totalCount}건</p>
      </div>

      <div className="map-sheet__list" aria-label="지도 매물 목록">
        {mappedListings.length > 0 ? (
          mappedListings.map((listing) => {
            const isFavorite = favoriteIds.includes(listing.id);

            return (
              <article
                className={`map-sheet__listing${
                  selectedListing?.id === listing.id ? " is-active" : ""
                }`}
                key={listing.id}
              >
                <button
                  type="button"
                  className="map-sheet__listing-main"
                  onClick={() => onListingClick?.(listing)}
                >
                  <img src={listing.imageUrl} alt="" />
                  <span>
                    <strong>{formatMapPrice(listing.price)}</strong>
                    <span>{listing.type}</span>
                    <span>{listing.info}</span>
                  </span>
                </button>
                <button
                  type="button"
                  className={`map-sheet__favorite${isFavorite ? " is-active" : ""}`}
                  aria-label={isFavorite ? "관심 매물 해제" : "관심 매물 저장"}
                  aria-pressed={isFavorite}
                  onClick={() => onFavoriteToggle?.(listing.id)}
                >
                  <HeartIcon filled={isFavorite} />
                </button>
              </article>
            );
          })
        ) : (
          <p className="map-sheet__empty">조건에 맞는 매물이 없습니다.</p>
        )}
      </div>
    </div>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill={filled ? "#ff5b70" : "none"}
      stroke="#ff5b70"
      strokeWidth="1.8"
      aria-hidden
    >
      <path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 00-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 000-7.8z" />
    </svg>
  );
}
