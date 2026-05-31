import { initKakao, getKakaoRedirectUri } from "../lib/kakao";
import { publicEnv } from "../config/publicEnv";
import { getPrototypeStorage } from "./prototypeStorage";

export type AuthProvider = "kakao" | "google";
export type AccountMode = "broker" | "tenant";

export type BrokerCertificationStatus =
  | "not-required"
  | "required"
  | "pending"
  | "approved"
  | "rejected";

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

export interface AuthUser {
  id: string;
  email?: string;
  nickname?: string;
  provider: AuthProvider;
  accountMode: AccountMode;
  brokerCertificationStatus?: BrokerCertificationStatus;
  isBrokerCertified?: boolean;
}

const ACCESS_TOKEN_KEY = "stayview_access_token";
const REFRESH_TOKEN_KEY = "stayview_refresh_token";
const USER_KEY = "stayview_user";

const API_BASE = publicEnv.apiBaseUrl;

function resolveAccountMode(provider: AuthProvider): AccountMode {
  return provider === "kakao" ? "broker" : "tenant";
}

function resolveDefaultBrokerCertificationStatus(
  accountMode: AccountMode,
  isBrokerCertified = false
): BrokerCertificationStatus {
  if (accountMode !== "broker") return "not-required";
  if (isBrokerCertified) return "approved";
  return "required";
}

function normalizeAuthUser(
  user: Partial<AuthUser> & { provider?: AuthProvider }
): AuthUser | null {
  if (!user.id && !user.nickname) return null;

  const provider = user.provider ?? "google";
  const accountMode = user.accountMode ?? resolveAccountMode(provider);
  const approved =
    user.brokerCertificationStatus === "approved" || Boolean(user.isBrokerCertified);
  const certificationStatus =
    user.brokerCertificationStatus ??
    resolveDefaultBrokerCertificationStatus(accountMode, approved);

  return {
    id: user.id ?? `fallback-${Date.now()}`,
    provider,
    accountMode,
    email: user.email,
    nickname: user.nickname,
    isBrokerCertified: approved,
    brokerCertificationStatus: certificationStatus,
  };
}

function applyAuthSession(tokens?: AuthTokens | null, user?: AuthUser | null) {
  if (!tokens) return;
  authStorage.setSession(tokens, user);
}

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
    return getPrototypeStorage().getItem(ACCESS_TOKEN_KEY);
  },

  getRefreshToken(): string | null {
    return getPrototypeStorage().getItem(REFRESH_TOKEN_KEY);
  },

  getUser(): AuthUser | null {
    const raw = getPrototypeStorage().getItem(USER_KEY);
    if (!raw) return null;
    try {
      return normalizeAuthUser(JSON.parse(raw) as AuthUser);
    } catch {
      return null;
    }
  },

  setSession(tokens: AuthTokens, user?: AuthUser | null) {
    const storage = getPrototypeStorage();
    storage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    if (tokens.refreshToken) {
      storage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
    } else {
      storage.removeItem(REFRESH_TOKEN_KEY);
    }
    if (user) {
      storage.setItem(USER_KEY, JSON.stringify(user));
    }
  },

  clear() {
    const storage = getPrototypeStorage();
    storage.removeItem(ACCESS_TOKEN_KEY);
    storage.removeItem(REFRESH_TOKEN_KEY);
    storage.removeItem(USER_KEY);
  },
};

export function getApiBaseUrl(): string {
  return API_BASE;
}

export function createPrototypeSession(provider: AuthProvider): AuthUser {
  const accountMode = resolveAccountMode(provider);
  const user: AuthUser = {
    id: `prototype-${provider}`,
    email: `${provider}@stayview.local`,
    nickname: provider === "kakao" ? "중개인 회원" : "임차인 회원",
    provider,
    accountMode,
    brokerCertificationStatus:
      accountMode === "broker" ? "required" : "not-required",
  };

  applyAuthSession(
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

    return normalizeAuthUser((await response.json()) as AuthUser);
  } catch {
    return storedUser;
  }
}

export function isBrokerUser(user: AuthUser | null): user is AuthUser {
  return user?.accountMode === "broker";
}

export function isCertifiedBroker(user: AuthUser | null): boolean {
  return (
    isBrokerUser(user) &&
    (user.isBrokerCertified ||
      user.brokerCertificationStatus === "approved")
  );
}

export function updateCurrentAuthUser(
  patch: Partial<AuthUser>
): AuthUser | null {
  const storedUser = authStorage.getUser();
  if (!storedUser) return null;

  const merged = normalizeAuthUser({
    ...storedUser,
    ...patch,
  });
  const tokens: AuthTokens = {
    accessToken: authStorage.getAccessToken() || `prototype-${Date.now()}`,
    refreshToken: authStorage.getRefreshToken() || undefined,
  };
  applyAuthSession(tokens, merged);
  return merged;
}

export function setBrokerCertificationStatus(
  status: Extract<BrokerCertificationStatus, "approved" | "pending" | "rejected">
): AuthUser | null {
  return updateCurrentAuthUser({
    brokerCertificationStatus: status,
    isBrokerCertified: status === "approved",
  });
}

export const setBrokerCertificationApproved = setBrokerCertificationStatus;

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

  const user: (Partial<AuthUser> & { provider?: AuthProvider }) | undefined =
    params.get("userId") || params.get("email") || params.get("nickname")
      ? {
          id: params.get("userId") ?? "",
          email: params.get("email") ?? undefined,
          nickname: params.get("nickname") ?? undefined,
          provider: (params.get("provider") as AuthProvider) ?? "kakao",
          accountMode: params.get("accountMode") as AccountMode | undefined,
          brokerCertificationStatus: params.get("brokerCertificationStatus") as
            | BrokerCertificationStatus
            | undefined,
          isBrokerCertified: params.get("isBrokerCertified") === "true",
        }
      : undefined;

  return {
    tokens: { accessToken, refreshToken },
    user: user ? normalizeAuthUser(user) ?? undefined : undefined,
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
  return publicEnv.useGoogleSdk && Boolean(publicEnv.googleClientId);
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
    accountMode: "tenant",
    brokerCertificationStatus: "not-required",
    isBrokerCertified: false,
  };
}
