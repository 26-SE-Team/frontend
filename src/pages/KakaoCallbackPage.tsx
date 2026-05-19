import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  authStorage,
  exchangeKakaoCode,
  fetchCurrentUser,
} from "../services/authService";
import { useAuth } from "../contexts/AuthContext";
import "./authCallback.css";

export function KakaoCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [message, setMessage] = useState("카카오 로그인 처리 중...");

  useEffect(() => {
    const handleCallback = async () => {
      const error = searchParams.get("error");
      if (error) {
        setMessage("카카오 로그인이 취소되었습니다.");
        setTimeout(() => navigate("/login", { replace: true }), 2000);
        return;
      }

      const code = searchParams.get("code");
      if (!code) {
        setMessage("카카오 인가 코드가 없습니다.");
        setTimeout(() => navigate("/login", { replace: true }), 2000);
        return;
      }

      try {
        const tokens = await exchangeKakaoCode(code);
        authStorage.setSession(tokens);
        const user = await fetchCurrentUser();
        setUser(user);
        navigate("/home", { replace: true });
      } catch (err) {
        setMessage(
          err instanceof Error ? err.message : "카카오 로그인에 실패했습니다."
        );
        setTimeout(() => navigate("/login", { replace: true }), 2500);
      }
    };

    void handleCallback();
  }, [navigate, searchParams, setUser]);

  return (
    <main className="auth-callback">
      <p className="auth-callback__message">{message}</p>
    </main>
  );
}
