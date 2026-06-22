import {
  defaultViewerAsset,
  findViewerAssetById,
  room0ViewerAssetId,
  uploadGeneratedViewerAssetId,
} from "../data/mockViewerAssets";
import type { Listing } from "../types/listing";
import type { ViewerAsset } from "../types/viewer";

export interface ViewerRepository {
  getViewerAssetById(assetId: string | undefined): ViewerAsset;
  getViewerAssetForSpace(listing: Listing | null | undefined): ViewerAsset;
  getCameraGeneratedAssetId(): string;
  getUploadGeneratedAssetId(): string;
}

export const localViewerRepository: ViewerRepository = {
  getViewerAssetById(assetId) {
    return findViewerAssetById(assetId);
  },

  getViewerAssetForSpace(listing) {
    if (!listing) return defaultViewerAsset;

    return findViewerAssetById(listing.viewerAssetId);
  },

  getCameraGeneratedAssetId() {
    return room0ViewerAssetId;
  },

  getUploadGeneratedAssetId() {
    return uploadGeneratedViewerAssetId;
  },
};

export const viewerRepository = localViewerRepository;
