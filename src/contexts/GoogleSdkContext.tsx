import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";

interface PendingGoogleLogin {
  resolve: (accessToken: string) => void;
  reject: (error: Error) => void;
}

interface GoogleSdkContextValue {
  isAvailable: boolean;
  requestAccessToken: (() => Promise<string>) | null;
}

const GoogleSdkContext = createContext<GoogleSdkContextValue>({
  isAvailable: false,
  requestAccessToken: null,
});

interface GoogleSdkProviderProps {
  children: ReactNode;
  clientId?: string;
}

export function GoogleSdkProvider({
  children,
  clientId,
}: GoogleSdkProviderProps) {
  const trimmedClientId = clientId?.trim();

  if (!trimmedClientId) {
    return (
      <GoogleSdkContext.Provider
        value={{ isAvailable: false, requestAccessToken: null }}
      >
        {children}
      </GoogleSdkContext.Provider>
    );
  }

  return (
    <GoogleOAuthProvider clientId={trimmedClientId}>
      <GoogleSdkBridge>{children}</GoogleSdkBridge>
    </GoogleOAuthProvider>
  );
}

function GoogleSdkBridge({ children }: { children: ReactNode }) {
  const pendingLoginRef = useRef<PendingGoogleLogin | null>(null);

  const startGoogleLogin = useGoogleLogin({
    scope: "openid email profile",
    onSuccess: (tokenResponse) => {
      const pendingLogin = pendingLoginRef.current;
      pendingLoginRef.current = null;

      if (!pendingLogin) return;
      if (!tokenResponse.access_token) {
        pendingLogin.reject(new Error("Google 토큰을 받지 못했습니다."));
        return;
      }

      pendingLogin.resolve(tokenResponse.access_token);
    },
    onError: () => {
      const pendingLogin = pendingLoginRef.current;
      pendingLoginRef.current = null;
      pendingLogin?.reject(
        new Error("Google 로그인이 취소되었거나 실패했습니다.")
      );
    },
  });

  const requestAccessToken = useCallback(() => {
    return new Promise<string>((resolve, reject) => {
      pendingLoginRef.current = { resolve, reject };
      startGoogleLogin();
    });
  }, [startGoogleLogin]);

  const value = useMemo<GoogleSdkContextValue>(
    () => ({
      isAvailable: true,
      requestAccessToken,
    }),
    [requestAccessToken]
  );

  return (
    <GoogleSdkContext.Provider value={value}>
      {children}
    </GoogleSdkContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useGoogleSdk() {
  return useContext(GoogleSdkContext);
}
