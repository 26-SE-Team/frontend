import { useEffect, useMemo, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { BottomNav } from "../components/home/BottomNav";
import { SearchBar } from "../components/home/SearchBar";
import { StayViewLogo } from "../components/start/StayViewLogo";
import { allListings } from "../data/mockListings";
import {
  appendPrototypeChatMessage,
  buildPrototypeChatRoomCatalog,
  ensurePrototypeChatRoomForListing,
  readDraftListingsForDisplay,
  readPrototypeChatRooms,
} from "../services/prototypeStorage";
import "./chat.css";

export function ChatPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [rooms, setRooms] = useState(() => readPrototypeChatRooms());
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const listingId = searchParams.get("listing");

  const listingCatalog = useMemo(
    () => [...allListings, ...readDraftListingsForDisplay()],
    []
  );
  const requestedListing = useMemo(
    () => listingCatalog.find((listing) => listing.id === listingId) ?? null,
    [listingCatalog, listingId]
  );
  const potentialRooms = useMemo(
    () => buildPrototypeChatRoomCatalog(listingCatalog, rooms),
    [listingCatalog, rooms]
  );

  const requestedRoom = useMemo(
    () => potentialRooms.find((room) => room.listingId === listingId) ?? null,
    [listingId, potentialRooms]
  );

  const activeRoom = useMemo(
    () => {
      const persistedRoom = rooms.find((room) => room.id === activeRoomId);
      if (persistedRoom) return persistedRoom;
      const potentialRoom = potentialRooms.find((room) => room.id === activeRoomId);
      if (potentialRoom) return potentialRoom;

      return requestedRoom;
    },
    [activeRoomId, potentialRooms, requestedRoom, rooms]
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

  useEffect(() => {
    if (requestedRoom) {
      setActiveRoomId(requestedRoom.id);
    }
  }, [requestedRoom]);

  const handleBackToList = () => {
    setActiveRoomId(null);
    setSearchParams({});
  };

  const sendDraftMessage = () => {
    const text = draft.trim();
    if (!text || !activeRoom) return false;

    const activeRoomExists = rooms.some((room) => room.id === activeRoom.id);
    const targetRoom =
      !activeRoomExists && requestedListing
        ? ensurePrototypeChatRoomForListing(requestedListing)
        : activeRoom;
    const nextRooms = appendPrototypeChatMessage(targetRoom.id, text);

    setRooms(nextRooms);
    setActiveRoomId(targetRoom.id);
    setDraft("");
    return true;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    sendDraftMessage();
  };

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter" || event.nativeEvent.isComposing) return;

    event.preventDefault();
    sendDraftMessage();
  };

  return (
    <main className="chat-page">
      <div className="chat-page__frame">
        {activeRoom ? (
          <>
            <header className="chat-room__header">
              <button
                type="button"
                onClick={handleBackToList}
                aria-label="채팅 목록으로 돌아가기"
              >
                <BackIcon />
              </button>
              <div>
                <h1>{activeRoom.listingPrice}</h1>
                <p>
                  {activeRoom.listingTitle} · {activeRoom.participantName}
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
                  onKeyDown={handleComposerKeyDown}
                  placeholder="메시지 보내기"
                />
                <button
                  type="submit"
                  className="chat-room__send"
                  disabled={!draft.trim()}
                >
                  전송
                </button>
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
                  onClick={() => {
                    setActiveRoomId(room.id);
                    setSearchParams({});
                  }}
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
