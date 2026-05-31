import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { allListings } from "../data/mockListings";
import {
  defaultMapListingFilters,
  matchesMapListingFilters,
  parseManagementFee,
  parseListingPrice,
} from "./mapListingFilters";

describe("mapListingFilters", () => {
  it("parses monthly and jeonse prices for map filtering", () => {
    assert.deepEqual(parseListingPrice("월세 500/31"), {
      tradeType: "monthly",
      deposit: 500,
      monthlyRent: 31,
    });
    assert.deepEqual(parseListingPrice("전세 2억 5000"), {
      tradeType: "jeonse",
      deposit: 25000,
    });
  });

  it("parses management fees for map filtering", () => {
    assert.equal(parseManagementFee("관리비 5만"), 5);
    assert.equal(parseManagementFee("12만 원"), 12);
    assert.equal(parseManagementFee("관리비 협의"), undefined);
  });

  it("filters listings by trade type, deposit, monthly rent, and management fee", () => {
    const monthlyUnder40 = allListings.filter((listing) =>
      matchesMapListingFilters(listing, {
        ...defaultMapListingFilters,
        tradeType: "monthly",
        monthlyRentMax: 40,
      })
    );
    const lowManagementFee = allListings.filter((listing) =>
      matchesMapListingFilters(listing, {
        ...defaultMapListingFilters,
        managementFeeMax: 5,
      })
    );
    const depositUnder10000 = allListings.filter((listing) =>
      matchesMapListingFilters(listing, {
        ...defaultMapListingFilters,
        depositMax: 10000,
      })
    );

    assert.equal(monthlyUnder40.some((listing) => listing.price === "월세 500/31"), true);
    assert.equal(monthlyUnder40.some((listing) => listing.price === "월세 1000/80"), false);
    assert.equal(lowManagementFee.every((listing) => listing.managementFee !== "8만 원"), true);
    assert.equal(depositUnder10000.some((listing) => listing.price === "전세 2억 5000"), false);
  });
});
