import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  readLatestCertificationDraft,
  savePrototypeListingDraft,
} from "../services/prototypeStorage";
import "./propertyRegister.css";

const optionItems = ["주차", "반려동물"];
const generatedViewerAssetId = "room0-studio-preview";
const defaultMimeTypeCandidates = [
  "video/webm;codecs=vp9",
  "video/webm;codecs=vp8",
  "video/mp4",
  "video/webm",
];

const guideItems = [
  "휴대폰 360°로 방 전체를 천천히 한 바퀴(최소 6초 이상) 촬영하세요.",
  "카메라를 천천히 낮추며 문, 창문, 부엌/욕실 입구 순으로 지나가면 공간이 선명하게 기록됩니다.",
  "짧은 흔들림은 괜찮지만 카메라를 멈추지 말고 일정한 보폭으로 이동하세요.",
  "촬영 중에는 플래시를 끄고, 가능하면 자연광이 있는 구간을 골라주세요.",
];

type ScanState = "idle" | "recording" | "processing" | "ready" | "error";

export function PropertyRegisterPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [scanVideoFileName, setScanVideoFileName] = useState("");
  const [recordedPreviewUrl, setRecordedPreviewUrl] = useState<string>("");
  const [scanMessage, setScanMessage] = useState("");
  const [scanSeconds, setScanSeconds] = useState(0);
  const [saved, setSaved] = useState(false);
  const cameraRef = useRef<HTMLVideoElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<number | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const latestCertification = readLatestCertificationDraft();
  const brokerName =
    latestCertification?.agentName.trim() || user?.nickname?.trim() || "중개인 회원";
  const brokerOfficeName = latestCertification?.officeName.trim() || "인증 사무소";
  const brokerRegistrationNumber = latestCertification?.agentNumber.trim();
  const recordingButtonLabel =
    scanState === "recording"
      ? "녹화 중지"
      : recordedPreviewUrl
        ? "다시 촬영"
        : "촬영 시작";

  const toggleOption = (option: string) => {
    setSelectedOptions((current) =>
      current.includes(option)
        ? current.filter((item) => item !== option)
        : [...current, option]
    );
  };

  const stopStream = useCallback(() => {
    const stream = streamRef.current;
    if (!stream) return;
    stream.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const stopRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state !== "recording") return;

    recorder.stop();
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const releasePreview = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setRecordedPreviewUrl("");
  }, []);

  const startScanProcessing = useCallback((videoFileName: string) => {
    setScanState("processing");
    setScanVideoFileName(videoFileName);
    setScanMessage("공간 보기를 준비하고 있습니다.");
    window.setTimeout(() => {
      setScanState("ready");
      setScanMessage("공간 보기가 준비되었습니다. 매물 등록 후 바로 확인할 수 있어요.");
    }, 1200);
  }, []);

  const startRecording = useCallback(async () => {
    const camera = cameraRef.current;
    if (!camera) return;

    setScanMessage("");
    releasePreview();
    setScanVideoFileName("");
    setScanSeconds(0);

    if (!navigator.mediaDevices?.getUserMedia) {
      setScanState("error");
      setScanMessage("이 브라우저는 카메라 녹화를 지원하지 않습니다.");
      return;
    }

    if (streamRef.current) {
      stopRecording();
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      streamRef.current = stream;
      camera.srcObject = stream;
      await camera.play();
      await new Promise<void>((resolve) => {
        setScanState("recording");
        window.setTimeout(resolve, 150);
      });

      const recorder = new MediaRecorder(
        stream,
        {
          mimeType: defaultMimeTypeCandidates.find((candidate) =>
            MediaRecorder.isTypeSupported(candidate)
          ),
        } as MediaRecorderOptions
      );
      chunksRef.current = [];
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const chunks = chunksRef.current;
        chunksRef.current = [];
        recorderRef.current = null;
        releasePreview();

        if (chunks.length === 0) {
          setScanState("idle");
          stopStream();
          return;
        }

        const blob = new Blob(chunks, {
          type: recorder.mimeType || "video/webm",
        });
        const safeName = `room-scan-${Date.now()}.webm`;
        const nextUrl = URL.createObjectURL(blob);
        previewUrlRef.current = nextUrl;
        setRecordedPreviewUrl(nextUrl);
        stopStream();
        startScanProcessing(safeName);
      };

      recorder.onerror = () => {
        setScanState("error");
        setScanMessage("녹화 중 문제가 발생했어요. 다시 시도해주세요.");
        recorderRef.current = null;
        stopRecording();
        stopStream();
      };

      setScanSeconds(0);
      timerRef.current = window.setInterval(() => {
        setScanSeconds((value) => value + 1);
      }, 1000);
      recorder.start(250);
    } catch (error) {
      stopStream();
      setScanState("error");
      setScanMessage(
        error instanceof DOMException
          ? error.message
          : "카메라 권한이 필요해요. 권한을 허용하고 다시 시도해 주세요."
      );
    }
  }, [releasePreview, startScanProcessing, stopRecording, stopStream]);

  const stopRecordingAndLeaveCamera = useCallback(() => {
    stopRecording();
    stopStream();
    setScanState(scanState === "recording" ? "ready" : scanState);
    if (cameraRef.current) {
      cameraRef.current.pause();
      cameraRef.current.srcObject = null;
    }
  }, [scanState, stopRecording, stopStream]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (scanState === "processing") {
      setScanMessage("모델 생성이 진행 중입니다. 완료되면 잠시 후 등록할 수 있어요.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    if (!scanVideoFileName) {
      setScanState("idle");
      setScanMessage("공간 보기를 등록하려면 동영상을 촬영해 주세요.");
      return;
    }

    savePrototypeListingDraft({
      address: String(formData.get("address") ?? ""),
      price: String(formData.get("price") ?? ""),
      size: String(formData.get("size") ?? ""),
      availableDate: String(formData.get("availableDate") ?? ""),
      options: selectedOptions,
      modelFileName: "generated-from-room-video.splat",
      scanSource: "camera",
      scanVideoFileName: scanVideoFileName || undefined,
      scanStatus: scanState === "ready" ? "ready" : "idle",
      brokerName,
      brokerOfficeName,
      brokerRegistrationNumber,
      viewerAssetId: generatedViewerAssetId,
    });

    releasePreview();
    stopStream();
    setSaved(true);
    setScanState("idle");
    setScanMessage("매물이 등록되었습니다.");
  };

  useEffect(() => {
    return () => {
      stopRecording();
      stopStream();
      releasePreview();
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
      }
    };
  }, [releasePreview, stopRecording, stopStream]);

  return (
    <main className="property-register">
      <div className="property-register__frame">
        <header className="property-register__header">
          <button type="button" onClick={() => navigate(-1)} aria-label="뒤로가기">
            <BackIcon />
          </button>
          <h1>매물 등록하기</h1>
        </header>

        <form className="property-register__form" onSubmit={handleSubmit}>
          <section className="property-register__broker" aria-label="등록 명의">
            <span>등록 명의</span>
            <strong>{brokerName}</strong>
            <small>
              {brokerOfficeName}
              {brokerRegistrationNumber ? ` · ${brokerRegistrationNumber}` : ""}
            </small>
          </section>

          <TextField id="address" label="주소" defaultValue="서울 동작구 상도동" />
          <TextField id="price" label="가격" defaultValue="월세 500/31" />
          <TextField id="size" label="면적" defaultValue="26.44m²" />
          <TextField id="availableDate" label="입주 가능일" defaultValue="즉시" />

          <section className="property-register__scan">
            <h2>공간 촬영</h2>
            <ol className="property-register__scan-guide">
              {guideItems.map((guide) => (
                <li key={guide}>{guide}</li>
              ))}
            </ol>
            <label className="property-register__camera">
              <video ref={cameraRef} playsInline muted />
              <span>
                {scanState === "recording"
                  ? `녹화 중 ${scanSeconds}s`
                  : scanState === "processing"
                    ? "3D 모델 생성 중..."
                    : "휴대폰 카메라 미리보기"}
              </span>
            </label>
            <div className="property-register__scan-actions">
              <button type="button" onClick={scanState === "recording" ? stopRecordingAndLeaveCamera : startRecording}>
                {recordingButtonLabel}
              </button>
            </div>
            {recordedPreviewUrl && (
              <video
                className="property-register__scan-preview"
                src={recordedPreviewUrl}
                controls
                playsInline
              />
            )}
          </section>

          <section className="property-register__options" aria-labelledby="register-options">
            <h2 id="register-options">옵션 선택</h2>
            <div>
              {optionItems.map((option) => (
                <label key={option}>
                  <input
                    type="checkbox"
                    checked={selectedOptions.includes(option)}
                    onChange={() => toggleOption(option)}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </section>

          {saved && (
            <p className="property-register__saved" role="status">
              {scanMessage || "매물 등록이 완료되었습니다."}
            </p>
          )}
          {scanMessage && !saved && (
            <p className="property-register__message" role="status">
              {scanMessage}
            </p>
          )}
          {scanState === "error" && (
            <p className="property-register__error" role="alert">
              {scanMessage}
            </p>
          )}

          <button type="submit" className="property-register__submit">
            매물 등록하기
          </button>
        </form>
      </div>
    </main>
  );
}

function TextField({
  id,
  label,
  defaultValue,
}: {
  id: string;
  label: string;
  defaultValue: string;
}) {
  return (
    <label className="property-register__field" htmlFor={id}>
      <span>{label}</span>
      <input id={id} name={id} placeholder="입력하기" defaultValue={defaultValue} />
    </label>
  );
}

function BackIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}
