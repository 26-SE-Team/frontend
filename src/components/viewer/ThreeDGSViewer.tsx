import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { PLYLoader } from "three/examples/jsm/loaders/PLYLoader.js";
import type { GaussianSceneData, ViewerAsset, ViewerMode, Viewpoint } from "../../types/viewer";

interface ThreeDGSViewerProps {
  asset: ViewerAsset;
  mode: ViewerMode;
}

type ViewerStatus = "loading" | "ready" | "error";

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

const vectorFromTuple = ([x, y, z]: [number, number, number]) =>
  new THREE.Vector3(x, y, z);

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
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const [status, setStatus] = useState<ViewerStatus>("loading");
  const [activeViewpoint, setActiveViewpoint] = useState<Viewpoint | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

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
      if (asset.kind !== "gaussian-scene") return;
      const { object, bounds, hotspots } = buildGaussianObject(asset.scene);
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
      if (asset.kind !== "model-file") return;

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

      if (asset.format === "ply") {
        new PLYLoader().load(
          asset.url,
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
        asset.url,
        (gltf) => handleLoadedObject(gltf.scene),
        undefined,
        handleError
      );
    };

    setStatus("loading");
    setActiveViewpoint(null);
    if (asset.kind === "gaussian-scene") {
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
  }, [asset, mode]);

  const resetView = useCallback(() => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;
    camera.position.set(6, 4, 8);
    controls.target.set(0, 1, 0);
    controls.update();
    setActiveViewpoint(null);
  }, []);

  const moveCamera = useCallback((command: ViewerMoveCommand) => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    const viewDirection = controls.target.clone().sub(camera.position).normalize();
    const rightDirection = new THREE.Vector3()
      .crossVectors(viewDirection, camera.up)
      .normalize();
    const upDirection = camera.up.clone().normalize();
    const moveStep = 0.42;
    const rotateStep = THREE.MathUtils.degToRad(5);

    const translate = (direction: THREE.Vector3, amount: number) => {
      const delta = direction.clone().multiplyScalar(amount);
      camera.position.add(delta);
      controls.target.add(delta);
      controls.update();
      setActiveViewpoint(null);
    };

    const rotateView = (axis: THREE.Vector3, angle: number) => {
      const distance = Math.max(camera.position.distanceTo(controls.target), 1);
      const nextDirection = viewDirection.clone().applyAxisAngle(axis.normalize(), angle);
      controls.target.copy(camera.position.clone().addScaledVector(nextDirection, distance));
      controls.update();
      setActiveViewpoint(null);
    };

    switch (command) {
      case "forward":
        translate(viewDirection, moveStep);
        break;
      case "backward":
        translate(viewDirection, -moveStep);
        break;
      case "left":
        translate(rightDirection, -moveStep);
        break;
      case "right":
        translate(rightDirection, moveStep);
        break;
      case "up":
        translate(upDirection, moveStep);
        break;
      case "down":
        translate(upDirection, -moveStep);
        break;
      case "yaw-left":
        rotateView(upDirection, rotateStep);
        break;
      case "yaw-right":
        rotateView(upDirection, -rotateStep);
        break;
      case "pitch-up":
        rotateView(rightDirection, rotateStep);
        break;
      case "pitch-down":
        rotateView(rightDirection, -rotateStep);
        break;
      case "roll-left":
        camera.up.applyAxisAngle(viewDirection, rotateStep).normalize();
        controls.update();
        break;
      case "roll-right":
        camera.up.applyAxisAngle(viewDirection, -rotateStep).normalize();
        controls.update();
        break;
    }
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      move: moveCamera,
      reset: resetView,
    }),
    [moveCamera, resetView]
  );

  return (
    <div className="viewer3d">
      <div ref={mountRef} className="viewer3d__stage" />
      <div className="viewer3d__hud viewer3d__hud--top">
        <div>
          <p>{asset.kind === "model-file" ? asset.format.toUpperCase() : "3DGS"}</p>
          <h2>{asset.label}</h2>
        </div>
        <button type="button" onClick={resetView}>
          초기화
        </button>
      </div>
      <div className="viewer3d__hud viewer3d__hud--bottom">
        <span className={`viewer3d__status viewer3d__status--${status}`}>
          {status === "loading" ? "로딩 중" : status === "ready" ? "준비 완료" : "로드 실패"}
        </span>
        {activeViewpoint && <span>{activeViewpoint.label}</span>}
        {mode === "furniture" && <span>가구 배치 준비</span>}
      </div>
    </div>
  );
});
