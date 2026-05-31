# StayView Prototype Testing Strategy

이 문서는 `10. Test.pdf`의 Test Oracle, Test harness, Unit/Integration/System/Acceptance Testing 개념을 `SE/frontend` 프로토타입에 맞춰 적용한 기준이다.

## Scope

현재 앱은 실제 REST API 없이 로컬 fixture, localStorage 세션, 정적 3D/이미지 자산으로 동작한다. 따라서 테스트의 1차 목표는 API 연동 성공 여부가 아니라 다음을 검증하는 것이다.

- 로컬 fixture가 화면 요구사항을 만족하는가
- 검색, 상세, 채팅, 등록, 마이페이지 흐름이 끊기지 않는가
- 로그인/세션은 API 없이도 localStorage stub으로 재현 가능한가
- 사용자 테스트에서 관찰해야 할 성공 기준이 코드로 남아 있는가

## Test Harness Mapping

| 강의자료 개념 | 프론트 적용 |
| --- | --- |
| Drivers | Node test runner, tsx, React server rendering |
| Stubs/Mocks | localStorage-compatible memory storage, auth session, local fixture data |
| Test Data | `mockListings`, `mockChats`, `prototypeUserScenarios` |
| Assertions/Oracles | 검색 결과 수, Room0 3DGS 연결, 채팅 전송, 등록 저장 안내 |
| Loggers/Reporters | Node test reporter, `userTestRecorder` localStorage 기록 |

## Commands

```bash
npm run test
npm run test:unit
npm run test:user
npm run lint
npm run build
```

## Automated Tests

- Unit tests
  - `src/utils/filterListings.test.ts`
  - `src/data/mockListings.test.ts`
  - `src/data/mockViewerAssets.test.ts`
  - `src/services/prototypeStorage.test.ts`
  - `src/services/authService.test.ts`
- Component/integration tests
  - `src/components/map/MapBottomSheet.test.tsx`
  - `src/test/harness/userTestRecorder.test.ts`
- User-flow tests
  - `src/test/user-flows/prototypeUserFlows.test.ts`

## Manual User Test Scenarios

`src/test/user-flows/prototypeUserScenarios.ts`에 사용자 테스트 시나리오와 오라클을 코드로 보관한다. 발표나 알파 테스트 때는 각 scenario의 `task`를 사용자에게 수행하게 하고, 관찰자는 `oracle`을 기준으로 pass/fail/blocked를 판단한다.

API 서버가 없으므로 사용자 테스트 로그는 `userTestRecorder`가 localStorage에만 저장한다. 이 데이터는 외부로 전송하지 않으며, 테스트 종료 후 삭제할 수 있다.

## Regression Policy

홈, 지도, 채팅, 상세, 등록, 마이페이지, 3D 진입점을 수정하면 최소한 다음을 실행한다.

```bash
npm run test:user
npm run lint
npm run build
```

순수 로직이나 fixture만 바꿨다면 `npm run test:unit`을 우선 실행하고, 화면 흐름에 영향이 있으면 `npm run test:user`도 실행한다.
