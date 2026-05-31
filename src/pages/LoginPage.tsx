import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { StayViewLogo } from "../components/start/StayViewLogo";
import { HouseIllustration } from "../components/start/HouseIllustration";
import { KakaoIcon, GoogleIcon } from "../components/start/SocialIcons";
import { useAuth } from "../contexts/AuthContext";
import { useSocialLogin } from "../hooks/useSocialLogin";
import "./start.css";

export function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();
  const { loginWithKakao, loginWithGoogle, loading, error, clearError } =
    useSocialLogin();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate("/home", { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  return (
    <main className="start-screen">
      <div className="start-screen__frame">
        <header>
          <StayViewLogo />
        </header>

        <section className="start-hero" aria-labelledby="start-heading">
          <HouseIllustration />
          <h1 id="start-heading" className="start-hero__title">
            공간의 구조부터 분위기까지,
            <br />
            한눈에 확인하세요
          </h1>
        </section>

        <section className="start-actions" aria-label="소셜 로그인">
          {error && (
            <div className="start-error" role="alert">
              <p>{error}</p>
              <button type="button" onClick={clearError} aria-label="닫기">
                ×
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => void loginWithKakao()}
            disabled={loading !== null}
            className="start-btn start-btn--kakao"
          >
            <KakaoIcon />
            {loading === "kakao" ? "연결 중..." : "카카오로 시작하기"}
          </button>

          <button
            type="button"
            onClick={() => void loginWithGoogle()}
            disabled={loading !== null}
            className="start-btn start-btn--google"
          >
            <GoogleIcon />
            {loading === "google" ? "연결 중..." : "Google로 시작하기"}
          </button>
        </section>

        <div className="start-home-indicator" aria-hidden>
          <div className="start-home-indicator__bar" />
        </div>
      </div>
    </main>
  );
}
