export interface MapCluster {
  id: string;
  lat: number;
  lng: number;
  count: number;
  label?: string;
}

export type MapFilterType = "all" | "monthly" | "jeonse" | "sale";
