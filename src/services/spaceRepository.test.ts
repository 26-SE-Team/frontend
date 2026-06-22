import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  room0ViewerAssetId,
  uploadGeneratedViewerAssetId,
} from "../data/mockViewerAssets";
import {
  createMemoryStorage,
  readFavoriteListingIds,
} from "./prototypeStorage";
import { spaceRepository } from "./spaceRepository";
import { viewerRepository } from "./viewerRepository";

describe("spaceRepository local API adapter", () => {
  it("exposes prepared and draft spaces through one API-shaped catalog", () => {
    const storage = createMemoryStorage();
    const draft = spaceRepository.createSpaceDraft(
      {
        address: "서울 동작구 상도동",
        price: "월세 900/58",
        size: "24m²",
        availableDate: "즉시",
        options: ["주차"],
        scanSource: "upload",
        scanImageFileNames: ["hotel_0_capture.jpg"],
        scanStatus: "ready",
        modelFileName: "hotel_0.splat",
        viewerAssetId: uploadGeneratedViewerAssetId,
      },
      storage
    );

    const listing = spaceRepository.getSpaceById(draft.id, storage);

    assert.equal(listing?.id, draft.id);
    assert.equal(listing?.viewerAssetId, uploadGeneratedViewerAssetId);
    assert.ok(spaceRepository.listSpaces({}, storage).some((item) => item.id === draft.id));
  });

  it("maps listing records to API SpaceResponse boundaries", () => {
    const storage = createMemoryStorage();
    const response = spaceRepository
      .listSpaceResponses({}, storage)
      .find((space) => space.spaceId === "rec-1");

    assert.equal(response?.deposit, 500);
    assert.equal(response?.monthlyRent, 31);
    assert.equal(response?.status, "AVAILABLE");
    assert.equal(response?.scrapped, true);
    assert.ok((response?.imageUrls.length ?? 0) > 1);
  });

  it("keeps recent viewed and scrapped spaces behind repository methods", () => {
    const storage = createMemoryStorage();

    spaceRepository.rememberViewedSpace("replica-room-1", storage);
    spaceRepository.toggleScrap("replica-room-1", storage);

    assert.equal(
      spaceRepository.listScrapIds(storage).includes("replica-room-1"),
      true
    );
    assert.deepEqual(
      spaceRepository.listRecentViewedSpaces(storage).map((listing) => listing.id),
      ["replica-room-1"]
    );
    assert.equal(readFavoriteListingIds(storage).includes("replica-room-1"), true);
    assert.equal(
      spaceRepository
        .listFavoriteSpaces(storage)
        .some((listing) => listing.id === "replica-room-1"),
      true
    );
  });

  it("persists local adapter mutations through the shared StorageLike boundary", () => {
    const storage = createMemoryStorage();
    const draft = spaceRepository.createSpaceDraft(
      {
        address: "서울 영등포구 당산동",
        price: "월세 1000/62",
        size: "29m²",
        availableDate: "협의",
        options: ["반려동물"],
        scanSource: "upload",
        scanImageFileNames: ["room_1_capture_001.webp"],
        scanStatus: "completed",
        viewerAssetId: "replica-room-1-3dgs",
      },
      storage
    );

    spaceRepository.rememberViewedSpace(draft.id, storage);
    spaceRepository.toggleScrap(draft.id, storage);

    const persistedListing = spaceRepository.getSpaceById(draft.id, storage);
    const persistedResponse = spaceRepository
      .listSpaceResponses({}, storage)
      .find((space) => space.spaceId === draft.id);

    assert.equal(persistedListing?.location, "서울 영등포구 당산동");
    assert.equal(persistedListing?.viewerAssetId, "replica-room-1-3dgs");
    assert.equal(persistedResponse?.scrapped, true);
    assert.deepEqual(
      spaceRepository.listRecentViewedSpaces(storage).map((listing) => listing.id),
      [draft.id]
    );
  });

  it("resolves a viewer asset through the viewer repository boundary", () => {
    const listing = spaceRepository.getSpaceById("replica-apartment-1");
    const asset = viewerRepository.getViewerAssetForSpace(listing);

    assert.equal(asset.id, "replica-apartment-1-3dgs");
    assert.equal(asset.kind, "splat-scene");
    assert.equal(viewerRepository.getCameraGeneratedAssetId(), room0ViewerAssetId);
    assert.equal(
      viewerRepository.getUploadGeneratedAssetId(),
      uploadGeneratedViewerAssetId
    );
  });
});
