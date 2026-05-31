import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import {
  room0ViewerAsset,
  room0ViewerPhotos,
  toPublicDemoPath,
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
});
