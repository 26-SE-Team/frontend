import type { Listing } from "../types/listing";
import type { ChatMessage, ChatRoom } from "../types/chat";

export type SocialType = "GOOGLE" | "KAKAO" | "EMAIL";
export type Role = "USER" | "ADMIN";
export type VerificationStatus = "PENDING" | "APPROVED" | "REJECTED";
export type SpaceStatus = "AVAILABLE" | "RESERVED" | "DELETED";

export interface UserResponse {
  userId: string;
  socialType: SocialType;
  email?: string;
  name?: string;
  phone?: string;
  role: Role;
  deleted: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  loginType: string;
  accessMode: string;
  user: UserResponse;
}

export interface AgentProfileRequest {
  licenseNo: string;
  officeName: string;
}

export interface AgentProfileResponse {
  userId: string;
  userName: string;
  licenseNo: string;
  verificationStatus: VerificationStatus;
  rejectionReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SpaceCreateRequest {
  title: string;
  address: string;
  area: number;
  deposit: number;
  monthlyRent: number;
  maintenanceFee: number;
  roomType: string;
  availableDate: string;
  livingEnvironmentInfo?: string;
  imageUrls?: string[];
}

export interface SpaceResponse {
  spaceId: string;
  agentId?: string;
  agentName?: string;
  title: string;
  address: string;
  area?: number;
  deposit: number;
  monthlyRent: number;
  maintenanceFee: number;
  roomType: string;
  availableDate?: string;
  status: SpaceStatus;
  livingEnvironmentInfo?: string;
  imageUrls: string[];
  scrapped: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ChatRoomSummaryResponse {
  chatRoomId: string;
  spaceId: string;
  spaceTitle: string;
  tenantId?: string;
  tenantName?: string;
  agentId?: string;
  agentName?: string;
  lastMessage: string;
  lastSentAt?: string;
}

export interface ChatRoomDetailResponse {
  room: ChatRoomSummaryResponse;
  messages: ChatMessageResponse[];
}

export interface ChatMessageRequest {
  message: string;
}

export interface ChatMessageResponse {
  messageId: string;
  senderId?: string;
  senderName?: string;
  message: string;
  sentAt: string;
}

export function listingToSpaceResponse(
  listing: Listing,
  scrapped = false
): SpaceResponse {
  const price = parseListingPrice(listing.price);

  return {
    spaceId: listing.id,
    agentName: listing.brokerName,
    title: [listing.location, listing.type].filter(Boolean).join(" ") || listing.type,
    address: listing.location ?? "",
    area: parseArea(listing.size),
    deposit: price.deposit,
    monthlyRent: price.monthlyRent,
    maintenanceFee: parseFee(listing.managementFee),
    roomType: listing.type,
    availableDate: undefined,
    status: "AVAILABLE",
    livingEnvironmentInfo: listing.highlights?.join(", "),
    imageUrls: listing.imageUrls ?? [listing.imageUrl],
    scrapped,
  };
}

export function chatRoomToSummaryResponse(room: ChatRoom): ChatRoomSummaryResponse {
  return {
    chatRoomId: room.id,
    spaceId: room.listingId,
    spaceTitle: room.listingTitle,
    agentName: room.participantName,
    lastMessage: room.lastMessage,
  };
}

export function chatMessageToResponse(
  message: ChatMessage
): ChatMessageResponse {
  return {
    messageId: message.id,
    senderName: message.sender === "me" ? "나" : "중개사",
    message: message.text,
    sentAt: message.sentAt,
  };
}

function parseListingPrice(price: string) {
  const match = price.match(/(\d+)\s*\/\s*(\d+)/);

  return {
    deposit: match ? Number(match[1]) : 0,
    monthlyRent: match ? Number(match[2]) : 0,
  };
}

function parseArea(value: string | undefined) {
  if (!value) return undefined;

  const numericValue = Number(value.replace(/[^\d.]/g, ""));

  return Number.isFinite(numericValue) ? numericValue : undefined;
}

function parseFee(value: string | undefined) {
  if (!value) return 0;

  const numericValue = Number(value.replace(/[^\d.]/g, ""));

  return Number.isFinite(numericValue) ? numericValue : 0;
}
