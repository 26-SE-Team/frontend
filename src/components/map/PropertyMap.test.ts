import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  detailListingCardZoom,
  getMapClusterStep,
  shouldShowListingCardMarkers,
} from "./mapMarkerConfig";

describe("PropertyMap marker density", () => {
  it("keeps numeric clusters just before the neighborhood listing-card zoom", () => {
    assert.equal(shouldShowListingCardMarkers(detailListingCardZoom - 1), false);
    assert.equal(getMapClusterStep(detailListingCardZoom - 1), 0.003);
  });

  it("switches to listing cards before the maximum street-level zoom", () => {
    assert.equal(shouldShowListingCardMarkers(detailListingCardZoom), true);
    assert.equal(getMapClusterStep(detailListingCardZoom), 0);
  });
});
