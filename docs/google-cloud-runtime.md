# Google Cloud Runtime Settings

StayView 프론트엔드는 GitHub Pages와 로컬 Vite 개발 서버에서 같은 Google OAuth/Maps 설정을 사용한다. `.env` 파일은 커밋하지 않고, 배포는 GitHub repo Secrets로, 로컬 개발은 `.env.local`로 주입한다.

## GitHub Secrets

`26-SE-Team/frontend` repository secrets에 아래 값을 둔다.

```text
VITE_GOOGLE_CLIENT_ID
VITE_GOOGLE_MAPS_API_KEY
```

Pages workflow는 `VITE_USE_GOOGLE_SDK=true`를 고정해서 빌드한다. `VITE_*` 값은 브라우저 번들에 포함되는 프론트엔드 runtime 설정이므로, Google Console의 origin/referrer/API 제한과 함께 관리한다.

## Local Development

로컬에서는 `.env.example`을 `.env.local`로 복사하고 실제 값을 채운다.

```bash
cp .env.example .env.local
npm run dev -- --host 0.0.0.0 --port 5173
```

`.env.local`은 `.gitignore`에 포함되어 있으므로 커밋하지 않는다.

백엔드 OAuth/token 교환까지 테스트할 때만 `.env.local`에 아래 값을 둔다. 기본값은 프론트 단독 prototype session이며, 이 경우 `localhost:8080` 헬스체크를 하지 않는다.

```text
VITE_USE_BACKEND_AUTH=true
```

## Google OAuth

Google Cloud Console에서 OAuth Web application client의 Authorized JavaScript origins에 아래 값을 등록한다.

```text
https://26-se-team.github.io
http://localhost:5173
http://127.0.0.1:5173
```

Authorized redirect URIs에는 아래 값을 등록한다.

```text
https://26-se-team.github.io/frontend/auth/callback
http://localhost:5173/auth/callback
http://127.0.0.1:5173/auth/callback
```

프론트는 `VITE_GOOGLE_CLIENT_ID`가 있으면 Google OAuth popup으로 access token을 받고, Google userinfo API로 프로필을 읽은 뒤 localStorage session을 저장한다. `VITE_USE_BACKEND_AUTH=true`일 때만 `/api/auth/google/token` 교환을 먼저 시도하고, 실패하면 프론트 단독 session으로 fallback한다.

## Google Maps

Maps API key는 HTTP referrer 제한과 API 제한을 함께 건다.

HTTP referrers:

```text
https://26-se-team.github.io/*
https://26-se-team.github.io/frontend/*
http://localhost:5173/*
http://127.0.0.1:5173/*
```

API restrictions:

```text
Maps JavaScript API
```

지도 컴포넌트는 `VITE_GOOGLE_MAPS_API_KEY`가 있으면 Google Maps JavaScript API를 로드한다. 키가 없거나 제한 설정이 맞지 않으면 지도 영역에 설정 안내를 보여준다.

## Runtime Key Restrictions

- OAuth client origin 제한
- Maps key HTTP referrer 제한
- Maps key API restriction
- Maps quota와 billing alert
