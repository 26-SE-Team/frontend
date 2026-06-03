import { useCallback, useEffect, useMemo, useState } from "react";
import {
  GoogleMap,
  Marker,
  useJsApiLoader,
} from "@react-google-maps/api";
import { publicEnv } from "../../config/publicEnv";
import type { Listing } from "../../types/listing";
import {
  filterListingsByMapBounds,
  type MapBoundsLiteral,
} from "../../utils/mapViewport";

const MAP_CONTAINER_STYLE = { width: "100%", height: "100%" };
const SEOUL_CENTER = { lat: 37.5368, lng: 126.9784 };

const MAP_OPTIONS: google.maps.MapOptions = {
  disableDefaultUI: true,
  zoomControl: false,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
  clickableIcons: false,
  gestureHandling: "greedy",
};

interface PropertyMapProps {
  listings: Listing[];
  selectedListingId?: string | null;
  onListingClick?: (listing: Listing) => void;
  onVisibleListingsChange?: (listings: Listing[]) => void;
}

function createClusterIcon(count: number, isSelected: boolean): google.maps.Icon {
  const size = count >= 10 ? 52 : 46;
  const color = isSelected ? "#1e293b" : "#2563eb";
  const border = isSelected ? "#0f172a" : "#dbeafe";

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <circle cx="${size / 2}" cy="${size / 2}" r="18" fill="${color}" stroke="${border}" stroke-width="3"/>
      <text x="${size / 2}" y="${Math.max(24, Math.floor(size * 0.58))}" fill="#ffffff" font-size="${count >= 10 ? 16 : 14}" font-weight="900" font-family="Pretendard, sans-serif" text-anchor="middle">${count}</text>
    </svg>
  `;

  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg.trim())}`,
    scaledSize: new google.maps.Size(size, size),
    anchor: new google.maps.Point(size / 2, size / 2),
  };
}

type ClusterPoint = {
  id: string;
  lat: number;
  lng: number;
  listingCount: number;
  isCluster: boolean;
  listing?: Listing;
  listings: Listing[];
};

function getMapClusterStep(zoom: number): number {
  if (zoom >= 17) return 0.0015;
  if (zoom >= 15) return 0.003;
  if (zoom >= 13) return 0.012;
  if (zoom >= 11) return 0.04;
  return 0.12;
}

function roundToGrid(value: number, step: number): number {
  const index = Math.round(value / step);
  return index * step;
}

export function PropertyMap({
  listings,
  selectedListingId,
  onListingClick,
  onVisibleListingsChange,
}: PropertyMapProps) {
  const apiKey = publicEnv.googleMapsApiKey;
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [zoomLevel, setZoomLevel] = useState(11);

  const { isLoaded, loadError } = useJsApiLoader({
    id: "stayview-google-map",
    googleMapsApiKey: apiKey,
    language: "ko",
    region: "KR",
  });

  const mappedListings = useMemo(
    () => listings.filter((listing) => listing.mapPosition),
    [listings]
  );

  const emitVisibleListings = useCallback(
    (targetMap: google.maps.Map | null) => {
      if (!onVisibleListingsChange) return;

      const bounds = targetMap?.getBounds();
      const literalBounds: MapBoundsLiteral | null = bounds
        ? {
            north: bounds.getNorthEast().lat(),
            east: bounds.getNorthEast().lng(),
            south: bounds.getSouthWest().lat(),
            west: bounds.getSouthWest().lng(),
          }
        : null;

      onVisibleListingsChange(
        filterListingsByMapBounds(mappedListings, literalBounds)
      );
    },
    [mappedListings, onVisibleListingsChange]
  );

  const mapPoints = useMemo(() => {
    if (mappedListings.length === 0) return [];

    const clusterStep = getMapClusterStep(zoomLevel);

    if (clusterStep === 0) {
      return mappedListings.map<ClusterPoint>((listing) => ({
        id: listing.id,
        lat: listing.mapPosition!.lat,
        lng: listing.mapPosition!.lng,
        listingCount: 1,
        isCluster: false,
        listing,
        listings: [listing],
      }));
    }

    const grouped = new Map<string, Listing[]>();

    for (const listing of mappedListings) {
      const position = listing.mapPosition;
      if (!position) continue;

      const bucketLat = roundToGrid(position.lat, clusterStep);
      const bucketLng = roundToGrid(position.lng, clusterStep);
      const key = `${bucketLat.toFixed(5)},${bucketLng.toFixed(5)}`;

      const bucket = grouped.get(key);
      if (bucket) {
        bucket.push(listing);
      } else {
        grouped.set(key, [listing]);
      }
    }

    return [...grouped.entries()].map(([key, clusterListings]) => {
      const [latText, lngText] = key.split(",");
      const lat = Number(latText);
      const lng = Number(lngText);

      if (clusterListings.length === 1) {
        const listing = clusterListings[0];
        return {
          id: listing.id,
          lat,
          lng,
          listingCount: 1,
          isCluster: false,
          listing,
          listings: clusterListings,
        };
      }

      return {
        id: key,
        lat,
        lng,
        listingCount: clusterListings.length,
        isCluster: true,
        listings: clusterListings,
      };
    });
  }, [mappedListings, zoomLevel]);

  useEffect(() => {
    if (!map || !isLoaded || mappedListings.length === 0) return;

    const bounds = new google.maps.LatLngBounds();
    mappedListings.forEach((listing) => {
      const position = listing.mapPosition;
      if (!position) return;
      bounds.extend({ lat: position.lat, lng: position.lng });
    });

    map.fitBounds(bounds, 64);
  }, [isLoaded, map, mappedListings]);

  const handleMapLoad = useCallback((nextMap: google.maps.Map) => {
    setMap(nextMap);
    setZoomLevel(nextMap.getZoom() ?? 11);
    emitVisibleListings(nextMap);
  }, [emitVisibleListings]);

  const handleMapIdle = useCallback(() => {
    if (!map) return;
    setZoomLevel(map.getZoom() ?? 11);
    emitVisibleListings(map);
  }, [emitVisibleListings, map]);

  useEffect(() => {
    emitVisibleListings(map);
  }, [emitVisibleListings, map]);

  const handlePointClick = useCallback(
    (point: ClusterPoint) => () => {
      if (point.isCluster && point.listings.length > 1) {
        if (!map) return;
        map.setCenter({ lat: point.lat, lng: point.lng });
        const nextZoom = Math.min((map.getZoom() ?? 14) + 2, 18);
        map.setZoom(nextZoom);
        return;
      }

      if (point.listing) {
        onListingClick?.(point.listing);
      }
    },
    [map, onListingClick]
  );

  if (!apiKey) {
    return (
      <div className="map-page__error">
        <p className="map-page__error-title">지도를 불러올 수 없습니다</p>
        <p className="map-page__error-desc">
          잠시 후 다시 시도해주세요.
        </p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="map-page__error">
        <p className="map-page__error-title">지도를 불러올 수 없습니다</p>
        <p className="map-page__error-desc">
          잠시 후 다시 시도해주세요.
        </p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="map-page__loading">
        <span className="map-page__spinner" />
        <p>지도 불러오는 중...</p>
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={MAP_CONTAINER_STYLE}
      center={SEOUL_CENTER}
      zoom={11}
      options={MAP_OPTIONS}
      onLoad={handleMapLoad}
      onIdle={handleMapIdle}
      onUnmount={() => setMap(null)}
    >
      {mapPoints.map((point) => {
        const listing = point.listing;
        if (point.isCluster) {
          const isSelected =
            selectedListingId &&
            point.listings.some((candidate) => candidate.id === selectedListingId);

          return (
            <Marker
              key={point.id}
              position={{ lat: point.lat, lng: point.lng }}
              icon={createClusterIcon(point.listingCount, Boolean(isSelected))}
              title={`${point.listingCount}건`}
              onClick={handlePointClick(point)}
              zIndex={isSelected ? 10 : 1}
            />
          );
        }

        if (!listing?.mapPosition) return null;
        const position = listing.mapPosition;
        const isSelected = listing.id === selectedListingId;

        return (
          <Marker
            key={point.id}
            position={{ lat: point.lat, lng: point.lng }}
            icon={createClusterIcon(point.listingCount, isSelected)}
            title={position.label ?? `${listing.location} ${listing.type}`}
            onClick={handlePointClick(point)}
            zIndex={isSelected ? 10 : 1}
          />
        );
      })}
    </GoogleMap>
  );
}
