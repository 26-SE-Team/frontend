import { mockChatRooms } from "../data/mockChats";
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
