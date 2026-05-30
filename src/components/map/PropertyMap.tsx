import { useCallback, useEffect, useMemo, useState } from "react";
import {
  GoogleMap,
  Marker,
  useJsApiLoader,
} from "@react-google-maps/api";
import { publicEnv } from "../../config/publicEnv";
import type { Listing } from "../../types/listing";

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
}

function createListingIcon(
  listing: Listing,
  isSelected: boolean
): google.maps.Icon {
  const label = listing.price.replace(/\s+/g, " ");
  const width = Math.max(82, Math.min(118, label.length * 11 + 24));
  const height = isSelected ? 44 : 38;
  const color = listing.viewerAssetId === "room0-studio-preview"
    ? "#7c3aed"
    : "#2563eb";
  const stroke = isSelected ? "#111827" : "#ffffff";
  const badge = listing.viewerAssetId === "room0-studio-preview"
    ? '<circle cx="16" cy="12" r="6" fill="#ffffff" fill-opacity="0.95"/><text x="16" y="12.6" text-anchor="middle" dominant-baseline="middle" fill="#7c3aed" font-size="7" font-weight="900" font-family="Pretendard, sans-serif">3D</text>'
    : "";
  const textX = listing.viewerAssetId === "room0-studio-preview" ? 31 : 14;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <path d="M10 3H${width - 10}Q${width - 3} 3 ${width - 3} 10V24Q${width - 3} 31 ${width - 10} 31H${width / 2 + 6}L${width / 2} ${height - 3}L${width / 2 - 6} 31H10Q3 31 3 24V10Q3 3 10 3Z" fill="${color}" stroke="${stroke}" stroke-width="${isSelected ? 3 : 2}"/>
      ${badge}
      <text x="${textX}" y="18.2" fill="#ffffff" font-size="12" font-weight="850" font-family="Pretendard, sans-serif">${label}</text>
    </svg>
  `;

  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg.trim())}`,
    scaledSize: new google.maps.Size(width, height),
    anchor: new google.maps.Point(width / 2, height - 3),
  };
}

export function PropertyMap({
  listings,
  selectedListingId,
  onListingClick,
}: PropertyMapProps) {
  const apiKey = publicEnv.googleMapsApiKey;
  const [map, setMap] = useState<google.maps.Map | null>(null);

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

  const handleMarkerClick = useCallback(
    (listing: Listing) => () => {
      onListingClick?.(listing);
    },
    [onListingClick]
  );

  if (!apiKey) {
    return (
      <div className="map-page__error">
        <p className="map-page__error-title">지도 API 키가 필요합니다</p>
        <p className="map-page__error-desc">
          GitHub Secrets 또는 로컬 <code>.env.local</code>에{" "}
          <code>VITE_GOOGLE_MAPS_API_KEY</code>를 설정해주세요.
        </p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="map-page__error">
        <p className="map-page__error-title">지도를 불러올 수 없습니다</p>
        <p className="map-page__error-desc">
          API 키와 Maps JavaScript API 설정을 확인해주세요.
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
      onLoad={setMap}
      onUnmount={() => setMap(null)}
    >
      {mappedListings.map((listing) => {
        const position = listing.mapPosition;
        if (!position) return null;

        return (
          <Marker
            key={listing.id}
            position={{ lat: position.lat, lng: position.lng }}
            icon={createListingIcon(listing, listing.id === selectedListingId)}
            title={position.label ?? `${listing.location} ${listing.type}`}
            onClick={handleMarkerClick(listing)}
            zIndex={listing.id === selectedListingId ? 10 : 1}
          />
        );
      })}
    </GoogleMap>
  );
}
