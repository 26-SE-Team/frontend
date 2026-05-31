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

interface SheetBounds {
  collapsed: number;
  defaultExpanded: number;
  max: number;
}

const sheetFallbackBounds: SheetBounds = {
  collapsed: 88,
  defaultExpanded: 304,
  max: 430,
};

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
  const sheetRef = React.useRef<HTMLDivElement>(null);
  const sheetBoundsRef = React.useRef<SheetBounds>(sheetFallbackBounds);
  const dragRef = React.useRef<{
    pointerId: number;
    startY: number;
    startHeight: number;
    currentHeight: number;
  } | null>(null);
  const lastSheetStateRef = React.useRef(sheetState);
  const [sheetHeight, setSheetHeight] = React.useState<number | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const mappedListings = React.useMemo(
    () => listings.filter((listing) => listing.mapPosition),
    [listings]
  );

  const measureSheetBounds = React.useCallback(() => {
    const frameHeight =
      sheetRef.current?.parentElement?.clientHeight ??
      (typeof window === "undefined" ? 720 : window.innerHeight);
    const collapsed = 88;
    const defaultExpanded = Math.min(Math.max(frameHeight * 0.38, 260), 320);
    const max = Math.max(
      defaultExpanded,
      Math.min(frameHeight * 0.66, frameHeight - 132)
    );
    const bounds = { collapsed, defaultExpanded, max };

    sheetBoundsRef.current = bounds;
    return bounds;
  }, []);

  const clampSheetHeight = React.useCallback(
    (height: number, bounds = sheetBoundsRef.current) =>
      Math.min(Math.max(height, bounds.collapsed), bounds.max),
    []
  );

  const syncSheetState = React.useCallback(
    (height: number) => {
      const nextState =
        height <= sheetBoundsRef.current.collapsed + 24
          ? "collapsed"
          : "expanded";

      if (lastSheetStateRef.current !== nextState) {
        lastSheetStateRef.current = nextState;
        onSheetStateChange?.(nextState);
      }
    },
    [onSheetStateChange]
  );

  React.useEffect(() => {
    lastSheetStateRef.current = sheetState;

    if (dragRef.current) {
      return;
    }

    const bounds = measureSheetBounds();
    setSheetHeight(
      sheetState === "collapsed" ? bounds.collapsed : bounds.defaultExpanded
    );
  }, [measureSheetBounds, sheetState]);

  React.useEffect(() => {
    const handleResize = () => {
      const bounds = measureSheetBounds();

      setSheetHeight((current) => {
        if (current === null) {
          return current;
        }

        return clampSheetHeight(current, bounds);
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [clampSheetHeight, measureSheetBounds]);

  const applySheetHeight = React.useCallback(
    (height: number) => {
      const nextHeight = clampSheetHeight(height);

      setSheetHeight(nextHeight);
      syncSheetState(nextHeight);
      return nextHeight;
    },
    [clampSheetHeight, syncSheetState]
  );

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const bounds = measureSheetBounds();
    const currentHeight =
      sheetRef.current?.getBoundingClientRect().height ??
      sheetHeight ??
      bounds.defaultExpanded;

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDragging(true);
    dragRef.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      startHeight: clampSheetHeight(currentHeight, bounds),
      currentHeight: clampSheetHeight(currentHeight, bounds),
    };
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;

    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    event.preventDefault();
    const deltaY = event.clientY - drag.startY;
    const nextHeight = applySheetHeight(drag.startHeight - deltaY);

    drag.currentHeight = nextHeight;
  };

  const finishDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;

    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragRef.current = null;
    setIsDragging(false);

    const bounds = sheetBoundsRef.current;
    const nextHeight =
      drag.currentHeight <= bounds.collapsed + 24
        ? bounds.collapsed
        : drag.currentHeight;

    setSheetHeight(nextHeight);
    syncSheetState(nextHeight);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const bounds = measureSheetBounds();
    const currentHeight =
      sheetHeight ??
      (sheetState === "collapsed" ? bounds.collapsed : bounds.defaultExpanded);
    const step = 56;
    let nextHeight: number | null = null;

    if (event.key === "ArrowUp" || event.key === "PageUp") {
      nextHeight = currentHeight + step;
    }

    if (event.key === "ArrowDown" || event.key === "PageDown") {
      nextHeight = currentHeight - step;
    }

    if (event.key === "Home") {
      nextHeight = bounds.collapsed;
    }

    if (event.key === "End") {
      nextHeight = bounds.max;
    }

    if (nextHeight !== null) {
      event.preventDefault();
      applySheetHeight(nextHeight);
    }
  };

  const isCollapsed =
    sheetHeight !== null
      ? sheetHeight <= sheetBoundsRef.current.collapsed + 24
      : sheetState === "collapsed";
  const sheetClassName = [
    "map-sheet",
    `map-sheet--${isCollapsed ? "collapsed" : "expanded"}`,
    isDragging ? "is-dragging" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const sheetStyle =
    sheetHeight === null
      ? undefined
      : { height: `${Math.round(sheetHeight)}px` };
  const sliderValue =
    sheetHeight ??
    (sheetState === "collapsed"
      ? sheetBoundsRef.current.collapsed
      : sheetBoundsRef.current.defaultExpanded);

  return (
    <div className={sheetClassName} ref={sheetRef} style={sheetStyle}>
      <div
        className="map-sheet__handle-button"
        role="slider"
        tabIndex={0}
        aria-label="매물 목록 높이"
        aria-orientation="vertical"
        aria-valuemin={sheetBoundsRef.current.collapsed}
        aria-valuemax={sheetBoundsRef.current.max}
        aria-valuenow={Math.round(sliderValue)}
        aria-valuetext={isCollapsed ? "작게 보기" : "크게 보기"}
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
      >
        <span className="map-sheet__handle" aria-hidden />
      </div>
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
