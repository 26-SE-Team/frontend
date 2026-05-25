const clean = (value: string | undefined): string => value?.trim() ?? "";

export const publicEnv = {
  apiBaseUrl:
    clean(import.meta.env.VITE_API_BASE_URL).replace(/\/$/, "") ||
    "http://localhost:8080",
  googleClientId: clean(import.meta.env.VITE_GOOGLE_CLIENT_ID),
  googleMapsApiKey: clean(import.meta.env.VITE_GOOGLE_MAPS_API_KEY),
  useGoogleSdk: import.meta.env.VITE_USE_GOOGLE_SDK !== "false",
  kakaoJsKey: clean(import.meta.env.VITE_KAKAO_JS_KEY),
  kakaoRedirectUri: clean(import.meta.env.VITE_KAKAO_REDIRECT_URI),
  routerBasename:
    import.meta.env.BASE_URL === "/"
      ? undefined
      : import.meta.env.BASE_URL.replace(/\/$/, ""),
};
