interface MapBottomSheetProps {
  totalCount: number;
  selectedClusterLabel?: string | null;
}

export function MapBottomSheet({
  totalCount,
  selectedClusterLabel,
}: MapBottomSheetProps) {
  return (
    <div className="map-sheet">
      <div className="map-sheet__handle" aria-hidden />
      <h2 className="map-sheet__title">매물</h2>
      <p className="map-sheet__meta">
        {selectedClusterLabel
          ? `${selectedClusterLabel} · `
          : ""}
        총 {totalCount}건
      </p>
    </div>
  );
}
