import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { filterListings } from "./filterListings";
import { allListings } from "../data/mockListings";

describe("filterListings", () => {
  it("returns all listings when the query is empty", () => {
    assert.equal(filterListings(allListings, "   ").length, allListings.length);
  });

  it("matches listing fields with trimmed, case-insensitive keywords", () => {
    const results = filterListings(allListings, "  상도  ");

    assert.deepEqual(results.map((listing) => listing.id), ["rec-1"]);
  });

  it("uses listing price and type as black-box search partitions", () => {
    assert.deepEqual(filterListings(allListings, "전세").map((listing) => listing.id), [
      "recent-2",
    ]);
    assert.deepEqual(filterListings(allListings, "투룸").map((listing) => listing.id), [
      "recent-1",
    ]);
  });

  it("returns an empty array when no oracle-matching field contains the query", () => {
    assert.deepEqual(filterListings(allListings, "부산 해운대"), []);
  });
});
