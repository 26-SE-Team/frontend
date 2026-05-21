import type { MapCluster } from "../types/map";

/** 상도역 인근 mock 클러스터 (지도 구간별 매물 수) */
export const SANGDO_CENTER = { lat: 37.5028, lng: 126.9479 };

export const mapClusters: MapCluster[] = [
  { id: "cluster-1", lat: 37.5042, lng: 126.9458, count: 3, label: "상도역 북서" },
  { id: "cluster-2", lat: 37.5035, lng: 126.9492, count: 2, label: "상도역 동쪽" },
  { id: "cluster-3", lat: 37.5018, lng: 126.9462, count: 2, label: "상도1동" },
  { id: "cluster-4", lat: 37.5025, lng: 126.9505, count: 1, label: "상도동 골목" },
  { id: "cluster-5", lat: 37.5009, lng: 126.9485, count: 1, label: "장승배기역 방향" },
  { id: "cluster-6", lat: 37.5015, lng: 126.9448, count: 5, label: "상도역 서쪽" },
];
