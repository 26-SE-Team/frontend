import { useCallback, useMemo } from "react";
import {
  GoogleMap,
  Marker,
  useJsApiLoader,
} from "@react-google-maps/api";
import { publicEnv } from "../../config/publicEnv";
import type { MapCluster } from "../../types/map";
import { SANGDO_CENTER } from "../../data/mockMapClusters";
import { createClusterIcon } from "../../utils/createClusterIcon";

const MAP_CONTAINER_STYLE = { width: "100%", height: "100%" };

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
  clusters: MapCluster[];
  onClusterClick?: (cluster: MapCluster) => void;
}

export function PropertyMap({ clusters, onClusterClick }: PropertyMapProps) {
  const apiKey = publicEnv.googleMapsApiKey;

  const { isLoaded, loadError } = useJsApiLoader({
    id: "stayview-google-map",
    googleMapsApiKey: apiKey,
    language: "ko",
    region: "KR",
  });

  const center = useMemo(() => SANGDO_CENTER, []);

  const handleMarkerClick = useCallback(
    (cluster: MapCluster) => () => {
      onClusterClick?.(cluster);
    },
    [onClusterClick]
  );

  if (!apiKey) {
    return (
      <div className="map-page__error">
        <p className="map-page__error-title">지도 API 키가 필요합니다</p>
        <p className="map-page__error-desc">
          GitHub Variables 또는 로컬 <code>.env.local</code>에{" "}
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
      center={center}
      zoom={16}
      options={MAP_OPTIONS}
    >
      {clusters.map((cluster) => (
        <Marker
          key={cluster.id}
          position={{ lat: cluster.lat, lng: cluster.lng }}
          icon={createClusterIcon(cluster.count)}
          title={cluster.label ?? `${cluster.count}개 매물`}
          onClick={handleMarkerClick(cluster)}
          zIndex={cluster.count}
        />
      ))}
    </GoogleMap>
  );
}
