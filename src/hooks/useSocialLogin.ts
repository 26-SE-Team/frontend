import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import {
  authStorage,
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

type LoadingProvider = AuthProvider | null;

export function useSocialLogin() {
  const navigate = useNavigate();
  const { setUser, refreshUser } = useAuth();
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
          nickname: provider === "kakao" ? "카카오 사용자" : "Google 사용자",
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

  const googleLoginWithSdk = useGoogleLogin({
    scope: "openid email profile",
    onSuccess: async (tokenResponse) => {
      try {
        if (!tokenResponse.access_token) {
          throw new Error("Google 토큰을 받지 못했습니다.");
        }

        const backendUp = await isBackendReachable();
        if (backendUp) {
          try {
            const tokens = await exchangeGoogleAccessToken(
              tokenResponse.access_token
            );
            authStorage.setSession(tokens);
            await completeLogin("google");
            return;
          } catch {
            /* 백엔드 교환 실패 시 프론트 단독 로그인 */
          }
        }

        await loginWithGoogleToken(tokenResponse.access_token);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Google 로그인에 실패했습니다."
        );
      } finally {
        setLoading(null);
      }
    },
    onError: () => {
      setError("Google 로그인이 취소되었거나 실패했습니다.");
      setLoading(null);
    },
  });

  const loginWithGoogle = useCallback(async () => {
    setError(null);

    if (shouldUseGoogleSdk()) {
      setLoading("google");
      googleLoginWithSdk();
      return;
    }

    setLoading("google");
    const backendUp = await isBackendReachable();
    if (!backendUp) {
      setError(
        "백엔드 서버에 연결할 수 없습니다. .env에 VITE_GOOGLE_CLIENT_ID를 설정했는지 확인해주세요."
      );
      setLoading(null);
      return;
    }

    startOAuthRedirect("google");
  }, [googleLoginWithSdk]);

  const loginWithKakao = useCallback(async () => {
    setError(null);
    setLoading("kakao");

    const hasKakaoKey = Boolean(import.meta.env.VITE_KAKAO_JS_KEY?.trim());
    if (hasKakaoKey) {
      startKakaoAuthorize();
      return;
    }

    const backendUp = await isBackendReachable();
    if (backendUp) {
      startOAuthRedirect("kakao");
      return;
    }

    setError(
      "백엔드(localhost:8080)에 연결할 수 없습니다. 백엔드를 실행하거나 .env에 VITE_KAKAO_JS_KEY를 추가해주세요."
    );
    setLoading(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    loginWithKakao,
    loginWithGoogle,
    loading,
    error,
    clearError,
  };
}
