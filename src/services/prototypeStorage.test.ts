import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  replicaViewerPhotosByScene,
  room0ViewerAssetId,
  uploadGeneratedReplicaSceneId,
  uploadGeneratedViewerAssetId,
} from "../data/mockViewerAssets";
import {
  appendPrototypeChatMessage,
  buildPrototypeChatRoomCatalog,
  createMemoryStorage,
  ensurePrototypeChatRoomForListing,
  readCertificationDrafts,
  readDraftListingsForDisplay,
  readFavoriteListingIds,
  readPrototypeChatRooms,
  readPrototypeListingDrafts,
  readRecentViewedListingIds,
  rememberRecentViewedListing,
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

  it("creates a listing chat room when the first inquiry is sent", () => {
    const storage = createMemoryStorage();
    const listing = {
      id: "replica-apartment-2",
      imageUrl: "/demo/apartment_2/photos/apartment_2_capture_001.webp",
      price: "월세 700/48",
      type: "원룸",
      info: "2층, 관리비 5만",
      location: "동작구 흑석동",
      brokerOfficeName: "흑석공인중개",
    };

    const room = ensurePrototypeChatRoomForListing(listing, storage);

    assert.equal(room.id, "chat-replica-apartment-2");
    assert.equal(room.listingId, "replica-apartment-2");
    assert.equal(room.participantName, "흑석공인중개");
    assert.equal(room.lastMessage, "");
    assert.deepEqual(room.messages, []);
    assert.equal(readPrototypeChatRooms(storage)[0]?.id, room.id);

    const updatedRooms = appendPrototypeChatMessage(
      room.id,
      "오늘 볼 수 있나요?",
      storage,
      () => 2
    );
    const updatedRoom = updatedRooms.find((item) => item.id === room.id);

    assert.equal(updatedRoom?.lastMessage, "오늘 볼 수 있나요?");
    assert.equal(updatedRoom?.messages.at(-1)?.sender, "me");
    assert.equal(updatedRoom?.messages.at(-1)?.id, "local-2");
    assert.equal(
      readPrototypeChatRooms(storage).filter((item) => item.listingId === listing.id)
        .length,
      1
    );
  });

  it("builds potential listing chat rooms without showing them in storage", () => {
    const storage = createMemoryStorage();
    const listing = {
      id: "replica-apartment-2",
      imageUrl: "/demo/apartment_2/photos/apartment_2_capture_001.webp",
      price: "월세 700/48",
      type: "원룸",
      info: "2층, 관리비 5만",
      location: "동작구 흑석동",
    };

    const catalog = buildPrototypeChatRoomCatalog(
      [listing],
      readPrototypeChatRooms(storage)
    );

    assert.equal(catalog[0]?.id, "chat-replica-apartment-2");
    assert.equal(catalog[0]?.listingId, "replica-apartment-2");
    assert.equal(catalog[0]?.lastMessage, "");
    assert.deepEqual(catalog[0]?.messages, []);
    assert.equal(
      readPrototypeChatRooms(storage).some((room) => room.listingId === listing.id),
      false
    );
  });

  it("persists favorite listing toggles and removals", () => {
    const storage = createMemoryStorage();

    assert.deepEqual(readFavoriteListingIds(storage), ["rec-1"]);
    assert.deepEqual(toggleFavoriteListing("replica-room-1", storage), [
      "replica-room-1",
      "rec-1",
    ]);
    assert.deepEqual(removeFavoriteListing("rec-1", storage), ["replica-room-1"]);
  });

  it("stores only listings the user actually opened as recent views", () => {
    const storage = createMemoryStorage();

    assert.deepEqual(readRecentViewedListingIds(storage), []);
    assert.deepEqual(rememberRecentViewedListing("replica-apartment-0", storage), [
      "replica-apartment-0",
    ]);
    assert.deepEqual(rememberRecentViewedListing("replica-room-1", storage), [
      "replica-room-1",
      "replica-apartment-0",
    ]);
    assert.deepEqual(rememberRecentViewedListing("replica-apartment-0", storage), [
      "replica-apartment-0",
      "replica-room-1",
    ]);
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
        brokerName: "김중개",
        brokerOfficeName: "상도역공인중개사사무소",
        brokerRegistrationNumber: "BROKER-1",
      },
      storage,
      () => new Date("2026-05-30T09:00:00.000Z")
    );
    saveCertificationDraft(
      {
        agentName: "김중개",
        agentNumber: "BROKER-1",
        officeName: "상도역공인중개사사무소",
      },
      storage,
      () => new Date("2026-05-30T09:01:00.000Z")
    );

    assert.equal(readPrototypeListingDrafts(storage)[0]?.id, "draft-1780131600000");
    assert.equal(readPrototypeListingDrafts(storage)[0]?.brokerName, "김중개");
    assert.equal(
      readCertificationDrafts(storage)[0]?.officeName,
      "상도역공인중개사사무소"
    );
  });

  it("maps generated listing drafts to the same photos and 3D viewer asset", () => {
    const storage = createMemoryStorage();

    const draft = savePrototypeListingDraft(
      {
        address: "서울 동작구 상도동",
        price: "월세 500/31",
        size: "23m²",
        availableDate: "즉시",
        options: ["주차"],
        modelFileName: "generated-from-room-video.splat",
        scanSource: "camera",
        scanVideoFileName: "room-scan.webm",
        scanStatus: "ready",
        viewerAssetId: "room0-studio-preview",
      },
      storage,
      () => new Date("2026-05-30T09:02:00.000Z")
    );

    const listing = readDraftListingsForDisplay(storage).find(
      (item) => item.id === draft.id
    );

    assert.equal(listing?.viewerAssetId, room0ViewerAssetId);
    assert.ok((listing?.imageUrls?.length ?? 0) > 1);
    assert.match(listing?.imageUrl ?? "", /room0_hotel_preview_/);
  });

  it("maps selected uploaded photos to the listing gallery", () => {
    const storage = createMemoryStorage();

    const draft = savePrototypeListingDraft(
      {
        address: "서울 동작구 상도동",
        price: "월세 500/31",
        size: "23m²",
        availableDate: "즉시",
        options: ["주차"],
        scanSource: "upload",
        scanImageFileNames: ["living-room.jpg", "kitchen.jpg"],
        scanImageUrls: ["data:image/jpeg;base64,living", "data:image/jpeg;base64,kitchen"],
        scanStatus: "ready",
        modelFileName: "hotel_0.splat",
        viewerAssetId: uploadGeneratedViewerAssetId,
      },
      storage,
      () => new Date("2026-05-30T09:03:00.000Z")
    );

    const listing = readDraftListingsForDisplay(storage).find(
      (item) => item.id === draft.id
    );

    assert.equal(listing?.imageUrl, "data:image/jpeg;base64,living");
    assert.equal(listing?.location, "서울 동작구 상도동");
    assert.equal(listing?.price, "월세 500/31");
    assert.equal(listing?.size, "23m²");
    assert.equal(listing?.viewerAssetId, uploadGeneratedViewerAssetId);
    assert.deepEqual(listing?.imageUrls, [
      "data:image/jpeg;base64,living",
      "data:image/jpeg;base64,kitchen",
    ]);
  });

  it("maps upload drafts without stored image data to the prepared demo sequence", () => {
    const storage = createMemoryStorage();

    const draft = savePrototypeListingDraft(
      {
        address: "서울 영등포구 당산동",
        price: "월세 1000/60",
        size: "25m²",
        availableDate: "즉시",
        options: ["주차"],
        scanSource: "upload",
        scanImageFileNames: ["hotel_0_frame_000000.jpg"],
        scanStatus: "ready",
        modelFileName: "hotel_0.splat",
        viewerAssetId: uploadGeneratedViewerAssetId,
      },
      storage,
      () => new Date("2026-05-30T09:04:00.000Z")
    );

    const listing = readDraftListingsForDisplay(storage).find(
      (item) => item.id === draft.id
    );
    const preparedPhotos = replicaViewerPhotosByScene[uploadGeneratedReplicaSceneId];

    assert.equal(listing?.viewerAssetId, uploadGeneratedViewerAssetId);
    assert.equal(listing?.location, "서울 영등포구 당산동");
    assert.equal(listing?.imageUrl, preparedPhotos[0]?.src);
    assert.deepEqual(
      listing?.imageUrls,
      preparedPhotos.map((photo) => photo.src)
    );
  });

  it("normalizes stale upload draft viewer keys to the prepared 3D asset", () => {
    const storage = createMemoryStorage();

    const draft = savePrototypeListingDraft(
      {
        address: "서울 영등포구 문래동",
        price: "월세 1000/60",
        size: "25m²",
        availableDate: "즉시",
        options: ["주차"],
        scanSource: "upload",
        scanImageFileNames: ["hotel_0_frame_000000.jpg"],
        scanStatus: "ready",
        modelFileName: "hotel_0.splat",
        viewerAssetId: "replica-hotel_0-3dgs",
      },
      storage,
      () => new Date("2026-05-30T09:05:00.000Z")
    );

    const listing = readDraftListingsForDisplay(storage).find(
      (item) => item.id === draft.id
    );

    assert.equal(listing?.viewerAssetId, uploadGeneratedViewerAssetId);
    assert.equal(listing?.location, "서울 영등포구 문래동");
  });

  it("normalizes stale non-service draft addresses before display", () => {
    const storage = createMemoryStorage();
    const staleAddress = `서울 영등포구 ${["테스트", "동"].join("")}`;

    const draft = savePrototypeListingDraft(
      {
        address: staleAddress,
        price: "월세 1000/60",
        size: "25m²",
        availableDate: "즉시",
        options: ["주차"],
        scanSource: "upload",
        scanImageFileNames: ["hotel_0_frame_000000.jpg"],
        scanStatus: "completed",
        viewerAssetId: uploadGeneratedViewerAssetId,
      },
      storage,
      () => new Date("2026-05-30T09:06:00.000Z")
    );

    const listing = readDraftListingsForDisplay(storage).find(
      (item) => item.id === draft.id
    );

    assert.equal(readPrototypeListingDrafts(storage)[0]?.address, "서울 영등포구 당산동");
    assert.equal(listing?.location, "서울 영등포구 당산동");
    assert.equal(listing?.station, "당산역 도보 6분");
  });
});
