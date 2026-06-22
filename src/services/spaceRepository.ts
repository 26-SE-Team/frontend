import { allListings, recommendedListings } from "../data/mockListings";
import type { Listing } from "../types/listing";
import type { SpaceResponse } from "./apiContracts";
import { listingToSpaceResponse } from "./apiContracts";
import {
  readDraftListingsForDisplay,
  readFavoriteListingIds,
  readRecentViewedListingIds,
  rememberRecentViewedListing,
  removeFavoriteListing,
  savePrototypeListingDraft,
  toggleFavoriteListing,
  type PrototypeListingDraft,
  type StorageLike,
} from "./prototypeStorage";

export interface SpaceSearchQuery {
  includeDrafts?: boolean;
}

export interface SpaceRepository {
  listSpaces(query?: SpaceSearchQuery, storage?: StorageLike): Listing[];
  listSpaceResponses(query?: SpaceSearchQuery, storage?: StorageLike): SpaceResponse[];
  listRecommendedSpaces(storage?: StorageLike): Listing[];
  listRecentViewedSpaces(storage?: StorageLike): Listing[];
  listScrapIds(storage?: StorageLike): string[];
  listFavoriteSpaces(storage?: StorageLike): Listing[];
  listBrokerOwnedSpaces(storage?: StorageLike): Listing[];
  getSpaceById(id: string | undefined, storage?: StorageLike): Listing | undefined;
  getSpaceByIdOrFallback(id: string | undefined, storage?: StorageLike): Listing;
  rememberViewedSpace(id: string, storage?: StorageLike): string[];
  toggleScrap(id: string, storage?: StorageLike): string[];
  removeScrap(id: string, storage?: StorageLike): string[];
  createSpaceDraft(
    draft: Omit<PrototypeListingDraft, "id" | "createdAt">,
    storage?: StorageLike
  ): PrototypeListingDraft;
}

function readSpaceCatalog(
  query: SpaceSearchQuery = {},
  storage?: StorageLike
): Listing[] {
  const baseListings = [...allListings];

  if (query.includeDrafts === false) {
    return baseListings;
  }

  return [...baseListings, ...readDraftListingsForDisplay(storage)];
}

function readListingByIds(listingIds: string[], catalog: Listing[]) {
  return listingIds
    .map((listingId) => catalog.find((listing) => listing.id === listingId))
    .filter((listing): listing is Listing => Boolean(listing));
}

export const localSpaceRepository: SpaceRepository = {
  listSpaces(query, storage) {
    return readSpaceCatalog(query, storage);
  },

  listSpaceResponses(query, storage) {
    const favoriteIds = readFavoriteListingIds(storage);

    return readSpaceCatalog(query, storage).map((listing) =>
      listingToSpaceResponse(listing, favoriteIds.includes(listing.id))
    );
  },

  listRecommendedSpaces() {
    return [...recommendedListings];
  },

  listRecentViewedSpaces(storage) {
    return readListingByIds(
      readRecentViewedListingIds(storage),
      readSpaceCatalog({}, storage)
    );
  },

  listScrapIds(storage) {
    return readFavoriteListingIds(storage);
  },

  listFavoriteSpaces(storage) {
    return readListingByIds(
      readFavoriteListingIds(storage),
      readSpaceCatalog({}, storage)
    );
  },

  listBrokerOwnedSpaces(storage) {
    return readDraftListingsForDisplay(storage);
  },

  getSpaceById(id, storage) {
    if (!id) return undefined;

    return readSpaceCatalog({}, storage).find((listing) => listing.id === id);
  },

  getSpaceByIdOrFallback(id, storage) {
    const fallback = readSpaceCatalog({}, storage)[0];

    if (!fallback) {
      throw new Error("Space catalog is empty.");
    }

    return localSpaceRepository.getSpaceById(id, storage) ?? fallback;
  },

  rememberViewedSpace(id, storage) {
    return rememberRecentViewedListing(id, storage);
  },

  toggleScrap(id, storage) {
    return toggleFavoriteListing(id, storage);
  },

  removeScrap(id, storage) {
    return removeFavoriteListing(id, storage);
  },

  createSpaceDraft(draft, storage) {
    return savePrototypeListingDraft(draft, storage);
  },
};

export const spaceRepository = localSpaceRepository;
