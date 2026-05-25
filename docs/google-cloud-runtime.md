# Google Cloud Runtime Settings

StayView 프론트엔드는 GitHub Pages와 로컬 Vite 개발 서버에서 같은 Google OAuth/Maps 설정을 사용한다. `.env` 파일은 커밋하지 않고, 배포는 GitHub repo Variables로, 로컬 개발은 `.env.local`로 주입한다.

## GitHub Variables

`26-SE-Team/frontend` repository variables에 아래 값을 둔다.

```text
VITE_GOOGLE_CLIENT_ID
VITE_GOOGLE_MAPS_API_KEY
VITE_USE_GOOGLE_SDK=true
```

`VITE_*` 값은 Vite 빌드 후 브라우저 JS에 포함된다. 이 값들은 숨기는 값이 아니라 Google Console 제한으로 보호하는 public browser 설정이다.

## Local Development

로컬에서는 `.env.example`을 `.env.local`로 복사하고 실제 값을 채운다.

```bash
cp .env.example .env.local
npm run dev -- --host 0.0.0.0 --port 5173
```

`.env.local`은 `.gitignore`에 포함되어 있으므로 커밋하지 않는다.

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

프론트는 `VITE_GOOGLE_CLIENT_ID`가 있으면 Google OAuth popup으로 access token을 받고, Google userinfo API로 프로필을 읽은 뒤 localStorage session을 저장한다. 백엔드가 살아 있으면 `/api/auth/google/token` 교환을 먼저 시도하고, 실패하면 프론트 단독 session으로 fallback한다.

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

## Exposed Key Handling

과거 커밋에 `.env` 값이 노출된 적이 있으므로 아래 조치를 유지한다.

- OAuth client origin 제한
- Maps key HTTP referrer 제한
- Maps key API restriction
- Maps quota와 billing alert
- 시연 종료 후 Maps key 재발급 검토
