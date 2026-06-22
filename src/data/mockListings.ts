import type { Listing } from "../types/listing";
import {
  replicaViewerPhotosByScene,
  room0ViewerPhotos,
  type ReplicaSceneId,
} from "./mockViewerAssets";

const replicaImageSet = (scene: ReplicaSceneId) =>
  replicaViewerPhotosByScene[scene].map((photo) => photo.src);

export const recommendedListings: Listing[] = [
  {
    id: "rec-1",
    imageUrl: room0ViewerPhotos[3].src,
    imageUrls: room0ViewerPhotos.map((photo) => photo.src),
    price: "월세 500/31",
    type: "원룸",
    info: "3층, 관리비 5만",
    location: "동작구 상도동",
    station: "상도역 도보 6분",
    size: "23.8m²",
    floor: "3층 / 5층",
    managementFee: "5만 원",
    highlights: ["햇살 좋은 방", "깔끔한 구조", "채광 좋음"],
    options: ["소파", "테이블", "스탠드 조명", "블라인드"],
    viewerAssetId: "room0-studio-preview",
    mapPosition: {
      lat: 37.5031,
      lng: 126.948,
      label: "상도역 원룸",
    },
  },
  {
    id: "replica-apartment-0",
    imageUrl: replicaViewerPhotosByScene.apartment_0[0].src,
    imageUrls: replicaImageSet("apartment_0"),
    price: "월세 1000/54",
    type: "원룸",
    info: "3층, 관리비 6만",
    location: "동작구 상도동",
    station: "상도역 도보 5분",
    size: "24.8m²",
    floor: "3층 / 6층",
    managementFee: "6만 원",
    highlights: ["남향 채광", "정돈된 구조", "역 접근성 좋음"],
    options: ["에어컨", "책상", "블라인드", "인덕션"],
    viewerAssetId: "replica-apartment-0-3dgs",
    mapPosition: {
      lat: 37.5038,
      lng: 126.9486,
      label: "상도역 채광 원룸",
    },
  },
  {
    id: "replica-apartment-1",
    imageUrl: replicaViewerPhotosByScene.apartment_1[0].src,
    imageUrls: replicaImageSet("apartment_1"),
    price: "월세 1500/62",
    type: "오피스텔",
    info: "7층, 관리비 9만",
    location: "동작구 노량진동",
    station: "노량진역 도보 6분",
    size: "28.6m²",
    floor: "7층 / 13층",
    managementFee: "9만 원",
    highlights: ["역세권", "풀옵션", "생활 동선 편리"],
    options: ["냉장고", "드럼세탁기", "전자레인지", "인덕션"],
    viewerAssetId: "replica-apartment-1-3dgs",
    mapPosition: {
      lat: 37.5126,
      lng: 126.9437,
      label: "노량진 컴팩트 오피스텔",
    },
  },
  {
    id: "replica-apartment-2",
    imageUrl: replicaViewerPhotosByScene.apartment_2[0].src,
    imageUrls: replicaImageSet("apartment_2"),
    price: "월세 700/48",
    type: "원룸",
    info: "2층, 관리비 5만",
    location: "동작구 흑석동",
    station: "흑석역 도보 7분",
    size: "21.7m²",
    floor: "2층 / 5층",
    managementFee: "5만 원",
    highlights: ["큰 창", "차분한 주택가", "즉시 입주 협의"],
    options: ["책상", "옷장", "블라인드", "에어컨"],
    viewerAssetId: "replica-apartment-2-3dgs",
    mapPosition: {
      lat: 37.5078,
      lng: 126.9592,
      label: "흑석 채광형 원룸",
    },
  },
];

export const recentListings: Listing[] = [
  {
    id: "replica-room-1",
    imageUrl: replicaViewerPhotosByScene.room_1[0].src,
    imageUrls: replicaImageSet("room_1"),
    price: "월세 1000/57",
    type: "원룸",
    info: "4층, 관리비 6만",
    location: "영등포구 당산동",
    station: "당산역 도보 6분",
    size: "25.3m²",
    floor: "4층 / 7층",
    managementFee: "6만 원",
    highlights: ["가구 포함", "한강공원 접근", "수납 공간 여유"],
    options: ["침대", "책상", "스탠드 조명", "옷장"],
    viewerAssetId: "replica-room-1-3dgs",
    mapPosition: {
      lat: 37.5344,
      lng: 126.9024,
      label: "당산 가구 포함 원룸",
    },
  },
  {
    id: "replica-room-2",
    imageUrl: replicaViewerPhotosByScene.room_2[0].src,
    imageUrls: replicaImageSet("room_2"),
    price: "월세 1000/50",
    type: "원룸",
    info: "5층, 관리비 7만",
    location: "영등포구 문래동",
    station: "문래역 도보 5분",
    size: "26.1m²",
    floor: "5층 / 8층",
    managementFee: "7만 원",
    highlights: ["분리형 주방", "조용한 골목", "카페거리 인접"],
    options: ["세탁기", "인덕션", "수납장", "에어컨"],
    viewerAssetId: "replica-room-2-3dgs",
    mapPosition: {
      lat: 37.5186,
      lng: 126.8959,
      label: "문래 분리형 원룸",
    },
  },
];

export const allListings = [...recommendedListings, ...recentListings];

export function findListingById(id: string | undefined): Listing | undefined {
  if (!id) return undefined;
  return allListings.find((listing) => listing.id === id);
}
