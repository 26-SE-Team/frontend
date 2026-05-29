# Room0 3DGS Demo

`room0_3dgs_hotel_preview_bundle.zip`에서 StayView 시연에 필요한 경량 자산만 `public/demo/room0`에 복사했다.

## Included

- `public/demo/room0/models/room0.splat`: 실제 학습된 80,000 Gaussian Splat scene
- `public/demo/room0/photos/*.webp`: 숙소 상세/갤러리용 앱 이미지
- `public/demo/room0/thumbs/*.webp`: 상세 썸네일
- `public/demo/room0/meta/*.json`: 학습/프리뷰 근거 metadata

## Excluded

- `room0_gaussian.ply`: 원본 PLY는 5MB 이상이며 앱은 `.splat`을 직접 로드한다.
- `room0_viewer.html`: standalone viewer는 4MB 이상이고 앱 UI와 충돌한다.
- `full_png/*.png`: 앱에서는 webp만 사용한다.

## Viewer Integration

`@mkkellogg/gaussian-splats-3d`를 3DGS renderer adapter로 사용한다. 기존 Three.js fixture/GLB/PLY 경로는 유지하고, `ViewerAsset.kind === "splat-scene"`일 때만 실제 `.splat/.ksplat` renderer를 사용한다.

3DGS 좌표계는 일반 Three.js Y-up 모델과 다를 수 있으므로 `ViewerAsset.navigationFrame`을 둔다. 보행 모드에서는 수동 up vector를 고정값으로 믿지 않고 `.splat` point cloud에서 바닥 평면을 먼저 찾은 뒤, 그 평면 normal을 이동/회전 기준축으로 사용한다.

Room0 asset은 `navigationFrame.floor.autoDetect`를 켜서 `.splat` 샘플에서 RANSAC 방식으로 넓은 낮은 평면을 찾는다. 초기 카메라 up은 실서비스에서 휴대폰 자이로/중력 센서가 줄 gravity hint의 prototype fallback으로만 쓰고, 실제 보행 축은 감지된 바닥 평면에서 만든다. 바닥 평면 감지가 실패하면 낮은 분위수 높이로 fallback한다.

기본 `orbit` 모드는 보행 모드로 동작하며 화면 가상 패드 대신 바닥 클릭/탭으로 위치를 옮기고, 드래그와 휠 입력으로 시야를 돌린다.
