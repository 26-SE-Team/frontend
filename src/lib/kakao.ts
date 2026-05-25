import { publicEnv } from "../config/publicEnv";

export function initKakao(): boolean {
  if (!publicEnv.kakaoJsKey || !window.Kakao) {
    return false;
  }

  if (!window.Kakao.isInitialized()) {
    window.Kakao.init(publicEnv.kakaoJsKey);
  }

  return window.Kakao.isInitialized();
}

export function getKakaoRedirectUri(): string {
  return publicEnv.kakaoRedirectUri || `${window.location.origin}/auth/kakao/callback`;
}
