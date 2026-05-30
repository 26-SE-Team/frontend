import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { BottomNav } from "../components/home/BottomNav";
import { SearchBar } from "../components/home/SearchBar";
import { StayViewLogo } from "../components/start/StayViewLogo";
import { mockChatRooms } from "../data/mockChats";
import "./chat.css";

export function ChatPage() {
  const [rooms, setRooms] = useState(mockChatRooms);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");

  const activeRoom = useMemo(
    () => rooms.find((room) => room.id === activeRoomId) ?? null,
    [activeRoomId, rooms]
  );
  const filteredRooms = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return rooms;

    return rooms.filter((room) =>
      [room.listingTitle, room.listingPrice, room.participantName, room.lastMessage]
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    );
  }, [query, rooms]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || !activeRoom) return;

    setRooms((currentRooms) =>
      currentRooms.map((room) =>
        room.id === activeRoom.id
          ? {
              ...room,
              lastMessage: text,
              unreadCount: 0,
              messages: [
                ...room.messages,
                {
                  id: `local-${Date.now()}`,
                  sender: "me",
                  text,
                  sentAt: "방금",
                },
              ],
            }
          : room
      )
    );
    setDraft("");
  };

  return (
    <main className="chat-page">
      <div className="chat-page__frame">
        {activeRoom ? (
          <>
            <header className="chat-room__header">
              <button
                type="button"
                onClick={() => setActiveRoomId(null)}
                aria-label="채팅 목록으로 돌아가기"
              >
                <BackIcon />
              </button>
              <div>
                <h1>{activeRoom.listingPrice}</h1>
                <p>
                  서울 {activeRoom.listingTitle}
                  <br />
                  원룸
                  <br />
                  3층, 관리비 5만
                </p>
              </div>
            </header>

            <section className="chat-room" aria-label="대화방">
              <div className="chat-room__messages">
                {activeRoom.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`chat-bubble chat-bubble--${message.sender}`}
                  >
                    {message.sender === "agent" && (
                      <img src={activeRoom.avatarUrl} alt="" />
                    )}
                    <p>{message.text}</p>
                  </div>
                ))}
              </div>

              <form className="chat-room__composer" onSubmit={handleSubmit}>
                <button type="button" aria-label="첨부">
                  +
                </button>
                <input
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="메시지 보내기"
                />
              </form>
            </section>
          </>
        ) : (
          <>
            <header className="chat-page__header">
              <StayViewLogo />
              <SearchBar value={query} onChange={setQuery} />
            </header>

            <section className="chat-list" aria-label="채팅 목록">
              {filteredRooms.map((room) => (
                <button
                  key={room.id}
                  type="button"
                  className="chat-list__item"
                  onClick={() => setActiveRoomId(room.id)}
                >
                  <img src={room.avatarUrl} alt="" className="chat-list__thumb" />
                  <span className="chat-list__main">
                    <span className="chat-list__topline">
                      <strong>{room.listingPrice}</strong>
                      {room.unreadCount > 0 && (
                        <span className="chat-list__badge">{room.unreadCount}</span>
                      )}
                    </span>
                    <span className="chat-list__title">{room.listingTitle}</span>
                    <span className="chat-list__message">{room.lastMessage}</span>
                  </span>
                </button>
              ))}
            </section>

            <BottomNav active="chat" />
          </>
        )}
      </div>
    </main>
  );
}

function BackIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}
