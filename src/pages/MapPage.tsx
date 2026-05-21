import { useMemo, useState } from "react";
import { BottomNav } from "../components/home/BottomNav";
import { PropertyMap } from "../components/map/PropertyMap";
import { MapFilterButton } from "../components/map/MapFilterButton";
import { MapBottomSheet } from "../components/map/MapBottomSheet";
import { mapClusters } from "../data/mockMapClusters";
import type { MapCluster } from "../types/map";
import "./map.css";

export function MapPage() {
  const [selectedCluster, setSelectedCluster] = useState<MapCluster | null>(
    null
  );

  const totalCount = useMemo(
    () => mapClusters.reduce((sum, c) => sum + c.count, 0),
    []
  );

  return (
    <main className="map-page">
      <div className="map-page__frame">
        <div className="map-page__map-wrap">
          <PropertyMap
            clusters={mapClusters}
            onClusterClick={setSelectedCluster}
          />
          <div className="map-page__overlay">
            <MapFilterButton />
          </div>
        </div>

        <MapBottomSheet
          totalCount={totalCount}
          selectedClusterLabel={selectedCluster?.label ?? null}
        />

        <BottomNav active="browse" />
      </div>
    </main>
  );
}
