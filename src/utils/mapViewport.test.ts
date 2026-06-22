import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { allListings } from "../data/mockListings";
import { filterListingsByMapBounds } from "./mapViewport";

describe("mapViewport", () => {
  it("keeps only listings inside the current visible map bounds", () => {
    const visible = filterListingsByMapBounds(allListings, {
      north: 37.509,
      south: 37.501,
      east: 126.961,
      west: 126.946,
    });

    assert.deepEqual(
      visible.map((listing) => listing.id).sort(),
      ["rec-1", "replica-apartment-0", "replica-apartment-2"].sort()
    );
  });

  it("falls back to mapped listings before the map reports bounds", () => {
    assert.equal(
      filterListingsByMapBounds(allListings, null).length,
      allListings.length
    );
  });
});
