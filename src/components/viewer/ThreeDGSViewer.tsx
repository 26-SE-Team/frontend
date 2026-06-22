import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import * as GaussianSplats3D from "@mkkellogg/gaussian-splats-3d";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { PLYLoader } from "three/examples/jsm/loaders/PLYLoader.js";
import type {
  GaussianSceneData,
  SplatCameraPreset,
  ViewerAsset,
  ViewerMode,
  Viewpoint,
} from "../../types/viewer";

interface ThreeDGSViewerProps {
  asset: ViewerAsset;
  mode: ViewerMode;
}

// Facade boundary: pages pass only StayView's ViewerAsset/ViewerMode contract,
// while this component adapts that contract to Three.js and GaussianSplats3D.

type ViewerStatus = "loading" | "ready" | "error";
type FloorStatus = "off" | "detecting" | "locked";

export type ViewerMoveCommand =
  | "forward"
  | "backward"
  | "left"
  | "right"
  | "up"
  | "down"
  | "yaw-left"
  | "yaw-right"
  | "pitch-up"
  | "pitch-down"
  | "roll-left"
  | "roll-right";

export interface ThreeDGSViewerHandle {
  move: (command: ViewerMoveCommand) => void;
  reset: () => void;
}

interface FloorState {
  up: THREE.Vector3;
  floorHeight: number;
  eyeHeight: number;
  boundsCenter: THREE.Vector3;
  startOffset: number;
  lookDistance: number;
}

interface FloorPlaneCandidate {
  normal: THREE.Vector3;
  height: number;
  support: number;
  score: number;
}

interface SplatPointStats {
  buffer: ArrayBuffer;
  splatCount: number;
  samples: THREE.Vector3[];
  fallbackHeights: number[];
  min: THREE.Vector3;
  max: THREE.Vector3;
}

const vectorFromTuple = ([x, y, z]: [number, number, number]) =>
  new THREE.Vector3(x, y, z);

const tupleFromVector = (vector: THREE.Vector3): [number, number, number] => [
  vector.x,
  vector.y,
  vector.z,
];

const splatFormatMap = {
  ply: GaussianSplats3D.SceneFormat.Ply,
  splat: GaussianSplats3D.SceneFormat.Splat,
  ksplat: GaussianSplats3D.SceneFormat.KSplat,
} as const;

const splatCameraForMode = (asset: ViewerAsset, mode: ViewerMode) => {
  if (asset.kind !== "splat-scene") return null;
  return mode === "plan" && asset.planCamera ? asset.planCamera : asset.camera;
};

const fallbackUp = new THREE.Vector3(0, 1, 0);
const fallbackForward = new THREE.Vector3(0, 0, -1);
const splatStrideBytes = 32;
const maxFloorSampleCount = 5000;
const floorPlaneIterations = 420;
const groundedDragYawSpeed = 0.006;
const groundedDragPitchSpeed = 0.0048;
const maxGroundedPitchDot = 0.92;
const planClipQuantile = 0.78;
const minPlanSplatRetentionRatio = 0.16;

function projectOntoPlane(vector: THREE.Vector3, planeNormal: THREE.Vector3) {
  return vector
    .clone()
    .sub(planeNormal.clone().multiplyScalar(vector.dot(planeNormal)));
}

function resolveNavigationUp(asset: ViewerAsset, mode: ViewerMode) {
  if (asset.kind === "splat-scene") {
    const cameraPreset = splatCameraForMode(asset, mode);
    const upTuple = asset.navigationFrame?.up ?? cameraPreset?.up;
    if (upTuple) {
      return vectorFromTuple(upTuple).normalize();
    }
  }

  return fallbackUp.clone();
}

function resolveNavigationForward(
  asset: ViewerAsset,
  mode: ViewerMode,
  upDirection: THREE.Vector3,
  viewDirection?: THREE.Vector3
) {
  if (viewDirection) {
    const projectedView = projectOntoPlane(viewDirection, upDirection);
    if (projectedView.lengthSq() > 0.0001) return projectedView.normalize();
  }

  if (asset.kind === "splat-scene" && asset.navigationFrame?.forward) {
    const projected = projectOntoPlane(
      vectorFromTuple(asset.navigationFrame.forward),
      upDirection
    );
    if (projected.lengthSq() > 0.0001) return projected.normalize();
  }

  const cameraPreset = asset.kind === "splat-scene"
    ? splatCameraForMode(asset, mode)
    : null;
  if (cameraPreset) {
    const presetView = vectorFromTuple(cameraPreset.lookAt)
      .sub(vectorFromTuple(cameraPreset.position));
    const projectedPreset = projectOntoPlane(presetView, upDirection);
    if (projectedPreset.lengthSq() > 0.0001) return projectedPreset.normalize();
  }

  return fallbackForward.clone();
}

function shouldUseGroundedFloor(asset: ViewerAsset, mode: ViewerMode) {
  return (
    asset.kind === "splat-scene" &&
    mode === "orbit" &&
    asset.navigationFrame?.floor?.enabled !== false
  );
}

function applyFloorHeightLock(
  camera: THREE.PerspectiveCamera | THREE.OrthographicCamera,
  controls: { target: THREE.Vector3; update: () => void },
  floor: FloorState
) {
  const desiredHeight = floor.floorHeight + floor.eyeHeight;
  const currentHeight = camera.position.dot(floor.up);
  const delta = floor.up.clone().multiplyScalar(desiredHeight - currentHeight);
  camera.position.add(delta);
  controls.target.add(delta);
  camera.up.copy(floor.up);
  controls.update();
}

function applyGroundedStart(
  viewer: GaussianSplats3D.Viewer,
  asset: ViewerAsset,
  mode: ViewerMode,
  floor: FloorState
) {
  if (!viewer.controls) return;

  const forward = resolveNavigationForward(asset, mode, floor.up);
  const walkCenter = floor.boundsCenter
    .clone()
    .addScaledVector(
      floor.up,
      floor.floorHeight + floor.eyeHeight - floor.boundsCenter.dot(floor.up)
    );
  const cameraPosition = walkCenter
    .clone()
    .addScaledVector(forward, -floor.startOffset);
  const lookAt = cameraPosition.clone().addScaledVector(forward, floor.lookDistance);

  viewer.camera.position.copy(cameraPosition);
  viewer.camera.up.copy(floor.up);
  viewer.camera.lookAt(lookAt);
  viewer.controls.target.copy(lookAt);
  viewer.controls.update();
  viewer.forceRenderNextFrame();
}

function rotateGroundedView(
  camera: THREE.PerspectiveCamera | THREE.OrthographicCamera,
  controls: { target: THREE.Vector3; update: () => void },
  axis: THREE.Vector3,
  angle: number
): THREE.Vector3 {
  const viewDirection = controls.target.clone().sub(camera.position);
  const distance = Math.max(viewDirection.length(), 1);
  const nextDirection = viewDirection.lengthSq() > 0.0001
    ? viewDirection.normalize().applyAxisAngle(axis, angle)
    : fallbackForward.clone().applyAxisAngle(axis, angle);

  camera.up.copy(axis);
  controls.target.copy(camera.position.clone().addScaledVector(nextDirection, distance));
  controls.update();
  return nextDirection.clone().normalize();
}

function rotateGroundedViewByDrag(
  camera: THREE.PerspectiveCamera | THREE.OrthographicCamera,
  controls: { target: THREE.Vector3; update: () => void },
  floor: FloorState,
  deltaX: number,
  deltaY: number
): THREE.Vector3 | null {
  const distance = Math.max(camera.position.distanceTo(controls.target), 1);
  const direction = controls.target.clone().sub(camera.position);
  if (direction.lengthSq() < 0.0001) return null;

  direction.normalize();
  direction.applyAxisAngle(floor.up, -deltaX * groundedDragYawSpeed);

  const right = new THREE.Vector3()
    .crossVectors(direction, floor.up)
    .normalize();
  const nextDirection = direction
    .clone()
    .applyAxisAngle(right, -deltaY * groundedDragPitchSpeed)
    .normalize();
  const pitchDot = nextDirection.dot(floor.up);
  const finalDirection =
    Math.abs(pitchDot) > maxGroundedPitchDot ? direction : nextDirection;

  camera.up.copy(floor.up);
  controls.target.copy(
    camera.position.clone().addScaledVector(finalDirection, distance)
  );
  controls.update();
  return finalDirection.clone();
}

function fallbackHeadingForUp(upDirection: THREE.Vector3) {
  const seed = Math.abs(fallbackForward.dot(upDirection)) < 0.95
    ? fallbackForward
    : new THREE.Vector3(0, 1, 0);
  const heading = projectOntoPlane(seed, upDirection);
  if (heading.lengthSq() > 0.0001) return heading.normalize();

  return projectOntoPlane(new THREE.Vector3(1, 0, 0), upDirection).normalize();
}

function resolveGroundedHeading(
  viewDirection: THREE.Vector3,
  floor: FloorState
) {
  const heading = projectOntoPlane(viewDirection, floor.up);
  if (heading.lengthSq() > 0.0001) return heading.normalize();

  return fallbackHeadingForUp(floor.up);
}

function moveGroundedCameraTo(
  viewer: GaussianSplats3D.Viewer,
  floorPoint: THREE.Vector3,
  floor: FloorState,
  preservedViewDirection?: THREE.Vector3 | null
) {
  if (!viewer.controls) return;

  const currentView = viewer.controls.target.clone().sub(viewer.camera.position);
  const distance = Math.max(floor.lookDistance, 1);
  const viewDirection =
    preservedViewDirection && preservedViewDirection.lengthSq() > 0.0001
      ? preservedViewDirection.clone().normalize()
      : currentView.lengthSq() > 0.0001
        ? resolveGroundedHeading(currentView, floor)
        : resolveGroundedHeading(fallbackForward, floor);
  const cameraPosition = floorPoint.clone().addScaledVector(floor.up, floor.eyeHeight);

  viewer.camera.position.copy(cameraPosition);
  viewer.camera.up.copy(floor.up);
  viewer.controls.target.copy(cameraPosition.clone().addScaledVector(viewDirection, distance));
  viewer.controls.update();
  viewer.forceRenderNextFrame();
}

function seededRandom(seed: number) {
  let state = seed >>> 0;

  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}

function clampFloorThreshold(boundsSize: THREE.Vector3) {
  return THREE.MathUtils.clamp(boundsSize.length() * 0.012, 0.035, 0.1);
}

function orientFloorNormal(
  normal: THREE.Vector3,
  height: number,
  upHint: THREE.Vector3,
  cameraPreset: SplatCameraPreset
) {
  const orientedNormal = normal.clone().normalize();
  let orientedHeight = height;

  if (orientedNormal.dot(upHint) < 0) {
    orientedNormal.negate();
    orientedHeight *= -1;
  }

  const cameraHeight =
    vectorFromTuple(cameraPreset.position).dot(orientedNormal) - orientedHeight;
  if (cameraHeight < 0) {
    orientedNormal.negate();
    orientedHeight *= -1;
  }

  return { normal: orientedNormal, height: orientedHeight };
}

function detectFloorPlane(
  samples: THREE.Vector3[],
  boundsSize: THREE.Vector3,
  upHint: THREE.Vector3,
  cameraPreset: SplatCameraPreset
): FloorPlaneCandidate | null {
  if (samples.length < 32) return null;

  const threshold = clampFloorThreshold(boundsSize);
  const random = seededRandom(20260530);
  let best: FloorPlaneCandidate | null = null;

  for (let iteration = 0; iteration < floorPlaneIterations; iteration += 1) {
    const pointA = samples[Math.floor(random() * samples.length)];
    const pointB = samples[Math.floor(random() * samples.length)];
    const pointC = samples[Math.floor(random() * samples.length)];
    const normal = new THREE.Vector3()
      .crossVectors(
        pointB.clone().sub(pointA),
        pointC.clone().sub(pointA)
      );

    if (normal.lengthSq() < 0.000001) continue;

    normal.normalize();
    let height = normal.dot(pointA);
    const oriented = orientFloorNormal(normal, height, upHint, cameraPreset);
    normal.copy(oriented.normal);
    height = oriented.height;

    const alignment = Math.abs(normal.dot(upHint));
    if (alignment < 0.35) continue;

    let support = 0;
    let above = 0;
    let below = 0;
    let inlierHeightTotal = 0;
    let errorTotal = 0;

    for (const sample of samples) {
      const distance = normal.dot(sample) - height;
      if (Math.abs(distance) <= threshold) {
        support += 1;
        inlierHeightTotal += normal.dot(sample);
        errorTotal += Math.abs(distance);
      }

      if (distance >= -threshold) {
        above += 1;
      } else {
        below += 1;
      }
    }

    if (support < 25) continue;

    const aboveRatio = above / samples.length;
    const belowRatio = below / samples.length;
    if (aboveRatio < 0.62 || belowRatio > 0.32) continue;

    const meanError = errorTotal / support;
    const score =
      support *
      Math.pow(alignment, 1.6) *
      Math.pow(aboveRatio, 2) *
      (1 / (1 + meanError / threshold));

    if (!best || score > best.score) {
      best = {
        normal: normal.clone(),
        height: inlierHeightTotal / support,
        support,
        score,
      };
    }
  }

  if (!best) return null;

  const oriented = orientFloorNormal(
    best.normal,
    best.height,
    upHint,
    cameraPreset
  );
  return {
    ...best,
    normal: oriented.normal,
    height: oriented.height,
  };
}

function quantileValue(values: number[], quantile: number) {
  if (values.length === 0) return undefined;

  const sortedValues = [...values].sort((left, right) => left - right);
  const index = Math.min(
    sortedValues.length - 1,
    Math.max(0, Math.floor(quantile * (sortedValues.length - 1)))
  );

  return sortedValues[index];
}

async function readSplatPointStats(
  asset: ViewerAsset,
  upHint: THREE.Vector3,
  signal: AbortSignal
): Promise<SplatPointStats> {
  if (asset.kind !== "splat-scene") {
    throw new Error("splat scene required");
  }

  const response = await fetch(asset.url, { signal });
  if (!response.ok) throw new Error("failed to load splat data");

  const buffer = await response.arrayBuffer();
  if (signal.aborted) throw new Error("splat analysis aborted");

  const view = new DataView(buffer);
  const splatCount = Math.floor(buffer.byteLength / splatStrideBytes);
  if (splatCount <= 0) throw new Error("empty splat scene");

  const sampleStride = Math.max(
    1,
    Math.floor(splatCount / maxFloorSampleCount)
  );
  const min = new THREE.Vector3(Infinity, Infinity, Infinity);
  const max = new THREE.Vector3(-Infinity, -Infinity, -Infinity);
  const samples: THREE.Vector3[] = [];
  const fallbackHeights: number[] = [];

  for (let index = 0; index < splatCount; index += 1) {
    const offset = index * splatStrideBytes;
    const point = new THREE.Vector3(
      view.getFloat32(offset, true),
      view.getFloat32(offset + 4, true),
      view.getFloat32(offset + 8, true)
    );

    fallbackHeights.push(point.dot(upHint));
    min.min(point);
    max.max(point);
    if (index % sampleStride === 0) {
      samples.push(point);
    }
  }

  return {
    buffer,
    splatCount,
    samples,
    fallbackHeights,
    min,
    max,
  };
}

function resolveSplatFloorState(
  asset: ViewerAsset,
  upHint: THREE.Vector3,
  stats: SplatPointStats
): FloorState | null {
  if (asset.kind !== "splat-scene") return null;

  const floorConfig = asset.navigationFrame?.floor;
  const quantile = floorConfig?.quantile ?? 0.05;
  const eyeHeight = floorConfig?.eyeHeight ?? 1.45;
  const startOffset = floorConfig?.startOffset ?? 1.8;
  const lookDistance = floorConfig?.lookDistance ?? 3.2;
  let floorHeight = floorConfig?.height;
  let floorUp = upHint.clone().normalize();

  if (floorHeight === undefined && floorConfig?.autoDetect !== false) {
    const cameraPreset = splatCameraForMode(asset, "orbit") ?? asset.camera;
    const floorPlane = asset.navigationFrame?.autoAlign === false
      ? null
      : detectFloorPlane(
          stats.samples,
          stats.max.clone().sub(stats.min),
          upHint.clone().normalize(),
          cameraPreset
        );

    if (floorPlane) {
      floorUp = floorPlane.normal;
      floorHeight = floorPlane.height;
    } else {
      floorHeight = quantileValue(stats.fallbackHeights, quantile);
    }
  }

  if (floorHeight === undefined) return null;

  return {
    up: floorUp,
    floorHeight,
    eyeHeight,
    boundsCenter: stats.min.clone().add(stats.max).multiplyScalar(0.5),
    startOffset,
    lookDistance,
  };
}

function resolvePlanClipUp(asset: ViewerAsset) {
  if (asset.kind !== "splat-scene") return fallbackUp.clone();

  if (asset.planCamera) {
    const viewAxis = vectorFromTuple(asset.planCamera.position).sub(
      vectorFromTuple(asset.planCamera.lookAt)
    );
    if (viewAxis.lengthSq() > 0.0001) return viewAxis.normalize();
  }

  return resolveNavigationUp(asset, "orbit");
}

function getSplatHeightRange(stats: SplatPointStats, upDirection: THREE.Vector3) {
  const view = new DataView(stats.buffer);
  let minHeight = Infinity;
  let maxHeight = -Infinity;

  for (let index = 0; index < stats.splatCount; index += 1) {
    const offset = index * splatStrideBytes;
    const height =
      view.getFloat32(offset, true) * upDirection.x +
      view.getFloat32(offset + 4, true) * upDirection.y +
      view.getFloat32(offset + 8, true) * upDirection.z;
    minHeight = Math.min(minHeight, height);
    maxHeight = Math.max(maxHeight, height);
  }

  return { minHeight, maxHeight };
}

function createFilteredSplatUrl(
  stats: SplatPointStats,
  upDirection: THREE.Vector3,
  maxHeight: number
) {
  const source = new Uint8Array(stats.buffer);
  const view = new DataView(stats.buffer);
  const keptOffsets: number[] = [];

  for (let index = 0; index < stats.splatCount; index += 1) {
    const offset = index * splatStrideBytes;
    const height =
      view.getFloat32(offset, true) * upDirection.x +
      view.getFloat32(offset + 4, true) * upDirection.y +
      view.getFloat32(offset + 8, true) * upDirection.z;

    if (height <= maxHeight) {
      keptOffsets.push(offset);
    }
  }

  const minimumKeptCount = Math.max(
    1000,
    Math.floor(stats.splatCount * minPlanSplatRetentionRatio)
  );
  if (
    keptOffsets.length < minimumKeptCount ||
    keptOffsets.length === stats.splatCount
  ) {
    return null;
  }

  const filtered = new Uint8Array(keptOffsets.length * splatStrideBytes);
  keptOffsets.forEach((offset, index) => {
    filtered.set(
      source.subarray(offset, offset + splatStrideBytes),
      index * splatStrideBytes
    );
  });

  const filteredBuffer = filtered.buffer.slice(
    filtered.byteOffset,
    filtered.byteOffset + filtered.byteLength
  );

  return URL.createObjectURL(
    new Blob([filteredBuffer], { type: "application/octet-stream" })
  );
}

async function createPlanSplatUrl(
  asset: ViewerAsset,
  signal: AbortSignal
): Promise<string | null> {
  if (
    asset.kind !== "splat-scene" ||
    (asset.format !== undefined && asset.format !== "splat")
  ) {
    return null;
  }

  const clipUp = resolvePlanClipUp(asset);
  const stats = await readSplatPointStats(asset, clipUp, signal);
  if (signal.aborted) throw new Error("plan splat clipping aborted");

  const floor = resolveSplatFloorState(asset, clipUp, stats);
  const clipAxis = floor?.up ?? clipUp;
  const { minHeight, maxHeight } = getSplatHeightRange(stats, clipAxis);
  const sceneHeight = maxHeight - minHeight;
  const fallbackCutHeight = quantileValue(stats.fallbackHeights, planClipQuantile);
  const floorCutHeight =
    floor?.floorHeight === undefined
      ? undefined
      : floor.floorHeight + THREE.MathUtils.clamp(sceneHeight * 0.72, 1.75, 2.35);
  const maxVisibleHeight = floorCutHeight ?? fallbackCutHeight;

  if (maxVisibleHeight === undefined) return null;

  return createFilteredSplatUrl(stats, clipAxis, maxVisibleHeight);
}

async function estimateSplatFloor(
  asset: ViewerAsset,
  upHint: THREE.Vector3,
  signal: AbortSignal
): Promise<FloorState | null> {
  if (asset.kind !== "splat-scene") return null;

  const stats = await readSplatPointStats(asset, upHint, signal);
  return resolveSplatFloorState(asset, upHint, stats);
}

function disposeObject(object: THREE.Object3D) {
  object.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (mesh.geometry) {
      mesh.geometry.dispose();
    }

    const material = mesh.material;
    if (Array.isArray(material)) {
      material.forEach((entry) => entry.dispose());
    } else if (material) {
      material.dispose();
    }
  });
}

function buildGaussianObject(sceneData: GaussianSceneData) {
  const group = new THREE.Group();
  const bounds = new THREE.Box3();
  const geometry = new THREE.SphereGeometry(1, 10, 10);
  const material = new THREE.MeshStandardMaterial({
    roughness: 0.62,
    metalness: 0.02,
    vertexColors: true,
  });
  const mesh = new THREE.InstancedMesh(geometry, material, sceneData.splats.length);
  const matrix = new THREE.Matrix4();

  sceneData.splats.forEach((splat, index) => {
    const center = vectorFromTuple(splat.position);
    matrix.compose(
      center,
      new THREE.Quaternion(),
      new THREE.Vector3(splat.scale, splat.scale, splat.scale)
    );
    mesh.setMatrixAt(index, matrix);
    mesh.setColorAt(
      index,
      new THREE.Color(`rgb(${splat.color[0]}, ${splat.color[1]}, ${splat.color[2]})`)
    );
    bounds.expandByPoint(center);
  });

  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  group.add(mesh);

  const hotspotGeometry = new THREE.SphereGeometry(0.14, 16, 16);
  const hotspotMaterial = new THREE.MeshBasicMaterial({
    color: "#7c3aed",
    transparent: true,
    opacity: 0.95,
  });

  const hotspots: THREE.Mesh[] = sceneData.viewpoints.map((viewpoint) => {
    const marker = new THREE.Mesh(hotspotGeometry, hotspotMaterial);
    marker.position.copy(vectorFromTuple(viewpoint.position));
    marker.userData.viewpoint = viewpoint;
    group.add(marker);
    bounds.expandByPoint(marker.position);
    return marker;
  });

  return { object: group, bounds, hotspots };
}

export const ThreeDGSViewer = forwardRef<ThreeDGSViewerHandle, ThreeDGSViewerProps>(
  function ThreeDGSViewer({ asset, mode }, ref) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const gaussianViewerRef = useRef<GaussianSplats3D.Viewer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const floorStateRef = useRef<FloorState | null>(null);
  const groundedLookDirectionRef = useRef<THREE.Vector3 | null>(null);
  const [status, setStatus] = useState<ViewerStatus>("loading");
  const [floorStatus, setFloorStatus] = useState<FloorStatus>("off");
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [, setActiveViewpoint] = useState<Viewpoint | null>(null);
  const activeAsset = asset;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    if (activeAsset.kind === "splat-scene") {
      let disposed = false;
      const floorAbortController = new AbortController();
      const cameraPreset = splatCameraForMode(activeAsset, mode) as SplatCameraPreset;
      const navigationUp = resolveNavigationUp(activeAsset, mode);
      const useGroundedFloor = shouldUseGroundedFloor(activeAsset, mode);
      const renderer = new THREE.WebGLRenderer({
        antialias: false,
        precision: "highp",
      });
      renderer.setPixelRatio(
        window.devicePixelRatio > 2 ? 1 : window.devicePixelRatio || 1
      );
      renderer.setClearColor(new THREE.Color("#111318"), 1);
      renderer.setSize(mount.clientWidth || 360, mount.clientHeight || 520);
      mount.appendChild(renderer.domElement);

      const resizeObserver = new ResizeObserver(() => {
        renderer.setSize(mount.clientWidth || 360, mount.clientHeight || 520);
        gaussianViewerRef.current?.forceRenderNextFrame();
      });
      resizeObserver.observe(mount);

      const viewer = new GaussianSplats3D.Viewer({
        rootElement: mount,
        renderer,
        cameraUp: tupleFromVector(navigationUp),
        initialCameraPosition: cameraPreset.position,
        initialCameraLookAt: cameraPreset.lookAt,
        sharedMemoryForWorkers: false,
        enableSIMDInSort: false,
        integerBasedSort: false,
        useBuiltInControls: true,
        ignoreDevicePixelRatio: window.devicePixelRatio > 2,
        sphericalHarmonicsDegree: 0,
        splatSortDistanceMapPrecision: 18,
        logLevel: GaussianSplats3D.LogLevel.None,
      });
      gaussianViewerRef.current = viewer;
      if (useGroundedFloor && viewer.controls) {
        viewer.controls.enablePan = false;
        viewer.controls.enableRotate = false;
        viewer.controls.enableZoom = false;
      }

      setStatus("loading");
      setFloorStatus(useGroundedFloor ? "detecting" : "off");
      setLoadingProgress(0);
      setActiveViewpoint(null);
      floorStateRef.current = null;
      groundedLookDirectionRef.current = null;

      const floorPromise = useGroundedFloor
        ? estimateSplatFloor(activeAsset, navigationUp, floorAbortController.signal)
            .then((floor) => {
              if (disposed) return null;
              floorStateRef.current = floor;
              setFloorStatus(floor ? "locked" : "off");
              return floor;
            })
            .catch(() => {
              if (!disposed) setFloorStatus("off");
              return null;
            })
        : Promise.resolve(null);
      let loadPromise: GaussianSplats3D.AbortablePromise | null = null;
      let planSceneObjectUrl: string | null = null;
      const loadSplatScene = (sceneUrl: string) => {
        loadPromise = viewer.addSplatScene(sceneUrl, {
          format: activeAsset.format
            ? splatFormatMap[activeAsset.format]
            : undefined,
          splatAlphaRemovalThreshold: 5,
          showLoadingUI: false,
          progressiveLoad: true,
          position: activeAsset.transform?.position,
          rotation: activeAsset.transform?.rotation,
          scale: activeAsset.transform?.scale,
          onProgress: (percentComplete) => {
            if (!disposed) setLoadingProgress(Math.round(percentComplete));
          },
        });

        return loadPromise;
      };

      let syncControls = false;
      const handleControlsChange = () => {
        const floor = floorStateRef.current;
        if (!useGroundedFloor || !floor || !viewer.controls || syncControls) return;

        syncControls = true;
        applyFloorHeightLock(viewer.camera, viewer.controls, floor);
        viewer.forceRenderNextFrame();
        syncControls = false;
      };

      viewer.controls?.addEventListener?.("change", handleControlsChange);

      let pointerStart: { x: number; y: number; time: number } | null = null;
      let pointerLast: { x: number; y: number } | null = null;
      let pointerDragged = false;
      const raycaster = new THREE.Raycaster();
      const pointer = new THREE.Vector2();
      const floorPlane = new THREE.Plane();
      const floorHit = new THREE.Vector3();
      const pointerListenerOptions = { capture: true };

      const stopGroundedEvent = (event: Event) => {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
      };

      const handlePointerDown = (event: PointerEvent) => {
        if (!useGroundedFloor) return;
        stopGroundedEvent(event);
        if (event.button !== 0) return;
        renderer.domElement.setPointerCapture?.(event.pointerId);
        pointerStart = {
          x: event.clientX,
          y: event.clientY,
          time: window.performance.now(),
        };
        pointerLast = {
          x: event.clientX,
          y: event.clientY,
        };
        pointerDragged = false;
      };

      const handlePointerMove = (event: PointerEvent) => {
        if (!useGroundedFloor) return;
        stopGroundedEvent(event);

        const floor = floorStateRef.current;
        if (
          !floor ||
          !viewer.controls ||
          !pointerStart ||
          !pointerLast ||
          event.buttons !== 1
        ) {
          return;
        }

        const totalDx = event.clientX - pointerStart.x;
        const totalDy = event.clientY - pointerStart.y;
        const dx = event.clientX - pointerLast.x;
        const dy = event.clientY - pointerLast.y;
        pointerLast = {
          x: event.clientX,
          y: event.clientY,
        };

        if (Math.hypot(totalDx, totalDy) > 3) {
          pointerDragged = true;
        }

        if (dx === 0 && dy === 0) return;

        const nextDirection = rotateGroundedViewByDrag(
          viewer.camera,
          viewer.controls,
          floor,
          dx,
          dy
        );
        if (nextDirection) {
          groundedLookDirectionRef.current = nextDirection;
        }
        viewer.forceRenderNextFrame();
      };

      const handlePointerUp = (event: PointerEvent) => {
        if (!useGroundedFloor) return;
        stopGroundedEvent(event);

        const floor = floorStateRef.current;
        if (!floor || !pointerStart) {
          pointerStart = null;
          pointerLast = null;
          pointerDragged = false;
          renderer.domElement.releasePointerCapture?.(event.pointerId);
          return;
        }

        const dx = event.clientX - pointerStart.x;
        const dy = event.clientY - pointerStart.y;
        const elapsed = window.performance.now() - pointerStart.time;
        pointerStart = null;
        pointerLast = null;
        renderer.domElement.releasePointerCapture?.(event.pointerId);

        if (pointerDragged || Math.hypot(dx, dy) > 8 || elapsed > 480) return;

        const rect = renderer.domElement.getBoundingClientRect();
        pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(pointer, viewer.camera);
        floorPlane.set(floor.up, -floor.floorHeight);

        const hit = raycaster.ray.intersectPlane(floorPlane, floorHit);
        if (!hit) return;

        moveGroundedCameraTo(
          viewer,
          floorHit,
          floor,
          groundedLookDirectionRef.current
        );
      };

      const handlePointerCancel = (event: PointerEvent) => {
        if (useGroundedFloor) {
          stopGroundedEvent(event);
        }
        pointerStart = null;
        pointerLast = null;
        pointerDragged = false;
        renderer.domElement.releasePointerCapture?.(event.pointerId);
      };

      const handleWheel = (event: WheelEvent) => {
        if (!useGroundedFloor) return;
        stopGroundedEvent(event);

        const floor = floorStateRef.current;
        if (!floor || !viewer.controls) return;

        const wheelDelta =
          Math.abs(event.deltaX) > Math.abs(event.deltaY)
            ? event.deltaX
            : event.deltaY;
        const angle = THREE.MathUtils.clamp(wheelDelta * 0.0024, -0.24, 0.24);
        groundedLookDirectionRef.current = rotateGroundedView(
          viewer.camera,
          viewer.controls,
          floor.up,
          -angle
        );
        viewer.forceRenderNextFrame();
      };

      renderer.domElement.addEventListener(
        "pointerdown",
        handlePointerDown,
        pointerListenerOptions
      );
      renderer.domElement.addEventListener(
        "pointermove",
        handlePointerMove,
        pointerListenerOptions
      );
      renderer.domElement.addEventListener(
        "pointerup",
        handlePointerUp,
        pointerListenerOptions
      );
      renderer.domElement.addEventListener(
        "pointercancel",
        handlePointerCancel,
        pointerListenerOptions
      );
      renderer.domElement.addEventListener("wheel", handleWheel, {
        capture: true,
        passive: false,
      });

      const handleSplatLoadFailure = () => {
        if (disposed) return;
        setStatus("error");
      };

      const startSplatSceneLoad = async () => {
        try {
          const sceneUrl =
            mode === "plan"
              ? (await createPlanSplatUrl(
                  activeAsset,
                  floorAbortController.signal
                )) ?? activeAsset.url
              : activeAsset.url;

          if (disposed) {
            if (sceneUrl.startsWith("blob:")) URL.revokeObjectURL(sceneUrl);
            return;
          }

          if (sceneUrl.startsWith("blob:")) {
            planSceneObjectUrl = sceneUrl;
          }

          loadSplatScene(sceneUrl)
            .then(async () => {
              if (disposed) return;
              const floor = await floorPromise;
              if (disposed) return;
              if (floor) {
                applyGroundedStart(viewer, activeAsset, mode, floor);
                if (viewer.controls) {
                  groundedLookDirectionRef.current = viewer.controls.target
                    .clone()
                    .sub(viewer.camera.position)
                    .normalize();
                }
              }
              viewer.start();
              setLoadingProgress(100);
              setStatus("ready");
            })
            .catch(handleSplatLoadFailure);
        } catch {
          if (disposed) return;
          loadSplatScene(activeAsset.url)
            .then(async () => {
              if (disposed) return;
              const floor = await floorPromise;
              if (disposed) return;
              if (floor) {
                applyGroundedStart(viewer, activeAsset, mode, floor);
              }
              viewer.start();
              setLoadingProgress(100);
              setStatus("ready");
            })
            .catch(handleSplatLoadFailure);
        }
      };

      void startSplatSceneLoad();

      return () => {
        disposed = true;
        gaussianViewerRef.current = null;
        floorStateRef.current = null;
        groundedLookDirectionRef.current = null;
        floorAbortController.abort();
        loadPromise?.abort("viewer disposed");
        if (planSceneObjectUrl) {
          URL.revokeObjectURL(planSceneObjectUrl);
        }
        viewer.controls?.removeEventListener?.("change", handleControlsChange);
        renderer.domElement.removeEventListener(
          "pointerdown",
          handlePointerDown,
          pointerListenerOptions
        );
        renderer.domElement.removeEventListener(
          "pointermove",
          handlePointerMove,
          pointerListenerOptions
        );
        renderer.domElement.removeEventListener(
          "pointerup",
          handlePointerUp,
          pointerListenerOptions
        );
        renderer.domElement.removeEventListener(
          "pointercancel",
          handlePointerCancel,
          pointerListenerOptions
        );
        renderer.domElement.removeEventListener("wheel", handleWheel, {
          capture: true,
        });
        void viewer
          .dispose()
          .catch(() => undefined)
          .finally(() => {
            resizeObserver.disconnect();
            renderer.dispose();
            if (renderer.domElement.parentNode === mount) {
              mount.removeChild(renderer.domElement);
            }
          });
      };
    }

    let animationFrame = 0;
    let disposed = false;
    const cleanupTargets: THREE.Object3D[] = [];
    const cleanupCallbacks: (() => void)[] = [];
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#111318");
    scene.fog = new THREE.Fog("#111318", 18, 42);

    const width = mount.clientWidth || 360;
    const height = mount.clientHeight || 520;
    const camera = new THREE.PerspectiveCamera(54, width / height, 0.1, 120);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 1.2;
    controls.maxDistance = 32;
    controls.maxPolarAngle = Math.PI / 2.02;
    controlsRef.current = controls;
    cameraRef.current = camera;

    scene.add(new THREE.AmbientLight("#ffffff", 1.8));
    const keyLight = new THREE.DirectionalLight("#ffffff", 2.2);
    keyLight.position.set(4, 7, 5);
    scene.add(keyLight);

    const grid = new THREE.GridHelper(12, 12, "#4f46e5", "#30333b");
    grid.position.y = -0.02;
    scene.add(grid);

    const focusBounds = (bounds: THREE.Box3) => {
      const center = bounds.getCenter(new THREE.Vector3());
      const size = bounds.getSize(new THREE.Vector3());
      const distance = Math.max(size.length() * 0.72, 7);

      if (mode === "plan") {
        camera.position.set(center.x, center.y + distance * 1.25, center.z + 0.01);
        controls.maxPolarAngle = 0.02;
      } else {
        camera.position.set(
          center.x + distance * 0.48,
          center.y + distance * 0.34,
          center.z + distance * 0.74
        );
        controls.maxPolarAngle = Math.PI / 2.02;
      }

      controls.target.copy(center);
      controls.update();
    };

    const loadGaussianScene = () => {
      if (activeAsset.kind !== "gaussian-scene") return;
      const { object, bounds, hotspots } = buildGaussianObject(activeAsset.scene);
      scene.add(object);
      cleanupTargets.push(object);
      focusBounds(bounds);
      setStatus("ready");

      const raycaster = new THREE.Raycaster();
      const pointer = new THREE.Vector2();
      const handlePointerDown = (event: PointerEvent) => {
        const rect = renderer.domElement.getBoundingClientRect();
        pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);

        const hit = raycaster.intersectObjects(hotspots, false)[0];
        if (!hit) return;

        const viewpoint = hit.object.userData.viewpoint as Viewpoint;
        camera.position.copy(vectorFromTuple(viewpoint.position));
        controls.target.copy(vectorFromTuple(viewpoint.target));
        controls.update();
        setActiveViewpoint(viewpoint);
      };

      renderer.domElement.addEventListener("pointerdown", handlePointerDown);
      cleanupCallbacks.push(() =>
        renderer.domElement.removeEventListener("pointerdown", handlePointerDown)
      );
    };

    const loadModelFile = () => {
      if (activeAsset.kind !== "model-file") return;

      const handleLoadedObject = (object: THREE.Object3D) => {
        if (disposed) return;
        const bounds = new THREE.Box3().setFromObject(object);
        scene.add(object);
        cleanupTargets.push(object);
        focusBounds(bounds);
        setStatus("ready");
      };

      const handleError = () => {
        if (!disposed) setStatus("error");
      };

      if (activeAsset.format === "ply") {
        new PLYLoader().load(
          activeAsset.url,
          (geometry) => {
            geometry.computeVertexNormals();
            const material = new THREE.MeshStandardMaterial({
              color: "#d9d2c6",
              roughness: 0.58,
            });
            handleLoadedObject(new THREE.Mesh(geometry, material));
          },
          undefined,
          handleError
        );
        return;
      }

      new GLTFLoader().load(
        activeAsset.url,
        (gltf) => handleLoadedObject(gltf.scene),
        undefined,
        handleError
      );
    };

    setStatus("loading");
    setFloorStatus("off");
    setLoadingProgress(0);
    setActiveViewpoint(null);
    if (activeAsset.kind === "gaussian-scene") {
      loadGaussianScene();
    } else {
      loadModelFile();
    }

    const handleResize = () => {
      const nextWidth = mount.clientWidth || 360;
      const nextHeight = mount.clientHeight || 520;
      camera.aspect = nextWidth / nextHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(nextWidth, nextHeight);
    };

    const render = () => {
      controls.update();
      renderer.render(scene, camera);
      animationFrame = requestAnimationFrame(render);
    };

    window.addEventListener("resize", handleResize);
    render();

    return () => {
      disposed = true;
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", handleResize);
      cleanupTargets.forEach((target) => {
        target.removeFromParent();
        disposeObject(target);
      });
      cleanupCallbacks.forEach((callback) => callback());
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [activeAsset, mode]);

  const resetView = useCallback(() => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    const gaussianViewer = gaussianViewerRef.current;

    if (gaussianViewer) {
      if (activeAsset.kind !== "splat-scene") return;
      const cameraPreset = splatCameraForMode(activeAsset, mode) as SplatCameraPreset;
      const navigationUp = resolveNavigationUp(activeAsset, mode);
      gaussianViewer.camera.position.copy(vectorFromTuple(cameraPreset.position));
      gaussianViewer.camera.up.copy(navigationUp).normalize();
      gaussianViewer.camera.lookAt(vectorFromTuple(cameraPreset.lookAt));
      gaussianViewer.controls?.target.copy(vectorFromTuple(cameraPreset.lookAt));
      if (floorStateRef.current && gaussianViewer.controls) {
        applyGroundedStart(gaussianViewer, activeAsset, mode, floorStateRef.current);
        groundedLookDirectionRef.current = gaussianViewer.controls.target
          .clone()
          .sub(gaussianViewer.camera.position)
          .normalize();
      }
      gaussianViewer.controls?.update();
      gaussianViewer.forceRenderNextFrame();
      setActiveViewpoint(null);
      return;
    }

    if (!camera || !controls) return;
    camera.position.set(6, 4, 8);
    controls.target.set(0, 1, 0);
    controls.update();
    setActiveViewpoint(null);
  }, [activeAsset, mode]);

  const moveCamera = useCallback((command: ViewerMoveCommand) => {
    const gaussianViewer = gaussianViewerRef.current;
    const camera = gaussianViewer?.camera ?? cameraRef.current;
    const controls = gaussianViewer?.controls ?? controlsRef.current;
    if (!camera || !controls) return;

    const floorState = shouldUseGroundedFloor(activeAsset, mode)
      ? floorStateRef.current
      : null;
    const viewDirection = controls.target.clone().sub(camera.position).normalize();
    const upDirection = floorState?.up ?? resolveNavigationUp(activeAsset, mode);
    const forwardDirection = resolveNavigationForward(
      activeAsset,
      mode,
      upDirection,
      viewDirection
    );
    const rightDirection = new THREE.Vector3()
      .crossVectors(forwardDirection, upDirection)
      .normalize();
    const moveStep = 0.42;
    const eyeHeightStep = 0.08;
    const rotateStep = THREE.MathUtils.degToRad(5);

    const translate = (direction: THREE.Vector3, amount: number) => {
      const delta = direction.clone().multiplyScalar(amount);
      camera.position.add(delta);
      controls.target.add(delta);
      if (floorState) {
        applyFloorHeightLock(camera, controls, floorState);
      }
      controls.update();
      setActiveViewpoint(null);
    };

    const rotateView = (axis: THREE.Vector3, angle: number) => {
      const distance = Math.max(camera.position.distanceTo(controls.target), 1);
      const nextDirection = viewDirection.clone().applyAxisAngle(axis.normalize(), angle);
      controls.target.copy(camera.position.clone().addScaledVector(nextDirection, distance));
      if (floorState) {
        camera.up.copy(upDirection);
      }
      controls.update();
      setActiveViewpoint(null);
    };

    const adjustEyeHeight = (amount: number) => {
      if (!floorState) {
        translate(upDirection, amount);
        return;
      }

      floorState.eyeHeight = THREE.MathUtils.clamp(
        floorState.eyeHeight + amount,
        0.9,
        1.9
      );
      applyFloorHeightLock(camera, controls, floorState);
      setActiveViewpoint(null);
    };

    switch (command) {
      case "forward":
        translate(forwardDirection, moveStep);
        break;
      case "backward":
        translate(forwardDirection, -moveStep);
        break;
      case "left":
        translate(rightDirection, -moveStep);
        break;
      case "right":
        translate(rightDirection, moveStep);
        break;
      case "up":
        adjustEyeHeight(eyeHeightStep);
        break;
      case "down":
        adjustEyeHeight(-eyeHeightStep);
        break;
      case "yaw-left":
        camera.up.copy(upDirection);
        rotateView(upDirection, rotateStep);
        break;
      case "yaw-right":
        camera.up.copy(upDirection);
        rotateView(upDirection, -rotateStep);
        break;
      case "pitch-up":
        rotateView(rightDirection, rotateStep);
        break;
      case "pitch-down":
        rotateView(rightDirection, -rotateStep);
        break;
      case "roll-left":
        if (floorState) {
          camera.up.copy(upDirection);
          controls.update();
          break;
        }
        camera.up.applyAxisAngle(viewDirection, rotateStep).normalize();
        controls.update();
        break;
      case "roll-right":
        if (floorState) {
          camera.up.copy(upDirection);
          controls.update();
          break;
        }
        camera.up.applyAxisAngle(viewDirection, -rotateStep).normalize();
        controls.update();
        break;
    }

    if (floorState) {
      const nextViewDirection = controls.target.clone().sub(camera.position);
      if (nextViewDirection.lengthSq() > 0.0001) {
        groundedLookDirectionRef.current = nextViewDirection.normalize();
      }
    }
    gaussianViewer?.forceRenderNextFrame();
  }, [activeAsset, mode]);

  useImperativeHandle(
    ref,
    () => ({
      move: moveCamera,
      reset: resetView,
    }),
    [moveCamera, resetView]
  );

  const isGroundedWalk = floorStatus === "locked";
  const shouldShowStatus = status === "loading" || status === "error";

  return (
    <div className={`viewer3d${isGroundedWalk ? " viewer3d--walk" : ""}`}>
      <div ref={mountRef} className="viewer3d__stage" />
      {shouldShowStatus && (
        <div className="viewer3d__hud viewer3d__hud--bottom">
          {status === "loading" && (
            <span className="viewer3d__status viewer3d__status--loading">
              {loadingProgress ? `${loadingProgress}%` : "불러오는 중"}
            </span>
          )}
          {status === "error" && (
            <span className="viewer3d__status viewer3d__status--error">
              공간을 불러오지 못했습니다
            </span>
          )}
        </div>
      )}
    </div>
  );
});
