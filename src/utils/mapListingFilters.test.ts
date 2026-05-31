import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { allListings } from "../data/mockListings";
import {
  matchesMapListingFilters,
  parseListingPrice,
} from "./mapListingFilters";

describe("mapListingFilters", () => {
  it("parses monthly and jeonse prices for map filtering", () => {
    assert.deepEqual(parseListingPrice("월세 500/31"), {
      tradeType: "monthly",
      monthlyRent: 31,
    });
    assert.deepEqual(parseListingPrice("전세 2억 5000"), {
      tradeType: "jeonse",
      jeonseAmount: 25000,
    });
  });

  it("filters listings by trade type and price range", () => {
    const monthlyUnder50 = allListings.filter((listing) =>
      matchesMapListingFilters(listing, {
        tradeType: "monthly",
        priceRange: "monthly-under-50",
      })
    );
    const jeonseOver20000 = allListings.filter((listing) =>
      matchesMapListingFilters(listing, {
        tradeType: "jeonse",
        priceRange: "jeonse-20000-30000",
      })
    );

    assert.equal(monthlyUnder50.some((listing) => listing.price === "월세 500/31"), true);
    assert.equal(jeonseOver20000.some((listing) => listing.price === "전세 2억 5000"), true);
  });
});
