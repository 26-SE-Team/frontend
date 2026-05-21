import type { Listing } from "../types/listing";

export function filterListings(
  listings: Listing[],
  query: string
): Listing[] {
  const keyword = query.trim().toLowerCase();
  if (!keyword) return listings;

  return listings.filter((listing) => {
    const searchable = [listing.price, listing.type, listing.info, listing.location]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchable.includes(keyword);
  });
}
