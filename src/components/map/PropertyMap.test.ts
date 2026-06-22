import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  detailListingCardZoom,
  getMapClusterStep,
  shouldShowListingCardMarkers,
} from "./mapMarkerConfig";

describe("PropertyMap marker density", () => {
  it("keeps numeric clusters until the final listing-detail zoom", () => {
    assert.equal(shouldShowListingCardMarkers(detailListingCardZoom - 1), false);
    assert.equal(getMapClusterStep(detailListingCardZoom - 1), 0.0015);
  });

  it("switches to listing cards at the maximum zoom", () => {
    assert.equal(shouldShowListingCardMarkers(detailListingCardZoom), true);
    assert.equal(getMapClusterStep(detailListingCardZoom), 0);
  });
});
