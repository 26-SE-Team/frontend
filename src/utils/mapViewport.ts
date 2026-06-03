import type { Listing } from "../types/listing";

export interface MapBoundsLiteral {
  north: number;
  south: number;
  east: number;
  west: number;
}

export function isListingInMapBounds(
  listing: Listing,
  bounds: MapBoundsLiteral
): boolean {
  const position = listing.mapPosition;
  if (!position) return false;

  const isLatInBounds =
    position.lat >= bounds.south && position.lat <= bounds.north;
  const isLngInBounds =
    bounds.west <= bounds.east
      ? position.lng >= bounds.west && position.lng <= bounds.east
      : position.lng >= bounds.west || position.lng <= bounds.east;

  return isLatInBounds && isLngInBounds;
}

export function filterListingsByMapBounds(
  listings: Listing[],
  bounds: MapBoundsLiteral | null
): Listing[] {
  if (!bounds) return listings.filter((listing) => listing.mapPosition);

  return listings.filter((listing) => isListingInMapBounds(listing, bounds));
}
