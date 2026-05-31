import type { Listing } from "../types/listing";
import { room0ViewerPhotos } from "./mockViewerAssets";

const publicPath = (path: string) =>
  `${import.meta.env?.BASE_URL ?? "/"}${path.replace(/^\/+/, "")}`;

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
    id: "rec-2",
    imageUrl:
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=400&fit=crop",
    price: "월세 500/55",
    type: "원룸",
    info: "3층, 관리비 5만",
    location: "마포구 연남동",
    station: "홍대입구역 도보 9분",
    size: "19.8m²",
    floor: "3층 / 4층",
    managementFee: "5만 원",
    highlights: ["조용한 골목", "최근 리모델링", "남향"],
    options: ["옷장", "전자레인지", "인덕션"],
    viewerAssetId: "sangdo-studio",
    mapPosition: {
      lat: 37.5627,
      lng: 126.9246,
      label: "홍대입구역 원룸",
    },
  },
  {
    id: "rec-3",
    imageUrl: publicPath("listings/studio-apartment-8142976.jpg"),
    price: "월세 500/55",
    type: "원룸",
    info: "3층, 관리비 5만",
    location: "강남구 역삼동",
    station: "역삼역 도보 7분",
    size: "23.1m²",
    floor: "5층 / 8층",
    managementFee: "7만 원",
    highlights: ["엘리베이터", "보안 출입", "넓은 수납"],
    options: ["에어컨", "세탁기", "붙박이장"],
    viewerAssetId: "sangdo-studio",
    mapPosition: {
      lat: 37.5008,
      lng: 127.0369,
      label: "역삼역 원룸",
    },
  },
];

export const recentListings: Listing[] = [
  {
    id: "recent-1",
    imageUrl:
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=400&h=400&fit=crop",
    price: "월세 1000/80",
    type: "투룸",
    info: "5층, 관리비 8만",
    location: "성동구 성수동",
    station: "성수역 도보 6분",
    size: "34.2m²",
    floor: "5층 / 6층",
    managementFee: "8만 원",
    highlights: ["분리형 거실", "반려동물 협의", "채광 좋음"],
    options: ["소파", "식탁", "에어컨"],
    viewerAssetId: "sangdo-studio",
    mapPosition: {
      lat: 37.5446,
      lng: 127.0559,
      label: "성수역 투룸",
    },
  },
  {
    id: "recent-2",
    imageUrl:
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=400&h=400&fit=crop",
    price: "전세 2억 5000",
    type: "오피스텔",
    info: "12층, 관리비 12만",
    location: "송파구 잠실동",
    station: "잠실새내역 도보 4분",
    size: "28.7m²",
    floor: "12층 / 18층",
    managementFee: "12만 원",
    highlights: ["고층 전망", "보안 우수", "주차 가능"],
    options: ["빌트인 냉장고", "드럼세탁기", "인덕션"],
    viewerAssetId: "sangdo-studio",
    mapPosition: {
      lat: 37.5111,
      lng: 127.086,
      label: "잠실새내역 오피스텔",
    },
  },
  {
    id: "recent-3",
    imageUrl:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400&h=400&fit=crop",
    price: "월세 300/40",
    type: "원룸",
    info: "2층, 관리비 4만",
    location: "용산구 이태원동",
    station: "이태원역 도보 8분",
    size: "18.5m²",
    floor: "2층 / 3층",
    managementFee: "4만 원",
    highlights: ["저렴한 월세", "즉시 입주", "개별 난방"],
    options: ["냉장고", "세탁기", "가스레인지"],
    viewerAssetId: "sangdo-studio",
    mapPosition: {
      lat: 37.5347,
      lng: 126.9946,
      label: "이태원역 원룸",
    },
  },
];

export const allListings = [...recommendedListings, ...recentListings];

export function findListingById(id: string | undefined): Listing | undefined {
  if (!id) return undefined;
  return allListings.find((listing) => listing.id === id);
}
