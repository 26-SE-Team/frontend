import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  authStorage,
  createPrototypeSession,
  exchangeGoogleAccessToken,
  fetchCurrentUser,
  fetchGoogleProfile,
  googleProfileToUser,
  isBackendReachable,
  shouldUseGoogleSdk,
  startKakaoAuthorize,
  startOAuthRedirect,
  type AuthProvider,
  type AuthUser,
} from "../services/authService";
import { useAuth } from "../contexts/AuthContext";
import { useGoogleSdk } from "../contexts/GoogleSdkContext";
import { publicEnv } from "../config/publicEnv";

type LoadingProvider = AuthProvider | null;

export function useSocialLogin() {
  const navigate = useNavigate();
  const { setUser, refreshUser } = useAuth();
  const { requestAccessToken } = useGoogleSdk();
  const [loading, setLoading] = useState<LoadingProvider>(null);
  const [error, setError] = useState<string | null>(null);

  const completeLogin = useCallback(
    async (provider: AuthProvider, fallbackUser?: AuthUser) => {
      let user = fallbackUser ?? null;

      try {
        user = (await fetchCurrentUser()) ?? user;
      } catch {
        /* 백엔드 미연결 시 fallback 사용 */
      }

      if (!user) {
        user = {
          id: "",
          provider,
          accountMode: "tenant",
          brokerCertificationStatus: "not-required",
          isBrokerCertified: false,
          nickname: provider === "kakao" ? "카카오 회원" : "Google 회원",
        };
      }

      setUser(user);
      await refreshUser();
      navigate("/home", { replace: true });
    },
    [navigate, refreshUser, setUser]
  );

  const loginWithGoogleToken = useCallback(
    async (accessToken: string) => {
      const profile = await fetchGoogleProfile(accessToken);
      const user = googleProfileToUser(profile);
      authStorage.setSession({ accessToken }, user);
      await completeLogin("google", user);
    },
    [completeLogin]
  );

  const loginWithGoogle = useCallback(async () => {
    setError(null);
    setLoading("google");

    try {
      if (shouldUseGoogleSdk() && requestAccessToken) {
        const accessToken = await requestAccessToken();

        if (publicEnv.useBackendAuth) {
          try {
            const backendUp = await isBackendReachable();
            if (backendUp) {
              const tokens = await exchangeGoogleAccessToken(accessToken);
              authStorage.setSession(tokens);
              await completeLogin("google");
              return;
            }
          } catch {
            /* 백엔드 교환 실패 시 프론트 단독 로그인 */
          }
        }

        await loginWithGoogleToken(accessToken);
        return;
      }

      if (publicEnv.useBackendAuth) {
        const backendUp = await isBackendReachable();
        if (backendUp) {
          startOAuthRedirect("google");
          return;
        }
      }

      const user = createPrototypeSession("google");
      await completeLogin("google", user);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Google 로그인에 실패했습니다."
      );
    } finally {
      setLoading(null);
    }
  }, [completeLogin, loginWithGoogleToken, requestAccessToken]);

  const loginWithKakao = useCallback(async () => {
    setError(null);
    setLoading("kakao");

    const hasKakaoKey = Boolean(publicEnv.kakaoJsKey);
    if (hasKakaoKey) {
      startKakaoAuthorize();
      return;
    }

    if (publicEnv.useBackendAuth) {
      const backendUp = await isBackendReachable();
      if (backendUp) {
        startOAuthRedirect("kakao");
        return;
      }
    }

    const user = createPrototypeSession("kakao");
    await completeLogin("kakao", user);
    setLoading(null);
  }, [completeLogin]);

  const clearError = useCallback(() => setError(null), []);

  return {
    loginWithKakao,
    loginWithGoogle,
    loading,
    error,
    clearError,
  };
}
