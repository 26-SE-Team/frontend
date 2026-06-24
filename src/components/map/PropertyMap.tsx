import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Listing } from "../../types/listing";
import { formatMapPrice } from "../../utils/formatMapPrice";
import {
  filterListingsByMapBounds,
  type MapBoundsLiteral,
} from "../../utils/mapViewport";
import {
  getMapClusterStep,
  shouldShowListingCardMarkers,
} from "./mapMarkerConfig";

const SEOUL_CENTER: [number, number] = [37.5368, 126.9784];

interface PropertyMapProps {
  listings: Listing[];
  selectedListingId?: string | null;
  onListingClick?: (listing: Listing) => void;
  onVisibleListingsChange?: (listings: Listing[]) => void;
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

function getPriceCaption(price: string) {
  const normalized = price.trim();
  if (normalized.startsWith("월세")) return "보/월";
  if (normalized.startsWith("전세")) return "전세";
  if (normalized.startsWith("매매")) return "매매";
  return "가격";
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
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const [zoomLevel, setZoomLevel] = useState(11);

  const mappedListings = useMemo(
    () => listings.filter((listing) => listing.mapPosition),
    [listings]
  );
  const showListingCards = shouldShowListingCardMarkers(zoomLevel);

  const emitVisibleListings = useCallback(
    (targetMap: L.Map | null) => {
      if (!onVisibleListingsChange || !targetMap) return;

      const bounds = targetMap.getBounds();
      const literalBounds: MapBoundsLiteral = {
        north: bounds.getNorth(),
        east: bounds.getEast(),
        south: bounds.getSouth(),
        west: bounds.getWest(),
      };

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

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView(SEOUL_CENTER, 11);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
    }).addTo(map);

    markersGroupRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    map.on("zoomend", () => {
      setZoomLevel(map.getZoom());
    });

    map.on("moveend", () => {
      emitVisibleListings(map);
    });

    emitVisibleListings(map);

    return () => {
      map.off();
      map.remove();
      mapInstanceRef.current = null;
      markersGroupRef.current = null;
    };
  }, [emitVisibleListings]);

  // Fit bounds when listings load
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || mappedListings.length === 0) return;

    const bounds = L.latLngBounds(
      mappedListings.map((l) => [l.mapPosition!.lat, l.mapPosition!.lng])
    );
    map.fitBounds(bounds, { padding: [64, 64] });
  }, [mappedListings]);

  // Sync visible listings on listings change
  useEffect(() => {
    emitVisibleListings(mapInstanceRef.current);
  }, [listings, emitVisibleListings]);

  // Draw Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    mapPoints.forEach((point) => {
      const listing = point.listing;
      const isSelected = selectedListingId
        ? point.isCluster
          ? point.listings.some((candidate) => candidate.id === selectedListingId)
          : listing?.id === selectedListingId
        : false;

      let markerIcon: L.DivIcon;

      if (point.isCluster) {
        const count = point.listingCount;
        const color = isSelected ? "#1e293b" : "#2563eb";
        const border = isSelected ? "#0f172a" : "#dbeafe";
        const size = count >= 10 ? 52 : 46;

        const svg = `
          <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
            <circle cx="${size / 2}" cy="${size / 2}" r="18" fill="${color}" stroke="${border}" stroke-width="3"/>
            <text x="${size / 2}" y="${Math.max(24, Math.floor(size * 0.58))}" fill="#ffffff" font-size="${count >= 10 ? 16 : 14}" font-weight="900" font-family="Pretendard, sans-serif" text-anchor="middle">${count}</text>
          </svg>
        `;

        markerIcon = L.divIcon({
          html: svg.trim(),
          className: "custom-cluster-icon",
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });
      } else {
        if (!listing?.mapPosition) return;

        if (showListingCards) {
          const priceCaption = getPriceCaption(listing.price);
          const priceValue = formatMapPrice(listing.price);
          const html = `
            <button
              type="button"
              class="map-listing-card-marker ${isSelected ? "is-active" : ""}"
              style="margin: 0; pointer-events: auto;"
            >
              <span class="map-listing-card-marker__photo">
                <img src="${listing.imageUrl}" alt="" />
              </span>
              <span class="map-listing-card-marker__text">
                <em>${priceCaption}</em>
                <strong>${priceValue}</strong>
              </span>
            </button>
          `;

          markerIcon = L.divIcon({
            html: html.trim(),
            className: "custom-listing-card-icon",
            iconSize: [112, 42],
            iconAnchor: [56, 46],
          });
        } else {
          const color = isSelected ? "#1e293b" : "#2563eb";
          const border = isSelected ? "#0f172a" : "#dbeafe";
          const size = 30;

          const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
              <circle cx="${size / 2}" cy="${size / 2}" r="10" fill="${color}" stroke="${border}" stroke-width="2"/>
            </svg>
          `;

          markerIcon = L.divIcon({
            html: svg.trim(),
            className: "custom-listing-dot-icon",
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2],
          });
        }
      }

      const marker = L.marker([point.lat, point.lng], { icon: markerIcon });

      marker.on("click", (event) => {
        L.DomEvent.stopPropagation(event);
        if (point.isCluster && point.listings.length > 1) {
          map.setView([point.lat, point.lng], Math.min(map.getZoom() + 2, 18));
        } else if (point.listing) {
          onListingClick?.(point.listing);
        }
      });

      marker.addTo(markersGroup);
    });
  }, [mapPoints, selectedListingId, showListingCards, onListingClick]);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
