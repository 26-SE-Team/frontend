import { useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ThreeDGSViewer } from "../components/viewer/ThreeDGSViewer";
import { defaultViewerAsset, findViewerAssetById } from "../data/mockViewerAssets";
import { findListingById } from "../data/mockListings";
import { loadSceneFromFile } from "../utils/sceneLoader";
import type { ViewerAsset, ViewerMode } from "../types/viewer";
import "./viewer.css";

const supportedModelExtensions = ["glb", "gltf", "ply"] as const;
const supportedSplatExtensions = ["splat", "ksplat"] as const;

export function ViewerPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [localAsset, setLocalAsset] = useState<ViewerAsset | null>(null);
  const [mode, setMode] = useState<ViewerMode>("orbit");
  const [fileError, setFileError] = useState<string | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const listingId = searchParams.get("listing") ?? undefined;

  const listing = useMemo(() => findListingById(listingId), [listingId]);
  const routeAsset = useMemo(
    () => (listing ? findViewerAssetById(listing.viewerAssetId) : defaultViewerAsset),
    [listing]
  );
  const asset = localAsset ?? routeAsset;
  const handleTogglePlanView = () => {
    setMode((currentMode) => (currentMode === "plan" ? "orbit" : "plan"));
  };

  const revokeObjectUrl = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileError(null);
    revokeObjectUrl();

    const extension = file.name.split(".").pop()?.toLowerCase();
    try {
      if (extension === "json") {
        const scene = await loadSceneFromFile(file);
        setLocalAsset({
          id: `local-${Date.now()}`,
          kind: "gaussian-scene",
          label: file.name,
          description: "사용자가 선택한 로컬 Gaussian scene JSON",
          scene,
        });
        return;
      }

      if (
        extension &&
        supportedModelExtensions.includes(
          extension as (typeof supportedModelExtensions)[number]
        )
      ) {
        const url = URL.createObjectURL(file);
        objectUrlRef.current = url;
        setLocalAsset({
          id: `local-${Date.now()}`,
          kind: "model-file",
          label: file.name,
          description: "사용자가 선택한 로컬 3D 모델",
          format: extension as "glb" | "gltf" | "ply",
          url,
        });
        return;
      }

      if (
        extension &&
        supportedSplatExtensions.includes(
          extension as (typeof supportedSplatExtensions)[number]
        )
      ) {
        const url = URL.createObjectURL(file);
        objectUrlRef.current = url;
        setLocalAsset({
          id: `local-${Date.now()}`,
          kind: "splat-scene",
          label: file.name,
          description: "사용자가 선택한 로컬 Gaussian Splat scene",
          url,
          format: extension as "splat" | "ksplat",
          previewImageUrl: "",
          photos: [],
          camera: {
            position: [-1.15, -4.2, 2.65],
            lookAt: [0, 0.65, 0],
            up: [0, -0.42, 0.9],
          },
        });
        return;
      }

      setFileError("지원하는 파일은 .json, .glb, .gltf, .ply, .splat, .ksplat입니다.");
    } catch {
      setFileError("파일 형식이 viewer 계약과 맞지 않습니다.");
    } finally {
      event.target.value = "";
    }
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
            <h1>{listing ? `${listing.price} 3D` : "3D 보기"}</h1>
          </div>
          <div className="viewer-page__header-actions">
            {listing && (
              <button
                type="button"
                onClick={() => navigate(`/listing/${listing.id}`)}
              >
                상세
              </button>
            )}
            <button type="button" onClick={() => navigate("/home")}>
              홈
            </button>
            <label className="viewer-page__file">
              <input
                type="file"
                accept=".json,.glb,.gltf,.ply,.splat,.ksplat"
                onChange={(event) => void handleFileChange(event)}
              />
              파일
            </label>
          </div>
        </header>

        <section className="viewer-page__stage" aria-label="3D 뷰어">
          <ThreeDGSViewer
            asset={asset}
            mode={mode}
            onTogglePlanView={handleTogglePlanView}
          />
        </section>

        {fileError && (
          <p className="viewer-page__error" role="alert">
            {fileError}
          </p>
        )}
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
