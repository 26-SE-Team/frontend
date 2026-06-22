export const detailListingCardZoom = 16;

export function shouldShowListingCardMarkers(zoom: number): boolean {
  return zoom >= detailListingCardZoom;
}

export function getMapClusterStep(zoom: number): number {
  if (shouldShowListingCardMarkers(zoom)) return 0;
  if (zoom >= 15) return 0.003;
  if (zoom >= 13) return 0.012;
  if (zoom >= 11) return 0.04;
  return 0.12;
}
