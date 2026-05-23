import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ThreeDGSViewer } from "../components/viewer/ThreeDGSViewer";
import type {
  ThreeDGSViewerHandle,
  ViewerMoveCommand,
} from "../components/viewer/ThreeDGSViewer";
import { defaultViewerAsset } from "../data/mockViewerAssets";
import { findListingById } from "../data/mockListings";
import { loadSceneFromFile } from "../utils/sceneLoader";
import type { ViewerAsset, ViewerMode } from "../types/viewer";
import "./viewer.css";

const supportedModelExtensions = ["glb", "gltf", "ply"] as const;

export function ViewerPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [asset, setAsset] = useState<ViewerAsset>(defaultViewerAsset);
  const [mode, setMode] = useState<ViewerMode>("orbit");
  const [fileError, setFileError] = useState<string | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const viewerRef = useRef<ThreeDGSViewerHandle | null>(null);
  const moveRepeatRef = useRef<ReturnType<typeof window.setInterval> | null>(
    null
  );
  const listingId = searchParams.get("listing") ?? undefined;

  const listing = useMemo(() => findListingById(listingId), [listingId]);

  const runMove = useCallback((command: ViewerMoveCommand) => {
    viewerRef.current?.move(command);
  }, []);

  const stopMove = useCallback(() => {
    if (!moveRepeatRef.current) return;
    window.clearInterval(moveRepeatRef.current);
    moveRepeatRef.current = null;
  }, []);

  const startMove = useCallback(
    (command: ViewerMoveCommand) => {
      stopMove();
      runMove(command);
      moveRepeatRef.current = window.setInterval(() => runMove(command), 80);
    },
    [runMove, stopMove]
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const keyMap: Partial<Record<string, ViewerMoveCommand>> = {
        w: "forward",
        W: "forward",
        s: "backward",
        S: "backward",
        a: "left",
        A: "left",
        d: "right",
        D: "right",
        r: "up",
        R: "up",
        f: "down",
        F: "down",
        q: "roll-left",
        Q: "roll-left",
        e: "roll-right",
        E: "roll-right",
        ArrowLeft: "yaw-left",
        ArrowRight: "yaw-right",
        ArrowUp: "pitch-up",
        ArrowDown: "pitch-down",
      };

      const command = keyMap[event.key];
      if (!command) return;

      event.preventDefault();
      runMove(command);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      stopMove();
    };
  }, [runMove, stopMove]);

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
        setAsset({
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
        setAsset({
          id: `local-${Date.now()}`,
          kind: "model-file",
          label: file.name,
          description: "사용자가 선택한 로컬 3D 모델",
          format: extension as "glb" | "gltf" | "ply",
          url,
        });
        return;
      }

      setFileError(".splat/.ksplat은 전용 3DGS renderer adapter를 붙인 뒤 열 수 있습니다.");
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
          <ThreeDGSViewer ref={viewerRef} asset={asset} mode={mode} />
          <div
            className="viewer-page__flight-controls"
            aria-label="6자유도 이동 컨트롤"
          >
            <div className="viewer-page__control-pad viewer-page__control-pad--move">
              <ControlButton
                label="위로 이동"
                command="up"
                onStart={startMove}
                onStop={stopMove}
              >
                ⇧
              </ControlButton>
              <ControlButton
                label="앞으로 이동"
                command="forward"
                onStart={startMove}
                onStop={stopMove}
              >
                ↑
              </ControlButton>
              <ControlButton
                label="아래로 이동"
                command="down"
                onStart={startMove}
                onStop={stopMove}
              >
                ⇩
              </ControlButton>
              <ControlButton
                label="왼쪽 이동"
                command="left"
                onStart={startMove}
                onStop={stopMove}
              >
                ←
              </ControlButton>
              <button type="button" onClick={() => viewerRef.current?.reset()}>
                ⌂
              </button>
              <ControlButton
                label="오른쪽 이동"
                command="right"
                onStart={startMove}
                onStop={stopMove}
              >
                →
              </ControlButton>
              <span aria-hidden />
              <ControlButton
                label="뒤로 이동"
                command="backward"
                onStart={startMove}
                onStop={stopMove}
              >
                ↓
              </ControlButton>
              <span aria-hidden />
            </div>

            <div className="viewer-page__control-pad viewer-page__control-pad--look">
              <ControlButton
                label="왼쪽 회전"
                command="yaw-left"
                onStart={startMove}
                onStop={stopMove}
              >
                ↶
              </ControlButton>
              <ControlButton
                label="위로 보기"
                command="pitch-up"
                onStart={startMove}
                onStop={stopMove}
              >
                ⤴
              </ControlButton>
              <ControlButton
                label="오른쪽 회전"
                command="yaw-right"
                onStart={startMove}
                onStop={stopMove}
              >
                ↷
              </ControlButton>
              <ControlButton
                label="왼쪽 롤"
                command="roll-left"
                onStart={startMove}
                onStop={stopMove}
              >
                ⟲
              </ControlButton>
              <ControlButton
                label="아래로 보기"
                command="pitch-down"
                onStart={startMove}
                onStop={stopMove}
              >
                ⤵
              </ControlButton>
              <ControlButton
                label="오른쪽 롤"
                command="roll-right"
                onStart={startMove}
                onStop={stopMove}
              >
                ⟳
              </ControlButton>
            </div>
          </div>
        </section>

        {fileError && (
          <p className="viewer-page__error" role="alert">
            {fileError}
          </p>
        )}

        <div className="viewer-page__modes" role="group" aria-label="뷰어 모드">
          <button
            type="button"
            className={mode === "orbit" ? "is-active" : ""}
            onClick={() => setMode("orbit")}
          >
            공간
          </button>
          <button
            type="button"
            className={mode === "plan" ? "is-active" : ""}
            onClick={() => setMode("plan")}
          >
            평면뷰
          </button>
          <button
            type="button"
            className={mode === "furniture" ? "is-active" : ""}
            onClick={() => setMode("furniture")}
          >
            가구 배치
          </button>
        </div>
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

interface ControlButtonProps {
  children: string;
  command: ViewerMoveCommand;
  label: string;
  onStart: (command: ViewerMoveCommand) => void;
  onStop: () => void;
}

function ControlButton({
  children,
  command,
  label,
  onStart,
  onStop,
}: ControlButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      onPointerDown={() => onStart(command)}
      onPointerUp={onStop}
      onPointerLeave={onStop}
      onPointerCancel={onStop}
    >
      {children}
    </button>
  );
}
