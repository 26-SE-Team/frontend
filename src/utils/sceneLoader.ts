import type {
  GaussianSceneData,
  GaussianSplat,
  Vec3,
  Viewpoint,
} from "../types/viewer";

const isVec3 = (value: unknown): value is Vec3 =>
  Array.isArray(value) &&
  value.length === 3 &&
  value.every((entry) => typeof entry === "number" && Number.isFinite(entry));

const isSplat = (value: unknown): value is GaussianSplat => {
  if (typeof value !== "object" || value === null) return false;

  const candidate = value as Partial<GaussianSplat>;
  return (
    typeof candidate.id === "string" &&
    isVec3(candidate.position) &&
    typeof candidate.scale === "number" &&
    Number.isFinite(candidate.scale) &&
    isVec3(candidate.color) &&
    typeof candidate.opacity === "number" &&
    Number.isFinite(candidate.opacity)
  );
};

const isViewpoint = (value: unknown): value is Viewpoint => {
  if (typeof value !== "object" || value === null) return false;

  const candidate = value as Partial<Viewpoint>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.label === "string" &&
    typeof candidate.description === "string" &&
    isVec3(candidate.position) &&
    isVec3(candidate.target)
  );
};

export function parseGaussianScene(value: unknown): GaussianSceneData {
  if (typeof value !== "object" || value === null) {
    throw new Error("scene root must be an object");
  }

  const candidate = value as Partial<GaussianSceneData>;
  if (typeof candidate.name !== "string" || typeof candidate.description !== "string") {
    throw new Error("scene metadata is missing");
  }

  if (!Array.isArray(candidate.splats) || !candidate.splats.every(isSplat)) {
    throw new Error("scene splats are invalid");
  }

  if (
    !Array.isArray(candidate.viewpoints) ||
    !candidate.viewpoints.every(isViewpoint)
  ) {
    throw new Error("scene viewpoints are invalid");
  }

  return candidate as GaussianSceneData;
}

export async function loadSceneFromFile(file: File): Promise<GaussianSceneData> {
  const content = await file.text();
  return parseGaussianScene(JSON.parse(content) as unknown);
}
