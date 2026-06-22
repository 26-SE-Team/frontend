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
});
