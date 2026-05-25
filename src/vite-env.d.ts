/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  readonly VITE_KAKAO_JS_KEY?: string;
  readonly VITE_KAKAO_REDIRECT_URI?: string;
  readonly VITE_USE_GOOGLE_SDK?: string;
  readonly VITE_GOOGLE_MAPS_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
