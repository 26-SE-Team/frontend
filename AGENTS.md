# StayView Frontend Agent Guide

이 문서는 `SE/frontend`에서 작업하는 에이전트와 팀원이 항상 먼저 참고해야 하는 운영 지침이다. 기존 팀원이 만든 화면 톤을 존중하면서, 프로토타입이라는 제약 안에서 소프트웨어공학적으로 설명 가능한 구조를 유지한다.

## 프로젝트 맥락

- 작업 레포: `SE/frontend`
- 디자인 레퍼런스: `SE/frontend_refs`
- 강의자료/SRS/계획서: `SE` 루트
- 3D 뷰어 참고 프로젝트: `SE/pj/3d-viewer`
- 현재 앱은 대외적으로 API 기반처럼 설명하지만, 시연 구현은 로컬 fixture와 localStorage를 우선 사용한다.
- 민감한 `.env`, 실제 모델, 실제 사용자 데이터, 로컬 시연 파일은 절대 커밋하지 않는다.

## 실행과 검증

- 의존성 설치: `npm install`
- 개발 서버: `npm run dev`
- 빌드 검증: `npm run build`
- 린트: `npm run lint`
- 큰 UI 변경 후에는 로컬 브라우저에서 `/login`, `/home`, `/map`, `/chat`, `/mypage`, `/listing/new`, `/viewer`를 확인한다.

## 커밋 메시지

최근 히스토리는 엄격한 Conventional Commits는 아니지만 `feat:`, `design:`, `chore:`가 일부 쓰였다. 새 커밋은 아래 형식을 우선한다.

- `feat: 채팅 프로토타입 화면 구현`
- `design: 홈 화면 카드 간격 조정`
- `fix: 카카오 로그인 로컬 fallback 처리`
- `chore: gitignore 로컬 모델 경로 추가`

## 디자인 원칙

- 기존 모바일 앱 프레임을 유지한다: 최대 폭 430px, 흰 배경, 하단 탭, 굵은 검정 타이틀, 연회색 입력/카드, 보라색 CTA.
- 레퍼런스의 분위기를 따르되, 간격, 대비, 버튼 상태, 정보 위계를 정돈해 완성도를 높인다.
- 새로운 주요 화면은 `src/pages/*Page.tsx`와 같은 폴더의 `.css`를 기본으로 둔다. 홈/지도처럼 BEM에 가까운 className을 사용한다.
- 기존 CSS Modules 화면을 수정할 때는 주변 파일 스타일을 따른다.
- 설명성 문구를 과하게 넣기보다, 실제 조작 가능한 화면을 첫 화면에 둔다.

## 설계 원칙

- 새 기능을 만들기 전 `git log`와 관련 커밋의 `git show`를 먼저 확인한다. 특히 `design: login 페이지`, `google 로그인 구현`, `카카오`, `feat: home, map 기본화면 구현`의 의도를 기준선으로 둔다.
- 기존 팀원이 구현한 로그인, 지도, 홈 흐름은 최대한 보존한다. 필요한 보완은 원본 파일을 덮어엎기보다 얇은 wrapper, adapter, local fixture 계층으로 얹는다.
- 도메인별 경계를 유지한다: `auth`, `listing`, `map`, `chat`, `viewer`, `mypage`.
- 컴포넌트는 UI에 집중하고, 외부 의존성은 service/adapter/data 계층에서 감싼다.
- 로컬 fixture는 실제 API 응답처럼 생긴 타입을 사용한다. 나중에 API로 바꿀 때 컴포넌트 변경을 최소화한다.
- Kakao/Google 로그인, 지도, 3D renderer는 직접 컴포넌트에 묶지 말고 교체 가능한 경계로 둔다.
- 3D 뷰어는 `glb`, `ply`, prototype Gaussian scene JSON을 로컬 파일로 열 수 있게 하고, 실제 `.splat/.ksplat` 3DGS는 전용 renderer adapter로 교체할 수 있게 설계한다.
- 강의자료 관점에서 `FR/NFR`, 우선순위, 검증 가능성, 역할 기반 접근을 문서에 남긴다.

## 보안과 로컬 파일

- `.env`, `.env.*`, `*.local`은 커밋하지 않는다.
- 로컬 Google OAuth/Maps 테스트 값은 `.env.local`에만 둔다.
- GitHub Pages 배포 값은 repository Secrets(`VITE_GOOGLE_CLIENT_ID`, `VITE_GOOGLE_MAPS_API_KEY`)로 주입하고, workflow에서 `VITE_USE_GOOGLE_SDK=true`를 고정한다.
- 프론트 런타임 설정은 Google Console의 origin/referrer/API 제한을 전제로 관리한다.
- 실제 3D 모델은 `public/local-models/` 또는 `src/local-data/`에 두고 커밋하지 않는다.
- 테스트 산출물, 빌드 산출물, coverage, Playwright report는 커밋하지 않는다.
- 외부 API 키가 없을 때도 프로토타입은 로컬 fallback으로 동작해야 한다.

## 현재 우선순위

1. Google OAuth는 실제 userinfo 확인 후 localStorage session을 저장한다. 백엔드 token exchange는 `VITE_USE_BACKEND_AUTH=true`일 때만 사용하고, 기본값은 프론트 단독 prototype session이다.
2. 홈, 지도, 채팅, 마이페이지, 매물 등록, 3D 보기 기본 흐름을 끊기지 않게 만든다.
3. 지도 API 키는 비용 이슈가 있으므로 referrer/API restriction과 quota를 전제로 사용한다.
4. 가구 배치는 후순위다. 뷰어 모드와 문서상 확장 지점만 먼저 준비한다.
