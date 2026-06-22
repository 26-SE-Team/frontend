import { useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  readLatestCertificationDraft,
  type PrototypeListingDraft,
} from "../services/prototypeStorage";
import { spaceRepository } from "../services/spaceRepository";
import { viewerRepository } from "../services/viewerRepository";
import "./propertyRegister.css";

const optionItems = ["주차", "반려동물"];
const uploadGeneratedModelFileName = "hotel_0.splat";
const generationQueuedDelayMs = 400;
const modelInferenceDelayMs = 10000;
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

const uploadGuideItems = [
  "방 전체 구조가 보이는 사진을 먼저 선택해 주세요.",
  "창가, 주방, 욕실 입구처럼 생활 동선이 드러나는 사진을 함께 올리면 좋아요.",
  "어둡거나 흔들린 사진은 제외하고, 같은 방향의 중복 사진은 줄여주세요.",
];

const scanSourceItems = [
  {
    value: "camera",
    label: "공간 촬영",
  },
  {
    value: "upload",
    label: "이미지 선택",
  },
] as const;

type ScanState =
  | "idle"
  | "recording"
  | "queued"
  | "processing"
  | "ready"
  | "error";
type ScanSource = "camera" | "upload";
type AreaUnit = "sqm" | "pyeong";

type UploadedImagePreview = {
  id: string;
  name: string;
  file: File;
  url: string;
  sizeLabel: string;
};

const areaUnitLabels: Record<AreaUnit, string> = {
  sqm: "m²",
  pyeong: "평",
};
const squareMetersPerPyeong = 3.305785;

const areaUnitItems: Array<{ value: AreaUnit; label: string }> = [
  { value: "sqm", label: areaUnitLabels.sqm },
  { value: "pyeong", label: areaUnitLabels.pyeong },
];

function formatAreaSize(value: string, unit: AreaUnit) {
  const normalized = value.trim();
  return normalized ? `${normalized}${areaUnitLabels[unit]}` : "";
}

function formatConvertedAreaValue(value: number) {
  return value.toFixed(2).replace(/\.?0+$/, "");
}

function convertAreaValue(value: string, fromUnit: AreaUnit, toUnit: AreaUnit) {
  if (fromUnit === toUnit) return value;

  const numericValue = Number(value);
  if (!value.trim() || !Number.isFinite(numericValue)) return value;

  const convertedValue =
    fromUnit === "sqm"
      ? numericValue / squareMetersPerPyeong
      : numericValue * squareMetersPerPyeong;

  return formatConvertedAreaValue(convertedValue);
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))}KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export function PropertyRegisterPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [scanSource, setScanSource] = useState<ScanSource>("camera");
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [scanVideoFileName, setScanVideoFileName] = useState("");
  const [recordedPreviewUrl, setRecordedPreviewUrl] = useState<string>("");
  const [uploadedImages, setUploadedImages] = useState<UploadedImagePreview[]>([]);
  const [selectedUploadImageIds, setSelectedUploadImageIds] = useState<string[]>([]);
  const [areaValue, setAreaValue] = useState("26.44");
  const [areaUnit, setAreaUnit] = useState<AreaUnit>("sqm");
  const [scanMessage, setScanMessage] = useState("");
  const [scanSeconds, setScanSeconds] = useState(0);
  const [saved, setSaved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const cameraRef = useRef<HTMLVideoElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<number | null>(null);
  const modelInferenceTimerRef = useRef<number | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const uploadPreviewUrlsRef = useRef<string[]>([]);
  const latestCertification = readLatestCertificationDraft();
  const brokerName =
    latestCertification?.agentName.trim() || user?.nickname?.trim() || "인증 회원";
  const brokerOfficeName = latestCertification?.officeName.trim() || "인증 사무소";
  const brokerRegistrationNumber = latestCertification?.agentNumber.trim();
  const recordingButtonLabel =
    scanState === "recording"
      ? "녹화 중지"
      : recordedPreviewUrl
        ? "다시 촬영"
        : "촬영 시작";
  const selectedUploadImages = uploadedImages.filter((image) =>
    selectedUploadImageIds.includes(image.id)
  );
  const allUploadedImagesSelected =
    uploadedImages.length > 0 && selectedUploadImages.length === uploadedImages.length;

  const waitForGenerationStep = useCallback(
    (delayMs: number) =>
      new Promise<void>((resolve) => {
        modelInferenceTimerRef.current = window.setTimeout(() => {
          modelInferenceTimerRef.current = null;
          resolve();
        }, delayMs);
      }),
    []
  );

  const waitForModelInference = useCallback(
    () => waitForGenerationStep(modelInferenceDelayMs),
    [waitForGenerationStep]
  );

  const changeAreaUnit = (nextUnit: AreaUnit) => {
    if (nextUnit === areaUnit) return;

    setAreaValue((currentValue) =>
      convertAreaValue(currentValue, areaUnit, nextUnit)
    );
    setAreaUnit(nextUnit);
  };

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

  const clearCameraPreview = useCallback(() => {
    if (!cameraRef.current) return;
    cameraRef.current.pause();
    cameraRef.current.srcObject = null;
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

  const releaseUploadPreviews = useCallback(() => {
    uploadPreviewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    uploadPreviewUrlsRef.current = [];
    setUploadedImages([]);
    setSelectedUploadImageIds([]);
  }, []);

  const releasePreview = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setRecordedPreviewUrl("");
  }, []);

  const startScanProcessing = useCallback((videoFileName: string) => {
    setScanSource("camera");
    setScanState("processing");
    setScanVideoFileName(videoFileName);
    setScanMessage("촬영 영상을 분석하고 있습니다.");
    window.setTimeout(() => {
      setScanState("ready");
      setScanMessage("공간 보기가 준비되었습니다. 매물 등록 후 바로 확인할 수 있어요.");
    }, 1200);
  }, []);

  const startRecording = useCallback(async () => {
    const camera = cameraRef.current;
    if (!camera) return;

    setSaved(false);
    setScanSource("camera");
    setScanMessage("");
    releasePreview();
    releaseUploadPreviews();
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
  }, [releasePreview, releaseUploadPreviews, startScanProcessing, stopRecording, stopStream]);

  const stopRecordingAndLeaveCamera = useCallback(() => {
    stopRecording();
    stopStream();
    setScanState(scanState === "recording" ? "ready" : scanState);
    clearCameraPreview();
  }, [clearCameraPreview, scanState, stopRecording, stopStream]);

  const selectScanSource = (nextSource: ScanSource) => {
    if (nextSource === scanSource) return;

    setSaved(false);
    setScanSource(nextSource);
    setScanMessage("");

    if (nextSource === "upload") {
      stopRecording();
      stopStream();
      clearCameraPreview();
      setScanState(uploadedImages.length > 0 ? "ready" : "idle");
      return;
    }

    setScanState(scanVideoFileName ? "ready" : "idle");
  };

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    const imageFiles = files.filter((file) => file.type.startsWith("image/"));
    releaseUploadPreviews();
    releasePreview();
    stopRecording();
    stopStream();
    clearCameraPreview();
    setSaved(false);
    setScanSource("upload");
    setScanVideoFileName("");

    if (imageFiles.length === 0) {
      setScanState("error");
      setScanMessage("이미지 파일만 선택할 수 있어요.");
      input.value = "";
      return;
    }

    const previews = imageFiles.map((file, index) => {
      const url = URL.createObjectURL(file);
      uploadPreviewUrlsRef.current.push(url);

      return {
        id: `${file.name}-${file.lastModified}-${index}`,
        name: file.name,
        file,
        url,
        sizeLabel: formatFileSize(file.size),
      };
    });

    setUploadedImages(previews);
    setSelectedUploadImageIds(previews.map((image) => image.id));
    setScanState("ready");
    setScanMessage("");
    input.value = "";
  };

  const clearUploadedImages = () => {
    releaseUploadPreviews();
    setScanState("idle");
    setScanMessage("");
  };

  const toggleUploadImageSelection = (imageId: string) => {
    setSelectedUploadImageIds((current) =>
      current.includes(imageId)
        ? current.filter((id) => id !== imageId)
        : [...current, imageId]
    );
  };

  const toggleAllUploadImages = () => {
    setSelectedUploadImageIds(
      allUploadedImagesSelected ? [] : uploadedImages.map((image) => image.id)
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    if (scanState === "queued" || scanState === "processing") {
      setScanMessage("모델 생성이 진행 중입니다. 완료되면 잠시 후 등록할 수 있어요.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const formattedAreaSize = formatAreaSize(areaValue, areaUnit);
    if (!formattedAreaSize) {
      setScanMessage("면적을 입력해 주세요.");
      return;
    }

    if (scanSource === "camera" && !scanVideoFileName) {
      setScanState("idle");
      setScanMessage("공간 촬영을 선택했다면 방 영상을 먼저 촬영해 주세요.");
      return;
    }

    if (scanSource === "upload" && uploadedImages.length === 0) {
      setScanState("idle");
      setScanMessage("이미지 선택을 선택했다면 매물 사진을 1장 이상 올려주세요.");
      return;
    }

    if (scanSource === "upload" && selectedUploadImages.length === 0) {
      setScanState("idle");
      setScanMessage("상세 사진으로 사용할 이미지를 1장 이상 선택해 주세요.");
      return;
    }

    const draftPayload: Omit<PrototypeListingDraft, "id" | "createdAt"> = {
      address: String(formData.get("address") ?? ""),
      price: String(formData.get("price") ?? ""),
      size: formattedAreaSize,
      availableDate: String(formData.get("availableDate") ?? ""),
      options: selectedOptions,
      modelFileName:
        scanSource === "camera"
          ? "generated-from-room-video.splat"
          : uploadGeneratedModelFileName,
      scanSource,
      scanVideoFileName: scanSource === "camera" ? scanVideoFileName : undefined,
      scanImageFileNames:
        scanSource === "upload" ? selectedUploadImages.map((image) => image.name) : undefined,
      scanImageUrls: undefined,
      scanStatus:
        scanState === "ready" || scanSource === "upload" ? "completed" : "idle",
      brokerName,
      brokerOfficeName,
      brokerRegistrationNumber,
      viewerAssetId:
        scanSource === "upload"
          ? viewerRepository.getUploadGeneratedAssetId()
          : viewerRepository.getCameraGeneratedAssetId(),
    };

    if (scanSource === "upload") {
      setIsSubmitting(true);
      setSaved(false);
      setScanState("queued");
      setScanMessage("공간 생성 요청이 접수되었습니다.");

      try {
        await waitForGenerationStep(generationQueuedDelayMs);
        setScanState("processing");
        setScanMessage("공간 모델을 생성하고 있습니다.");
        await waitForModelInference();
        const savedDraft = spaceRepository.createSpaceDraft(draftPayload);

        spaceRepository.rememberViewedSpace(savedDraft.id);

        releasePreview();
        releaseUploadPreviews();
        stopStream();
        clearCameraPreview();
        setSaved(true);
        setScanState("ready");
        setScanMessage("준비된 3D 공간 모델로 매물이 등록되었습니다.");
        window.setTimeout(() => {
          navigate(`/listing/${savedDraft.id}`);
        }, 700);
      } catch {
        setScanState("error");
        setScanMessage("매물 정보를 저장하지 못했어요. 다시 시도해주세요.");
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    spaceRepository.createSpaceDraft(draftPayload);

    releasePreview();
    releaseUploadPreviews();
    stopStream();
    clearCameraPreview();
    setSaved(true);
    setScanState("idle");
    setScanMessage("공간 보기와 매물 정보가 등록되었습니다.");
  };

  useEffect(() => {
    return () => {
      stopRecording();
      stopStream();
      releasePreview();
      releaseUploadPreviews();
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
      }
      if (modelInferenceTimerRef.current !== null) {
        window.clearTimeout(modelInferenceTimerRef.current);
      }
    };
  }, [releasePreview, releaseUploadPreviews, stopRecording, stopStream]);

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
          <AreaField
            value={areaValue}
            unit={areaUnit}
            onValueChange={setAreaValue}
            onUnitChange={changeAreaUnit}
          />
          <TextField id="availableDate" label="입주 가능일" defaultValue="즉시" />

          <section className="property-register__scan" aria-labelledby="register-media">
            <div className="property-register__section-heading">
              <h2 id="register-media">공간 자료</h2>
              <p>방을 촬영하거나 준비된 이미지를 선택해 매물에 연결하세요.</p>
            </div>

            <div
              className="property-register__source-toggle"
              role="radiogroup"
              aria-label="공간 자료 등록 방식"
            >
              {scanSourceItems.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  role="radio"
                  aria-checked={scanSource === item.value}
                  className={scanSource === item.value ? "is-selected" : ""}
                  onClick={() => selectScanSource(item.value)}
                  disabled={isSubmitting}
                >
                  <strong>{item.label}</strong>
                </button>
              ))}
            </div>

            {scanSource === "camera" ? (
              <div className="property-register__scan-panel">
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
                  <button
                    type="button"
                    onClick={scanState === "recording" ? stopRecordingAndLeaveCamera : startRecording}
                    disabled={isSubmitting}
                  >
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
              </div>
            ) : (
              <div className="property-register__scan-panel">
                <ol className="property-register__scan-guide">
                  {uploadGuideItems.map((guide) => (
                    <li key={guide}>{guide}</li>
                  ))}
                </ol>
                <label className="property-register__upload-picker" htmlFor="room-images">
                  <input
                    id="room-images"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    disabled={isSubmitting}
                  />
                  <strong>이미지 선택하기</strong>
                  <span>JPG, PNG, WEBP 형식의 방 사진을 여러 장 선택할 수 있어요.</span>
                </label>

                {isSubmitting && scanSource === "upload" && (
                  <div className="property-register__upload-processing" role="status">
                    <span aria-hidden />
                    <strong>
                      {scanState === "queued" ? "생성 요청 접수" : "공간 모델 생성 중"}
                    </strong>
                    <p>
                      {scanState === "queued"
                        ? "선택한 사진과 매물 정보를 저장하고 있습니다."
                        : "선택한 사진으로 모델 인퍼런스를 진행하고 있습니다."}
                    </p>
                  </div>
                )}

                {uploadedImages.length > 0 && (
                  <div className="property-register__upload-result">
                    <div className="property-register__upload-summary">
                      <span>
                        <strong>상세 사진 선택</strong>
                        <small>
                          {uploadedImages.length}장 중 {selectedUploadImages.length}장 표시
                        </small>
                      </span>
                      <div>
                        <button
                          type="button"
                          onClick={toggleAllUploadImages}
                          disabled={isSubmitting}
                        >
                          {allUploadedImagesSelected ? "전체 해제" : "전체 선택"}
                        </button>
                        <button type="button" onClick={clearUploadedImages} disabled={isSubmitting}>
                          비우기
                        </button>
                      </div>
                    </div>

                    <p className="property-register__upload-help">
                      체크한 사진만 상세 페이지의 메인 사진과 썸네일 목록에 표시됩니다.
                    </p>

                    <div className="property-register__upload-grid" aria-label="상세 사진 선택">
                      {uploadedImages.map((image) => {
                        const isSelected = selectedUploadImageIds.includes(image.id);
                        const selectedIndex =
                          selectedUploadImages.findIndex((selected) => selected.id === image.id) + 1;

                        return (
                          <button
                            type="button"
                            key={image.id}
                            className={`property-register__upload-card${isSelected ? " is-selected" : ""}`}
                            aria-pressed={isSelected}
                            onClick={() => toggleUploadImageSelection(image.id)}
                            disabled={isSubmitting}
                          >
                            <img src={image.url} alt={`${image.name} 미리보기`} />
                            <span className="property-register__upload-check">
                              {isSelected ? selectedIndex : ""}
                            </span>
                            <span className="property-register__upload-caption">
                              <span>{image.name}</span>
                              <small>{image.sizeLabel}</small>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
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
          {scanMessage && !saved && scanState !== "error" && (
            <p className="property-register__message" role="status">
              {scanMessage}
            </p>
          )}
          {scanState === "error" && (
            <p className="property-register__error" role="alert">
              {scanMessage}
            </p>
          )}

          <button
            type="submit"
            className="property-register__submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "모델 생성 중..." : "매물 등록하기"}
          </button>
        </form>
      </div>
    </main>
  );
}

function AreaField({
  value,
  unit,
  onValueChange,
  onUnitChange,
}: {
  value: string;
  unit: AreaUnit;
  onValueChange: (value: string) => void;
  onUnitChange: (unit: AreaUnit) => void;
}) {
  return (
    <label className="property-register__field" htmlFor="area-value">
      <span>면적</span>
      <div className="property-register__area-row">
        <input
          id="area-value"
          name="areaValue"
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          placeholder="입력하기"
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
        />
        <div className="property-register__area-unit" role="radiogroup" aria-label="면적 단위">
          {areaUnitItems.map((item) => (
            <button
              key={item.value}
              type="button"
              role="radio"
              aria-checked={unit === item.value}
              className={unit === item.value ? "is-selected" : ""}
              onClick={() => onUnitChange(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </label>
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
