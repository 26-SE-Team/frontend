const clean = (value: string | undefined): string => value?.trim() ?? "";
const viteEnv = import.meta.env ?? {};

export const publicEnv = {
  apiBaseUrl:
    clean(viteEnv.VITE_API_BASE_URL).replace(/\/$/, "") ||
    "http://localhost:8080",
  googleClientId: clean(viteEnv.VITE_GOOGLE_CLIENT_ID),
  googleMapsApiKey: clean(viteEnv.VITE_GOOGLE_MAPS_API_KEY),
  useGoogleSdk: viteEnv.VITE_USE_GOOGLE_SDK !== "false",
  useBackendAuth: viteEnv.VITE_USE_BACKEND_AUTH === "true",
  kakaoJsKey: clean(viteEnv.VITE_KAKAO_JS_KEY),
  kakaoRedirectUri: clean(viteEnv.VITE_KAKAO_REDIRECT_URI),
  routerBasename:
    viteEnv.BASE_URL === "/"
      ? undefined
      : viteEnv.BASE_URL?.replace(/\/$/, ""),
};
