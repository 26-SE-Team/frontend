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
  mapFilterLimits,
  matchesMapListingFilters,
  type MapListingFilters,
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
    filters.tradeType !== "all" ||
    filters.depositMax !== defaultMapListingFilters.depositMax ||
    filters.monthlyRentMax !== defaultMapListingFilters.monthlyRentMax ||
    filters.managementFeeMax !== defaultMapListingFilters.managementFeeMax;

  useEffect(() => {
    if (
      selectedListing &&
      !filteredListings.some((listing) => listing.id === selectedListing.id)
    ) {
      setSelectedListing(null);
    }
  }, [filteredListings, selectedListing]);

  const handleTradeTypeChange = (tradeType: MapTradeType) => {
    setFilters((current) => ({ ...current, tradeType }));
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
              onFilterChange={(patch) =>
                setFilters((current) => ({ ...current, ...patch }))
              }
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

interface MapFilterPanelProps {
  filters: MapListingFilters;
  onTradeTypeChange: (tradeType: MapTradeType) => void;
  onFilterChange: (patch: Partial<MapListingFilters>) => void;
  onReset: () => void;
  onClose: () => void;
}

function MapFilterPanel({
  filters,
  onTradeTypeChange,
  onFilterChange,
  onReset,
  onClose,
}: MapFilterPanelProps) {
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

      <RangeFilter
        id="map-deposit-filter"
        label="보증금"
        value={filters.depositMax}
        max={mapFilterLimits.depositMax}
        step={500}
        displayValue={formatDepositLabel(filters.depositMax)}
        onChange={(depositMax) => onFilterChange({ depositMax })}
      />

      {filters.tradeType !== "jeonse" && (
        <RangeFilter
          id="map-monthly-filter"
          label="월세"
          value={filters.monthlyRentMax}
          max={mapFilterLimits.monthlyRentMax}
          step={5}
          displayValue={formatMonthlyLabel(filters.monthlyRentMax)}
          onChange={(monthlyRentMax) => onFilterChange({ monthlyRentMax })}
        />
      )}

      <RangeFilter
        id="map-maintenance-filter"
        label="관리비"
        value={filters.managementFeeMax}
        max={mapFilterLimits.managementFeeMax}
        step={1}
        displayValue={formatManagementFeeLabel(filters.managementFeeMax)}
        onChange={(managementFeeMax) => onFilterChange({ managementFeeMax })}
      />

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

interface RangeFilterProps {
  id: string;
  label: string;
  value: number;
  max: number;
  step: number;
  displayValue: string;
  onChange: (value: number) => void;
}

function RangeFilter({
  id,
  label,
  value,
  max,
  step,
  displayValue,
  onChange,
}: RangeFilterProps) {
  return (
    <label className="map-filter-panel__range" htmlFor={id}>
      <span>
        <strong>{label}</strong>
        <em>{displayValue}</em>
      </span>
      <input
        id={id}
        type="range"
        min="0"
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function getFilterButtonLabel(filters: MapListingFilters): string {
  if (
    filters.tradeType === "all" &&
    filters.depositMax === defaultMapListingFilters.depositMax &&
    filters.monthlyRentMax === defaultMapListingFilters.monthlyRentMax &&
    filters.managementFeeMax === defaultMapListingFilters.managementFeeMax
  ) {
    return "거래 유형/가격";
  }

  const tradeLabel =
    tradeOptions.find((option) => option.value === filters.tradeType)?.label ??
    "전체";

  return filters.tradeType === "all" ? "조건 적용됨" : `${tradeLabel} 조건`;
}

function formatDepositLabel(value: number): string {
  if (value >= mapFilterLimits.depositMax) return "전체";
  if (value >= 10000) {
    const eok = Math.floor(value / 10000);
    const rest = value % 10000;
    return rest > 0 ? `${eok}억 ${rest}만 이하` : `${eok}억 이하`;
  }
  return `${value}만 이하`;
}

function formatMonthlyLabel(value: number): string {
  return value >= mapFilterLimits.monthlyRentMax ? "전체" : `${value}만 이하`;
}

function formatManagementFeeLabel(value: number): string {
  return value >= mapFilterLimits.managementFeeMax ? "전체" : `${value}만 이하`;
}
