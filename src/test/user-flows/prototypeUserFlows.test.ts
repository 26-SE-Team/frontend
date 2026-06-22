import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { allListings, findListingById } from "../../data/mockListings";
import { findViewerAssetById, room0ViewerAssetId } from "../../data/mockViewerAssets";
import {
  appendPrototypeChatMessage,
  createMemoryStorage,
  readCertificationDrafts,
  readFavoriteListingIds,
  readPrototypeListingDrafts,
  saveCertificationDraft,
  savePrototypeListingDraft,
  toggleFavoriteListing,
  type StorageLike,
} from "../../services/prototypeStorage";
import { filterListings } from "../../utils/filterListings";
import {
  getPrototypeUserScenario,
  prototypeUserScenarios,
} from "./prototypeUserScenarios";

let storage: StorageLike;

describe("prototype user scenario catalog", () => {
  it("has unique scenario ids and executable oracles", () => {
    const ids = prototypeUserScenarios.map((scenario) => scenario.id);

    assert.equal(new Set(ids).size, ids.length);
    assert.equal(
      prototypeUserScenarios.every((scenario) => scenario.oracle.length > 0),
      true
    );
  });

  it("can find a scenario by id for manual user-test scripts", () => {
    assert.equal(getPrototypeUserScenario("UT-CHAT-INQUIRY")?.route, "/chat");
  });
});

describe("prototype user flows", () => {
  beforeEach(() => {
    storage = createMemoryStorage();
  });
  afterEach(() => {
    storage.clear?.();
  });

  it("supports the home search functional scenario", () => {
    const results = filterListings(allListings, "상도");

    assert.ok(results.length >= 1);
    assert.ok(results.some((listing) => listing.id === "rec-1"));
    assert.equal(
      results.every((listing) =>
        [listing.location, listing.station, listing.price, listing.type]
          .filter(Boolean)
          .some((value) => value?.includes("상도"))
      ),
      true
    );
  });

  it("keeps the listing detail to space viewer contract wired", () => {
    const listing = findListingById("rec-1");
    const asset = findViewerAssetById(listing?.viewerAssetId);

    assert.equal(asset.id, room0ViewerAssetId);
    assert.equal(asset.kind, "splat-scene");
  });

  it("persists chat inquiry messages in prototype storage", () => {
    const rooms = appendPrototypeChatMessage(
      "chat-1",
      "소형견도 가능할까요?",
      storage,
      () => 20260530
    );
    const room = rooms.find((item) => item.id === "chat-1");

    assert.equal(room?.lastMessage, "소형견도 가능할까요?");
    assert.equal(room?.messages.at(-1)?.id, "local-20260530");
    assert.equal(room?.messages.at(-1)?.sender, "me");
  });

  it("stores listing drafts and broker certification requests locally", () => {
    savePrototypeListingDraft(
      {
        address: "서울 동작구 테스트동",
        price: "월세 500/42",
        size: "22m²",
        availableDate: "즉시",
        options: ["반려동물"],
        modelFileName: "room0.splat",
      },
      storage,
      () => new Date("2026-05-30T09:00:00.000Z")
    );
    saveCertificationDraft(
      {
        agentName: "홍길동",
        agentNumber: "A-1234",
        officeName: "상도공인중개",
        fileName: "license.pdf",
      },
      storage,
      () => new Date("2026-05-30T09:01:00.000Z")
    );

    assert.equal(readPrototypeListingDrafts(storage)[0]?.modelFileName, "room0.splat");
    assert.equal(readCertificationDrafts(storage)[0]?.officeName, "상도공인중개");
  });

  it("persists favorite listing toggles for the stored-page flow", () => {
    assert.deepEqual(readFavoriteListingIds(storage), ["rec-1"]);

    const removed = toggleFavoriteListing("rec-1", storage);
    assert.deepEqual(removed, []);

    const added = toggleFavoriteListing("replica-room-2", storage);
    assert.deepEqual(added, ["replica-room-2"]);
  });
});
