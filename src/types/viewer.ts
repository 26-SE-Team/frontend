export type Vec3 = [number, number, number];

export type ViewerMode = "orbit" | "plan" | "furniture";

export interface GaussianSplat {
  id: string;
  position: Vec3;
  scale: number;
  color: Vec3;
  opacity: number;
}

export interface Viewpoint {
  id: string;
  label: string;
  description: string;
  position: Vec3;
  target: Vec3;
}

export interface ViewerPhoto {
  id: string;
  label: string;
  src: string;
  thumbSrc: string;
}

export interface SplatCameraPreset {
  position: Vec3;
  lookAt: Vec3;
  up: Vec3;
}

export interface NavigationFrame {
  up?: Vec3;
  forward?: Vec3;
  autoAlign?: boolean;
  floor?: {
    enabled?: boolean;
    autoDetect?: boolean;
    height?: number;
    quantile?: number;
    eyeHeight?: number;
    startOffset?: number;
    lookDistance?: number;
  };
}

export interface GaussianSceneData {
  name: string;
  description: string;
  splats: GaussianSplat[];
  viewpoints: Viewpoint[];
}

export type ViewerAsset =
  | {
      id: string;
      kind: "gaussian-scene";
      label: string;
      description: string;
      scene: GaussianSceneData;
    }
  | {
      id: string;
      kind: "splat-scene";
      label: string;
      description: string;
      url: string;
      format?: "splat" | "ksplat" | "ply";
      previewImageUrl: string;
      photos: ViewerPhoto[];
      camera: SplatCameraPreset;
      planCamera?: SplatCameraPreset;
      navigationFrame?: NavigationFrame;
      transform?: {
        position?: Vec3;
        rotation?: [number, number, number, number];
        scale?: Vec3;
      };
      stats?: {
        dataset: string;
        gaussianCount: number;
        finalEvalLoss: number;
      };
    }
  | {
      id: string;
      kind: "model-file";
      label: string;
      description: string;
      format: "glb" | "gltf" | "ply";
      url: string;
    };
