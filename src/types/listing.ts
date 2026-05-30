export interface Listing {
  id: string;
  imageUrl: string;
  imageUrls?: string[];
  price: string;
  type: string;
  info: string;
  location?: string;
  station?: string;
  size?: string;
  floor?: string;
  managementFee?: string;
  highlights?: string[];
  options?: string[];
  viewerAssetId?: string;
  mapPosition?: {
    lat: number;
    lng: number;
    label?: string;
  };
}
