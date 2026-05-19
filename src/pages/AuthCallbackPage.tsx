import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  authStorage,
  fetchCurrentUser,
  parseCallbackTokens,
} from "../services/authService";
import { useAuth } from "../contexts/AuthContext";
import "./authCallback.css";

export function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [message, setMessage] = useState("로그인 처리 중...");

  useEffect(() => {
    const handleCallback = async () => {
      const parsed = parseCallbackTokens(searchParams);

      if (parsed && "error" in parsed) {
        setMessage(parsed.error);
        setTimeout(() => navigate("/login", { replace: true }), 2000);
        return;
      }

      if (!parsed || !("tokens" in parsed)) {
        setMessage("유효하지 않은 로그인 응답입니다.");
        setTimeout(() => navigate("/login", { replace: true }), 2000);
        return;
      }

      authStorage.setSession(parsed.tokens, parsed.user ?? null);
      const user = (await fetchCurrentUser()) ?? parsed.user ?? null;
      setUser(user);
      navigate("/home", { replace: true });
    };

    void handleCallback();
  }, [navigate, searchParams, setUser]);

  return (
    <main className="auth-callback">
      <p className="auth-callback__message">{message}</p>
    </main>
  );
}
