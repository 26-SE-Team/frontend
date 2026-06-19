import { useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ThreeDGSViewer,
  type ThreeDGSViewerHandle,
} from "../components/viewer/ThreeDGSViewer";
import { defaultViewerAsset, findViewerAssetById } from "../data/mockViewerAssets";
import { allListings } from "../data/mockListings";
import { readDraftListingsForDisplay } from "../services/prototypeStorage";
import type { ViewerMode } from "../types/viewer";
import "./viewer.css";

export function ViewerPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<ViewerMode>("orbit");
  const viewerRef = useRef<ThreeDGSViewerHandle | null>(null);
  const listingId = searchParams.get("listing") ?? undefined;

  const listing = useMemo(() => {
    const catalog = [...allListings, ...readDraftListingsForDisplay()];
    return catalog.find((item) => item.id === listingId);
  }, [listingId]);
  const routeAsset = useMemo(
    () => (listing ? findViewerAssetById(listing.viewerAssetId) : defaultViewerAsset),
    [listing]
  );
  const handleTogglePlanView = () => {
    setMode((currentMode) => (currentMode === "plan" ? "orbit" : "plan"));
  };
  const handleResetView = () => {
    viewerRef.current?.reset();
  };

  return (
    <main className="viewer-page">
      <div className="viewer-page__frame">
        <header className="viewer-page__header">
          <button type="button" onClick={() => navigate(-1)} aria-label="뒤로가기">
            <BackIcon />
          </button>
          <div>
            <p>{listing?.location ?? "StayView"}</p>
            <h1>{listing ? listing.price : "공간 보기"}</h1>
          </div>
          <div className="viewer-page__header-actions" aria-label="공간 보기 조작">
            <button type="button" onClick={handleResetView}>
              초기화
            </button>
            <button
              type="button"
              aria-pressed={mode === "plan"}
              onClick={handleTogglePlanView}
            >
              {mode === "plan" ? "평면뷰 해제" : "평면뷰"}
            </button>
          </div>
        </header>

        <section className="viewer-page__stage" aria-label="공간 뷰어">
          <ThreeDGSViewer
            ref={viewerRef}
            asset={routeAsset}
            mode={mode}
          />
        </section>
      </div>
    </main>
  );
}

function BackIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}
