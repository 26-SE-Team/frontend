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
      kind: "model-file";
      label: string;
      description: string;
      format: "glb" | "gltf" | "ply";
      url: string;
    };
