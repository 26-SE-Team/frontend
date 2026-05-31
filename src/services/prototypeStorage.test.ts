import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  appendPrototypeChatMessage,
  createMemoryStorage,
  readCertificationDrafts,
  readFavoriteListingIds,
  readPrototypeListingDrafts,
  removeFavoriteListing,
  saveCertificationDraft,
  savePrototypeListingDraft,
  toggleFavoriteListing,
} from "./prototypeStorage";

describe("prototypeStorage", () => {
  it("persists chat messages without an API server", () => {
    const storage = createMemoryStorage();
    const rooms = appendPrototypeChatMessage(
      "chat-1",
      "오늘 저녁에 볼 수 있나요?",
      storage,
      () => 1
    );
    const room = rooms.find((item) => item.id === "chat-1");

    assert.equal(room?.lastMessage, "오늘 저녁에 볼 수 있나요?");
    assert.equal(room?.messages.at(-1)?.id, "local-1");
  });

  it("persists favorite listing toggles and removals", () => {
    const storage = createMemoryStorage();

    assert.deepEqual(readFavoriteListingIds(storage), ["rec-1"]);
    assert.deepEqual(toggleFavoriteListing("rec-2", storage), ["rec-2", "rec-1"]);
    assert.deepEqual(removeFavoriteListing("rec-1", storage), ["rec-2"]);
  });

  it("stores listing and certification drafts as prototype records", () => {
    const storage = createMemoryStorage();

    savePrototypeListingDraft(
      {
        address: "서울 동작구 상도동",
        price: "월세 500/31",
        size: "23m²",
        availableDate: "즉시",
        options: ["주차"],
        modelFileName: "room0.splat",
      },
      storage,
      () => new Date("2026-05-30T09:00:00.000Z")
    );
    saveCertificationDraft(
      {
        agentName: "김중개",
        agentNumber: "BROKER-1",
        officeName: "테스트부동산",
      },
      storage,
      () => new Date("2026-05-30T09:01:00.000Z")
    );

    assert.equal(readPrototypeListingDrafts(storage)[0]?.id, "draft-1780131600000");
    assert.equal(readCertificationDrafts(storage)[0]?.officeName, "테스트부동산");
  });
});
