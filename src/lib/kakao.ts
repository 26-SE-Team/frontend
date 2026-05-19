const KAKAO_JS_KEY = import.meta.env.VITE_KAKAO_JS_KEY;

export function initKakao(): boolean {
  if (!KAKAO_JS_KEY || !window.Kakao) {
    return false;
  }

  if (!window.Kakao.isInitialized()) {
    window.Kakao.init(KAKAO_JS_KEY);
  }

  return window.Kakao.isInitialized();
}

export function getKakaoRedirectUri(): string {
  return (
    import.meta.env.VITE_KAKAO_REDIRECT_URI ||
    `${window.location.origin}/auth/kakao/callback`
  );
}
