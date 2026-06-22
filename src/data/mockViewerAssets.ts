import type {
  GaussianSceneData,
  GaussianSplat,
  ViewerAsset,
  ViewerPhoto,
} from "../types/viewer";

export function toPublicDemoPath(
  path: string,
  baseUrl = import.meta.env?.BASE_URL ?? "/"
) {
  const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;

  return `${normalizedBaseUrl}${path.replace(/^\/+/, "")}`;
}

const demoPath = (path: string) => toPublicDemoPath(path);

const room0PhotoNames = [
  "room0_hotel_preview_01_frame000000",
  "room0_hotel_preview_02_frame000275",
  "room0_hotel_preview_03_frame000550",
  "room0_hotel_preview_04_frame000825",
  "room0_hotel_preview_05_frame001125",
  "room0_hotel_preview_06_frame001400",
  "room0_hotel_preview_07_frame001675",
  "room0_hotel_preview_08_frame001975",
] as const;

export const room0ViewerPhotos: ViewerPhoto[] = room0PhotoNames.map(
  (name, index) => ({
    id: `room0-photo-${index + 1}`,
    label: `${String(index + 1).padStart(2, "0")} / 실내 사진`,
    src: demoPath(`demo/room0/photos/${name}.webp`),
    thumbSrc: demoPath(`demo/room0/thumbs/${name}_thumb.webp`),
  })
);

function createRoomSplats(): GaussianSplat[] {
  const splats: GaussianSplat[] = [];
  let id = 0;

  for (let x = -5; x <= 5; x += 0.8) {
    for (let z = -4; z <= 4; z += 0.8) {
      splats.push({
        id: `floor-${id++}`,
        position: [x, 0, z],
        scale: 0.18,
        color: [218, 210, 198],
        opacity: 0.9,
      });
    }
  }

  for (let x = -5; x <= 5; x += 0.8) {
    for (let y = 0.8; y <= 3.2; y += 0.8) {
      splats.push({
        id: `wall-back-${id++}`,
        position: [x, y, -4],
        scale: 0.16,
        color: [238, 233, 224],
        opacity: 0.88,
      });
    }
  }

  for (let z = -4; z <= 4; z += 0.8) {
    for (let y = 0.8; y <= 3.2; y += 0.8) {
      splats.push({
        id: `wall-side-${id++}`,
        position: [-5, y, z],
        scale: 0.16,
        color: [232, 227, 218],
        opacity: 0.88,
      });
    }
  }

  for (let x = 1.2; x <= 4.2; x += 0.45) {
    for (let z = 0.8; z <= 2.8; z += 0.45) {
      splats.push({
        id: `bed-${id++}`,
        position: [x, 0.55, z],
        scale: 0.2,
        color: [128, 111, 96],
        opacity: 0.95,
      });
    }
  }

  for (let x = -3.8; x <= -1.4; x += 0.45) {
    for (let y = 0.5; y <= 1.7; y += 0.45) {
      splats.push({
        id: `desk-${id++}`,
        position: [x, y, 2.8],
        scale: 0.17,
        color: [91, 72, 55],
        opacity: 0.95,
      });
    }
  }

  return splats;
}

const sangdoStudioScene: GaussianSceneData = {
  name: "상도역 원룸 가상공간",
  description: "실내 공간 보기 데이터",
  splats: createRoomSplats(),
  viewpoints: [
    {
      id: "door",
      label: "현관",
      description: "입구에서 방 전체를 보는 시점",
      position: [4.4, 1.6, 5.2],
      target: [0, 1.2, 0],
    },
    {
      id: "window",
      label: "창가",
      description: "침대와 창가 쪽을 확인하는 시점",
      position: [-4.2, 1.7, 3.2],
      target: [1.8, 1.1, 0.5],
    },
    {
      id: "desk",
      label: "책상",
      description: "수납과 책상 영역을 보는 시점",
      position: [1.2, 1.6, 4.4],
      target: [-2.8, 1.0, 2.6],
    },
  ],
};

export const defaultViewerAsset: ViewerAsset = {
  id: "sangdo-studio",
  kind: "gaussian-scene",
  label: "상도역 원룸",
  description: "실내 공간 보기",
  scene: sangdoStudioScene,
};

export const room0ViewerAsset: ViewerAsset = {
  id: "room0-studio-preview",
  kind: "splat-scene",
  label: "상도역 원룸",
  description: "상도역 원룸 실내 공간",
  url: demoPath("demo/room0/models/room0.splat"),
  format: "splat",
  previewImageUrl: demoPath("demo/room0/photos/room0_3dgs_preview.webp"),
  photos: room0ViewerPhotos,
  fallbackScene: sangdoStudioScene,
  camera: {
    position: [-1.15, -4.2, 2.65],
    lookAt: [0, 0.65, 0],
    up: [0, -0.42, 0.9],
  },
  planCamera: {
    position: [-0.15, 0.15, 11],
    lookAt: [-0.15, 0.15, 0.28],
    up: [0, 1, 0],
  },
  navigationFrame: {
    autoAlign: true,
    floor: {
      enabled: true,
      autoDetect: true,
      quantile: 0.05,
      eyeHeight: 1.45,
      startOffset: 1.8,
      lookDistance: 3.2,
    },
  },
  transform: {
    position: [0, 0, 0],
    rotation: [0, 0, 0, 1],
    scale: [1, 1, 1],
  },
  stats: {
    dataset: "room0",
    gaussianCount: 80000,
    finalEvalLoss: 0.019625112414360046,
  },
};

export const replicaSceneIds = [
  "apartment_0",
  "apartment_1",
  "apartment_2",
  "hotel_0",
  "room_1",
  "room_2",
] as const;

export type ReplicaSceneId = (typeof replicaSceneIds)[number];

const replicaSceneLabels: Record<ReplicaSceneId, string> = {
  apartment_0: "상도역 채광 원룸",
  apartment_1: "노량진 컴팩트 오피스텔",
  apartment_2: "흑석 채광형 원룸",
  hotel_0: "업로드 생성 데모 공간",
  room_1: "당산 가구 포함 원룸",
  room_2: "문래 분리형 원룸",
};

const replicaPhotoNames = Array.from({ length: 20 }, (_, index) =>
  String(index + 1).padStart(3, "0")
);

export const replicaViewerPhotosByScene: Record<ReplicaSceneId, ViewerPhoto[]> =
  Object.fromEntries(
    replicaSceneIds.map((sceneId) => [
      sceneId,
      replicaPhotoNames.map((captureNumber, index) => ({
        id: `${sceneId}-photo-${captureNumber}`,
        label: `${String(index + 1).padStart(2, "0")} / 실내 사진`,
        src: demoPath(`demo/${sceneId}/photos/${sceneId}_capture_${captureNumber}.webp`),
        thumbSrc: demoPath(
          `demo/${sceneId}/thumbs/${sceneId}_capture_${captureNumber}_thumb.webp`
        ),
      })),
    ])
  ) as Record<ReplicaSceneId, ViewerPhoto[]>;

export const uploadGeneratedReplicaSceneId: ReplicaSceneId = "hotel_0";
export const uploadGeneratedViewerAssetId = "replica-hotel-0-3dgs";

function createReplicaViewerAsset(sceneId: ReplicaSceneId): ViewerAsset {
  const label = replicaSceneLabels[sceneId];
  const photos = replicaViewerPhotosByScene[sceneId];

  return {
    id: `replica-${sceneId.replace("_", "-")}-3dgs`,
    kind: "splat-scene",
    label,
    description: `${label} 실내 공간`,
    url: demoPath(`demo/${sceneId}/models/${sceneId}.splat`),
    format: "splat",
    previewImageUrl: photos[0]?.src ?? demoPath("demo/room0/photos/room0_3dgs_preview.webp"),
    photos,
    fallbackScene: sangdoStudioScene,
    camera: {
      position: [0, -3.8, 1.8],
      lookAt: [0, 0.3, 0.35],
      up: [0, -0.18, 0.98],
    },
    planCamera: {
      position: [0, 0, 9.5],
      lookAt: [0, 0, 0],
      up: [0, 1, 0],
    },
    navigationFrame: {
      autoAlign: true,
      floor: {
        enabled: true,
        autoDetect: true,
        quantile: 0.05,
        eyeHeight: 1.45,
        startOffset: 1.8,
        lookDistance: 3.2,
      },
    },
    transform: {
      position: [0, 0, 0],
      rotation: [0, 0, 0, 1],
      scale: [1, 1, 1],
    },
    stats: {
      dataset: sceneId,
      gaussianCount: 80000,
      finalEvalLoss: 0.018,
    },
  };
}

const replicaViewerAssets = replicaSceneIds.map(createReplicaViewerAsset);

export const viewerAssets = [
  ...replicaViewerAssets,
  room0ViewerAsset,
  defaultViewerAsset,
];

export function findViewerAssetById(id: string | undefined): ViewerAsset {
  return viewerAssets.find((asset) => asset.id === id) ?? defaultViewerAsset;
}
