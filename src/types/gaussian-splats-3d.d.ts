declare module "@mkkellogg/gaussian-splats-3d" {
  import type * as THREE from "three";

  export const SceneFormat: {
    Ply: number;
    Splat: number;
    KSplat: number;
  };

  export const LogLevel: {
    None: number;
    Error: number;
    Info: number;
    Debug: number;
  };

  export interface ViewerOptions {
    rootElement?: HTMLElement;
    renderer?: THREE.WebGLRenderer;
    cameraUp?: [number, number, number];
    initialCameraPosition?: [number, number, number];
    initialCameraLookAt?: [number, number, number];
    useBuiltInControls?: boolean;
    sharedMemoryForWorkers?: boolean;
    enableSIMDInSort?: boolean;
    integerBasedSort?: boolean;
    showLoadingUI?: boolean;
    ignoreDevicePixelRatio?: boolean;
    sphericalHarmonicsDegree?: number;
    splatSortDistanceMapPrecision?: number;
    logLevel?: number;
  }

  export interface SplatSceneOptions {
    format?: number;
    splatAlphaRemovalThreshold?: number;
    showLoadingUI?: boolean;
    progressiveLoad?: boolean;
    position?: [number, number, number];
    rotation?: [number, number, number, number];
    scale?: [number, number, number];
    onProgress?: (
      percentComplete: number,
      percentCompleteLabel?: string,
      loaderStatus?: number
    ) => void;
  }

  export interface AbortablePromise<T = void> {
    then: (onResolve: (value: T) => void | PromiseLike<void>) => AbortablePromise;
    catch: (onFail: (error: unknown) => void) => AbortablePromise;
    abort: (reason?: string) => void;
  }

  export class Viewer {
    camera: THREE.PerspectiveCamera | THREE.OrthographicCamera;
    controls: {
      target: THREE.Vector3;
      update: () => void;
      enablePan?: boolean;
      enableRotate?: boolean;
      enableZoom?: boolean;
      addEventListener?: (type: string, listener: () => void) => void;
      removeEventListener?: (type: string, listener: () => void) => void;
    } | null;

    constructor(options?: ViewerOptions);
    addSplatScene(path: string, options?: SplatSceneOptions): AbortablePromise;
    start(): void;
    stop(): void;
    dispose(): Promise<void>;
    forceRenderNextFrame(): void;
  }
}
