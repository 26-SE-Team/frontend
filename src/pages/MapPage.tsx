import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "../components/home/BottomNav";
import { PropertyMap } from "../components/map/PropertyMap";
import { MapFilterButton } from "../components/map/MapFilterButton";
import { MapBottomSheet } from "../components/map/MapBottomSheet";
import { allListings } from "../data/mockListings";
import type { Listing } from "../types/listing";
import "./map.css";

export function MapPage() {
  const navigate = useNavigate();
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);

  const totalCount = useMemo(
    () => allListings.filter((listing) => listing.mapPosition).length,
    []
  );

  return (
    <main className="map-page">
      <div className="map-page__frame">
        <div className="map-page__map-wrap">
          <PropertyMap
            listings={allListings}
            selectedListingId={selectedListing?.id ?? null}
            onListingClick={setSelectedListing}
          />
          <div className="map-page__overlay">
            <MapFilterButton />
          </div>
        </div>

        <MapBottomSheet
          totalCount={totalCount}
          listings={allListings}
          selectedListing={selectedListing}
          onListingClick={(listing) => navigate(`/listing/${listing.id}`)}
        />

        <BottomNav active="browse" />
      </div>
    </main>
  );
}
