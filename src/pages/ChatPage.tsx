import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { BottomNav } from "../components/home/BottomNav";
import { mockChatRooms } from "../data/mockChats";
import "./chat.css";

export function ChatPage() {
  const [rooms, setRooms] = useState(mockChatRooms);
  const [activeRoomId, setActiveRoomId] = useState(mockChatRooms[0]?.id ?? "");
  const [draft, setDraft] = useState("");

  const activeRoom = useMemo(
    () => rooms.find((room) => room.id === activeRoomId) ?? rooms[0],
    [activeRoomId, rooms]
  );

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
        <header className="chat-page__header">
          <div>
            <p className="chat-page__eyebrow">StayView</p>
            <h1>채팅</h1>
          </div>
          <span className="chat-page__count">{rooms.length}</span>
        </header>

        <div className="chat-page__body">
          <section className="chat-list" aria-label="채팅 목록">
            {rooms.map((room) => (
              <button
                key={room.id}
                type="button"
                className={`chat-list__item${
                  room.id === activeRoom?.id ? " chat-list__item--active" : ""
                }`}
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

          {activeRoom && (
            <section className="chat-room" aria-label="대화방">
              <div className="chat-room__listing">
                <img src={activeRoom.avatarUrl} alt="" />
                <div>
                  <p>{activeRoom.listingTitle}</p>
                  <strong>{activeRoom.listingPrice}</strong>
                </div>
                <Link to={`/listing/${activeRoom.listingId}`}>상세</Link>
              </div>

              <div className="chat-room__messages">
                {activeRoom.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`chat-bubble chat-bubble--${message.sender}`}
                  >
                    <p>{message.text}</p>
                    <span>{message.sentAt}</span>
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
                  placeholder="메시지 입력"
                />
                <button type="submit" disabled={!draft.trim()}>
                  전송
                </button>
              </form>
            </section>
          )}
        </div>

        <BottomNav active="chat" />
      </div>
    </main>
  );
}
