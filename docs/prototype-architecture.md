# StayView Frontend Prototype Architecture

## 목표

StayView 프론트엔드는 부동산 매물을 사진, 지도, 채팅, 3D 공간 보기로 탐색하는 모바일 프로토타입이다. 시연에서는 실제 서버 대신 로컬 fixture, localStorage, 로컬 3D 파일을 사용하지만, 외부 발표에서는 API 기반으로 확장 가능한 구조로 설명한다.

## 요구사항 추적

| ID | 우선순위 | 요구사항 | 현재 구현 전략 |
| --- | --- | --- | --- |
| FR-AUTH-01 | P0 | 사용자는 카카오/Google로 앱에 진입할 수 있다. | Google OAuth userinfo 확인 후 localStorage session 저장, 설정이 없으면 prototype session으로 fallback |
| FR-LISTING-01 | P0 | 사용자는 추천/최근 매물을 탐색하고 검색할 수 있다. | `src/data/mockListings.ts` fixture와 필터 유틸 사용 |
| FR-MAP-01 | P0 | 사용자는 지도에서 매물 밀집도를 볼 수 있다. | GitHub Variables 또는 `.env.local`의 Maps key로 Google Maps 로드, 키가 없으면 설정 안내 표시 |
| FR-CHAT-01 | P0 | 사용자는 매물 문의 채팅 UI를 확인할 수 있다. | 로컬 채팅 fixture와 클라이언트 상태 |
| FR-REGISTER-01 | P1 | 중개사/호스트는 매물 정보를 등록할 수 있다. | 로컬 폼, 파일명 표시, 제출 완료 상태 |
| FR-VIEWER-01 | P1 | 사용자는 매물 상세에서 3D 공간을 볼 수 있다. | Three.js 기반 viewer shell, local GLB/PLY/JSON loader |
| FR-FURNITURE-01 | P2 | 사용자는 가구 배치를 시뮬레이션할 수 있다. | 후순위, viewer mode와 하단 tray만 확장 지점으로 유지 |

## 품질 요구사항

| ID | 품질 속성 | 기준 |
| --- | --- | --- |
| NFR-USABILITY-01 | 사용성 | 보호 라우트 진입 후 하단 탭으로 홈/지도/채팅/마이페이지를 이동할 수 있어야 한다. |
| NFR-MAINT-01 | 유지보수성 | 외부 API 또는 renderer 변경 시 page component가 아니라 service/adapter 계층만 바꾸는 것을 목표로 한다. |
| NFR-SEC-01 | 보안 | `.env`, 실제 모델, 실제 사용자 데이터는 git에 남기지 않는다. |
| NFR-PERF-01 | 성능 | 3D viewer는 lazy route 수준으로 분리하고, canvas unmount 시 WebGL resource를 dispose한다. |
| NFR-COST-01 | 비용 | 지도 API 키가 없을 때도 시연 가능한 정적 지도 fallback을 제공한다. |

## 모듈 경계

- `auth`: OAuth, prototype session, localStorage session.
- `listing`: 매물 fixture, 검색, 상세, 등록.
- `map`: 지도 adapter, cluster marker, API fallback.
- `chat`: 채팅방 목록, 메시지 fixture, 로컬 메시지 상태.
- `viewer`: Three.js renderer shell, GLB/PLY/JSON local loader, 향후 3DGS renderer adapter.
- `mypage`: 사용자 역할/상태 기반 메뉴.

## 로컬 데이터 전략

대외 설명은 API 응답 기반으로 하되 내부 구현은 아래 순서를 따른다.

1. `src/data/*`에 API 응답과 유사한 fixture를 둔다.
2. 사용자 액션으로 바뀌는 임시 상태는 component state 또는 localStorage에 둔다.
3. 실제 모델 파일은 git에 넣지 않고 `public/local-models/` 또는 사용자 파일 입력으로만 다룬다.
4. 서버 연결이 생기면 data/service 함수의 내부 구현만 fetch로 교체한다.

## 3D Viewer 확장 계획

현재 viewer는 Three.js로 prototype Gaussian scene JSON, GLB, PLY를 처리한다. 실제 3D Gaussian Splatting 파일은 `.splat` 또는 `.ksplat` 계열 renderer adapter를 추가해 붙인다.

- `GaussianSceneData`: 프로토타입용 point/splat scene 계약
- `model-file`: 로컬 `glb`, `gltf`, `ply` 파일 계약
- 향후 `splat-file`: 전용 3DGS renderer 계약

뷰어 UI는 full-screen viewer shell, floating controls, bottom mode tray를 유지한다. 가구 배치는 `furniture` mode로 확장하되 현재 우선순위에서는 실제 배치 엔진을 구현하지 않는다.

## 지도 API 비용 전략

지도 API 키는 GitHub Pages에서는 repository Variables, 로컬에서는 `.env.local`로만 주입한다. 키가 제공되면 Google Maps adapter가 동작한다. 키가 없거나 Google Console 제한이 맞지 않으면 설정 안내를 보여준다. 네이버 지도 전환 시에도 page component는 유지하고 map component 또는 adapter만 교체한다.

## 검증 체크리스트

- `/login`: Google 설정이 있으면 실제 OAuth 후 홈으로 진입하고, 설정이 없으면 prototype session으로 홈에 진입한다.
- `/home`: 검색, 카드 클릭, 등록 버튼이 끊기지 않는다.
- `/map`: Maps key가 있으면 Google Map과 cluster marker가 보이고, 키가 없으면 설정 안내가 보인다.
- `/chat`: 채팅방 선택과 메시지 입력이 동작한다.
- `/mypage`: 사용자 정보, 인증/등록 메뉴, 로그아웃이 보인다.
- `/listing/new`: 매물 등록 폼과 3D 파일 입력이 보인다.
- `/viewer`: 기본 3D scene과 로컬 파일 입력이 동작한다.
