import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { allListings, findListingById } from "./mockListings";

const publicRoot = join(process.cwd(), "public");

function publicFileFromAssetUrl(url: string) {
  const publicPath = url.replace(/^\/frontend\//, "/").replace(/^\/+/, "");

  return join(publicRoot, publicPath);
}

describe("mockListings fixture", () => {
  it("maps every prototype listing to a browse-map position", () => {
    assert.equal(allListings.every((listing) => listing.mapPosition), true);
  });

  it("keeps the Sangdo listing wired to the viewer asset", () => {
    const room0Listing = findListingById("rec-1");

    assert.equal(room0Listing?.price, "월세 500/31");
    assert.equal(room0Listing?.viewerAssetId, "room0-studio-preview");
    assert.ok((room0Listing?.imageUrls?.length ?? 0) > 1);
    assert.match(room0Listing?.mapPosition?.label ?? "", /상도역 원룸/);
  });

  it("keeps at least three sample listings clustered in Dongjak-gu", () => {
    const dongjakListings = allListings.filter((listing) =>
      listing.location?.includes("동작구")
    );

    assert.ok(dongjakListings.length >= 3);
    assert.equal(
      dongjakListings.every((listing) => {
        const position = listing.mapPosition;
        return Boolean(
          position &&
          position.lat >= 37.49 &&
          position.lat <= 37.52 &&
          position.lng >= 126.94 &&
          position.lng <= 126.97
        );
      }),
      true
    );
  });

  it("returns undefined for unknown ids instead of falling through silently", () => {
    assert.equal(findListingById("missing-listing"), undefined);
  });

  it("backs local listing images with real public files to prevent 404s", () => {
    const localImageUrls = allListings
      .map((listing) => listing.imageUrl)
      .filter((url) => url.startsWith("/"));

    assert.ok(localImageUrls.length > 0);

    for (const url of localImageUrls) {
      assert.equal(
        existsSync(publicFileFromAssetUrl(url)),
        true,
        `${url} must exist under public/`
      );
    }
  });
});
