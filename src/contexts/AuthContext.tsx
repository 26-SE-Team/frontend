import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  authStorage,
  fetchCurrentUser,
  logout as clearAuthSession,
  type AuthUser,
} from "../services/authService";

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: AuthUser | null) => void;
  refreshUser: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => authStorage.getUser());
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const storedUser = authStorage.getUser();
    if (storedUser) {
      setUser(storedUser);
      setIsLoading(false);
      return;
    }

    if (!authStorage.getAccessToken()) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const remoteUser = await fetchCurrentUser();
      setUser(remoteUser);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  const logout = useCallback(() => {
    clearAuthSession();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user || authStorage.getAccessToken()),
      isLoading,
      setUser,
      refreshUser,
      logout,
    }),
    [user, isLoading, refreshUser, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
