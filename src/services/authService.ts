import { initKakao, getKakaoRedirectUri } from "../lib/kakao";

export type AuthProvider = "kakao" | "google";

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

export interface AuthUser {
  id: string;
  email?: string;
  nickname?: string;
  provider: AuthProvider;
}

const ACCESS_TOKEN_KEY = "stayview_access_token";
const REFRESH_TOKEN_KEY = "stayview_refresh_token";
const USER_KEY = "stayview_user";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:8080";

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { message?: string; error?: string };
    return data.message || data.error || "로그인에 실패했습니다.";
  } catch {
    return "로그인에 실패했습니다.";
  }
}

export const authStorage = {
  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  getUser(): AuthUser | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  },

  setSession(tokens: AuthTokens, user?: AuthUser | null) {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    if (tokens.refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
    } else {
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  },

  clear() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

export function getApiBaseUrl(): string {
  return API_BASE;
}

export function createPrototypeSession(provider: AuthProvider): AuthUser {
  const user: AuthUser = {
    id: `prototype-${provider}`,
    email: `${provider}@stayview.local`,
    nickname: provider === "kakao" ? "카카오 시연 사용자" : "Google 시연 사용자",
    provider,
  };

  authStorage.setSession(
    {
      accessToken: `prototype-${provider}-${Date.now()}`,
      refreshToken: `prototype-refresh-${provider}`,
    },
    user
  );

  return user;
}

/** 백엔드 OAuth 시작 (서버 리다이렉트 방식) */
export function startOAuthRedirect(provider: AuthProvider): void {
  window.location.assign(`${API_BASE}/api/auth/${provider}`);
}

/** 카카오 JS SDK authorize */
export function startKakaoAuthorize(): void {
  if (!initKakao() || !window.Kakao) {
    startOAuthRedirect("kakao");
    return;
  }

  window.Kakao.Auth.authorize({
    redirectUri: getKakaoRedirectUri(),
    scope: "profile_nickname, account_email",
  });
}

/** 카카오 인가 코드 → 백엔드 토큰 교환 */
export async function exchangeKakaoCode(code: string): Promise<AuthTokens> {
  const redirectUri = getKakaoRedirectUri();
  const response = await fetch(`${API_BASE}/api/auth/kakao/callback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ code, redirectUri }),
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  return normalizeTokenResponse(await response.json());
}

/** 구글 인가 코드 → 백엔드 토큰 교환 */
export async function exchangeGoogleCode(
  code: string,
  redirectUri?: string
): Promise<AuthTokens> {
  const response = await fetch(`${API_BASE}/api/auth/google/callback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      code,
      redirectUri: redirectUri ?? window.location.origin,
    }),
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  return normalizeTokenResponse(await response.json());
}

/** 구글 access token → 백엔드 검증 */
export async function exchangeGoogleAccessToken(
  accessToken: string
): Promise<AuthTokens> {
  const response = await fetch(`${API_BASE}/api/auth/google/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ accessToken }),
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  return normalizeTokenResponse(await response.json());
}

/** 구글 ID 토큰(credential) → 백엔드 검증 */
export async function exchangeGoogleIdToken(
  idToken: string
): Promise<AuthTokens> {
  const response = await fetch(`${API_BASE}/api/auth/google/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ idToken }),
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  return normalizeTokenResponse(await response.json());
}

/** 로그인된 사용자 정보 조회 */
export async function fetchCurrentUser(): Promise<AuthUser | null> {
  const token = authStorage.getAccessToken();
  if (!token) return null;

  const storedUser = authStorage.getUser();
  if (storedUser) return storedUser;

  try {
    const response = await fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include",
    });

    if (!response.ok) {
      if (response.status === 401) authStorage.clear();
      return null;
    }

    return (await response.json()) as AuthUser;
  } catch {
    return storedUser;
  }
}

export function logout(): void {
  authStorage.clear();
  if (initKakao() && window.Kakao?.Auth.getAccessToken()) {
    window.Kakao.Auth.logout();
  }
}

/** OAuth 콜백 URL 쿼리에서 토큰 추출 */
export function parseCallbackTokens(
  params: URLSearchParams
): { tokens: AuthTokens; user?: AuthUser } | { error: string } | null {
  const error =
    params.get("error") || params.get("error_description") || params.get("message");
  if (error) return { error };

  const accessToken =
    params.get("accessToken") ||
    params.get("access_token") ||
    params.get("token");
  if (!accessToken) return null;

  const refreshToken =
    params.get("refreshToken") || params.get("refresh_token") || undefined;

  const user: AuthUser | undefined =
    params.get("userId") || params.get("email") || params.get("nickname")
      ? {
          id: params.get("userId") ?? "",
          email: params.get("email") ?? undefined,
          nickname: params.get("nickname") ?? undefined,
          provider: (params.get("provider") as AuthProvider) ?? "kakao",
        }
      : undefined;

  return {
    tokens: { accessToken, refreshToken },
    user,
  };
}

function normalizeTokenResponse(data: Record<string, unknown>): AuthTokens {
  const accessToken =
    (data.accessToken as string) ||
    (data.access_token as string) ||
    (data.token as string);

  if (!accessToken) {
    throw new Error("서버에서 토큰을 받지 못했습니다.");
  }

  return {
    accessToken,
    refreshToken:
      (data.refreshToken as string) || (data.refresh_token as string) || undefined,
  };
}

export function shouldUseGoogleSdk(): boolean {
  if (import.meta.env.VITE_USE_GOOGLE_SDK === "false") return false;
  return Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);
}

/** 백엔드 서버 연결 가능 여부 (OAuth 리다이렉트 전 확인) */
export async function isBackendReachable(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/api/auth/health`, {
      method: "GET",
      signal: AbortSignal.timeout(3000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export interface GoogleProfile {
  sub: string;
  email?: string;
  name?: string;
  picture?: string;
}

/** Google access token으로 사용자 정보 조회 (백엔드 없이 로그인) */
export async function fetchGoogleProfile(
  accessToken: string
): Promise<GoogleProfile> {
  const response = await fetch(
    "https://www.googleapis.com/oauth2/v3/userinfo",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    throw new Error("Google 사용자 정보를 가져올 수 없습니다.");
  }

  return response.json() as Promise<GoogleProfile>;
}

export function googleProfileToUser(profile: GoogleProfile): AuthUser {
  return {
    id: profile.sub,
    email: profile.email,
    nickname: profile.name,
    provider: "google",
  };
}
