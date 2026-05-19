interface KakaoAuthObj {
  access_token: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: number;
}

interface KakaoAuthAuthorizeParams {
  redirectUri: string;
  scope?: string;
  state?: string;
  throughTalk?: boolean;
  prompts?: string;
}

interface KakaoAuth {
  authorize(params: KakaoAuthAuthorizeParams): void;
  login(options: {
    success: (authObj: KakaoAuthObj) => void;
    fail: (error: unknown) => void;
  }): void;
  logout(callback?: () => void): void;
  getAccessToken(): string | null;
}

interface KakaoStatic {
  init(appKey: string): void;
  isInitialized(): boolean;
  Auth: KakaoAuth;
}

interface Window {
  Kakao?: KakaoStatic;
}
