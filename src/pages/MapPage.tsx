import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "../components/home/BottomNav";
import { PropertyMap } from "../components/map/PropertyMap";
import { MapFilterButton } from "../components/map/MapFilterButton";
import {
  MapBottomSheet,
  type MapSheetState,
} from "../components/map/MapBottomSheet";
import { allListings } from "../data/mockListings";
import {
  readDraftListingsForDisplay,
  readFavoriteListingIds,
  toggleFavoriteListing,
} from "../services/prototypeStorage";
import type { Listing } from "../types/listing";
import {
  defaultMapListingFilters,
  matchesMapListingFilters,
  type MapListingFilters,
  type MapPriceRange,
  type MapTradeType,
} from "../utils/mapListingFilters";
import "./map.css";

export function MapPage() {
  const navigate = useNavigate();
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [favoriteIds, setFavoriteIds] = useState(() => readFavoriteListingIds());
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sheetState, setSheetState] = useState<MapSheetState>("expanded");
  const [filters, setFilters] = useState<MapListingFilters>(
    defaultMapListingFilters
  );
  const combinedListings = useMemo(
    () => [...allListings, ...readDraftListingsForDisplay()],
    []
  );
  const filteredListings = useMemo(
    () =>
      combinedListings.filter((listing) =>
        matchesMapListingFilters(listing, filters)
      ),
    [combinedListings, filters]
  );

  const totalCount = useMemo(
    () => filteredListings.filter((listing) => listing.mapPosition).length,
    [filteredListings]
  );
  const hasActiveFilter =
    filters.tradeType !== "all" || filters.priceRange !== "all";

  useEffect(() => {
    if (
      selectedListing &&
      !filteredListings.some((listing) => listing.id === selectedListing.id)
    ) {
      setSelectedListing(null);
    }
  }, [filteredListings, selectedListing]);

  const handleTradeTypeChange = (tradeType: MapTradeType) => {
    setFilters({ tradeType, priceRange: "all" });
  };

  const handlePriceRangeChange = (priceRange: MapPriceRange) => {
    setFilters((current) => ({ ...current, priceRange }));
  };

  const handleFavoriteToggle = (listingId: string) => {
    setFavoriteIds(toggleFavoriteListing(listingId));
  };

  return (
    <main className="map-page">
      <div className="map-page__frame">
        <div className="map-page__map-wrap">
          <PropertyMap
            listings={filteredListings}
            selectedListingId={selectedListing?.id ?? null}
            onListingClick={setSelectedListing}
          />
          <div className="map-page__overlay">
            <MapFilterButton
              active={hasActiveFilter}
              label={getFilterButtonLabel(filters)}
              onClick={() => setIsFilterOpen((open) => !open)}
            />
          </div>
          {isFilterOpen && (
            <MapFilterPanel
              filters={filters}
              onTradeTypeChange={handleTradeTypeChange}
              onPriceRangeChange={handlePriceRangeChange}
              onReset={() => setFilters(defaultMapListingFilters)}
              onClose={() => setIsFilterOpen(false)}
            />
          )}
        </div>

        <MapBottomSheet
          totalCount={totalCount}
          listings={filteredListings}
          selectedListing={selectedListing}
          favoriteIds={favoriteIds}
          sheetState={sheetState}
          onListingClick={(listing) => navigate(`/listing/${listing.id}`)}
          onFavoriteToggle={handleFavoriteToggle}
          onSheetStateChange={setSheetState}
        />

        <BottomNav active="browse" />
      </div>
    </main>
  );
}

const tradeOptions: Array<{ value: MapTradeType; label: string }> = [
  { value: "all", label: "전체" },
  { value: "monthly", label: "월세" },
  { value: "jeonse", label: "전세" },
];

const priceOptions: Array<{
  value: MapPriceRange;
  label: string;
  tradeType?: MapTradeType;
}> = [
  { value: "all", label: "전체" },
  { value: "monthly-under-50", label: "50 이하", tradeType: "monthly" },
  { value: "monthly-50-70", label: "50-70", tradeType: "monthly" },
  { value: "monthly-over-70", label: "70 초과", tradeType: "monthly" },
  { value: "jeonse-under-20000", label: "20000 이하", tradeType: "jeonse" },
  { value: "jeonse-20000-30000", label: "20000-30000", tradeType: "jeonse" },
  { value: "jeonse-over-30000", label: "30000 초과", tradeType: "jeonse" },
];

interface MapFilterPanelProps {
  filters: MapListingFilters;
  onTradeTypeChange: (tradeType: MapTradeType) => void;
  onPriceRangeChange: (priceRange: MapPriceRange) => void;
  onReset: () => void;
  onClose: () => void;
}

function MapFilterPanel({
  filters,
  onTradeTypeChange,
  onPriceRangeChange,
  onReset,
  onClose,
}: MapFilterPanelProps) {
  const visiblePriceOptions = priceOptions.filter(
    (option) => !option.tradeType || filters.tradeType === "all" || option.tradeType === filters.tradeType
  );

  return (
    <section className="map-filter-panel" aria-label="지도 필터">
      <div className="map-filter-panel__header">
        <strong>필터</strong>
        <button type="button" onClick={onClose} aria-label="필터 닫기">
          ×
        </button>
      </div>

      <div className="map-filter-panel__group">
        <span>거래 유형</span>
        <div>
          {tradeOptions.map((option) => (
            <button
              type="button"
              key={option.value}
              className={filters.tradeType === option.value ? "is-active" : ""}
              onClick={() => onTradeTypeChange(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="map-filter-panel__group">
        <span>가격</span>
        <div>
          {visiblePriceOptions.map((option) => (
            <button
              type="button"
              key={option.value}
              className={filters.priceRange === option.value ? "is-active" : ""}
              onClick={() => onPriceRangeChange(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        className="map-filter-panel__reset"
        onClick={onReset}
      >
        초기화
      </button>
    </section>
  );
}

function getFilterButtonLabel(filters: MapListingFilters): string {
  if (filters.tradeType === "all" && filters.priceRange === "all") {
    return "거래 유형/가격";
  }

  const tradeLabel =
    tradeOptions.find((option) => option.value === filters.tradeType)?.label ??
    "전체";
  const priceLabel =
    priceOptions.find((option) => option.value === filters.priceRange)?.label ??
    "전체";

  if (filters.priceRange === "all") return tradeLabel;
  if (filters.tradeType === "all") return priceLabel;
  return `${tradeLabel} ${priceLabel}`;
}
