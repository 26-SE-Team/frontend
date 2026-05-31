import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import * as React from "react";
import { allListings } from "../../data/mockListings";
import { formatMapPrice } from "../../utils/formatMapPrice";
import { MapBottomSheet } from "./MapBottomSheet";

describe("MapBottomSheet", () => {
  it("renders mapped sample listings from the shared fixture", () => {
    const html = renderToStaticMarkup(
      React.createElement(MapBottomSheet, { totalCount: allListings.length, listings: allListings })
    );

    assert.match(html, new RegExp(`총 ${allListings.length}건`));
    assert.match(html, /500\/31/);
    assert.match(html, /25000/);
    assert.doesNotMatch(html, /월세 500\/31/);
    assert.doesNotMatch(html, /전세 2억 5000/);
  });

  it("formats map prices as compact numeric labels", () => {
    assert.equal(formatMapPrice("월세 500/31"), "500/31");
    assert.equal(formatMapPrice("전세 2억 5000"), "25000");
  });

  it("marks the selected listing as the visual oracle", () => {
    const html = renderToStaticMarkup(
      React.createElement(MapBottomSheet, {
        totalCount: allListings.length,
        listings: allListings,
        selectedListing: allListings[0],
      })
    );

    assert.match(html, /map-sheet__listing is-active/);
  });
});
