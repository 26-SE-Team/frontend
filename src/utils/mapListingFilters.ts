import type { Listing } from "../types/listing";

export type MapTradeType = "all" | "monthly" | "jeonse";

export interface MapListingFilters {
  tradeType: MapTradeType;
  depositMax: number;
  monthlyRentMax: number;
  managementFeeMax: number;
}

interface PriceMetrics {
  tradeType: MapTradeType;
  deposit?: number;
  monthlyRent?: number;
}

export const mapFilterLimits = {
  depositMax: 30000,
  monthlyRentMax: 100,
  managementFeeMax: 20,
} as const;

export const defaultMapListingFilters: MapListingFilters = {
  tradeType: "all",
  depositMax: mapFilterLimits.depositMax,
  monthlyRentMax: mapFilterLimits.monthlyRentMax,
  managementFeeMax: mapFilterLimits.managementFeeMax,
};

export function parseListingPrice(price: string): PriceMetrics {
  const normalized = price.trim().replace(/\s+/g, " ");

  if (normalized.startsWith("월세")) {
    const match = normalized.match(/월세\s*(\d+)\s*\/\s*(\d+)/);
    return {
      tradeType: "monthly",
      deposit: match ? Number(match[1]) : undefined,
      monthlyRent: match ? Number(match[2]) : undefined,
    };
  }

  if (normalized.startsWith("전세")) {
    const withoutType = normalized.replace(/^전세\s*/, "");
    const eokMatch = withoutType.match(/^(\d+)\s*억(?:\s*(\d+))?$/);
    const numericMatch = withoutType.match(/^(\d+)$/);

    return {
      tradeType: "jeonse",
      deposit: eokMatch
        ? Number(eokMatch[1]) * 10000 + Number(eokMatch[2] ?? "0")
        : numericMatch
          ? Number(numericMatch[1])
          : undefined,
    };
  }

  return { tradeType: "all" };
}

export function parseManagementFee(value: string | undefined): number | undefined {
  if (!value || value.includes("협의")) return undefined;

  const match = value.replace(/\s+/g, "").match(/(\d+(?:\.\d+)?)만/);
  return match ? Number(match[1]) : undefined;
}

export function matchesMapListingFilters(
  listing: Listing,
  filters: MapListingFilters
): boolean {
  const metrics = parseListingPrice(listing.price);
  const managementFee = parseManagementFee(
    listing.managementFee ?? listing.info
  );

  if (filters.tradeType !== "all" && metrics.tradeType !== filters.tradeType) {
    return false;
  }

  if (metrics.deposit !== undefined && metrics.deposit > filters.depositMax) {
    return false;
  }

  if (
    metrics.tradeType === "monthly" &&
    metrics.monthlyRent !== undefined &&
    metrics.monthlyRent > filters.monthlyRentMax
  ) {
    return false;
  }

  if (
    managementFee !== undefined &&
    managementFee > filters.managementFeeMax
  ) {
    return false;
  }

  return true;
}
