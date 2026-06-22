import type { Listing } from "../types/listing";
import type { ChatRoom } from "../types/chat";
import type {
  ChatMessageRequest,
  ChatRoomDetailResponse,
  ChatRoomSummaryResponse,
} from "./apiContracts";
import {
  chatMessageToResponse,
  chatRoomToSummaryResponse,
} from "./apiContracts";
import {
  appendPrototypeChatMessage,
  buildPrototypeChatRoomCatalog,
  ensurePrototypeChatRoomForListing,
  readPrototypeChatRooms,
  type StorageLike,
} from "./prototypeStorage";

export interface ChatRepository {
  listRooms(storage?: StorageLike): ChatRoom[];
  listRoomSummaries(storage?: StorageLike): ChatRoomSummaryResponse[];
  listPotentialRooms(listings: Listing[], rooms?: ChatRoom[]): ChatRoom[];
  ensureRoomForSpace(listing: Listing, storage?: StorageLike): ChatRoom;
  sendMessage(
    roomId: string,
    request: ChatMessageRequest,
    storage?: StorageLike
  ): ChatRoom[];
  getRoomDetail(room: ChatRoom): ChatRoomDetailResponse;
}

export const localChatRepository: ChatRepository = {
  listRooms(storage) {
    return readPrototypeChatRooms(storage);
  },

  listRoomSummaries(storage) {
    return readPrototypeChatRooms(storage).map(chatRoomToSummaryResponse);
  },

  listPotentialRooms(listings, rooms = readPrototypeChatRooms()) {
    return buildPrototypeChatRoomCatalog(listings, rooms);
  },

  ensureRoomForSpace(listing, storage) {
    return ensurePrototypeChatRoomForListing(listing, storage);
  },

  sendMessage(roomId, request, storage) {
    return appendPrototypeChatMessage(roomId, request.message, storage);
  },

  getRoomDetail(room) {
    return {
      room: chatRoomToSummaryResponse(room),
      messages: room.messages.map(chatMessageToResponse),
    };
  },
};

export const chatRepository = localChatRepository;
