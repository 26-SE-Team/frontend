import type { ChatRoom } from "../types/chat";

export const mockChatRooms: ChatRoom[] = [
  {
    id: "chat-1",
    listingId: "rec-1",
    listingTitle: "상도역 원룸 3층",
    listingPrice: "월세 500/31",
    participantName: "상도 공인중개사",
    avatarUrl:
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=160&h=160&fit=crop",
    lastMessage: "오늘 오후 6시 이후 방문 가능합니다.",
    unreadCount: 2,
    messages: [
      {
        id: "m-1",
        sender: "agent",
        text: "안녕하세요. 상도역 원룸 문의 주셔서 감사합니다.",
        sentAt: "14:08",
      },
      {
        id: "m-2",
        sender: "me",
        text: "현장과 같은 구조인지 확인해도 될까요?",
        sentAt: "14:10",
      },
      {
        id: "m-3",
        sender: "agent",
        text: "네, 같은 호실을 촬영한 모델입니다. 오늘 오후 6시 이후 방문 가능합니다.",
        sentAt: "14:12",
      },
    ],
  },
  {
    id: "chat-2",
    listingId: "recent-1",
    listingTitle: "성수동 투룸",
    listingPrice: "월세 1000/80",
    participantName: "성수 하우스",
    avatarUrl:
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=160&h=160&fit=crop",
    lastMessage: "관리비에는 인터넷이 포함되어 있어요.",
    unreadCount: 0,
    messages: [
      {
        id: "m-4",
        sender: "agent",
        text: "관리비에는 인터넷이 포함되어 있어요.",
        sentAt: "어제",
      },
    ],
  },
  {
    id: "chat-3",
    listingId: "recent-2",
    listingTitle: "잠실 오피스텔",
    listingPrice: "전세 2억 5000",
    participantName: "잠실 직방 파트너",
    avatarUrl:
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=160&h=160&fit=crop",
    lastMessage: "등기부등본은 방문 전 공유드릴게요.",
    unreadCount: 1,
    messages: [
      {
        id: "m-5",
        sender: "agent",
        text: "등기부등본은 방문 전 공유드릴게요.",
        sentAt: "월",
      },
    ],
  },
];
