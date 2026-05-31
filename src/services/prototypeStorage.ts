import { mockChatRooms } from "../data/mockChats";
import { room0ViewerPhotos } from "../data/mockViewerAssets";
import type { Listing } from "../types/listing";
import type { ChatRoom } from "../types/chat";

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear?(): void;
}

export interface PrototypeListingDraft {
  id: string;
  address: string;
  price: string;
  size: string;
  availableDate: string;
  options: string[];
  modelFileName?: string;
  scanSource?: "camera" | "upload";
  scanVideoFileName?: string;
  scanStatus?: "idle" | "ready" | "processing" | "failed";
  viewerAssetId?: string;
  mapPosition?: Listing["mapPosition"];
  brokerName?: string;
  brokerOfficeName?: string;
  brokerRegistrationNumber?: string;
  createdAt: string;
}

export interface PrototypeCertificationDraft {
  id: string;
  agentName: string;
  agentNumber: string;
  officeName: string;
  fileName?: string;
  createdAt: string;
}

export const prototypeStorageKeys = {
  chatRooms: "stayview_chat_rooms",
  favoriteListings: "stayview_favorite_listing_ids",
  listingDrafts: "stayview_listing_drafts",
  certificationDrafts: "stayview_certification_drafts",
} as const;

const publicRoot = (path: string) =>
  `${import.meta.env?.BASE_URL ?? "/"}${path.replace(/^\/+/, "")}`;

const defaultScanViewerAssetId = "room0-studio-preview";

const generatedRoomImageUrls = room0ViewerPhotos.map((photo) => photo.src);
const generatedRoomCoverImageUrl =
  generatedRoomImageUrls[3] ??
  publicRoot("demo/room0/photos/room0_3dgs_preview.webp");

const mapFallbacks: Array<{
  keywords: string[];
  lat: number;
  lng: number;
  label: string;
}> = [
  { keywords: ["상도", "동작"], lat: 37.5031, lng: 126.948, label: "상도역" },
  { keywords: ["연남", "홍대"], lat: 37.5627, lng: 126.9246, label: "홍대입구역" },
  { keywords: ["역삼", "강남"], lat: 37.5008, lng: 127.0369, label: "역삼역" },
  { keywords: ["성수", "성동"], lat: 37.5446, lng: 127.0559, label: "성수역" },
  { keywords: ["잠실", "송파"], lat: 37.5111, lng: 127.086, label: "잠실새내역" },
  { keywords: ["이태원", "용산"], lat: 37.5347, lng: 126.9946, label: "이태원역" },
];

function hashString(value: string) {
  return [...value].reduce(
    (acc, char) => (acc * 31 + char.codePointAt(0)!) % 100000,
    1
  );
}

function resolveDraftMapPosition(address: string): Listing["mapPosition"] {
  const normalized = address.replace(/\s/g, "");
  const fallback = mapFallbacks.find((entry) =>
    entry.keywords.some((keyword) => normalized.includes(keyword))
  );

  const baseLat = fallback?.lat ?? 37.5275;
  const baseLng = fallback?.lng ?? 126.964;
  const hash = hashString(address);
  const latOffset = (hash % 500 - 250) / 10000;
  const lngOffset = ((hash * 7) % 500 - 250) / 10000;

  return {
    lat: Number((baseLat + latOffset).toFixed(6)),
    lng: Number((baseLng + lngOffset).toFixed(6)),
    label: fallback?.label ?? "서울 전역",
  };
}

export function mapDraftToListing(draft: PrototypeListingDraft): Listing {
  return {
    id: draft.id,
    imageUrl: generatedRoomCoverImageUrl,
    imageUrls: generatedRoomImageUrls,
    price: draft.price || "가격 미입력",
    type: "원룸",
    info: `${draft.size || "면적 미입력"} · ${draft.availableDate || "입주일 미입력"}`,
    location: draft.address || "입력 필요",
    station: "주소 기반 자동 매칭",
    size: draft.size || undefined,
    floor: "현재층 / 전체층",
    managementFee: "관리비 협의",
    highlights: ["공간 보기 등록 완료", ...(draft.options.length ? draft.options : ["옵션 미등록"])],
    options: draft.options,
    brokerName: draft.brokerName,
    brokerOfficeName: draft.brokerOfficeName,
    brokerRegistrationNumber: draft.brokerRegistrationNumber,
    viewerAssetId: draft.viewerAssetId ?? defaultScanViewerAssetId,
    mapPosition: draft.mapPosition ?? resolveDraftMapPosition(draft.address),
  };
}

export function readDraftListingsForDisplay(
  storage: StorageLike = getPrototypeStorage()
): Listing[] {
  const drafts = readPrototypeListingDrafts(storage);
  return drafts.map(mapDraftToListing);
}

const fallbackStorage = createMemoryStorage();
const defaultFavoriteListingIds = ["rec-1"];

export function createMemoryStorage(): StorageLike {
  const values = new Map<string, string>();

  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
    clear: () => values.clear(),
  };
}

export function getPrototypeStorage(): StorageLike {
  if (typeof globalThis.localStorage !== "undefined") {
    return globalThis.localStorage;
  }

  return fallbackStorage;
}

export function resetPrototypeFallbackStorage() {
  fallbackStorage.clear?.();
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function readJson<T>(
  key: string,
  fallback: T,
  storage: StorageLike = getPrototypeStorage()
): T {
  const raw = storage.getItem(key);
  if (!raw) return cloneJson(fallback);

  try {
    return JSON.parse(raw) as T;
  } catch {
    return cloneJson(fallback);
  }
}

export function writeJson<T>(
  key: string,
  value: T,
  storage: StorageLike = getPrototypeStorage()
) {
  storage.setItem(key, JSON.stringify(value));
}

export function readPrototypeChatRooms(
  storage: StorageLike = getPrototypeStorage()
): ChatRoom[] {
  return readJson(prototypeStorageKeys.chatRooms, mockChatRooms, storage);
}

export function savePrototypeChatRooms(
  rooms: ChatRoom[],
  storage: StorageLike = getPrototypeStorage()
) {
  writeJson(prototypeStorageKeys.chatRooms, rooms, storage);
}

export function appendPrototypeChatMessage(
  roomId: string,
  text: string,
  storage: StorageLike = getPrototypeStorage(),
  clock = () => Date.now()
): ChatRoom[] {
  const trimmedText = text.trim();
  if (!trimmedText) return readPrototypeChatRooms(storage);

  const nextRooms = readPrototypeChatRooms(storage).map((room) =>
    room.id === roomId
      ? {
          ...room,
          lastMessage: trimmedText,
          unreadCount: 0,
          messages: [
            ...room.messages,
            {
              id: `local-${clock()}`,
              sender: "me" as const,
              text: trimmedText,
              sentAt: "방금",
            },
          ],
        }
      : room
  );

  savePrototypeChatRooms(nextRooms, storage);
  return nextRooms;
}

export function readFavoriteListingIds(
  storage: StorageLike = getPrototypeStorage()
): string[] {
  return readJson(
    prototypeStorageKeys.favoriteListings,
    defaultFavoriteListingIds,
    storage
  );
}

export function saveFavoriteListingIds(
  listingIds: string[],
  storage: StorageLike = getPrototypeStorage()
) {
  writeJson(
    prototypeStorageKeys.favoriteListings,
    Array.from(new Set(listingIds)),
    storage
  );
}

export function toggleFavoriteListing(
  listingId: string,
  storage: StorageLike = getPrototypeStorage()
): string[] {
  const currentIds = readFavoriteListingIds(storage);
  const nextIds = currentIds.includes(listingId)
    ? currentIds.filter((id) => id !== listingId)
    : [listingId, ...currentIds];

  saveFavoriteListingIds(nextIds, storage);
  return nextIds;
}

export function removeFavoriteListing(
  listingId: string,
  storage: StorageLike = getPrototypeStorage()
): string[] {
  const nextIds = readFavoriteListingIds(storage).filter((id) => id !== listingId);
  saveFavoriteListingIds(nextIds, storage);
  return nextIds;
}

export function readPrototypeListingDrafts(
  storage: StorageLike = getPrototypeStorage()
): PrototypeListingDraft[] {
  return readJson(prototypeStorageKeys.listingDrafts, [], storage);
}

export function savePrototypeListingDraft(
  draft: Omit<PrototypeListingDraft, "id" | "createdAt">,
  storage: StorageLike = getPrototypeStorage(),
  clock = () => new Date()
): PrototypeListingDraft {
  const now = clock();
  const savedDraft: PrototypeListingDraft = {
    ...draft,
    id: `draft-${now.getTime()}`,
    createdAt: now.toISOString(),
  };
  const drafts = [savedDraft, ...readPrototypeListingDrafts(storage)].slice(0, 20);

  writeJson(prototypeStorageKeys.listingDrafts, drafts, storage);
  return savedDraft;
}

export function readCertificationDrafts(
  storage: StorageLike = getPrototypeStorage()
): PrototypeCertificationDraft[] {
  return readJson(prototypeStorageKeys.certificationDrafts, [], storage);
}

export function readLatestCertificationDraft(
  storage: StorageLike = getPrototypeStorage()
): PrototypeCertificationDraft | null {
  return readCertificationDrafts(storage)[0] ?? null;
}

export function saveCertificationDraft(
  draft: Omit<PrototypeCertificationDraft, "id" | "createdAt">,
  storage: StorageLike = getPrototypeStorage(),
  clock = () => new Date()
): PrototypeCertificationDraft {
  const now = clock();
  const savedDraft: PrototypeCertificationDraft = {
    ...draft,
    id: `cert-${now.getTime()}`,
    createdAt: now.toISOString(),
  };
  const drafts = [savedDraft, ...readCertificationDrafts(storage)].slice(0, 10);

  writeJson(prototypeStorageKeys.certificationDrafts, drafts, storage);
  return savedDraft;
}
