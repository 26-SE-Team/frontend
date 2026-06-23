import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import {
  findViewerAssetById,
  normalizeViewerAssetId,
  room0ViewerAssetId,
  room0ViewerAsset,
  room0ViewerPhotos,
  toPublicDemoPath,
  uploadGeneratedViewerAssetId,
  viewerAssets,
} from "./mockViewerAssets";

const publicRoot = join(process.cwd(), "public");

function publicFileFromAssetUrl(url: string) {
  const publicPath = url.replace(/^\/frontend\//, "/").replace(/^\/+/, "");

  return join(publicRoot, publicPath);
}

describe("mockViewerAssets public files", () => {
  it("builds deploy-safe demo URLs for local Vite and GitHub Pages", () => {
    assert.equal(
      toPublicDemoPath("demo/room0/models/room0.splat", "/"),
      "/demo/room0/models/room0.splat"
    );
    assert.equal(
      toPublicDemoPath("/demo/room0/models/room0.splat", "/frontend/"),
      "/frontend/demo/room0/models/room0.splat"
    );
  });

  it("keeps the Room0 splat and preview images backed by real public files", () => {
    const assetUrls =
      room0ViewerAsset.kind === "splat-scene"
        ? [
            room0ViewerAsset.url,
            room0ViewerAsset.previewImageUrl,
            ...room0ViewerPhotos.flatMap((photo) => [photo.src, photo.thumbSrc]),
          ]
        : [...room0ViewerPhotos.flatMap((photo) => [photo.src, photo.thumbSrc])];

    assert.ok(assetUrls.length > 0);

    for (const url of assetUrls) {
      assert.equal(
        existsSync(publicFileFromAssetUrl(url)),
        true,
        `${url} must exist under public/ to avoid deployed 404s`
      );
    }
  });

  it("keeps every 3D sample asset key backed by real public files", () => {
    const sampleAssets = viewerAssets.filter((asset) => asset.kind === "splat-scene");

    assert.ok(sampleAssets.length >= 6);

    for (const asset of sampleAssets) {
      if (asset.kind !== "splat-scene") continue;

      const assetUrls = [
        asset.url,
        asset.previewImageUrl,
        ...asset.photos.flatMap((photo) => [photo.src, photo.thumbSrc]),
      ];

      for (const url of assetUrls) {
        assert.equal(
          existsSync(publicFileFromAssetUrl(url)),
          true,
          `${asset.id} references missing public file ${url}`
        );
      }
    }
  });

  it("normalizes old draft and scene keys to the prepared 3D sample assets", () => {
    assert.equal(normalizeViewerAssetId("hotel_0"), uploadGeneratedViewerAssetId);
    assert.equal(normalizeViewerAssetId("hotel_0.splat"), uploadGeneratedViewerAssetId);
    assert.equal(
      normalizeViewerAssetId("replica-hotel_0-3dgs"),
      uploadGeneratedViewerAssetId
    );
    assert.equal(
      normalizeViewerAssetId("public/demo/hotel_0/models/hotel_0.splat"),
      uploadGeneratedViewerAssetId
    );
    assert.equal(
      findViewerAssetById("apartment_1").id,
      "replica-apartment-1-3dgs"
    );
    assert.equal(normalizeViewerAssetId("room0-studio-preview"), room0ViewerAssetId);
    assert.equal(normalizeViewerAssetId("sangdo-studio"), room0ViewerAssetId);
    assert.equal(normalizeViewerAssetId("demo/room0/models/room0.splat"), room0ViewerAssetId);
  });

  it("keeps every 3D sample grounded with explicit walking presets", () => {
    const sampleAssets = viewerAssets.filter((asset) => asset.kind === "splat-scene");

    assert.ok(sampleAssets.length >= 6);

    for (const asset of sampleAssets) {
      if (asset.kind !== "splat-scene") continue;

      const navigationFrame = asset.navigationFrame;
      const floor = navigationFrame?.floor;

      assert.ok(floor?.enabled, `${asset.id} must enable grounded navigation`);
      assert.equal(typeof floor.eyeHeight, "number", `${asset.id} needs eye height`);
      assert.equal(typeof floor.startOffset, "number", `${asset.id} needs start offset`);
      assert.equal(typeof floor.lookDistance, "number", `${asset.id} needs look distance`);
      const { eyeHeight, startOffset, lookDistance } = floor as {
        eyeHeight: number;
        startOffset: number;
        lookDistance: number;
      };
      assert.ok(eyeHeight > 0, `${asset.id} eye height must be positive`);
      assert.ok(startOffset >= 0, `${asset.id} start offset must be valid`);
      assert.ok(lookDistance > 0, `${asset.id} look distance must be positive`);
      assert.ok(floor.walkBounds, `${asset.id} needs a walking boundary`);
      assert.equal(floor.walkBounds.halfSize.length, 2);

      for (const halfSize of floor.walkBounds.halfSize) {
        assert.ok(halfSize > 0, `${asset.id} walking boundary must be positive`);
      }

      if (asset.id.startsWith("replica-")) {
        assert.deepEqual(navigationFrame?.up, [0, 0, 1]);
        assert.deepEqual(navigationFrame?.forward, [0, -1, 0]);
        assert.equal(floor.autoDetect, false);
        assert.equal(floor.height, 0);
      }
    }
  });
});
