import type { Listing } from "../types/listing";

export type MapTradeType = "all" | "monthly" | "jeonse";
export type MapPriceRange =
  | "all"
  | "monthly-under-50"
  | "monthly-50-70"
  | "monthly-over-70"
  | "jeonse-under-20000"
  | "jeonse-20000-30000"
  | "jeonse-over-30000";

export interface MapListingFilters {
  tradeType: MapTradeType;
  priceRange: MapPriceRange;
}

interface PriceMetrics {
  tradeType: MapTradeType;
  monthlyRent?: number;
  jeonseAmount?: number;
}

export const defaultMapListingFilters: MapListingFilters = {
  tradeType: "all",
  priceRange: "all",
};

export function parseListingPrice(price: string): PriceMetrics {
  const normalized = price.trim().replace(/\s+/g, " ");

  if (normalized.startsWith("월세")) {
    const match = normalized.match(/월세\s*(\d+)\s*\/\s*(\d+)/);
    return {
      tradeType: "monthly",
      monthlyRent: match ? Number(match[2]) : undefined,
    };
  }

  if (normalized.startsWith("전세")) {
    const withoutType = normalized.replace(/^전세\s*/, "");
    const eokMatch = withoutType.match(/^(\d+)\s*억(?:\s*(\d+))?$/);
    const numericMatch = withoutType.match(/^(\d+)$/);

    return {
      tradeType: "jeonse",
      jeonseAmount: eokMatch
        ? Number(eokMatch[1]) * 10000 + Number(eokMatch[2] ?? "0")
        : numericMatch
          ? Number(numericMatch[1])
          : undefined,
    };
  }

  return { tradeType: "all" };
}

export function matchesMapListingFilters(
  listing: Listing,
  filters: MapListingFilters
): boolean {
  const metrics = parseListingPrice(listing.price);

  if (filters.tradeType !== "all" && metrics.tradeType !== filters.tradeType) {
    return false;
  }

  switch (filters.priceRange) {
    case "monthly-under-50":
      return metrics.tradeType === "monthly" && (metrics.monthlyRent ?? Infinity) <= 50;
    case "monthly-50-70":
      return (
        metrics.tradeType === "monthly" &&
        (metrics.monthlyRent ?? -Infinity) > 50 &&
        (metrics.monthlyRent ?? Infinity) <= 70
      );
    case "monthly-over-70":
      return metrics.tradeType === "monthly" && (metrics.monthlyRent ?? -Infinity) > 70;
    case "jeonse-under-20000":
      return metrics.tradeType === "jeonse" && (metrics.jeonseAmount ?? Infinity) <= 20000;
    case "jeonse-20000-30000":
      return (
        metrics.tradeType === "jeonse" &&
        (metrics.jeonseAmount ?? -Infinity) > 20000 &&
        (metrics.jeonseAmount ?? Infinity) <= 30000
      );
    case "jeonse-over-30000":
      return metrics.tradeType === "jeonse" && (metrics.jeonseAmount ?? -Infinity) > 30000;
    case "all":
    default:
      return true;
  }
}
